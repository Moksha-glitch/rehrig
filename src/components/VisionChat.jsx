import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { Button } from './UI.jsx';
import { LandingReport, StructuredAnswer } from './AssistantAnswer.jsx';
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
  DAY_METRICS_KEY,
  DAY_METRICS_PROMPT,
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

function storageKey(base, userKey) {
  return `${base}.${userKey || 'anon'}`;
}

function readHistory(userKey) {
  try {
    const raw = window.localStorage.getItem(storageKey(HISTORY_KEY, userKey));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeThread) : [];
  } catch {
    return [];
  }
}

function writeHistory(userKey, threads) {
  try {
    window.localStorage.setItem(storageKey(HISTORY_KEY, userKey), JSON.stringify(threads.slice(0, 12)));
  } catch {
    /* ignore quota / private-mode failures */
  }
}

function readFavorites(userKey) {
  try {
    const raw = window.localStorage.getItem(storageKey(FAVS_KEY, userKey));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeThread) : [];
  } catch {
    return [];
  }
}

function writeFavorites(userKey, threads) {
  try {
    window.localStorage.setItem(storageKey(FAVS_KEY, userKey), JSON.stringify(threads.slice(0, 12)));
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

function rollToChild(scroller, child, instant) {
  if (!scroller || !child) return;
  const top =
    scroller.scrollTop +
    child.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top -
    12;
  scroller.scrollTo({ top: Math.max(0, top), behavior: instant ? 'auto' : 'smooth' });
}

function chatReplyFor(key) {
  if (key === DAY_METRICS_KEY) {
    return "Here's today's collections — tips so far, trucks reporting, unmatched carts, and route pace.";
  }
  const answer = PLAYBOOK[key];
  if (!answer?.summary) return '';
  return String(answer.summary).replace(/\{\{(c\d+)\}\}/g, (_, id) => answer.claims?.[id]?.v || '');
}

export default function VisionChat({ onOnboard, onClose, children }) {
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
  const user = state.currentUser;
  const userKey = user?.id || user?.email || 'anonymous';
  const isSp = persona === 'sp';
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState([]);
  const [viewing, setViewing] = useState({ type: 'landing' });
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(() => readHistory(userKey));
  const [favorites, setFavorites] = useState(() => readFavorites(userKey));
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
  const agentScrollRef = useRef(null);
  const currentAnswerRef = useRef(null);

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
    if (viewing.type !== 'playbook' || !viewing.turnId) return undefined;
    const scroller = agentScrollRef.current;
    if (!scroller) return undefined;

    let cancelled = false;
    const roll = () => {
      if (cancelled) return;
      const target = document.getElementById(`vision-answer-${viewing.turnId}`);
      if (!target) return;
      rollToChild(scroller, target, !!viewing.instant);
    };

    const frame = window.requestAnimationFrame(roll);
    const retry = window.setTimeout(roll, 120);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(retry);
    };
  }, [viewing.type, viewing.turnId, viewing.focus, viewing.instant]);

  useEffect(() => {
    window.clearTimeout(timerRef.current);
    chatIdRef.current = null;
    turnId.current = 0;
    setTurns([]);
    setDraft('');
    setBusy(false);
    setViewing({ type: 'landing' });
    setHistory(readHistory(userKey));
    setFavorites(readFavorites(userKey));
    setHistoryOpen(false);
    setFavsOpen(false);
  }, [userKey]);

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

  const greetName = user?.firstName || user?.name || (isSp ? 'Edmonton AB Admin' : 'there');
  const starters = PLAYBOOK_STARTERS;
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
      writeHistory(userKey, next);
      return next;
    });
  };

  const finishTurnReply = (id, reply) => {
    setTurns((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, reply } : item));
      persistCurrent(next);
      return next;
    });
    setBusy(false);
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };

  const askDayMetrics = (instant = false) => {
    turnId.current += 1;
    const turn = {
      id: turnId.current,
      prompt: DAY_METRICS_PROMPT,
      playbookKey: DAY_METRICS_KEY,
      reply: instant ? chatReplyFor(DAY_METRICS_KEY) : null,
      action: null,
    };
    const nextTurns = [...turns, turn];
    setTurns(nextTurns);
    setViewing((prev) => ({
      type: 'landing',
      instant,
      turnId: turn.id,
      focus: (prev.focus || 0) + 1,
    }));
    if (instant) {
      persistCurrent(nextTurns);
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
      return;
    }
    setBusy(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => finishTurnReply(turn.id, chatReplyFor(DAY_METRICS_KEY)), 520);
  };

  const askPlaybook = (key, instant = false) => {
    if (key === DAY_METRICS_KEY) {
      askDayMetrics(instant);
      return;
    }
    const answer = PLAYBOOK[key];
    if (!answer) return;
    turnId.current += 1;
    const turn = {
      id: turnId.current,
      prompt: answer.q,
      playbookKey: key,
      reply: instant ? chatReplyFor(key) : null,
      action: null,
    };
    const nextTurns = [...turns, turn];
    setTurns(nextTurns);
    setViewing((prev) => ({
      type: 'playbook',
      key,
      instant,
      turnId: turn.id,
      focus: (prev.focus || 0) + 1,
    }));
    if (instant) {
      persistCurrent(nextTurns);
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
      return;
    }
    setBusy(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => finishTurnReply(turn.id, chatReplyFor(key)), 520);
  };

  const send = (rawPrompt) => {
    const prompt = String(rawPrompt || '').trim();
    if (!prompt || busy) return;
    const playbookKey = PLAYBOOK[prompt] ? prompt : resolvePlaybookKey(prompt);
    if (
      prompt.toLowerCase() === DAY_METRICS_PROMPT.toLowerCase() ||
      /today'?s collections|daily collections|metrics of (the |this )?day/.test(prompt.toLowerCase())
    ) {
      setDraft('');
      askDayMetrics();
      return;
    }
    if (playbookKey && PLAYBOOK[playbookKey]) {
      setDraft('');
      askPlaybook(playbookKey);
      return;
    }
    turnId.current += 1;
    const turn = { id: turnId.current, prompt, playbookKey: null, reply: null, action: null };
    const nextTurns = [...turns, turn];
    setTurns(nextTurns);
    setDraft('');
    setBusy(true);
    setViewing((prev) => ({
      type: prev.type === 'idle' ? 'landing' : prev.type,
      key: prev.key,
      turnId: turn.id,
    }));
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
  const playbookAnswer = viewing.type === 'playbook' ? PLAYBOOK[viewing.key] : null;

  const isFavorite = (thread) => !!thread?.title && favorites.some((item) => item.title === thread.title);

  const toggleFavorite = (thread) => {
    if (!thread?.title) return;
    setFavorites((prev) => {
      const exists = prev.some((item) => item.title === thread.title);
      const next = exists
        ? prev.filter((item) => item.title !== thread.title)
        : [{ ...thread, id: thread.id || `fav-${Date.now().toString(36)}` }, ...prev].slice(0, 12);
      writeFavorites(userKey, next);
      return next;
    });
  };

  const removeHistory = (thread) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item.id !== thread.id && item.title !== thread.title);
      writeHistory(userKey, next);
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
    setViewing({ type: 'landing' });
    setHistoryOpen(false);
    setFavsOpen(false);
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };

  const openThread = (thread) => {
    const normalized = normalizeThread(thread);
    chatIdRef.current = normalized.id || null;
    setTurns(normalized.turns || []);
    const last = (normalized.turns || [])[normalized.turns.length - 1];
    if (last?.playbookKey === DAY_METRICS_KEY) {
      setViewing((prev) => ({
        type: 'landing',
        instant: true,
        turnId: last.id,
        focus: (prev.focus || 0) + 1,
      }));
    } else if (last?.playbookKey && PLAYBOOK[last.playbookKey]) {
      setViewing((prev) => ({
        type: 'playbook',
        key: last.playbookKey,
        instant: true,
        turnId: last.id,
        focus: (prev.focus || 0) + 1,
      }));
    } else {
      setViewing((prev) => ({
        type: 'landing',
        turnId: last?.id,
        focus: (prev.focus || 0) + 1,
      }));
    }
    setHistoryOpen(false);
    setFavsOpen(false);
  };

  const reopen = (turn) => {
    if (turn.playbookKey === DAY_METRICS_KEY) {
      setViewing((prev) => ({
        type: 'landing',
        instant: true,
        turnId: turn.id,
        focus: (prev.focus || 0) + 1,
      }));
      return;
    }
    if (turn.playbookKey && PLAYBOOK[turn.playbookKey]) {
      setViewing((prev) => ({
        type: 'playbook',
        key: turn.playbookKey,
        instant: true,
        turnId: turn.id,
        focus: (prev.focus || 0) + 1,
      }));
    }
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

  const showDetail = viewing.type === 'playbook' || viewing.type === 'landing';
  const answerSub =
    viewing.type === 'landing'
      ? PLAYBOOK_LANDING.sub
      : playbookAnswer?.persona?.scope || "Today's collections";

  const closeDetail = () => setViewing({ type: 'idle' });

  const playbookTurns = turns.filter(
    (turn) => turn.playbookKey && turn.playbookKey !== DAY_METRICS_KEY && PLAYBOOK[turn.playbookKey]
  );

  const agentPage = showDetail ? (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-canvas" aria-label="Answer">
      <div className="flex h-[60px] shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-brand">Today&apos;s collections</p>
          <p className="truncate text-[10px] text-ink-faint">{answerSub}</p>
        </div>
        <button
          type="button"
          onClick={closeDetail}
          className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-muted hover:bg-elevated hover:text-ink"
        >
          Back to page
        </button>
      </div>
      <div
        ref={agentScrollRef}
        className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4 scroll-thin [overflow-anchor:none]"
      >
        <LandingReport
          instant={!!viewing.instant}
          onAsk={askPlaybook}
          onExport={handleExport}
          onCreateWidget={openCreateWidget}
          onCreateReport={openCreateReport}
        />
        {playbookTurns.map((turn) => (
          <div
            key={turn.id}
            id={`vision-answer-${turn.id}`}
            ref={turn.id === viewing.turnId ? currentAnswerRef : undefined}
            className={`mt-8 border-t border-line pt-6 ${
              turn.id === viewing.turnId ? 'min-h-[calc(100vh-8.5rem)]' : ''
            }`}
          >
            <StructuredAnswer
              answer={PLAYBOOK[turn.playbookKey]}
              instant={turn.id !== viewing.turnId || !!viewing.instant}
              onAsk={askPlaybook}
              onExport={handleExport}
              onCreateWidget={openCreateWidget}
              onCreateReport={openCreateReport}
            />
          </div>
        ))}
      </div>
    </section>
  ) : null;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
    <aside
      className={`flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-line bg-surface ${
        showDetail ? 'w-[426px]' : 'w-full lg:w-[426px]'
      }`}
      aria-label="Vision AI"
    >
      <div className="flex h-[60px] shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-3">
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-semibold text-brand">Vision AI</div>
          <p className="truncate text-[10px] text-ink-faint">
            {isSp ? 'Service Provider · collections' : content.eyebrow}
          </p>
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

      <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-canvas px-3 py-2.5 scroll-thin">
        {turns.length === 0 ? (
          <div className="rounded-panel border border-dashed border-line-strong bg-brand-soft px-3 py-2 text-xs leading-relaxed text-ink-muted">
            <p className="mb-0.5 text-sm font-semibold text-brand">
              {timeGreeting()}, {greetName}
            </p>
            Type a question below, or pick a suggestion to start.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5" role="log" aria-live="polite">
            {turns.map((turn) => {
              const isReport =
                turn.playbookKey === DAY_METRICS_KEY || !!(turn.playbookKey && PLAYBOOK[turn.playbookKey]);
              const waiting = busy && !turn.reply && turn.id === turns[turns.length - 1]?.id;
              return (
                <div key={turn.id} className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => reopen(turn)}
                    className={`assistant-msg-enter max-w-[92%] self-end rounded-2xl rounded-br-md px-3 py-2 text-left text-[13px] leading-snug text-white ${
                      turn.id === activeTurnId && isReport ? 'bg-brand ring-2 ring-brand/30 ring-offset-2' : 'bg-brand'
                    }`}
                  >
                    {turn.prompt}
                  </button>
                  {waiting ? (
                    <div className="assistant-msg-enter flex max-w-[92%] items-center gap-2 self-start rounded-2xl rounded-bl-md border border-line bg-surface px-3 py-2 text-[13px] text-ink-muted">
                      <span className="loading-spinner" />
                      Reading your question…
                    </div>
                  ) : turn.reply ? (
                    <div className="assistant-msg-enter max-w-[92%] self-start rounded-2xl rounded-bl-md border border-line bg-surface px-3 py-2 text-left text-[13px] leading-snug text-ink">
                      <p>{turn.reply}</p>
                      {isReport && (
                        <button
                          type="button"
                          onClick={() => reopen(turn)}
                          className="mt-2 text-xs font-semibold text-brand hover:underline"
                        >
                          {turn.playbookKey === DAY_METRICS_KEY
                            ? "Jump to today's collections"
                            : 'Jump to this report'}
                        </button>
                      )}
                      {turn.action && (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          className="mt-2"
                          onClick={() => runAction(turn.action)}
                        >
                          {turn.action.label}
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="relative shrink-0 overflow-hidden border-t border-line bg-surface px-3 py-2">
        {showSearch && (
          <div className="absolute inset-x-3 bottom-full z-20 mb-1.5 max-h-56 overflow-y-auto rounded-panel border border-line bg-surface p-1.5 shadow-float scroll-thin">
            <div className="px-3 pb-1 pt-1.5 type-overline">Jump to</div>
            {searchResults.slice(0, 8).map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => {
                  navigate(result.module, result.params);
                  setDraft('');
                }}
                className="block w-full rounded-control px-3 py-1.5 text-left hover:bg-elevated"
              >
                <span className="block truncate text-sm font-medium text-ink">{result.label}</span>
                {(result.meta || result.category) && (
                  <span className="mt-0.5 block truncate text-xs text-ink-muted">{result.meta || result.category}</span>
                )}
              </button>
            ))}
          </div>
        )}
        <div className="mb-2">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-faint">Try asking</p>
          <div className="flex flex-col gap-1">
            {starters.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={busy}
                onClick={() =>
                  item.key === DAY_METRICS_KEY || PLAYBOOK[item.key]
                    ? askPlaybook(item.key)
                    : send(item.label)
                }
                className="block w-full rounded-control border border-line bg-canvas px-2.5 py-1.5 text-left text-xs font-medium text-brand hover:border-brand hover:bg-brand-soft disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
          className="flex items-center gap-2"
        >
          <label className="flex h-9 min-w-0 flex-1 items-center overflow-hidden rounded-control border border-line bg-elevated px-3">
            <span className="sr-only">Message Vision AI</span>
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={busy}
              autoComplete="off"
              placeholder={
                isSp
                  ? "Ask about today's collections, routes, trucks…"
                  : 'How can I help you today?'
              }
              className="min-w-0 h-full w-full overflow-hidden bg-transparent text-sm leading-5 text-ink placeholder:text-ink-faint focus:outline-none focus-visible:shadow-none"
            />
          </label>
          <Button type="submit" variant="primary" disabled={busy || !draft.trim()} className="!h-9 !px-3 !py-0">
            Ask
          </Button>
        </form>
      </div>
    </aside>
    {typeof children === 'function' ? children(agentPage) : children}
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
    </div>
  );
}
