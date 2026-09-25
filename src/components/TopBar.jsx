/**
 * App chrome: desktop search + account, small screens = hamburger nav.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import VisionAiMark from './VisionAiMark.jsx';
import UserAccountMenu from './UserAccountMenu.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { useSearch } from '../hooks/useSearch.js';
import { NAV, filterNavTree, isNavItemActive } from './navConfig.js';
import { getAvatarProps } from '../utils/theme.js';
import AppLauncher from './AppLauncher.jsx';

export default function TopBar() {
  const {
    state,
    persona,
    navigate,
    logout,
    canNav,
    openAssistant,
    isScoped,
    canPreviewPersonas,
    personaViews,
    previewPersona,
    exitPersonaPreview,
    previewOrigin,
    isPreviewingPersona,
    psgLabel,
  } = useStore();
  const accountsQuery = useAccounts();
  const user = state.currentUser;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState({});
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const searchRef = useRef(null);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const searchResults = useSearch(searchQuery);
  const liveResults = searchResults.data || [];

  const normalSuggestions = [
    { icon: 'box', label: 'View Assets / Trucks', module: 'assets' },
    { icon: 'clipboard', label: 'Recent Work Orders', module: 'workOrders' },
    { icon: 'users', label: 'Manage Customers', module: 'customers' },
  ];

  const aiSuggestions = [
    { icon: 'star', label: 'Summarize recent dispatches in my area' },
    { icon: 'star', label: 'Find delayed routes from yesterday' },
    { icon: 'star', label: "Show today's collections" },
    { icon: 'star', label: 'Show me alerts for missing containers' },
  ];

  const closeSearch = () => {
    setIsSearchFocused(false);
    setIsAiMode(false);
  };

  const goToResult = (result) => {
    if (!result?.module) return;
    navigate(result.module, result.params || {});
    setSearchQuery('');
    closeSearch();
  };

  const askFromSearch = (prompt) => {
    const text = String(prompt || searchQuery || '').trim();
    openAssistant();
    if (text) window.dispatchEvent(new CustomEvent('vision:ask', { detail: { prompt: text } }));
    setSearchQuery('');
    closeSearch();
  };

  const tree = useMemo(
    () => filterNavTree(NAV[persona] || [], canNav),
    [persona, canNav]
  );

  const accounts = accountsQuery.data || [];
  const scopedAccount =
    persona !== 'rehrig'
      ? accounts.find((a) => user?.accountIds?.includes(a.id)) ||
        (persona === 'sp' ? accounts[0] : null)
      : null;

  const activeModule = state.nav.module;
  const activeParams = state.nav.params || {};

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
      if (!searchRef.current?.contains(event.target)) {
        setIsSearchFocused(false);
        setIsAiMode(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        setMobileOpen(false);
        setIsSearchFocused(false);
        setIsAiMode(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const goTo = (item) => {
    if (item.module === 'assistant') {
      openAssistant();
      setMobileOpen(false);
      return;
    }
    navigate(item.module, item.params);
    setMobileOpen(false);
  };

  return (
    <>
      {isPreviewingPersona && (
        <header className="relative z-30 hidden border-b border-line bg-surface/95 backdrop-blur-md lg:block">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 bg-warn-soft px-4 py-2 text-xs text-warn sm:px-5">
              <Icon name="eye" size={14} />
              <span className="font-semibold uppercase tracking-wide">Admin preview</span>
              <span className="min-w-0 truncate">
                Viewing Vision as {user?.name} · {user?.role}
                {psgLabel ? ` · ${psgLabel}` : ''}
              </span>
              <button
                type="button"
                onClick={exitPersonaPreview}
                className="ml-auto font-semibold underline hover:no-underline"
              >
                Back to {previewOrigin?.name}
              </button>
            </div>
        </header>
      )}

      <header className="relative z-30 border-b border-line bg-surface/95 backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-control p-1.5 text-ink-muted interactive hover:bg-elevated hover:text-ink"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <Icon name="panelLeft" size={18} />
            </button>
            <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink">
              vision
            </span>
            <span className="hidden rounded-control border border-line bg-elevated px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint sm:inline">
              ops
            </span>
          </div>
          {isPreviewingPersona && (
            <div className="flex flex-col items-start gap-1 border-t border-line bg-warn-soft px-4 py-2 text-xs text-warn sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2.5">
              <Icon name="eye" size={14} />
              <span className="font-semibold uppercase tracking-wide">Admin preview</span>
              <span className="min-w-0 truncate">
                Viewing Vision as {user?.name} · {user?.role}
              </span>
              <button
                type="button"
                onClick={exitPersonaPreview}
                className="font-semibold underline hover:no-underline sm:ml-auto"
              >
                Back to {previewOrigin?.name}
              </button>
            </div>
          )}
      </header>

      {/* Desktop Header */}
      <header className="relative z-30 hidden h-[60px] border-b border-line bg-surface lg:flex">
        <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center gap-4 px-5 sm:px-7 lg:px-10">
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-line bg-canvas text-ink-muted hover:bg-elevated hover:text-ink"
          aria-label="App Launcher"
          onClick={() => setLauncherOpen(true)}
        >
          <Icon name="grid" size={16} />
        </button>
        {/* Left: Search Bar with AI Button */}
        <div ref={searchRef} className="relative flex w-full max-w-[35rem] flex-col">
          <div
            className={`relative flex h-10 w-full items-center gap-2 rounded-[10px] border px-3 transition-all duration-200 ${
              isSearchFocused
                ? 'border-accent bg-surface shadow-[0_0_0_3px_var(--color-accent-soft)]'
                : 'border-line bg-canvas hover:border-line-strong hover:bg-surface'
            }`}
          >
            <span className="pointer-events-none text-ink-faint">
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              placeholder={isAiMode ? 'Ask Vision AI…' : 'Search, or ask Vision AI…'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  if (isAiMode) {
                    askFromSearch(searchQuery);
                    return;
                  }
                  if (liveResults[0]) goToResult(liveResults[0]);
                }
              }}
              className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none"
            />

            {/* AI pill button — always visible on right inside search bar */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  askFromSearch(searchQuery);
                  return;
                }
                if (isSearchFocused) {
                  setIsAiMode(!isAiMode);
                } else {
                  openAssistant();
                }
              }}
              className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-[7px] px-2.5 text-[11.5px] font-extrabold transition-all duration-200 ${
                isAiMode
                  ? 'bg-accent text-white'
                  : 'bg-accent-soft text-accent hover:bg-accent hover:text-white'
              }`}
              aria-label="Toggle Vision AI"
              title="Ask Vision AI (⌘↵)"
            >
              <VisionAiMark size={18} className="rounded-[4px]" />
              Ask AI
            </button>
          </div>

          {/* Dropdown */}
          <div
            className={`absolute top-full z-50 w-full overflow-hidden rounded-b-lg border border-line bg-surface shadow-float transition-all duration-200 ${
              isSearchFocused ? 'max-h-96 border-t-0 opacity-100' : 'max-h-0 border-transparent border-t-0 opacity-0'
            }`}
          >
            <div className="p-2">
              <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                {isAiMode
                  ? 'Vision AI Suggestions'
                  : searchQuery.trim().length >= 2
                    ? 'Matching records'
                    : 'Jump to'}
              </div>
              <ul className="flex flex-col gap-0.5">
                {isAiMode ? (
                  aiSuggestions.map((s, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-ink-muted interactive hover:bg-elevated hover:text-ink"
                        onClick={() => askFromSearch(s.label)}
                      >
                        <Icon name={s.icon} size={15} className="shrink-0 text-ink-faint" />
                        <span className="truncate">{s.label}</span>
                      </button>
                    </li>
                  ))
                ) : searchQuery.trim().length >= 2 ? (
                  liveResults.length ? (
                    liveResults.slice(0, 8).map((result) => (
                      <li key={result.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-ink interactive hover:bg-elevated"
                          onClick={() => goToResult(result)}
                        >
                          <Icon name="search" size={15} className="shrink-0 text-ink-faint" />
                          <span className="min-w-0">
                            <span className="block truncate">{result.title || result.label}</span>
                            <span className="block truncate text-[11px] text-ink-faint">
                              {result.meta || result.category}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-2 py-3 text-sm text-ink-muted">No matching records.</li>
                  )
                ) : (
                  normalSuggestions.map((s, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-ink-muted interactive hover:bg-elevated hover:text-ink"
                        onClick={() => goToResult(s)}
                      >
                        <Icon name={s.icon} size={15} className="shrink-0 text-ink-faint" />
                        <span className="truncate">{s.label}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Right: User Profile */}
        {user && (
          <div className="relative ml-auto" ref={accountRef}>
            <button
              type="button"
              onClick={() => setAccountOpen(!accountOpen)}
              className={`flex items-center gap-2.5 rounded-xl p-1 text-left interactive hover:bg-elevated transition-colors ${accountOpen ? 'bg-elevated' : ''}`}
              aria-expanded={accountOpen}
              aria-haspopup="menu"
            >
              {(() => {
                const { initials } = getAvatarProps(user.name, user.role);
                return (
                  <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-brand text-[13px] font-bold text-white">
                    {initials}
                  </span>
                );
              })()}
              <div className="hidden flex-col xl:flex">
                <span className="text-[13px] font-bold leading-tight text-ink">{user.name}</span>
                <span className="mt-0.5 text-[11px] leading-tight text-ink-muted">
                  Admin · {user.email?.split('@')[0] || 'admin'}
                </span>
              </div>
            </button>

            {accountOpen && (
              <UserAccountMenu
                user={user}
                persona={persona}
                scopedAccount={scopedAccount}
                isScoped={isScoped}
                canPreviewPersonas={canPreviewPersonas}
                personaViews={personaViews}
                previewPersona={previewPersona}
                exitPersonaPreview={exitPersonaPreview}
                previewOrigin={previewOrigin}
                isPreviewingPersona={isPreviewingPersona}
                navigate={navigate}
                logout={logout}
                onClose={() => setAccountOpen(false)}
                className="absolute right-0 top-full mt-2 w-64 rounded-panel border border-line bg-surface p-1.5 shadow-float z-50"
              />
            )}
          </div>
        )}
        </div>
      </header>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="overlay-scrim fixed inset-0 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,92vw)] flex-col border-r border-line bg-surface shadow-float lg:hidden">
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <span className="font-display text-lg font-semibold text-ink">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-control p-1.5 text-ink-muted"
                aria-label="Close menu"
              >
                <Icon name="x" size={17} />
              </button>
            </div>
            {scopedAccount && (
              <div className="mx-3 mt-3 rounded-panel border border-line bg-elevated/70 px-3.5 py-3">
                <div className="type-overline">Service Provider</div>
                <div className="mt-1 truncate text-sm font-semibold text-ink">{scopedAccount.name}</div>
              </div>
            )}
            <nav className="flex-1 overflow-y-auto px-2.5 py-3 scroll-thin" aria-label="Mobile primary">
              {tree.map((node, i) => {
                if (node.type === 'item') {
                  const active = isNavItemActive(node, activeModule, activeParams);
                  return (
                    <button
                      key={node.key}
                      type="button"
                      onClick={() => goTo(node)}
                      className={`mb-0.5 flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-sm ${
                        active ? 'bg-elevated font-medium text-ink' : 'text-ink-muted hover:bg-elevated'
                      }`}
                    >
                      {node.icon && <Icon name={node.icon} size={15} className="text-ink-faint" />}
                      {node.label}
                    </button>
                  );
                }
                const expanded = mobileExpanded[i] ?? false;
                return (
                  <div key={node.label} className="mb-2 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMobileExpanded((prev) => ({ ...prev, [i]: !expanded }))
                      }
                      aria-expanded={expanded}
                      className="mb-1 flex w-full items-center justify-between px-3 py-1 type-overline"
                    >
                      <span>{node.label}</span>
                      <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={12} />
                    </button>
                    {expanded &&
                      node.children.map((item) => {
                        const active = isNavItemActive(item, activeModule, activeParams);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => goTo(item)}
                            className={`mb-0.5 flex w-full items-center gap-2 rounded-control px-3 py-2 pl-4 text-left text-sm ${
                              active
                                ? 'bg-elevated font-medium text-ink'
                                : 'text-ink-muted hover:bg-elevated'
                            }`}
                          >
                            {item.icon && (
                              <Icon name={item.icon} size={14} className="text-ink-faint" />
                            )}
                            {item.label}
                          </button>
                        );
                      })}
                  </div>
                );
              })}
            </nav>
            <div ref={accountRef} className="relative shrink-0 border-t border-line px-3 py-3">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left interactive hover:bg-elevated ${
                  accountOpen ? 'bg-elevated' : ''
                }`}
                aria-label={`Signed in as ${user?.name || 'user'}`}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                {(() => {
                  const { initials, palette } = getAvatarProps(user?.name, user?.role);
                  return (
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold text-white ${
                        isPreviewingPersona ? 'bg-warn shadow-[0_2px_8px_rgba(234,179,8,0.4)]' : ''
                      }`}
                      style={
                        !isPreviewingPersona
                          ? { background: palette.bg, boxShadow: `0 2px 8px ${palette.shadow}` }
                          : {}
                      }
                    >
                      {initials}
                    </span>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{user?.name}</div>
                  <div className="truncate text-[11px] text-ink-faint">{user?.role}</div>
                </div>
                <Icon name="chevronDown" size={12} className="text-ink-faint" />
              </button>
              {accountOpen && (
                <UserAccountMenu
                  user={user}
                  persona={persona}
                  scopedAccount={scopedAccount}
                  isScoped={isScoped}
                  canPreviewPersonas={canPreviewPersonas}
                  personaViews={personaViews}
                  previewPersona={previewPersona}
                  exitPersonaPreview={exitPersonaPreview}
                  previewOrigin={previewOrigin}
                  isPreviewingPersona={isPreviewingPersona}
                  navigate={navigate}
                  logout={logout}
                  onClose={() => {
                    setAccountOpen(false);
                    setMobileOpen(false);
                  }}
                />
              )}
            </div>
          </div>
        </>
      )}
      {launcherOpen && <AppLauncher onClose={() => setLauncherOpen(false)} />}
    </>
  );
}
