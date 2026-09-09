import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import VisionAiMark from './VisionAiMark.jsx';
import { Button } from './UI.jsx';
import { IntentAnswer, LandingReport, StructuredAnswer } from './AssistantAnswer.jsx';
import CreateWidgetDrawer from './CreateWidgetDrawer.jsx';
import CreateReportDrawer from './CreateReportDrawer.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useSearch } from '../hooks/useSearch.js';
import { useWorkspaceMutations, useWorkspaceSettings } from '../hooks/useConfig.js';
import { useReportMutations } from '../hooks/useConfig.js';
import { MODULE_LABELS } from './navConfig.js';
import {
  filterAssistantContent,
  getPersonaAssistantContent,
  resolveIntent,
  runAssistantAction,
} from '../data/assistantIntents.js';
import {
  PLAYBOOK,
  PLAYBOOK_LANDING,
  PLAYBOOK_STARTERS,
  buildAnswerExportHtml,
  buildLandingExportHtml,
  downloadAssistantExport,
  resolvePlaybookKey,
} from '../data/assistantPlaybook.js';
import { blankReportSpec, REPORT_DATA_SOURCES } from '../data/reportStudio.js';
import {
  blankCustomWidget,
  persistableWidget,
  placeCustomWidget,
} from '../data/dashboardWidgets.js';

const HISTORY_KEY = 'vision.ui.chatHistory';
const FAVS_KEY = 'vision.ui.chatFavorites';

function readHistory() {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeThread) : [];
  } catch {
    return [];
  }
}

function writeHistory(threads) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(threads.slice(0, 12)));
  } catch {
    /* ignore quota / private-mode failures */
  }
}

function readFavorites() {
  try {
    const raw = window.localStorage.getItem(FAVS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeThread) : [];
  } catch {
    return [];
  }
}

function writeFavorites(threads) {
  try {
    window.localStorage.setItem(FAVS_KEY, JSON.stringify(threads.slice(0, 12)));
  } catch {
    /* ignore quota / private-mode failures */
  }
}

function normalizeThread(thread) {
  if (!thread) return { id: 'chat', title: 'New chat', turns: [] };
  if (Array.isArray(thread.turns)) return thread;
  const turns = [];
  (thread.messages || []).forEach((message) => {
    if (message.role === 'user') {
      turns.push({
        id: message.id,
        prompt: message.text,
        playbookKey: message.playbookKey || null,
        reply: null,
        action: null,
      });
      return;
    }
    const last = turns[turns.length - 1];
    if (!last) return;
    last.reply = message.text;
    last.action = message.action || null;
    last.playbookKey = message.playbookKey || last.playbookKey;
  });
  return { ...thread, turns };
}

