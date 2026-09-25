import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Button } from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts, useSegments } from '../hooks/useAccounts.js';
import { SEED_PROFILES, TOTAL_PROFILE_SCREENS } from '../data/profileAccess.js';
import ProfileForm from './ProfileForm.jsx';

const PROFILES_KEY = 'vision.ui.profiles';

const COLUMNS = [
  { key: 'access', label: 'Access', locked: false },
  { key: 'status', label: 'Status', locked: false },
  { key: 'created', label: 'Created', locked: false },
  { key: 'updated', label: 'Last updated', locked: false },
];

function readProfiles() {
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    if (!raw) return SEED_PROFILES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : SEED_PROFILES;
  } catch {
    return SEED_PROFILES;
  }
}

function writeProfiles(profiles) {
  try {
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    /* ignore quota / private mode */
  }
}

function todayLabel() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || name || '';
}

function parseDate(value) {
  const parts = String(value || '').split('/').map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return 0;
  const [day, month, year] = parts;
  const fullYear = year < 100 ? 2000 + year : year;
  return new Date(fullYear, month - 1, day).getTime();
}

function enabledScreenCount(screens) {
  if (!screens?.length) return null;
  return screens.reduce(
    (sum, group) =>
      sum +
      group.screens.filter(
        (screen) => screen.view || screen.edit || screen.create || screen.delete || screen.enabled
      ).length,
    0
  );
}

function profileScreenUsage(profile) {
  const total = profile.total || TOTAL_PROFILE_SCREENS;
  if (Number.isFinite(profile.used)) return { used: profile.used, total };
  const fromScreens = enabledScreenCount(profile.screens);
  if (fromScreens != null) return { used: fromScreens, total: profile.screens.reduce((n, g) => n + g.screens.length, 0) };
  if (profile.preset === 'all' || /Screen:\s*All access/i.test(profile.access || '')) {
    return { used: total, total };
  }
  if (profile.preset === 'mobile' || /mobile/i.test(profile.access || '')) {
    return { used: Math.min(2, total), total };
  }
  const seed = (profile.role || profile.id || '').length;
  return { used: Math.max(1, Math.min(total - 1, (seed * 3) % 18 + 4)), total };
}

function statusKey(status) {
  return String(status || 'active').toLowerCase();
}

