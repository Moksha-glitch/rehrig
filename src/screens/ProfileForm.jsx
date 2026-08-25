import React, { useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Button,
  ConfirmDialog,
  DrawerActions,
  Field,
  FormDrawer,
  Switch,
  TextArea,
  TextInput,
} from '../components/UI.jsx';
import {
  TOTAL_PROFILE_SCREENS,
  accessStateFromFlags,
  buildProviderTree,
  buildScreenModules,
  collectFlags,
  moduleAccessState,
  screenAccessState,
  summarizeProfileAccess,
} from '../data/profileAccess.js';

// Fixed neutral-professional palette — each role gets a consistent slot
const AVATAR_PALETTE = [
  { bg: '#3B5998', shadow: 'rgba(59,89,152,0.30)' },   // navy
  { bg: '#2E7D5E', shadow: 'rgba(46,125,94,0.30)' },   // forest
  { bg: '#5A4A8A', shadow: 'rgba(90,74,138,0.30)' },   // plum
  { bg: '#7A5230', shadow: 'rgba(122,82,48,0.30)' },   // chestnut
  { bg: '#2C6E8A', shadow: 'rgba(44,110,138,0.30)' },  // steel blue
  { bg: '#6B3A3A', shadow: 'rgba(107,58,58,0.30)' },   // burgundy
  { bg: '#3A6B4A', shadow: 'rgba(58,107,74,0.30)' },   // sage
  { bg: '#4A5568', shadow: 'rgba(74,85,104,0.30)' },   // slate
];

function hydrateScreens(groups) {
  return groups.map((group) => ({
    ...group,
    screens: group.screens.map((screen) => ({
      ...screen,
      view: screen.view ?? !!screen.enabled,
      edit: screen.edit ?? !!screen.enabled,
      create: screen.create ?? !!screen.enabled,
      delete: screen.delete ?? false,
      fields: screen.fields
        ? screen.fields.map((field) => ({
            ...field,
            view: field.view ?? !!field.enabled,
            edit: field.edit ?? !!field.enabled,
          }))
        : screen.fields,
    })),
  }));
}

function screensFromProfile(profile) {
  if (profile?.screens?.length) return hydrateScreens(JSON.parse(JSON.stringify(profile.screens)));
  return buildScreenModules(profile?.preset || (profile?.id ? 'partial' : 'none'));
}

function providersFromProfile(profile, accounts, segments, { blank = false } = {}) {
  if (!blank && profile?.providers?.length) {
    return JSON.parse(JSON.stringify(profile.providers));
  }
  return buildProviderTree(accounts, segments, {
    checked: !blank && profile?.preset === 'all',
  });
}

function allScreensState(modules) {
  return accessStateFromFlags(modules.flatMap((group) => group.screens.flatMap(collectFlags)));
}

function enabledScreenCount(modules) {
  return modules.reduce(
    (sum, group) =>
      sum + group.screens.filter((screen) => screen.view || screen.edit || screen.create || screen.delete).length,
    0
  );
}

