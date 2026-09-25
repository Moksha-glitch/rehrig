import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';
import UserAccountMenu from './UserAccountMenu.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { NAV, filterNavTree, isNavItemActive } from './navConfig.js';
import {
  applyResolvedTheme,
  subscribeSystemTheme,
  getAvatarProps,
} from '../utils/theme.js';



function NavButton({ item, active, onClick, collapsed }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={item.label}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      className={
        collapsed
          ? `flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200 ${
              active
                ? 'bg-white/10 text-white font-semibold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`
          : `nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors duration-200 ${
              active
                ? 'bg-white/10 text-white font-semibold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`
      }
    >
      {item.icon ? (
        <Icon
          name={item.icon}
          size={collapsed ? 18 : 16}
          className={`shrink-0 ${active ? 'text-white' : 'text-white/70'}`}
        />
      ) : (
        <span
          className={`flex shrink-0 items-center justify-center font-semibold ${
            collapsed ? 'h-5 w-5 text-[11px]' : 'h-4 w-4 text-[10px]'
          } ${active ? 'text-white' : 'text-white/70'}`}
        >
          {item.label.charAt(0)}
        </span>
      )}
      {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>}
    </button>
  );
}

function NestedNavItems({ items, isItemActive, onSelect, openNested, onToggleNested }) {
  return items.map((item) => {
    const active = isItemActive(item);
    const hasChildren = Boolean(item.children?.length);
    const nestedOpen = hasChildren && openNested.has(item.key);
    const childActive = item.children?.some((nested) => isItemActive(nested));
    return (
      <div key={item.key}>
        <button
          type="button"
          role="menuitem"
          aria-expanded={hasChildren ? nestedOpen : undefined}
          onClick={() => (hasChildren ? onToggleNested(item.key) : onSelect(item))}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left text-[13px] interactive transition-colors duration-200 ${
            active || childActive
              ? 'bg-white/10 text-white font-medium'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          {item.icon ? (
            <Icon
              name={item.icon}
              size={15}
              className={`shrink-0 ${active || childActive ? 'text-white' : 'text-white/70'}`}
            />
          ) : (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-semibold">
              {item.label.charAt(0)}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge !== undefined && item.badge !== null && (
            <span className="ml-2 shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-white/70">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
          {hasChildren && (
            <Icon
              name="chevronRight"
              size={13}
              className={`shrink-0 text-white/50 transition-transform ${nestedOpen ? 'rotate-90' : ''}`}
            />
          )}
        </button>
        {nestedOpen && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
            {item.children.map((nested) => {
              const nestedActive = isItemActive(nested);
              return (
                <button
                  key={nested.key}
                  type="button"
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-[13px] transition-colors duration-200 ${
                    nestedActive
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => onSelect(nested)}
                >
                  {nested.icon ? <Icon name={nested.icon} size={14} className="shrink-0" /> : null}
                  <span className="min-w-0 flex-1 truncate">{nested.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  });
}

function FolderFlyout({ anchorEl, section, isItemActive, onSelect, openNested, onToggleNested }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!anchorEl) return undefined;
    const place = () => {
      const rect = anchorEl.getBoundingClientRect();
      const width = 220;
      const estimatedHeight = 16 + section.children.length * 40;
      const top = Math.min(rect.top, window.innerHeight - estimatedHeight - 12);
      setPos({
        top: Math.max(12, top),
        left: Math.min(rect.right + 6, window.innerWidth - width - 12),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchorEl, section.children.length]);

  return createPortal(
    <div
      role="menu"
      aria-label={section.label}
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-[60] min-w-[13.5rem] rounded-2xl border border-white/10 bg-brand p-1.5 shadow-float"
    >
      <NestedNavItems
        items={section.children}
        isItemActive={isItemActive}
        onSelect={onSelect}
        openNested={openNested}
        onToggleNested={onToggleNested}
      />
    </div>,
    document.body
  );
}

const SECTION_RAIL_ICONS = {
  ACTIVITIES: 'clipboard',
  ANALYTICS: 'barChart',
  CONFIGURATION: 'settings',
};

function sectionRailIcon(section) {
  if (section.icon && section.icon !== 'none') return section.icon;
  return SECTION_RAIL_ICONS[section.label] || section.children?.[0]?.icon || 'grid';
}

function FolderButton({
  section,
  collapsed,
  open,
  active,
  onToggle,
  isItemActive,
  onSelect,
  openNested,
  onToggleNested,
}) {
  const buttonRef = useRef(null);
  const showIcon = true;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        title={section.label}
        aria-label={section.label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
        className={
          collapsed
            ? `flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200 ${
                active
                  ? 'bg-white/10 text-white font-semibold'
                  : open
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            : `nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-colors duration-200 ${
                active
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
        }
      >
        {showIcon && (
          <Icon
            name={sectionRailIcon(section)}
            size={collapsed ? 18 : 16}
            className={`shrink-0 ${active || open ? 'text-white' : 'text-white/70'}`}
          />
        )}
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate text-left">
              {section.label.charAt(0) + section.label.slice(1).toLowerCase()}
            </span>
            <Icon
              name="chevronRight"
              size={14}
              className={`shrink-0 ${active ? 'text-white/80' : 'text-white/50'} transition-transform ${open ? 'rotate-90' : ''}`}
            />
          </>
        )}
      </button>
      {open && collapsed && (
        <FolderFlyout
          anchorEl={buttonRef.current}
          section={section}
          isItemActive={isItemActive}
          onSelect={onSelect}
          openNested={openNested}
          onToggleNested={onToggleNested}
        />
      )}
      {open && !collapsed && (
        <div className="mb-1 ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-2" role="menu" aria-label={section.label}>
          <NestedNavItems
            items={section.children}
            isItemActive={isItemActive}
            onSelect={onSelect}
            openNested={openNested}
            onToggleNested={onToggleNested}
          />
        </div>
      )}
    </div>
  );
}

export default function SideNav({ open, onToggle }) {
  const {
    state,
    persona,
    navigate,
    logout,
    canNav,
    openAssistant,
    assistantOpen,
    isScoped,
    canPreviewPersonas,
    personaViews,
    previewPersona,
    exitPersonaPreview,
    previewOrigin,
    isPreviewingPersona,
  } = useStore();
  const accountsQuery = useAccounts();
  const user = state.currentUser;
  const [accountOpen, setAccountOpen] = useState(false);
  const [openFolders, setOpenFolders] = useState(() => new Set());
  const [openNested, setOpenNested] = useState(() => new Set());
  const accountRef = useRef(null);
  const shellRef = useRef(null);

  const tree = useMemo(() => filterNavTree(NAV[persona] || [], canNav), [persona, canNav]);
  const accounts = accountsQuery.data || [];
  const scopedAccount =
    persona !== 'rehrig'
      ? accounts.find((a) => user?.accountIds?.includes(a.id)) ||
        (persona === 'sp' ? accounts[0] : null)
      : null;
  const countByKind = useMemo(() => {
    const accountNames = new Set(
      (persona === 'sp' ? [scopedAccount?.name].filter(Boolean) : accounts.map((account) => account.name))
    );
    const accountIds = new Set(
      (persona === 'sp' ? [scopedAccount?.id].filter(Boolean) : accounts.map((account) => account.id))
    );
    const inScope = (record) =>
      !accountNames.size ||
      accountIds.has(record.accountId) ||
      accountNames.has(record.account) ||
      accountNames.has(record.accountName);
    const records = state.operationalRecords || {};
    const counts = {};
    Object.entries(records).forEach(([kind, rows]) => {
      counts[kind] = (rows || []).filter(inScope).length;
    });
    counts.segments = (state.segments || []).filter(
      (segment) => !accountIds.size || accountIds.has(segment.accountId) || accountNames.has(segment.account)
    ).length;
    counts.customers = (records.customers || []).filter(inScope).length;
    return counts;
  }, [accounts, persona, scopedAccount, state.operationalRecords, state.segments]);

  const activeModule = state.nav.module;
  const activeParams = state.nav.params;

  const decorateItem = (item) => ({
    ...item,
    badge: item.countKind ? countByKind[item.countKind] ?? 0 : item.badge,
    children: item.children?.map(decorateItem),
  });

  const toggleNested = (key) => {
    setOpenNested((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    if (!open) setOpenFolders(new Set());
  }, [open]);

  useEffect(() => {
    const activeKeys = [];
    tree.forEach((node) => {
      (node.children || []).forEach((item) => {
        if (
          item.children?.some((nested) => isNavItemActive(nested, activeModule, activeParams || {}))
        ) {
          activeKeys.push(item.key);
        }
      });
    });
    if (!activeKeys.length) return;
    setOpenNested((current) => {
      const next = new Set(current);
      activeKeys.forEach((key) => next.add(key));
      return next;
    });
  }, [tree, activeModule, activeParams]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
      if (open) return;
      const inShell = shellRef.current?.contains(event.target);
      const inFlyout = event.target.closest?.('[role="menu"]');
      if (!inShell && !inFlyout) setOpenFolders(new Set());
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        if (!open) setOpenFolders(new Set());
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!tree.length) return null;

  const personaLabel =
    persona === 'rehrig' ? 'Rehrig' : persona === 'sp' ? 'Service Provider' : 'Resident';

  const goTo = (item) => {
    if (!open) setOpenFolders(new Set());
    if (item.module === 'assistant') {
      openAssistant();
      return;
    }
    navigate(item.module, item.params);
  };

  const isItemActive = (item) =>
    item.module === 'assistant'
      ? assistantOpen
      : isNavItemActive(item, activeModule, activeParams);

  return (
    <div ref={shellRef} className={`side-nav hidden lg:block ${open ? 'w-[16.5rem]' : 'w-[4.25rem]'}`}>
      <aside
        className="flex h-full w-full flex-col overflow-hidden bg-brand"
        aria-label="Main navigation"
      >
        <div
          className={`flex h-14 shrink-0 items-center ${open ? 'px-4' : 'justify-center px-0'}`}
        >
          {open ? (
            <button
              type="button"
              onClick={() => navigate('home')}
              className="flex min-w-0 items-center gap-2 interactive"
              aria-label="VisionPulse home"
            >
              <div className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#CADCFC] text-[13px] font-extrabold tracking-wide text-brand">
                VP
              </div>
              <span className="font-display text-base font-extrabold tracking-tight text-white">
                VisionPulse
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('home')}
              className="mx-auto grid h-8 w-8 place-items-center rounded-[9px] bg-[#CADCFC] text-[13px] font-extrabold tracking-wide text-brand interactive"
              aria-label="VisionPulse home"
            >
              VP
            </button>
          )}
        </div>

        <nav
          className={`flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pt-1 pb-3 scroll-thin ${
            open ? 'space-y-0.5 px-3' : 'items-center gap-1 px-1.5'
          }`}
        >
          {tree.map((node) => {
            if (node.type === 'item') {
              return (
                <div key={node.key}>
                  <NavButton
                    item={node}
                    active={isItemActive(node)}
                    collapsed={!open}
                    onClick={() => goTo(node)}
                  />
                </div>
              );
            }

            const section = { ...node, children: node.children.map(decorateItem) };
            const sectionActive = section.children.some(
              (item) => isItemActive(item) || item.children?.some((nested) => isItemActive(nested))
            );
            return (
              <FolderButton
                key={node.label}
                section={section}
                collapsed={!open}
                open={openFolders.has(node.label)}
                active={sectionActive}
                onToggle={() => {
                  setAccountOpen(false);
                  setOpenFolders((current) => {
                    const next = new Set(current);
                    if (next.has(node.label)) next.delete(node.label);
                    else next.add(node.label);
                    return next;
                  });
                }}
                isItemActive={isItemActive}
                onSelect={goTo}
                openNested={openNested}
                onToggleNested={toggleNested}
              />
            );
          })}
        </nav>

        <div className={`mt-auto shrink-0 border-t border-white/10 py-2.5 ${open ? 'px-2.5' : 'px-1.5'}`}>
          {open && scopedAccount && (
            <div className="mb-1 truncate px-2 text-[11px] font-medium text-white/50">{scopedAccount.name}</div>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-label={open ? 'Collapse menu' : 'Expand menu'}
            title={open ? 'Collapse menu' : 'Expand menu'}
            className={`flex w-full items-center rounded-xl px-2.5 py-2.5 text-[13.5px] font-semibold text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white ${
              open ? 'gap-2.5' : 'justify-center px-0'
            }`}
          >
            <Icon name="chevronsLeft" size={16} className={`shrink-0 ${open ? '' : 'rotate-180'}`} />
            {open && <span>Collapse</span>}
          </button>
          <div ref={accountRef} className="relative mt-1">
            <button
              type="button"
              onClick={() => setAccountOpen((current) => !current)}
              aria-label={`Signed in as ${user?.name || 'user'}`}
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              className={`flex w-full items-center rounded-xl py-1.5 text-left transition-colors duration-200 hover:bg-white/10 ${
                open ? 'gap-2.5 px-2' : 'justify-center px-0'
              } ${accountOpen ? 'bg-white/10' : ''}`}
            >
              {(() => {
                const { initials, palette } = getAvatarProps(user?.name, user?.role);
                return (
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${
                      isPreviewingPersona ? 'bg-warn' : ''
                    }`}
                    style={!isPreviewingPersona ? { background: palette.bg } : undefined}
                  >
                    {initials}
                  </span>
                );
              })()}
              {open && (
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-white">{user?.name}</div>
                  <div className="truncate text-[11px] text-white/55">
                    {user?.role}
                    {user?.alias ? ` · ${user.alias}` : ''}
                  </div>
                </div>
              )}
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
              />
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
