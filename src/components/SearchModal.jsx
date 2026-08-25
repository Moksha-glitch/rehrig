import React, { useState, useEffect, useRef } from 'react';

import Icon from './Icon.jsx';
import { useStore } from '../state/AppStore.jsx';

export function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const { navigate } = useStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const results = query ? [
    { label: 'Work Order: ' + query, type: 'Work Order', action: () => navigate('workOrders') },
    { label: 'Asset: ' + query, type: 'Asset', action: () => navigate('assets') }
  ] : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-float">
        <div className="flex items-center border-b border-line px-4 py-3">
          <Icon name="search" size={18} className="text-ink-muted" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search anywhere... (Cmd+K)"
            className="flex-1 bg-transparent px-3 py-1 text-ink outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="rounded-control p-1 text-ink-muted hover:bg-elevated" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        {query && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-left hover:bg-elevated"
                onClick={() => { r.action(); onClose(); }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded bg-elevated">
                  <Icon name={r.type === 'Asset' ? 'box' : 'clipboard'} size={14} className="text-ink-muted" />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink">{r.label}</div>
                  <div className="text-[11px] text-ink-faint">{r.type}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}