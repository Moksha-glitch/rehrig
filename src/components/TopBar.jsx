/**
 * Shell chrome that is not a Salesforce-style top bar:
 * desktop = persona-preview banner only; small screens = hamburger nav.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import UserAccountMenu from './UserAccountMenu.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { NAV, filterNavTree, isNavItemActive } from './navConfig.js';
import { getAvatarProps } from '../utils/theme.js';

function VaiRow({ active = false, collapsed = false, className = '' }) {
  const id = React.useId().replace(/:/g, '');
  const ink = active ? '#5DB7E7' : '#64748B';
  return (
    <svg
      viewBox={collapsed ? '0.5 0 48 48' : '0 0 240 49'}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {active && (
        <>
          <rect x="0.5" width="239" height="48" rx="4" fill={`url(#vai-fill-a-${id})`} fillOpacity="0.2" />
          <rect x="0.5" width="239" height="48" rx="4" fill={`url(#vai-fill-b-${id})`} />
          <rect x="0.5" width="239" height="48" rx="4" stroke={`url(#vai-stroke-${id})`} strokeOpacity="0.15" />
          <path
            d="M19.7256 39.7998C28.6635 39.7998 38.059 32.3516 38.059 23.9382C38.059 15.5247 28.6635 8.71094 19.7256 8.71094C10.7876 8.71094 8.94141 15.5247 8.94141 23.9382C8.94141 32.3516 10.7876 39.7998 19.7256 39.7998Z"
            fill={`url(#vai-mark-${id})`}
            fillOpacity="0.2"
          />
        </>
      )}
      <path
        d="M27.92 18.2305V20.897M29.2437 19.5637H26.5964M18.6546 30.23C18.6546 30.9663 18.062 31.5633 17.331 31.5633C16.5999 31.5633 16.0073 30.9663 16.0073 30.23C16.0073 29.4936 16.5999 28.8967 17.331 28.8967C18.062 28.8967 18.6546 29.4936 18.6546 30.23Z"
        stroke={ink}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M22.1763 32.8889L19.3825 27.259L13.7939 24.4444L19.3825 21.6299L22.1763 16L24.9701 21.6299L30.5587 24.4444L24.9701 27.259L22.1763 32.8889ZM16.8904 24.4444L20.4198 26.2305L22.1763 29.786L23.9492 26.2305L27.4787 24.4444L23.9492 22.6749L22.1763 19.1194L20.4198 22.6749L16.8904 24.4444Z"
        fill={ink}
      />
      {!collapsed && (
        <path
          d="M50.1506 18.8182L53.1733 27.3892H53.2926L56.3153 18.8182H57.608L53.8693 29H52.5966L48.858 18.8182H50.1506ZM58.7365 29H57.4439L61.1825 18.8182H62.4553L66.1939 29H64.9013L61.8587 20.429H61.7791L58.7365 29ZM59.2138 25.0227H64.424V26.1165H59.2138V25.0227ZM69.0128 18.8182V29H67.7798V18.8182H69.0128Z"
          fill="#64748B"
        />
      )}
      {active && (
        <defs>
          <linearGradient id={`vai-fill-a-${id}`} x1="120" y1="0" x2="120" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#BB00BB" />
            <stop offset="1" stopColor="#2B81FF" />
          </linearGradient>
          <linearGradient id={`vai-fill-b-${id}`} x1="0.5" y1="24" x2="239.5" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0.7" />
            <stop offset="0.504808" stopColor="white" stopOpacity="0.5" />
            <stop offset="1" stopColor="white" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id={`vai-stroke-${id}`} x1="183.438" y1="6.07321" x2="182.051" y2="51.1314" gradientUnits="userSpaceOnUse">
            <stop stopColor="#BB00BB" />
            <stop offset="1" stopColor="#2B81FF" />
          </linearGradient>
          <linearGradient id={`vai-mark-${id}`} x1="23.5002" y1="8.71094" x2="23.5002" y2="39.7998" gradientUnits="userSpaceOnUse">
            <stop stopColor="#BB00BB" />
            <stop offset="1" stopColor="#2B81FF" />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
}

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
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        setMobileOpen(false);
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
      <header className="relative z-30 hidden h-[4.5rem] items-center justify-between border-b border-line bg-surface/95 px-6 backdrop-blur-md lg:flex">
        <div className="flex-1" />
        
        {/* Center: Search Bar with AI Button */}
        <div className="flex flex-1 justify-center">
          <div className="flex w-full max-w-[32rem] items-center gap-2 rounded-lg bg-[#F8FAFC] p-1.5 border border-transparent focus-within:border-line focus-within:bg-surface hover:bg-surface hover:border-line transition-colors">
            <button
              type="button"
              onClick={openAssistant}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded overflow-hidden shadow-sm transition-transform hover:scale-105"
              aria-label="Open Vision AI"
              title="Vision AI"
            >
              <VaiRow active={true} collapsed={true} className="w-full h-full object-cover" />
            </button>
            <button
              type="button"
              onClick={() => {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
              }}
              className="flex-1 bg-transparent px-2 py-1 text-sm text-ink-muted text-left outline-none cursor-text"
            >
              Search vision pulse...
            </button>
          </div>
        </div>

        {/* Right: User Profile */}
        <div className="flex flex-1 justify-end">
          {user && (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen(!accountOpen)}
                className={`flex items-center gap-3 text-right interactive rounded-xl p-1.5 hover:bg-surface transition-colors ${accountOpen ? 'bg-surface' : ''}`}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-ink leading-tight">{user.name}</span>
                  <span className="text-[11px] text-ink-faint leading-tight mt-0.5">Admin - {user.email?.split('@')[0] || 'admin'}</span>
                </div>
                {(() => {
                  const { initials, palette } = getAvatarProps(user.name, user.role);
                  return (
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white shadow-sm"
                      style={{ background: palette.bg }}
                    >
                      {initials}
                    </span>
                  );
                })()}
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
                const expanded = mobileExpanded[i] ?? true;
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
    </>
  );
}
