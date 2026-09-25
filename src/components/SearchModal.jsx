import React, { useState, useEffect, useRef } from 'react';

import Icon from './Icon.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useSearch } from '../hooks/useSearch.js';

export function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const { navigate, openAssistant } = useStore();
  const searchQuery = useSearch(query);
  const results = searchQuery.data || [];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const openResult = (result) => {
    if (!result?.module) return;
    navigate(result.module, result.params || {});
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'Enter' && results[0]) {
      e.preventDefault();
      openResult(results[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-float">
        <div className="flex items-center border-b border-line px-4 py-3">
          <Icon name="search" size={18} className="text-ink-muted" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search anywhere... (Ctrl+K)"
            className="flex-1 bg-transparent px-3 py-1 text-ink outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="rounded-control p-1 text-ink-muted hover:bg-elevated" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        {query.trim().length >= 2 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.length ? (
              results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-left hover:bg-elevated"
                  onClick={() => openResult(result)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-elevated">
                    <Icon name="search" size={14} className="text-ink-muted" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{result.title || result.label}</div>
                    <div className="truncate text-[11px] text-ink-faint">{result.meta || result.category}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-sm text-ink-muted">No matching records.</div>
            )}
            <button
              type="button"
              className="mt-1 flex w-full items-center gap-3 rounded-control px-3 py-2 text-left hover:bg-elevated"
              onClick={() => {
                openAssistant();
                window.dispatchEvent(new CustomEvent('vision:ask', { detail: { prompt: query } }));
                onClose();
              }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-brand-soft">
                <Icon name="star" size={14} className="text-brand" />
              </div>
              <div>
                <div className="text-sm font-medium text-ink">Ask Vision AI</div>
                <div className="text-[11px] text-ink-faint">Keep this page open and search in chat</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