function ProviderTree({ providers, setProviders }) {
  const [search, setSearch] = useState('');

  const toggleParent = (id) => {
    setProviders((prev) =>
      prev.map((provider) => {
        if (provider.id !== id) return provider;
        const next = !provider.checked;
        return {
          ...provider,
          checked: next,
          segments: provider.segments.map((segment) => ({ ...segment, checked: next })),
        };
      })
    );
  };

  const toggleSegment = (providerId, segmentId) => {
    setProviders((prev) =>
      prev.map((provider) => {
        if (provider.id !== providerId) return provider;
        const segments = provider.segments.map((segment) =>
          segment.id === segmentId ? { ...segment, checked: !segment.checked } : segment
        );
        return {
          ...provider,
          segments,
          checked: segments.length ? segments.every((segment) => segment.checked) : !provider.checked,
        };
      })
    );
  };

  const selectAll = () => setProviders((prev) =>
    prev.map((p) => ({ ...p, checked: true, segments: p.segments.map((s) => ({ ...s, checked: true })) }))
  );
  const clearAll = () => setProviders((prev) =>
    prev.map((p) => ({ ...p, checked: false, segments: p.segments.map((s) => ({ ...s, checked: false })) }))
  );

  const term = search.trim().toLowerCase();
  const visible = term
    ? providers.filter((p) => p.name.toLowerCase().includes(term) || p.segments.some((s) => s.name.toLowerCase().includes(term)))
    : providers;

  return (
    <div className="flex flex-col gap-2">
      {/* Search + quick actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter providers…"
            className="h-8 w-full rounded-lg border border-line bg-surface pl-8 pr-3 text-[12.5px] text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
          />
        </div>
        <button type="button" onClick={selectAll} className="shrink-0 rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:bg-elevated hover:text-ink">
          All
        </button>
        <button type="button" onClick={clearAll} className="shrink-0 rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:bg-elevated hover:text-ink">
          None
        </button>
      </div>

      {/* Provider list */}
      <div className="max-h-[380px] overflow-y-auto rounded-xl border border-line bg-elevated/30 p-2 scroll-thin">
        {visible.length === 0 && (
          <p className="py-4 text-center text-[12px] text-ink-faint">No providers match.</p>
        )}
        {visible.map((provider) => {
          const someSegments = provider.segments.some((segment) => segment.checked);
          const allSegments = provider.segments.length
            ? provider.segments.every((segment) => segment.checked)
            : provider.checked;
          return (
            <div key={provider.id} className="mb-1 last:mb-0">
              <label className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-surface ${allSegments ? 'bg-brand-soft/40' : ''}`}>
                <input
                  type="checkbox"
                  checked={allSegments}
                  ref={(node) => {
                    if (node) node.indeterminate = someSegments && !allSegments;
                  }}
                  onChange={() => toggleParent(provider.id)}
                  className="h-4 w-4 shrink-0 rounded border-line-strong text-brand focus:ring-brand/30"
                />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink" title={provider.name}>
                  {provider.name}
                </span>
                {provider.segments.length > 0 && (
                  <span className="shrink-0 text-[10px] text-ink-faint">
                    {provider.segments.filter((s) => s.checked).length}/{provider.segments.length}
                  </span>
                )}
              </label>
              {provider.segments.map((segment) => (
                <label
                  key={segment.id}
                  className="ml-6 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1 transition-colors hover:bg-surface"
                >
                  <input
                    type="checkbox"
                    checked={segment.checked}
                    onChange={() => toggleSegment(provider.id, segment.id)}
                    className="h-3.5 w-3.5 shrink-0 rounded border-line-strong text-brand focus:ring-brand/30"
                  />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-muted" title={segment.name}>
                    {segment.name}
                  </span>
                </label>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function applyAccess(target, value) {
  const next = { ...target, view: value, edit: value, create: value, delete: value };
  if (target.fields) {
    next.fields = target.fields.map((field) => ({ ...field, view: value, edit: value }));
  }
  return next;
}

function ScreenModulePanel({ modules, setModules }) {
  const [filter, setFilter] = useState('all');
  const visible =
    filter === 'all' ? modules : modules.filter((_, index) => String(index) === filter);
  const fullState = allScreensState(modules);

  const setAllScreens = (value) => {
    setModules((prev) =>
      prev.map((group) => ({
        ...group,
        screens: group.screens.map((screen) => applyAccess(screen, value)),
      }))
    );
  };

  const toggleModuleExpand = (moduleName) => {
    setModules((prev) =>
      prev.map((group) =>
        group.module === moduleName ? { ...group, expanded: !group.expanded } : group
      )
    );
  };

  const setAllForModule = (moduleName, value) => {
    setModules((prev) =>
      prev.map((group) =>
        group.module === moduleName
          ? { ...group, screens: group.screens.map((screen) => applyAccess(screen, value)) }
          : group
      )
    );
  };

  const setAllForScreen = (moduleName, screenId, value) => {
    setModules((prev) =>
      prev.map((group) =>
        group.module === moduleName
          ? {
              ...group,
              screens: group.screens.map((screen) =>
                screen.id === screenId ? applyAccess(screen, value) : screen
              ),
            }
          : group
      )
    );
  };

  const toggleScreenExpand = (moduleName, screenId) => {
    setModules((prev) =>
      prev.map((group) =>
        group.module === moduleName
          ? {
              ...group,
              screens: group.screens.map((screen) =>
                screen.id === screenId ? { ...screen, expanded: !screen.expanded } : screen
              ),
            }
          : group
      )
    );
  };

  const toggleFlag = (moduleName, screenId, key, fieldId) => {
    setModules((prev) =>
      prev.map((group) => {
        if (group.module !== moduleName) return group;
        return {
          ...group,
          screens: group.screens.map((screen) => {
            if (screen.id !== screenId) return screen;
            if (!fieldId) return { ...screen, [key]: !screen[key] };
            return {
              ...screen,
              fields: screen.fields.map((field) =>
                field.id === fieldId ? { ...field, [key]: !field[key] } : field
              ),
            };
          }),
        };
      })
    );
  };

  const enabledInModule = (group) =>
    group.screens.filter((s) => s.view || s.edit || s.create || s.delete).length;

  return (
    <div>
      {/* Full-access toggle card */}
      <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-elevated/50 px-3.5 py-3">
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold text-ink">Full Access — All Screens</div>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            View &amp; Edit everything across every module in one switch
          </p>
        </div>
        <Switch
          state={fullState}
          onChange={setAllScreens}
          label="Full access — all screens"
        />
      </div>

      {/* Module filter — horizontal chip scroll */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5 scroll-thin">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
            filter === 'all'
              ? 'border-brand bg-brand-soft text-brand-ink'
              : 'border-line bg-surface text-ink-muted hover:bg-elevated hover:text-ink'
          }`}
        >
          All · {TOTAL_PROFILE_SCREENS}
        </button>
        {modules.map((group, index) => {
          const enabled = enabledInModule(group);
          const active = filter === String(index);
          return (
            <button
              key={group.module}
              type="button"
              onClick={() => setFilter(String(index))}
              className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                active
                  ? 'border-brand bg-brand-soft text-brand-ink'
                  : 'border-line bg-surface text-ink-muted hover:bg-elevated hover:text-ink'
              }`}
            >
              {group.module.split(' ').slice(0, 2).join(' ')}
              {enabled > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active ? 'bg-brand/20 text-brand-ink' : 'bg-success-soft text-success'
                }`}>
                  {enabled}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Module rows */}
      <div className="max-h-[440px] space-y-1 overflow-y-auto pr-1 scroll-thin">
        {visible.map((group) => {
          const moduleState = moduleAccessState(group);
          const showHeaderToggle = filter === 'all';
          const enabledCount = enabledInModule(group);
          const totalCount = group.screens.length;
          const pct = totalCount ? Math.round((enabledCount / totalCount) * 100) : 0;
          return (
            <div key={group.module}>
              <div
                className={`mb-0.5 overflow-hidden rounded-lg border ${
                  enabledCount > 0 ? 'border-line bg-surface' : 'border-line/60 bg-elevated/30'
                }`}
              >
                {/* Module header row */}
                <div className="flex items-center justify-between px-3 py-2">
                  {showHeaderToggle ? (
                    <button
                      type="button"
                      onClick={() => toggleModuleExpand(group.module)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      aria-expanded={group.expanded}
                    >
                      <Icon
                        name={group.expanded ? 'chevronDown' : 'chevronRight'}
                        size={12}
                        className="shrink-0 text-ink-faint"
                      />
                      <span className="truncate text-[11.5px] font-semibold text-ink">
                        {group.module}
                      </span>
                      <span className="ml-auto shrink-0 text-[10px] text-ink-faint">
                        {enabledCount}/{totalCount}
                      </span>
                    </button>
                  ) : (
                    <span className="truncate text-[11.5px] font-semibold text-ink">{group.module}</span>
                  )}
                  <Switch
                    state={moduleState}
                    onChange={(value) => setAllForModule(group.module, value)}
                    label={`${group.module} access`}
                    className="ml-3"
                  />
                </div>
                {/* Progress bar */}
                {enabledCount > 0 && (
                  <div className="h-[2px] w-full bg-line/50">
                    <div
                      className="h-full bg-brand/60 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>

              {(group.expanded || filter !== 'all') && (
                <div className="mb-1.5 ml-3 space-y-1 border-l border-line pl-2.5 pt-1">
                  {group.screens.map((screen) => {
                    const screenState = screenAccessState(screen);
                    return (
                      <div
                        key={screen.id}
                        className="overflow-hidden rounded-lg border border-line bg-surface"
                      >
                        <div className="flex items-center justify-between px-3 py-2">
                          <button
                            type="button"
                            onClick={() => toggleScreenExpand(group.module, screen.id)}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            aria-expanded={screen.expanded}
                          >
                            <Icon
                              name={screen.expanded ? 'chevronDown' : 'chevronRight'}
                              size={12}
                              className="text-ink-faint"
                            />
                            <span className="truncate text-[12px] text-ink">
                              {screen.name}
                            </span>
                            {screen.fields && (
                              <span className="shrink-0 rounded bg-elevated px-1 py-0.5 text-[9px] text-ink-faint">
                                {screen.fields.length} fields
                              </span>
                            )}
                          </button>
                          <Switch
                            state={screenState}
                            onChange={(value) => setAllForScreen(group.module, screen.id, value)}
                            label={`${screen.name} access`}
                          />
                        </div>
                        {screen.expanded && (
                          <div className="border-t border-line px-3 pb-3 pt-2">
                            <div className="grid grid-cols-[1fr_48px_48px_48px_48px] items-center gap-1">
                              <div />
                              {['View', 'Edit', 'Create', 'Delete'].map((label) => (
                                <div
                                  key={label}
                                  className="text-center text-[9px] uppercase tracking-wider text-ink-faint"
                                >
                                  {label}
                                </div>
                              ))}
                              <div className="text-[11.5px] font-medium text-ink">Screen access</div>
                              {['view', 'edit', 'create', 'delete'].map((flag) => (
                                <div key={flag} className="flex justify-center">
                                  <Switch
                                    checked={!!screen[flag]}
                                    onChange={() => toggleFlag(group.module, screen.id, flag)}
                                    label={`${screen.name} ${flag}`}
                                  />
                                </div>
                              ))}
                            </div>
                            {screen.fields && (
                              <div className="mt-2.5 max-h-[220px] overflow-y-auto border-t border-dashed border-line pt-2.5 scroll-thin">
                                <div className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-wider text-ink-faint">
                                  Fields · {screen.fields.length}
                                </div>
                                {screen.fields.map((field) => (
                                  <div
                                    key={field.id}
                                    className="grid grid-cols-[1fr_52px_52px] items-center gap-1 py-0.5"
                                  >
                                    <div className="truncate text-[11px] text-ink-muted" title={field.name}>
                                      {field.name}
                                    </div>
                                    <div className="flex justify-center">
                                      <Switch
                                        checked={field.view}
                                        onChange={() => toggleFlag(group.module, screen.id, 'view', field.id)}
                                        label={`${field.name} view`}
                                      />
                                    </div>
                                    <div className="flex justify-center">
                                      <Switch
                                        checked={field.edit}
                                        onChange={() => toggleFlag(group.module, screen.id, 'edit', field.id)}
                                        label={`${field.name} edit`}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfileForm({
  profile,
  profiles = [],
  accounts = [],
  segments = [],
  onClose,
  onSave,
  onDelete,
  busy = false,
  error = '',
}) {
  const isNew = !profile?.id;
  const [step, setStep] = useState(isNew ? 'choose' : 'form');
  const [createMode, setCreateMode] = useState('blank');
  const [cloneId, setCloneId] = useState(profiles[0]?.id || '');
  const [name, setName] = useState(isNew ? '' : profile?.role || '');
  const [status, setStatus] = useState(isNew ? false : profile?.status !== 'Inactive');
  const [description, setDescription] = useState(isNew ? '' : profile?.description || '');
  const [providers, setProviders] = useState(() =>
    isNew ? buildProviderTree(accounts, segments, { checked: false }) : providersFromProfile(profile, accounts, segments)
  );
  const [screens, setScreens] = useState(() =>
    isNew ? buildScreenModules('none') : screensFromProfile(profile)
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const snapshot = JSON.stringify({ name, status, description, providers, screens });
  const initialRef = useRef(isNew ? '' : snapshot);
  const dirty = step === 'form' && snapshot !== initialRef.current;
  const screenCount = enabledScreenCount(screens);
  const canSave = !!name.trim() && screenCount > 0;

  const startForm = () => {
    if (createMode === 'clone') {
      const source = profiles.find((item) => item.id === cloneId);
      if (!source) return;
      setName('');
      setStatus(false);
      setDescription('');
      setProviders(providersFromProfile(source, accounts, segments));
      setScreens(screensFromProfile(source));
    } else {
      setName('');
      setStatus(false);
      setDescription('');
      setProviders(providersFromProfile(null, accounts, segments, { blank: true }));
      setScreens(buildScreenModules('none'));
    }
    setStep('form');
    initialRef.current = '';
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (screenCount === 0) return;
    onSave({
      ...(profile || {}),
      id: profile?.id,
      role: name.trim(),
      status: status ? 'Active' : 'Inactive',
      description: description.slice(0, 255),
      access: summarizeProfileAccess(providers, screens),
      providers,
      screens,
    });
  };

  if (step === 'choose') {
    const ICONS = {
      blank: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
      clone: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
        </svg>
      ),
    };
    const OPTIONS = [
      {
        id: 'blank',
        title: 'Start from scratch',
        body: 'Define every permission from a clean slate. Best for a brand-new role.',
        detail: 'All screens off · All providers unselected',
      },
      {
        id: 'clone',
        title: 'Clone an existing profile',
        body: 'Copy all screen and provider access from an existing role, then rename and adjust.',
        detail: 'Inherits screens + providers',
      },
    ];

    return (
      <FormDrawer
        onClose={onClose}
        onSubmit={(event) => {
          event.preventDefault();
          startForm();
        }}
        title="New Profile"
        description="Choose how to set up permission access for this profile."
        dirty={false}
        busy={busy}
        submitLabel="Continue"
        footer={
          <DrawerActions>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMode === 'clone' && !cloneId}
            >
              Continue →
            </Button>
          </DrawerActions>
        }
      >
        {/* Visual intro strip */}
        <div className="-mt-1 mb-5 flex items-center gap-3 rounded-xl border border-line bg-elevated/40 px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">New permission profile</p>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Profiles define what a user role can see and edit across the platform.
            </p>
          </div>
        </div>

        {/* Option cards */}
        <div className="space-y-2.5">
          {OPTIONS.map((option) => {
            const selected = createMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setCreateMode(option.id)}
                className={`group w-full overflow-hidden rounded-xl border text-left transition-all duration-150 ${
                  selected
                    ? 'border-brand bg-brand-soft shadow-[0_0_0_3px_rgba(11,79,125,0.08)]'
                    : 'border-line bg-surface hover:border-brand/30 hover:bg-elevated/60'
                }`}
              >
                <div className="flex items-start gap-4 p-4">
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      selected ? 'bg-brand text-white' : 'bg-elevated text-ink-muted group-hover:text-brand'
                    }`}
                  >
                    {ICONS[option.id]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`block text-sm font-semibold ${selected ? 'text-brand-ink' : 'text-ink'}`}>
                        {option.title}
                      </span>
                      {selected && (
                        <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                          Selected
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-muted">
                      {option.body}
                    </span>
                    <span
                      className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        selected ? 'bg-brand/10 text-brand-ink' : 'bg-elevated text-ink-faint'
                      }`}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                      {option.detail}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Clone picker */}
        {createMode === 'clone' && (
          <div className="mt-4 rounded-xl border border-brand/20 bg-brand-soft/30 p-3">
            <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">
              Clone from
            </p>
            <div className="space-y-1">
              {profiles.map((item) => {
                const words = (item.role || '').trim().split(/\s+/);
                const initials = words.length >= 2
                  ? `${words[0][0]}${words[words.length - 1][0]}`
                  : (words[0] || 'P').slice(0, 2);
                const idx = [...(item.role || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_PALETTE.length;
                const palette = AVATAR_PALETTE[idx];
                const isSelected = cloneId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCloneId(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? 'bg-brand/10 ring-1 ring-brand/25'
                        : 'hover:bg-surface'
                    }`}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                      style={{
                        background: palette.bg,
                      }}
                    >
                      {initials.toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">{item.role}</span>
                      {item.access && (
                        <span className="block truncate text-[11px] text-ink-muted">{item.access}</span>
                      )}
                    </span>
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 text-brand">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </FormDrawer>
    );
  }

  return (
    <>
      <FormDrawer
        onClose={onClose}
        onSubmit={handleSubmit}
        title={isNew ? 'New Profile' : 'Edit Profile'}
        extraWide
        dirty={dirty}
        busy={busy}
        error={error}
        submitLabel="Save Profile"
        footer={
          <DrawerActions className="justify-between">
            <div>
              {!isNew && (
                <Button type="button" variant="secondary" onClick={() => setConfirmDelete(true)}>
                  <span className="text-danger">Delete</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={busy || !canSave}>
                {busy ? 'Saving…' : 'Save Profile'}
              </Button>
            </div>
          </DrawerActions>
        }
      >
        {/* Identity header — shows for both new (as live preview) and edit */}
        <div className="-mt-1 mb-4 flex items-center gap-3 rounded-xl border border-line bg-elevated/50 px-4 py-3">
          {name.trim() ? (
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white select-none transition-all"
              style={{
                background: AVATAR_PALETTE[[...(name)].reduce((a,c)=>a+c.charCodeAt(0),0) % AVATAR_PALETTE.length].bg,
                boxShadow: `0 2px 8px ${AVATAR_PALETTE[[...(name)].reduce((a,c)=>a+c.charCodeAt(0),0) % AVATAR_PALETTE.length].shadow}`,
              }}
            >
              {(() => { const w = name.trim().split(/\s+/); return w.length >= 2 ? `${w[0][0]}${w[w.length-1][0]}` : (w[0]||'P').slice(0,2); })().toUpperCase()}
            </span>
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-line bg-elevated/60 text-ink-faint">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">
              {name.trim() || <span className="italic text-ink-faint">Enter a profile name…</span>}
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-muted">
              {screenCount > 0
                ? <>{screenCount} screen{screenCount !== 1 ? 's' : ''} enabled · {providers.filter(p => p.checked || p.segments?.some(s => s.checked)).length} provider{providers.filter(p => p.checked || p.segments?.some(s => s.checked)).length !== 1 ? 's' : ''}</>
                : 'No screens enabled yet'}
            </p>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
            status ? 'bg-success-soft text-success' : 'bg-elevated text-ink-faint'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status ? 'bg-success' : 'bg-ink-faint'}`} />
            {status ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Profile Name" required>
            <TextInput
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Regional Manager"
            />
          </Field>
          <Field label="Status">
            <div className="flex h-10 items-center gap-2">
              <Switch checked={status} onChange={setStatus} label="Profile status" />
              <span className="text-sm text-ink-muted">{status ? 'Active' : 'Inactive'}</span>
            </div>
          </Field>
        </div>
        <Field label="Description" span2>
          <TextArea
            value={description}
            onChange={(event) => setDescription(event.target.value.slice(0, 255))}
            placeholder="What this profile is for..."
          />
        </Field>

        <div className="grid gap-5 pt-1 lg:grid-cols-[340px_1fr]">
          <div className="min-w-0">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Service Providers</span>
              <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-ink-faint">
                {providers.filter(p => p.checked || p.segments?.some(s => s.checked)).length} selected
              </span>
            </div>
            <ProviderTree providers={providers} setProviders={setProviders} />
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Screens · by module <span className="text-danger">*</span></span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                screenCount > 0 ? 'bg-brand-soft text-brand-ink' : 'bg-elevated text-ink-faint'
              }`}>
                {screenCount} active
              </span>
            </div>
            <ScreenModulePanel modules={screens} setModules={setScreens} />
            {screenCount === 0 && (
              <p className="mt-2 flex items-center gap-1 pb-4 text-[12px] text-danger">
                <Icon name="x" size={12} /> Turn on at least one screen.
              </p>
            )}
          </div>
        </div>
      </FormDrawer>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this profile?"
        description={`${profile?.role || 'This profile'} will be removed. Users assigned to it keep their login but lose this permission set.`}
        confirmLabel="Delete profile"
        severity="danger"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete?.(profile);
        }}
      />
    </>
  );
}
