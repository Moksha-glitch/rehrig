import React, { useMemo } from 'react';
import Icon from './Icon.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import { NAV, filterNavTree, buildBreadcrumbs } from './navConfig.js';

export default function Breadcrumb() {
  const { state, persona, navigate, canNav } = useStore();
  const accountsQuery = useAccounts();
  const module = state.nav.module;
  const params = state.nav.params || {};

  const tree = useMemo(() => filterNavTree(NAV[persona] || [], canNav), [persona, canNav]);
  const account = (accountsQuery.data || []).find((row) => row.id === params.accountId);

  const crumbs = useMemo(
    () =>
      buildBreadcrumbs(tree, module, params, {
        accountName: account?.name,
        recordLabel: params.recordId,
      }),
    [tree, module, params, account?.name]
  );

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-h-9 items-center border-b border-line bg-surface px-5 py-1.5 sm:px-7 lg:px-10"
    >
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[12.5px]">
        {crumbs.map((item, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 && (
                <Icon name="chevronRight" size={12} className="shrink-0 text-ink-faint" aria-hidden="true" />
              )}
              {last || !item.module ? (
                <span
                  className={`truncate ${last ? 'font-medium text-ink' : 'text-ink-faint'}`}
                  aria-current={last ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(item.module, item.params)}
                  className="truncate text-ink-muted interactive hover:text-ink"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
