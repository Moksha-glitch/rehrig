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
          ? `flex h-10 w-10 items-center justify-center rounded-xl ${
              active
                ? 'nav-item-active text-ink'
                : 'text-ink-muted hover:bg-surface hover:text-ink'
            }`
          : `nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] ${
              active ? 'nav-item-active' : 'text-ink-muted hover:bg-surface hover:text-ink'
            }`
      }
    >
      {item.icon ? (
        <Icon
          name={item.icon}
          size={collapsed ? 18 : 16}
          className={`shrink-0 ${active ? 'text-ink' : 'text-ink-faint'}`}
        />
      ) : (
        <span
          className={`flex shrink-0 items-center justify-center font-semibold ${
            collapsed ? 'h-5 w-5 text-[11px]' : 'h-4 w-4 text-[10px]'
          } ${active ? 'text-ink' : 'text-ink-faint'}`}
        >
          {item.label.charAt(0)}
        </span>
      )}
      {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>}
    </button>
  );
}

function FolderFlyout({ anchorEl, section, isItemActive, onSelect }) {
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
      className="fixed z-[60] min-w-[13.5rem] rounded-2xl border border-line bg-elevated p-1.5 shadow-float"
    >
      {section.children.map((item) => {
        const active = isItemActive(item);
        return (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            onClick={() => onSelect(item)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13.5px] interactive ${
              active ? 'nav-item-active-soft text-ink' : 'text-ink-muted hover:bg-surface hover:text-ink'
            }`}
          >
            {item.icon ? (
              <Icon
                name={item.icon}
                size={16}
                className={`shrink-0 ${active ? 'text-ink' : 'text-ink-faint'}`}
              />
            ) : (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-semibold">
                {item.label.charAt(0)}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );
}

function FolderButton({ section, collapsed, open, active, onToggle, isItemActive, onSelect }) {
  const buttonRef = useRef(null);

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
            ? `flex h-10 w-10 items-center justify-center rounded-xl ${
                active
                  ? 'nav-item-active text-ink'
                  : open
                    ? 'bg-surface/70 text-ink'
                    : 'text-ink-muted hover:bg-surface hover:text-ink'
              }`
            : `nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] ${
                active
                  ? 'nav-item-active text-ink'
                  : 'text-ink-muted hover:bg-surface hover:text-ink'
              }`
        }
      >
        {(!section.icon || section.icon !== 'none') && (
          <Icon
            name={section.icon || section.children?.[0]?.icon || 'grid'}
            size={collapsed ? 18 : 16}
            className={`shrink-0 ${active || open ? 'text-ink' : 'text-ink-faint'}`}
          />
        )}
        {!collapsed && (
          <>
            <span className={`min-w-0 flex-1 truncate text-left ${section.icon === 'none' ? 'tracking-wider text-xs font-semibold' : ''}`}>{section.label}</span>
            <Icon
              name="chevronRight"
              size={14}
              className={`shrink-0 ${active ? 'text-ink-muted' : 'text-ink-faint'} transition-transform ${open ? 'rotate-90' : ''}`}
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
        />
      )}
      {open && !collapsed && (
        <div className="mb-1 ml-4 mt-0.5 space-y-0.5 border-l border-line pl-2" role="menu" aria-label={section.label}>
          {section.children.map((item) => {
            const itemActive = isItemActive(item);
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => onSelect(item)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left text-[13px] interactive ${
                  itemActive ? 'nav-item-active-soft text-ink' : 'text-ink-muted hover:bg-surface hover:text-ink'
                }`}
              >
                {item.icon ? (
                  <Icon
                    name={item.icon}
                    size={15}
                    className={`shrink-0 ${itemActive ? 'text-ink' : 'text-ink-faint'}`}
                  />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-semibold">
                    {item.label.charAt(0)}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
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
  const [openFolder, setOpenFolder] = useState(null);
  const accountRef = useRef(null);
  const shellRef = useRef(null);

  const tree = useMemo(() => filterNavTree(NAV[persona] || [], canNav), [persona, canNav]);

  const activeModule = state.nav.module;
  const activeParams = state.nav.params;

  const accounts = accountsQuery.data || [];
  const scopedAccount =
    persona !== 'rehrig'
      ? accounts.find((a) => user?.accountIds?.includes(a.id)) ||
        (persona === 'sp' ? accounts[0] : null)
      : null;

  useEffect(() => {
    if (!open) {
      setOpenFolder(null);
      return;
    }
    const activeSection = tree.find(
      (node) =>
        node.type === 'section' &&
        node.children?.some((item) => isNavItemActive(item, activeModule, activeParams || {}))
    );
    if (activeSection) setOpenFolder(activeSection.label);
  }, [open, tree, activeModule, activeParams]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
      if (open) return;
      const inShell = shellRef.current?.contains(event.target);
      const inFlyout = event.target.closest?.('[role="menu"]');
      if (!inShell && !inFlyout) setOpenFolder(null);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        if (!open) setOpenFolder(null);
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
    if (!open) setOpenFolder(null);
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
    <div ref={shellRef} className={`side-nav hidden lg:block ${open ? 'w-[16.5rem]' : 'w-14'}`}>
      <aside
        className="flex h-full w-full flex-col border-r border-line bg-elevated/70"
        aria-label="Main navigation"
      >
        <div
          className="flex h-14 shrink-0 items-center px-4"
        >
          {open ? (
            <button
              type="button"
              onClick={() => navigate('home')}
              className="flex min-w-0 items-center gap-2 interactive"
              aria-label="VisionPulse home"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[#0b386e] text-white">
                <Icon name="star" size={14} className="fill-current" />
              </div>
              <span className="font-display text-[1.1rem] font-bold tracking-tight text-[#0b386e]">
                VisionPulse
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('home')}
              className="mx-auto flex h-8 w-8 items-center justify-center rounded bg-[#0b386e] text-white interactive"
              aria-label="VisionPulse home"
            >
              <Icon name="star" size={16} className="fill-current" />
            </button>
          )}
        </div>

        <nav
          className={`flex min-h-0 flex-1 flex-col overflow-y-auto pt-1 pb-3 scroll-thin ${
            open ? 'space-y-0.5 px-3' : 'items-center gap-1 px-2'
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

            const sectionActive = node.children.some((item) => isItemActive(item));
            return (
              <FolderButton
                key={node.label}
                section={node}
                collapsed={!open}
                open={openFolder === node.label}
                active={sectionActive}
                onToggle={() => {
                  setAccountOpen(false);
                  setOpenFolder((current) => (current === node.label ? null : node.label));
                }}
                isItemActive={isItemActive}
                onSelect={goTo}
              />
            );
          })}
        </nav>

        <div className="mt-auto shrink-0 border-t border-line px-3 py-3 flex items-center justify-between">
          {open && scopedAccount && (
            <div className="truncate px-2 text-[11px] font-medium text-ink-faint">{scopedAccount.name}</div>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
            title={open ? 'Collapse sidebar' : 'Expand sidebar'}
            className={`rounded-lg p-1.5 text-ink-muted interactive hover:bg-surface hover:text-ink ${open ? '' : 'mx-auto'}`}
          >
            <Icon name="panelLeft" size={16} />
          </button>
        </div>
      </aside>
    </div>
  );
}