function titleFromTurns(turns) {
  return turns[0]?.prompt?.slice(0, 42) || 'New chat';
}

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function VisionChat({ onOnboard, onClose }) {
  const { state, persona, navigate, canAccessModule, canTab, toast } = useStore();
  const settingsQuery = useWorkspaceSettings();
  const { update: updateWorkspace } = useWorkspaceMutations();
  const { upsert: upsertReport } = useReportMutations();
  const content = useMemo(
    () =>
      filterAssistantContent(getPersonaAssistantContent(persona), {
        canAccessModule,
        canTab,
      }),
    [persona, canAccessModule, canTab]
  );
  const pageLabel = MODULE_LABELS[state.nav.module] || 'Home';
  const isSp = persona === 'sp';
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState([]);
  const [viewing, setViewing] = useState({ type: isSp ? 'landing' : 'empty' });
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(readHistory);
  const [favorites, setFavorites] = useState(readFavorites);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [favsOpen, setFavsOpen] = useState(false);
  const [widgetDraft, setWidgetDraft] = useState(null);
  const [widgetBusy, setWidgetBusy] = useState(false);
  const [widgetError, setWidgetError] = useState('');
  const [reportDraft, setReportDraft] = useState(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState('');
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const turnId = useRef(0);
  const chatIdRef = useRef(null);
  const logRef = useRef(null);
  const menusRef = useRef(null);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 40);
    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [turns, busy]);

  useEffect(() => {
    if (!historyOpen && !favsOpen) return undefined;
    const closeMenus = () => {
      setHistoryOpen(false);
      setFavsOpen(false);
    };
    const onPointerDown = (event) => {
      if (menusRef.current?.contains(event.target)) return;
      closeMenus();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeMenus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [historyOpen, favsOpen]);

  const user = state.currentUser;
  const greetName = user?.firstName || user?.name || (isSp ? 'Edmonton AB Admin' : 'there');
  const starters = isSp ? PLAYBOOK_STARTERS : content.chips.map((label) => ({ key: label, label }));
  const searchQuery = useSearch(draft);
  const searchResults = useMemo(
    () =>
      (searchQuery.data || []).map((item) => ({
        ...item,
        label: item.title || item.label,
      })),
    [searchQuery.data]
  );
  const showSearch = draft.trim().length >= 2 && searchResults.length > 0;

  const runAction = (action) => {
    runAssistantAction(action, {
      navigate,
      onOnboard,
      canAccessModule,
      canTab,
    });
  };

  const persistCurrent = (nextTurns) => {
    if (!nextTurns.length) return;
    if (!chatIdRef.current) chatIdRef.current = `chat-${Date.now().toString(36)}`;
    const thread = {
      id: chatIdRef.current,
      title: titleFromTurns(nextTurns),
      turns: nextTurns,
      page: pageLabel,
      ts: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };
    setHistory((prev) => {
      const next = [thread, ...prev.filter((item) => item.id !== thread.id)].slice(0, 12);
      writeHistory(next);
      return next;
    });
  };

  const askPlaybook = (key, instant = false) => {
    const answer = PLAYBOOK[key];
    if (!answer) return;
    turnId.current += 1;
    const turn = {
      id: turnId.current,
      prompt: answer.q,
      playbookKey: key,
      reply: null,
      action: null,
    };
    const nextTurns = [...turns, turn];
    setTurns(nextTurns);
    setViewing({ type: 'playbook', key, instant, turnId: turn.id });
    persistCurrent(nextTurns);
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };

  const send = (rawPrompt) => {
    const prompt = String(rawPrompt || '').trim();
    if (!prompt || busy) return;
    const playbookKey = PLAYBOOK[prompt] ? prompt : resolvePlaybookKey(prompt);
    if (playbookKey && PLAYBOOK[playbookKey]) {
      setDraft('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
      askPlaybook(playbookKey);
      return;
    }
    turnId.current += 1;
    const turn = { id: turnId.current, prompt, playbookKey: null, reply: null, action: null };
    const nextTurns = [...turns, turn];
    setTurns(nextTurns);
    setDraft('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setBusy(true);
    setViewing({ type: 'intent', turnId: turn.id });
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const result = resolveIntent(content, prompt);
      const withReply = nextTurns.map((item) =>
        item.id === turn.id ? { ...item, reply: result.reply, action: result.action } : item
      );
      setTurns(withReply);
      persistCurrent(withReply);
      setBusy(false);
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
    }, 400);
  };

  const currentTitle = titleFromTurns(turns);
  const currentIsFavorite = turns.length > 0 && favorites.some((item) => item.title === currentTitle);
  const activeTurnId = viewing.turnId;
  const activeTurn = turns.find((turn) => turn.id === activeTurnId) || turns[turns.length - 1] || null;
  const playbookAnswer = viewing.type === 'playbook' ? PLAYBOOK[viewing.key] : null;

  const isFavorite = (thread) => !!thread?.title && favorites.some((item) => item.title === thread.title);

  const toggleFavorite = (thread) => {
    if (!thread?.title) return;
    setFavorites((prev) => {
      const exists = prev.some((item) => item.title === thread.title);
      const next = exists
        ? prev.filter((item) => item.title !== thread.title)
        : [{ ...thread, id: thread.id || `fav-${Date.now().toString(36)}` }, ...prev].slice(0, 12);
      writeFavorites(next);
      return next;
    });
  };

  const removeHistory = (thread) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item.id !== thread.id && item.title !== thread.title);
      writeHistory(next);
      return next;
    });
  };

  const currentThread = {
    id: `current-${currentTitle}`,
    title: currentTitle,
    turns,
    page: pageLabel,
  };

  const newChat = () => {
    window.clearTimeout(timerRef.current);
    chatIdRef.current = null;
    setTurns([]);
    setBusy(false);
    setDraft('');
    setViewing({ type: isSp ? 'landing' : 'empty' });
    setHistoryOpen(false);
    setFavsOpen(false);
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };

  const openThread = (thread) => {
    const normalized = normalizeThread(thread);
    chatIdRef.current = normalized.id || null;
    setTurns(normalized.turns || []);
    const last = (normalized.turns || [])[normalized.turns.length - 1];
    if (last?.playbookKey && PLAYBOOK[last.playbookKey]) {
      setViewing({ type: 'playbook', key: last.playbookKey, instant: true, turnId: last.id });
    } else if (last) {
      setViewing({ type: 'intent', turnId: last.id });
    } else {
      setViewing({ type: isSp ? 'landing' : 'empty' });
    }
    setHistoryOpen(false);
    setFavsOpen(false);
  };

  const reopen = (turn) => {
    if (turn.playbookKey && PLAYBOOK[turn.playbookKey]) {
      setViewing({ type: 'playbook', key: turn.playbookKey, instant: true, turnId: turn.id });
      return;
    }
    setViewing({ type: 'intent', turnId: turn.id });
  };

  const handleExport = () => {
    if (playbookAnswer) {
      downloadAssistantExport(playbookAnswer.q, buildAnswerExportHtml(playbookAnswer));
      toast('Response exported as HTML');
      return;
    }
    downloadAssistantExport(PLAYBOOK_LANDING.title, buildLandingExportHtml());
    toast('Response exported as HTML');
  };

  const openCreateWidget = (kind, title, snapshot = {}) => {
    setWidgetError('');
    setWidgetDraft(
      blankCustomWidget({
        title,
        kind: snapshot.chart && !snapshot.table ? 'chart' : kind,
        table: snapshot.table || null,
        chart: snapshot.chart || null,
        span: kind === 'chart' ? 8 : 12,
        category: 'Collections',
        placeOn: 'home',
      })
    );
  };

  const handleCreateWidget = async (event, draft) => {
    event?.preventDefault?.();
    const settings = settingsQuery.data || {};
    const userKey = user?.id || user?.email || 'anonymous';
    const widget = persistableWidget(draft);
    const { changes, placedOn } = placeCustomWidget(
      settings,
      { ...widget, placeOn: draft.placeOn, dashboardName: draft.dashboardName },
      { userKey, user }
    );
    setWidgetBusy(true);
    setWidgetError('');
    try {
      await updateWorkspace.mutateAsync(changes);
      setWidgetDraft(null);
      toast(`Widget “${widget.title}” created on ${placedOn}`);
    } catch {
      setWidgetError('Unable to create this widget.');
    } finally {
      setWidgetBusy(false);
    }
  };

  const openCreateReport = (kind, title, snapshot = {}) => {
    const source = snapshot.source || 'aggregatedTips';
    const fields = REPORT_DATA_SOURCES[source]?.fields || [];
    setReportError('');
    setReportDraft(
      blankReportSpec({
        name: title || '',
        desc: '',
        source,
        groupBy: snapshot.groupBy || fields[0] || 'truck',
        chart: snapshot.chartType || (kind === 'chart' ? 'bar' : 'bar'),
        timeframe: 'today',
        category: 'Operations',
        visibility: 'private',
        ownerId: user?.id || '',
        owner: user?.name || '',
      })
    );
  };

  const handleCreateReport = async (event, draft) => {
    event?.preventDefault?.();
    const spec = blankReportSpec({
      ...draft,
      id: `rpt-ai-${Date.now()}`,
      name: String(draft?.name || '').trim(),
      desc: String(draft?.desc || '').trim() || 'Created from Vision AI.',
      sharedWith: draft?.visibility === 'public' ? ['*'] : [],
      ownerId: user?.id || '',
      owner: user?.name || '',
    });
    setReportBusy(true);
    setReportError('');
    try {
      await upsertReport.mutateAsync(spec);
      setReportDraft(null);
      toast(`Report “${spec.name}” created`);
      navigate('reports');
    } catch {
      setReportError('Unable to create this report.');
    } finally {
      setReportBusy(false);
    }
  };

  const answerSub =
    viewing.type === 'playbook'
      ? playbookAnswer?.persona?.scope || 'How I read your question'
      : viewing.type === 'intent'
        ? 'A short answer you can act on'
        : isSp
          ? "Today's collections until you ask"
          : 'Ask a question to see an answer';

  return (
    <aside
      className="flex h-full min-h-0 w-full shrink-0 flex-col border-r border-line bg-surface lg:w-[min(52rem,46vw)]"
      aria-label="Vision AI"
    >
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-3">
        <div className="flex min-w-0 items-center gap-2">
          <VisionAiMark size={28} className="shrink-0 rounded-md" />
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-semibold text-brand">Vision AI</div>
            <p className="truncate text-[10px] text-ink-faint">
              {isSp ? 'Service Provider · collections' : content.eyebrow}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={newChat}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-muted hover:bg-elevated hover:text-ink"
            aria-label="New chat"
            title="New chat"
          >
            <Icon name="plus" size={14} />
            New chat
          </button>
          <div ref={menusRef} className="flex items-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setHistoryOpen(false);
                  setFavsOpen((open) => !open);
                }}
                className={`relative rounded-lg p-1.5 hover:bg-elevated ${
                  currentIsFavorite || favsOpen ? 'text-brand' : 'text-ink-muted hover:text-ink'
                }`}
                aria-label="Favorite chats"
                aria-expanded={favsOpen}
                aria-pressed={currentIsFavorite}
                title={currentIsFavorite ? 'Favorited' : 'Favorites'}
              >
                <Icon name="star" size={16} filled={currentIsFavorite} />
              </button>
              {favsOpen && (
                <div className="absolute right-0 z-20 mt-1 w-72 rounded-2xl border border-line bg-surface p-1.5 shadow-float">
                  <div className="px-2.5 pb-1 pt-1.5 type-overline">Favorites</div>
                  {turns.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleFavorite(currentThread)}
                      className="mb-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left hover:bg-elevated"
                    >
                      <Icon
                        name="star"
                        size={14}
                        filled={currentIsFavorite}
                        className={currentIsFavorite ? 'text-brand' : 'text-ink-faint'}
                      />
                      <span className="text-xs font-medium text-ink">
                        {currentIsFavorite ? 'Remove current chat' : 'Save current chat'}
                      </span>
                    </button>
                  )}
                  {favorites.length ? (
                    favorites.map((thread) => (
                      <div key={thread.id} className="group flex items-center gap-0.5 rounded-xl hover:bg-elevated">
                        <button type="button" onClick={() => openThread(thread)} className="min-w-0 flex-1 px-2.5 py-2 text-left">
                          <div className="truncate text-xs font-medium text-ink">{thread.title}</div>
                          <div className="truncate text-[10px] text-ink-faint">{thread.page}</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(thread)}
                          className="rounded-lg p-1.5 text-brand"
                          aria-label={`Unfavorite ${thread.title}`}
                        >
                          <Icon name="star" size={14} filled />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(thread)}
                          className="mr-1 rounded-lg p-1.5 text-ink-faint opacity-0 hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
                          aria-label={`Delete ${thread.title}`}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="px-2.5 py-3 text-xs text-ink-muted">No favorite chats yet. Save one from this menu.</div>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setFavsOpen(false);
                  setHistoryOpen((open) => !open);
                }}
                className="relative rounded-lg p-1.5 text-ink-muted hover:bg-elevated hover:text-ink"
                aria-label="Chat history"
                aria-expanded={historyOpen}
                title="History"
              >
                <Icon name="clock" size={16} />
              </button>
              {historyOpen && (
                <div className="absolute right-0 z-20 mt-1 w-72 rounded-2xl border border-line bg-surface p-1.5 shadow-float">
                  {history.length ? (
                    history.map((thread) => {
                      const favored = isFavorite(thread);
                      const count = (thread.turns || []).length;
                      return (
                        <div key={thread.id} className="group flex items-center gap-0.5 rounded-xl hover:bg-elevated">
                          <button type="button" onClick={() => openThread(thread)} className="min-w-0 flex-1 px-2.5 py-2 text-left">
                            <div className="truncate text-xs font-medium text-ink">{thread.title}</div>
                            <div className="truncate text-[10px] text-ink-faint">
                              {thread.ts || thread.page}
                              {count ? ` · ${count} question${count === 1 ? '' : 's'}` : ''}
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleFavorite(thread)}
                            className={`rounded-lg p-1.5 ${favored ? 'text-brand' : 'text-ink-faint hover:text-ink'}`}
                            aria-label={favored ? `Unfavorite ${thread.title}` : `Favorite ${thread.title}`}
                          >
                            <Icon name="star" size={14} filled={favored} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeHistory(thread)}
                            className="mr-1 rounded-lg p-1.5 text-ink-faint opacity-0 hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
                            aria-label={`Delete ${thread.title}`}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-2.5 py-3 text-xs text-ink-muted">No earlier chats yet.</div>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-elevated hover:text-ink"
            aria-label="Close Vision AI"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="flex min-h-0 min-w-0 flex-col border-b border-line bg-canvas lg:h-auto lg:w-[20rem] lg:shrink-0 lg:border-b-0 lg:border-r" aria-label="Ask">
          <div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-3 py-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-[11px] font-bold text-white">?</span>
            <div>
              <p className="text-xs font-semibold text-brand">Ask</p>
              <p className="text-[10px] text-ink-faint">Your questions land here</p>
            </div>
          </div>
          <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 scroll-thin">
            {turns.length === 0 ? (
              <div className="rounded-panel border border-dashed border-line-strong bg-brand-soft px-3 py-3 text-xs leading-relaxed text-ink-muted">
                <p className="mb-1 text-sm font-semibold text-brand">
                  {timeGreeting()}, {greetName}
                </p>
                No questions in this chat yet. Type one below, or pick a suggestion to start.
              </div>
            ) : (
              <div className="flex flex-col items-end gap-3" role="log" aria-live="polite">
                {turns.map((turn) => (
                  <button
                    key={turn.id}
                    type="button"
                    onClick={() => reopen(turn)}
                    className={`max-w-[92%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-left text-[13px] leading-relaxed text-white ${
                      turn.id === activeTurnId ? 'bg-brand ring-2 ring-brand/30 ring-offset-2' : 'bg-brand'
                    }`}
                  >
                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-white/70">
                      You asked · tap to reopen
                    </span>
                    {turn.prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-line px-3 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-faint">Try asking</p>
            <div className="space-y-1.5">
              {starters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  disabled={busy}
                  onClick={() => (PLAYBOOK[item.key] ? askPlaybook(item.key) : send(item.label))}
                  className="block w-full rounded-control border border-line bg-surface px-3 py-2 text-left text-xs font-medium text-brand hover:border-brand hover:bg-brand-soft disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative shrink-0 border-t border-line px-3 pb-3 pt-2">
            {showSearch && (
              <div className="absolute inset-x-3 bottom-full z-20 mb-2 max-h-64 overflow-y-auto rounded-panel border border-line bg-surface p-1.5 shadow-float scroll-thin">
                <div className="px-3 pb-1 pt-1.5 type-overline">Jump to</div>
                {searchResults.slice(0, 8).map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => {
                      navigate(result.module, result.params);
                      setDraft('');
                    }}
                    className="block w-full rounded-control px-3 py-2 text-left hover:bg-elevated"
                  >
                    <span className="block truncate text-sm font-medium text-ink">{result.label}</span>
                    {(result.meta || result.category) && (
                      <span className="mt-0.5 block truncate text-xs text-ink-muted">{result.meta || result.category}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(draft);
              }}
              className="flex items-end gap-2"
            >
              <label className="flex min-h-9 min-w-0 flex-1 items-center rounded-control border border-line bg-elevated px-3">
                <span className="sr-only">Message Vision AI</span>
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    const field = event.target;
                    field.style.height = 'auto';
                    field.style.height = `${Math.min(field.scrollHeight, 96)}px`;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      send(draft);
                    }
                  }}
                  disabled={busy}
                  rows={1}
                  placeholder={
                    isSp
                      ? "Ask about today's collections, routes, trucks, work orders…"
                      : 'How can I help you today?'
                  }
                  className="max-h-24 min-h-9 w-full resize-none bg-transparent py-2 text-sm leading-5 text-ink placeholder:text-ink-faint focus:outline-none focus-visible:shadow-none"
                />
              </label>
              <Button type="submit" variant="primary" disabled={busy || !draft.trim()} className="!px-3">
                Ask
              </Button>
            </form>
          </div>
        </section>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-canvas" aria-label="Answer">
          <div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-3 py-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-success text-[11px] font-bold text-white">✦</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-brand">Answer</p>
              <p className="truncate text-[10px] text-ink-faint">{answerSub}</p>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 scroll-thin">
            {viewing.type === 'playbook' && playbookAnswer && (
              <StructuredAnswer
                key={`${viewing.turnId}-${viewing.instant ? 'i' : 'a'}`}
                answer={playbookAnswer}
                instant={!!viewing.instant}
                onAsk={askPlaybook}
                onExport={handleExport}
                onCreateWidget={openCreateWidget}
                onCreateReport={openCreateReport}
              />
            )}
            {viewing.type === 'intent' && (
              busy && activeTurn && !activeTurn.reply ? (
                <div className="flex items-center gap-2 text-sm text-ink-muted" role="status">
                  <span className="loading-spinner" />
                  Reading your question…
                </div>
              ) : (
                <IntentAnswer text={activeTurn?.reply || content.fallback} action={activeTurn?.action} onAction={runAction} />
              )
            )}
            {viewing.type === 'landing' && (
              <LandingReport
                onAsk={askPlaybook}
                onExport={handleExport}
                onCreateWidget={openCreateWidget}
                onCreateReport={openCreateReport}
              />
            )}
            {viewing.type === 'empty' && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Icon name="zap" size={18} />
                </span>
                <h2 className="font-display text-[1.05rem] font-semibold text-brand">{content.heading}</h2>
                <p className="mt-2 max-w-[18rem] text-[12.5px] leading-relaxed text-ink-muted">{content.intro}</p>
              </div>
            )}
          </div>
        </section>
      </div>
      {widgetDraft && (
        <CreateWidgetDrawer
          draft={widgetDraft}
          onChange={setWidgetDraft}
          onClose={() => {
            if (!widgetBusy) {
              setWidgetDraft(null);
              setWidgetError('');
            }
          }}
          onSubmit={handleCreateWidget}
          busy={widgetBusy}
          error={widgetError}
          templates={settingsQuery.data?.dashboardTemplates || []}
        />
      )}
      {reportDraft && (
        <CreateReportDrawer
          draft={reportDraft}
          onChange={setReportDraft}
          onClose={() => {
            if (!reportBusy) {
              setReportDraft(null);
              setReportError('');
            }
          }}
          onSubmit={handleCreateReport}
          busy={reportBusy}
          error={reportError}
        />
      )}
    </aside>
  );
}
