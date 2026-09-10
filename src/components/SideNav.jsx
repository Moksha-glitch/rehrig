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
      className="fixed z-[60] min-w-[13.5rem] rounded-2xl border border-white/10 bg-brand p-1.5 shadow-float"
    >
      {section.children.map((item) => {
        const active = isItemActive(item);
        return (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            onClick={() => onSelect(item)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13.5px] interactive transition-colors duration-200 ${
              active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.icon ? (
              <Icon
                name={item.icon}
                size={16}
                className={`shrink-0 ${active ? 'text-white' : 'text-white/70'}`}
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

const SECTION_RAIL_ICONS = {
  ACTIVITIES: 'clipboard',
  ANALYTICS: 'barChart',
  CONFIGURATION: 'settings',
};

function sectionRailIcon(section) {
  if (section.icon && section.icon !== 'none') return section.icon;
  return SECTION_RAIL_ICONS[section.label] || section.children?.[0]?.icon || 'grid';
}

function FolderButton({ section, collapsed, open, active, onToggle, isItemActive, onSelect }) {
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
        />
      )}
      {open && !collapsed && (
        <div className="mb-1 ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-2" role="menu" aria-label={section.label}>
          {section.children.map((item) => {
            const itemActive = isItemActive(item);
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => onSelect(item)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left text-[13px] interactive transition-colors duration-200 ${
                  itemActive ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon ? (
                  <Icon
                    name={item.icon}
                    size={15}
                    className={`shrink-0 ${itemActive ? 'text-white' : 'text-white/70'}`}
                  />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-semibold">
                    {item.label.charAt(0)}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-2 flex h-5 items-center justify-center rounded bg-danger px-1.5 text-[10.5px] font-semibold text-white">
                    {item.badge}
                  </span>
                )}
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
        </div>
      </aside>
    </div>
  );
}