function accessKind(profile) {
  const { used, total } = profileScreenUsage(profile);
  return used === total ? 'full' : 'partial';
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadCsv(filename, rows) {
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function StatusPill({ status }) {
  const key = statusKey(status);
  const styles = {
    active: 'bg-[#E4F4EC] text-[#0F7A52] before:bg-[#0F7A52]',
    inactive: 'bg-[#F5F7FC] text-[#767C9B] before:bg-[#9AA0BF]',
    draft: 'bg-[#FBEEDD] text-[#B4530A] before:bg-[#B4530A]',
  };
  const label = key === 'draft' ? 'Draft' : key === 'inactive' ? 'Inactive' : 'Active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${styles[key] || styles.inactive} before:h-1.5 before:w-1.5 before:rounded-full before:content-['']`}
    >
      {label}
    </span>
  );
}

function AccessCell({ profile }) {
  const { used, total } = profileScreenUsage(profile);
  const full = used === total && total > 0;
  const pct = total ? Math.round((used / total) * 100) : 0;
  return (
    <div className="min-w-[9.5rem]">
      <div className="mb-1.5 text-[12.5px] font-semibold tabular-nums text-ink-soft">
        {full ? `All ${total} screens` : `${used} / ${total} screens`}
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full ${full ? 'bg-success' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DateCell({ date, by }) {
  return (
    <div className="text-right">
      <div className="text-[13px] tabular-nums text-ink-soft">{date || '—'}</div>
      {by ? <div className="mt-0.5 text-[11px] text-ink-faint">by {firstName(by)}</div> : null}
    </div>
  );
}

function Popover({ open, onClose, align = 'right', width = 'w-[14.5rem]', children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!ref.current?.contains(event.target)) onClose();
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className={`absolute top-[calc(100%+7px)] z-[60] rounded-xl border border-line bg-surface p-2 shadow-float ${width} ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
    >
      {children}
    </div>
  );
}

export default function ProfileManagement() {
  const { state, toast, persona } = useStore();
  const accountsQuery = useAccounts();
  const segmentsQuery = useSegments();
  const [profiles, setProfiles] = useState(readProfiles);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [accessFilter, setAccessFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [sortSpec, setSortSpec] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [colsOpen, setColsOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    access: true,
    status: true,
    created: true,
    updated: true,
  });

  useEffect(() => {
    writeProfiles(profiles);
  }, [profiles]);

  const allAccounts = accountsQuery.data || [];
  const segments = segmentsQuery.data || [];
  const actor = state.currentUser?.name || 'You';
  const accounts = useMemo(() => {
    if (persona !== 'sp') return allAccounts;
    const scopedIds = state.currentUser?.accountIds || [];
    if (scopedIds.length) {
      const scoped = allAccounts.filter((account) => scopedIds.includes(account.id));
      return scoped.length ? scoped : allAccounts.slice(0, 1);
    }
    return allAccounts.slice(0, 1);
  }, [persona, allAccounts, state.currentUser?.accountIds]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    let rows = profiles.filter((profile) => {
      if (statusFilter && statusKey(profile.status) !== statusFilter) return false;
      if (accessFilter && accessKind(profile) !== accessFilter) return false;
      if (!term) return true;
      return [profile.role, profile.access, profile.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
    if (sortSpec.length) {
      rows = rows.slice().sort((a, b) => {
        for (const spec of sortSpec) {
          let va;
          let vb;
          if (spec.key === 'name') {
            va = a.role || '';
            vb = b.role || '';
          } else if (spec.key === 'used') {
            va = profileScreenUsage(a).used;
            vb = profileScreenUsage(b).used;
          } else if (spec.key === 'created') {
            va = parseDate(a.createdDate);
            vb = parseDate(b.createdDate);
          } else if (spec.key === 'updated') {
            va = parseDate(a.lastUpdatedDate);
            vb = parseDate(b.lastUpdatedDate);
          }
          const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
          if (cmp !== 0) return cmp * spec.dir;
        }
        return 0;
      });
    }
    return rows;
  }, [profiles, query, statusFilter, accessFilter, sortSpec]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);
  const pageIds = paginated.map((profile) => profile.id);
  const selectedOnPage = pageIds.filter((id) => selected.has(id));
  const allPageSelected = pageIds.length > 0 && selectedOnPage.length === pageIds.length;
  const somePageSelected = selectedOnPage.length > 0 && !allPageSelected;
  const hiddenColCount = COLUMNS.filter((col) => !visibleCols[col.key]).length;
  const activeFilterCount = Number(Boolean(statusFilter)) + Number(Boolean(accessFilter));

  const setSortByCol = (key, event) => {
    setSortSpec((current) => {
      const existing = current.find((item) => item.key === key);
      if (event.shiftKey) {
        if (!existing) return [...current, { key, dir: 1 }];
        if (existing.dir === 1) return current.map((item) => (item.key === key ? { ...item, dir: -1 } : item));
        return current.filter((item) => item.key !== key);
      }
      if (existing && current.length === 1 && existing.dir === 1) return [{ key, dir: -1 }];
      if (existing && current.length === 1 && existing.dir === -1) return [];
      return [{ key, dir: 1 }];
    });
  };

  const sortMeta = (key) => {
    const index = sortSpec.findIndex((item) => item.key === key);
    if (index < 0) return null;
    return { dir: sortSpec[index].dir, level: index + 1, multi: sortSpec.length > 1 };
  };

  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const selectedProfiles = profiles.filter((profile) => selected.has(profile.id));

  const saveProfile = (next) => {
    const stamp = { lastUpdatedBy: actor, lastUpdatedDate: todayLabel() };
    setProfiles((prev) => {
      if (next.id) {
        return prev.map((profile) => (profile.id === next.id ? { ...profile, ...next, ...stamp } : profile));
      }
      return [
        {
          ...next,
          id: `vp-${Date.now().toString(36)}`,
          created: actor,
          createdDate: todayLabel(),
          ...stamp,
        },
        ...prev,
      ];
    });
    toast(next.id ? 'Profile saved' : 'Profile created');
    setEditing(null);
  };

  const deleteProfile = (profile) => {
    setProfiles((prev) => prev.filter((item) => item.id !== profile.id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(profile.id);
      return next;
    });
    toast('Profile deleted');
    setEditing(null);
  };

  const bulkStatus = (status) => {
    setProfiles((prev) =>
      prev.map((profile) =>
        selected.has(profile.id)
          ? { ...profile, status, lastUpdatedBy: actor, lastUpdatedDate: todayLabel() }
          : profile
      )
    );
    toast(status === 'Active' ? 'Profiles activated' : 'Profiles deactivated');
  };

  const bulkDelete = () => {
    setProfiles((prev) => prev.filter((profile) => !selected.has(profile.id)));
    setSelected(new Set());
    toast('Profiles deleted');
  };

  const rowsToCsv = (rows) => {
    const header = ['Profile', 'Access', 'Status', 'Created', 'Last updated'];
    return [
      header.join(','),
      ...rows.map((profile) => {
        const { used, total } = profileScreenUsage(profile);
        const access = used === total ? `All ${total} screens` : `${used} / ${total} screens`;
        return [
          profile.role,
          access,
          profile.status,
          `${profile.createdDate || ''} by ${profile.created || ''}`,
          `${profile.lastUpdatedDate || ''} by ${profile.lastUpdatedBy || ''}`,
        ]
          .map(csvEscape)
          .join(',');
      }),
    ];
  };

  const exportView = () => {
    downloadCsv('profiles.csv', rowsToCsv(filtered));
    toast('Exported current view');
  };

  const exportSelected = () => {
    downloadCsv('profiles-selected.csv', rowsToCsv(selectedProfiles));
    toast('Exported selected profiles');
  };

  const SortLabel = ({ colKey, children }) => {
    const meta = sortMeta(colKey);
    return (
      <button
        type="button"
        onClick={(event) => setSortByCol(colKey, event)}
        title="Click to sort · Shift+click to add a sort level"
        className={`inline-flex items-center gap-1 uppercase tracking-[0.05em] ${
          meta ? 'text-brand' : 'text-ink-faint hover:text-brand'
        }`}
      >
        {children}
        {meta ? (
          <span className="text-accent">
            {meta.dir === 1 ? '↑' : '↓'}
            {meta.multi ? (
              <span className="ml-0.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-extrabold text-white">
                {meta.level}
              </span>
            ) : null}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-60px)] w-full max-w-screen-2xl flex-col px-6 py-6 lg:px-7">
      <header className="mb-3 flex flex-wrap items-center gap-4">
        <h1 className="text-[18px] font-extrabold tracking-tight text-ink">Profiles</h1>
        <div className="ml-auto flex items-center gap-2.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setColsOpen(false);
                setFiltersOpen((open) => !open);
              }}
              className={`inline-flex items-center gap-1.5 rounded-[9px] border px-3 py-2 text-[12.5px] font-bold transition-colors ${
                filtersOpen || activeFilterCount
                  ? 'border-accent-soft bg-accent-soft text-brand'
                  : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-elevated hover:text-brand'
              }`}
            >
              <Icon name="filter" size={15} />
              Filters
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-accent-soft px-1.5 text-[10.5px] font-extrabold text-accent">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            <Popover open={filtersOpen} onClose={() => setFiltersOpen(false)}>
              <label className="mb-1.5 block px-1 text-[10.5px] font-extrabold uppercase tracking-[0.05em] text-ink-faint">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="field-input mb-2.5 w-full text-[13px]"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
              <label className="mb-1.5 block px-1 text-[10.5px] font-extrabold uppercase tracking-[0.05em] text-ink-faint">
                Access
              </label>
              <select
                value={accessFilter}
                onChange={(event) => {
                  setAccessFilter(event.target.value);
                  setPage(1);
                }}
                className="field-input mb-2.5 w-full text-[13px]"
              >
                <option value="">All access levels</option>
                <option value="full">Full access</option>
                <option value="partial">Partial access</option>
              </select>
              <button
                type="button"
                disabled={!activeFilterCount}
                onClick={() => {
                  setStatusFilter('');
                  setAccessFilter('');
                  setPage(1);
                }}
                className="w-full rounded-[9px] border border-line bg-surface px-2.5 py-2 text-[12.5px] font-bold text-brand hover:bg-elevated disabled:cursor-default disabled:opacity-45"
              >
                Clear all filters
              </button>
            </Popover>
          </div>
          <Button variant="primary" onClick={() => setEditing({})} className="gap-1.5 !rounded-[10px] !px-[15px] !py-2.5">
            <Icon name="plus" size={15} />
            Create profile
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(30,26,54,.05),0_10px_30px_rgba(30,39,97,.08)]">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-[#EEF1F8] px-3.5 py-2.5">
          <label className="flex min-w-[12.5rem] flex-1 items-center gap-2 rounded-[9px] border border-line bg-canvas px-2.5 py-1.5 sm:max-w-xs">
            <Icon name="search" size={15} className="shrink-0 text-ink-faint" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search profiles…"
              className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-faint"
            />
          </label>
          <div className="ml-auto flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setFiltersOpen(false);
                  setColsOpen((open) => !open);
                }}
                className={`inline-flex items-center gap-1.5 rounded-[9px] border px-3 py-2 text-[12.5px] font-bold transition-colors ${
                  colsOpen || hiddenColCount
                    ? 'border-accent-soft bg-accent-soft text-brand'
                    : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-elevated hover:text-brand'
                }`}
              >
                <Icon name="sliders" size={15} />
                Columns
                {hiddenColCount > 0 ? (
                  <span className="rounded-full bg-accent-soft px-1.5 text-[10.5px] font-extrabold text-accent">
                    {hiddenColCount}
                  </span>
                ) : null}
              </button>
              <Popover open={colsOpen} onClose={() => setColsOpen(false)} width="w-[13.5rem]">
                <div className="px-2 pb-1.5 pt-1 text-[9.5px] font-extrabold uppercase tracking-[0.06em] text-ink-faint">
                  Visible columns
                </div>
                <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-semibold text-ink-soft">
                  Profile
                  <Icon name="lock" size={12} className="ml-auto text-ink-faint" />
                </div>
                {COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-semibold text-ink-soft hover:bg-elevated"
                  >
                    <input
                      type="checkbox"
                      checked={visibleCols[col.key]}
                      onChange={() =>
                        setVisibleCols((prev) => ({ ...prev, [col.key]: !prev[col.key] }))
                      }
                      className="h-4 w-4 accent-accent"
                    />
                    {col.label}
                  </label>
                ))}
              </Popover>
            </div>
            <button
              type="button"
              onClick={exportView}
              className="inline-flex items-center gap-1.5 rounded-[9px] border border-line bg-surface px-3 py-2 text-[12.5px] font-bold text-ink-soft hover:border-line-strong hover:bg-elevated hover:text-brand"
            >
              <Icon name="download" size={15} />
              Export
            </button>
            <span className="hidden h-[22px] w-px bg-line sm:block" />
            <label className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-muted">
              Rows
              <select
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(1);
                }}
                className="rounded-[9px] border border-line bg-surface py-1.5 pl-2.5 pr-7 text-[12.5px] font-semibold text-ink-soft outline-none"
              >
                {[10, 25, 50].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage <= 1}
                className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-line bg-surface text-ink-soft hover:bg-elevated disabled:opacity-40"
                aria-label="Previous page"
              >
                ‹
              </button>
              <span className="min-w-[3.25rem] px-2 text-center text-[12.5px] font-bold text-ink">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage >= totalPages}
                className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-line bg-surface text-ink-soft hover:bg-elevated disabled:opacity-40"
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3.5 bg-brand px-3.5 py-2.5">
            <span className="whitespace-nowrap text-[12.5px] font-extrabold text-white">
              {selected.size} selected
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => bulkStatus('Active')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/22 bg-white/10 px-2.5 py-1.5 text-[12px] font-bold text-white hover:bg-white/18"
              >
                <Icon name="check" size={14} />
                Activate
              </button>
              <button
                type="button"
                onClick={() => bulkStatus('Inactive')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/22 bg-white/10 px-2.5 py-1.5 text-[12px] font-bold text-white hover:bg-white/18"
              >
                Deactivate
              </button>
              <button
                type="button"
                onClick={exportSelected}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/22 bg-white/10 px-2.5 py-1.5 text-[12px] font-bold text-white hover:bg-white/18"
              >
                <Icon name="download" size={14} />
                Export
              </button>
              <button
                type="button"
                onClick={bulkDelete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E04F4F]/40 bg-[#E04F4F]/16 px-2.5 py-1.5 text-[12px] font-bold text-white hover:bg-danger hover:border-danger"
              >
                <Icon name="trash" size={14} />
                Delete
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-auto text-[12px] font-bold text-white/75 hover:text-white"
            >
              Clear selection
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto scroll-thin">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="sticky top-0 z-[3] w-[42px] bg-surface px-3.5 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(node) => {
                      if (node) node.indeterminate = somePageSelected;
                    }}
                    onChange={toggleAllOnPage}
                    title="Select all on this page"
                    className="h-4 w-4 accent-accent"
                  />
                </th>
                <th className="sticky top-0 z-[3] bg-surface px-3.5 py-2.5 text-[10.5px] font-extrabold">
                  <SortLabel colKey="name">Profile</SortLabel>
                </th>
                {visibleCols.access && (
                  <th className="sticky top-0 z-[3] bg-surface px-3.5 py-2.5 text-[10.5px] font-extrabold">
                    <SortLabel colKey="used">Access</SortLabel>
                  </th>
                )}
                {visibleCols.status && (
                  <th className="sticky top-0 z-[3] bg-surface px-3.5 py-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.05em] text-ink-faint">
                    Status
                  </th>
                )}
                {visibleCols.created && (
                  <th className="sticky top-0 z-[3] bg-surface px-3.5 py-2.5 text-right text-[10.5px] font-extrabold">
                    <SortLabel colKey="created">Created</SortLabel>
                  </th>
                )}
                {visibleCols.updated && (
                  <th className="sticky top-0 z-[3] bg-surface px-3.5 py-2.5 text-right text-[10.5px] font-extrabold">
                    <SortLabel colKey="updated">Last updated</SortLabel>
                  </th>
                )}
                <th className="sticky top-0 z-[3] w-8 bg-surface" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((profile) => {
                const isSelected = selected.has(profile.id);
                return (
                  <tr
                    key={profile.id}
                    onClick={() => setEditing(profile)}
                    className={`cursor-pointer border-t border-[#EEF1F8] transition-colors ${
                      isSelected ? 'bg-accent-soft' : 'hover:bg-[#EEF2FD]'
                    }`}
                  >
                    <td className="px-3.5 py-2 text-center" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(profile.id)}
                        className="h-4 w-4 accent-accent"
                      />
                    </td>
                    <td className="px-3.5 py-2">
                      <div className="text-[13px] font-bold text-ink">{profile.role}</div>
                    </td>
                    {visibleCols.access && (
                      <td className="px-3.5 py-2">
                        <AccessCell profile={profile} />
                      </td>
                    )}
                    {visibleCols.status && (
                      <td className="px-3.5 py-2">
                        <StatusPill status={profile.status} />
                      </td>
                    )}
                    {visibleCols.created && (
                      <td className="px-3.5 py-2">
                        <DateCell date={profile.createdDate} by={profile.created} />
                      </td>
                    )}
                    {visibleCols.updated && (
                      <td className="px-3.5 py-2">
                        <DateCell date={profile.lastUpdatedDate} by={profile.lastUpdatedBy} />
                      </td>
                    )}
                    <td className="px-2 py-2 text-right text-ink-faint">
                      <span className="text-lg leading-none">›</span>
                    </td>
                  </tr>
                );
              })}
              {!paginated.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-muted">
                    No profiles match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ProfileForm
          profile={editing.id ? editing : null}
          profiles={profiles}
          accounts={accounts}
          segments={segments}
          persona={persona}
          onClose={() => setEditing(null)}
          onSave={saveProfile}
          onDelete={deleteProfile}
        />
      )}
    </div>
  );
}
