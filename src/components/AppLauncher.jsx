import React, { useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import { SearchField } from './UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { NAV, filterNavTree, flattenNavDestinations } from './navConfig.js';

export default function AppLauncher({ onClose }) {
  const { persona, canNav, navigate } = useStore();
  const [query, setQuery] = useState('');
  const items = useMemo(() => {
    const tree = filterNavTree(NAV[persona] || [], canNav);
    const dest = flattenNavDestinations(tree);
    const needle = query.trim().toLowerCase();
    return dest.filter((item) => !needle || String(item.label || '').toLowerCase().includes(needle));
  }, [persona, canNav, query]);

  return (
    <div className="fixed inset-0 z-[70] bg-ink/30" onClick={onClose}>
      <div
        className="absolute left-1/2 top-20 w-[min(36rem,92vw)] -translate-x-1/2 overflow-hidden rounded-sheet border border-line bg-surface shadow-float"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-line px-4 py-3">
          <p className="type-overline">App Launcher</p>
          <div className="mt-2">
            <SearchField
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search all items…"
              className="!max-w-none w-full"
            />
          </div>
        </div>
        <ul className="grid max-h-[24rem] grid-cols-2 gap-2 overflow-y-auto p-4 scroll-thin sm:grid-cols-3">
          {items.map((item) => (
            <li key={item.key || item.label}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-left hover:bg-elevated"
                onClick={() => {
                  navigate(item.module, item.params || {});
                  onClose?.();
                }}
              >
                <Icon name={item.icon || 'grid'} size={14} className="text-ink-faint" />
                <span className="truncate text-sm font-medium text-ink">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
