import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Badge,
  Table,
  Page,
  PageHeader,
  Panel,
  Toolbar,
  SearchField,
  Button,
  FormDrawer,
  FieldSection,
  Field,
  TextInput,
  Select,
  Checkbox,
  ConfirmDialog,
  AsyncState,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import {
  useAccounts,
  useSegments,
  useCreateSegment,
  useUpdateSegment,
  useDeleteSegment,
} from '../hooks/useAccounts.js';
import { getErrorMessage } from '../lib/errors.js';

const SEGMENT_TYPES = ['Top', 'Market Area', 'District', 'Division'];

const TYPE_CONFIG = {
  Top: {
    label: 'Top',
    badge: 'violet',
    iconColor: '#8B5CF6',
    pillClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/25',
    iconBg: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  },
  'Market Area': {
    label: 'Market Area',
    badge: 'cyan',
    iconColor: '#06B6D4',
    pillClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25',
    iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  },
  District: {
    label: 'District',
    badge: 'green',
    iconColor: '#10B981',
    pillClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  Division: {
    label: 'Division',
    badge: 'amber',
    iconColor: '#F59E0B',
    pillClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
};

function segmentFormValues(segment, defaultAccountId = '', defaultParentId = '') {
  return {
    accountId: segment?.accountId || defaultAccountId,
    name: segment?.name || segment?.segmentName || '',
    shortName: segment?.shortName || '',
    type: segment?.type || (defaultParentId ? 'District' : 'District'),
    parentId: segment?.parentId || segment?.parent || defaultParentId || '',
    delaySharing: !!segment?.delaySharing,
    delayDuration: segment?.delayDuration || 0,
    publicGroupId: segment?.publicGroupId || '',
  };
}

export function SegmentEditorDrawer({
  accounts = [],
  segments = [],
  segment = null,
  defaultAccountId = '',
  defaultParentId = '',
  onClose,
  onSaved,
}) {
  const { toast } = useStore();
  const createSegment = useCreateSegment();
  const updateSegment = useUpdateSegment();
  const isNew = !segment;

  const [form, setForm] = useState(() =>
    segmentFormValues(segment, defaultAccountId, defaultParentId)
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(segmentFormValues(segment, defaultAccountId, defaultParentId));
    setError('');
  }, [segment, defaultAccountId, defaultParentId]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const accountOptions = accounts.map((a) => a.name);
  const accountIdByName = Object.fromEntries(accounts.map((a) => [a.name, a.id]));
  const accountNameById = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  // Hierarchy rule: Parent must be higher in hierarchy than this segment
  // Top: no parent
  // Market Area: can sit under Top
  // District: can sit under Top or Market Area
  // Division: can sit under Top, Market Area, or District
  const eligibleParents = useMemo(() => {
    if (form.type === 'Top') return [];
    const hierarchyOrder = ['Top', 'Market Area', 'District', 'Division'];
    const currentRank = hierarchyOrder.indexOf(form.type);

    return segments.filter((s) => {
      // Must be same account
      if (s.accountId !== form.accountId) return false;
      // Cannot be itself
      if (segment && s.id === segment.id) return false;
      // Parent must be higher rank
      const parentRank = hierarchyOrder.indexOf(s.type);
      return parentRank !== -1 && currentRank !== -1 && parentRank < currentRank;
    });
  }, [segments, form.accountId, form.type, segment]);

  const parentOptions = ['(No Parent / Top Level)', ...eligibleParents.map((p) => p.name)];
  const parentIdByName = Object.fromEntries(eligibleParents.map((p) => [p.name, p.id]));
  const parentNameById = Object.fromEntries(segments.map((p) => [p.id, p.name]));

  const save = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.accountId) {
      setError('Service provider account is required.');
      return;
    }
    if (!form.name.trim()) {
      setError('Segment name is required.');
      return;
    }

    setBusy(true);
    setError('');

    const payload = {
      accountId: form.accountId,
      name: form.name.trim(),
      segmentName: form.name.trim(),
      shortName: form.shortName.trim() || form.name.slice(0, 4).toUpperCase(),
      type: form.type,
      parentId: form.type === 'Top' ? null : form.parentId || null,
      delaySharing: !!form.delaySharing,
      delayDuration: Number(form.delayDuration) || 0,
      publicGroupId:
        form.publicGroupId.trim() ||
        segment?.publicGroupId ||
        `00G4M00000${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    };

    try {
      if (isNew) {
        await createSegment.mutateAsync(payload);
        toast(`Segment "${payload.name}" created successfully`);
      } else {
        await updateSegment.mutateAsync({ id: segment.id, changes: payload });
        toast(`Segment "${payload.name}" updated successfully`);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save segment.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDrawer
      open={true}
      title={isNew ? 'New Service Provider Segment' : `Edit: ${segment?.name || 'Segment'}`}
      description="Define organizational hierarchy, record-sharing boundaries, and operational scoping."
      submitLabel={isNew ? 'Create Segment' : 'Save Changes'}
      cancelLabel="Cancel"
      busy={busy}
      error={error}
      onSubmit={save}
      onClose={onClose}
    >
      <div className="space-y-6">
        <FieldSection title="Information">
          <Field label="Service Provider" required>
            <Select
              value={accountNameById[form.accountId] || ''}
              onChange={(e) => {
                const nextAccId = accountIdByName[e.target.value] || '';
                set({ accountId: nextAccId, parentId: '' });
              }}
              options={accountOptions}
            />
          </Field>

          <Field label="Segment Type" required>
            <Select
              value={form.type}
              onChange={(e) => {
                const val = e.target.value;
                set({ type: val, parentId: val === 'Top' ? '' : form.parentId });
              }}
              options={SEGMENT_TYPES}
            />
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
              Hierarchy: <strong className="text-ink">Top → Market Area → District → Division</strong>.
              Determines which segments can act as parent.
            </p>
          </Field>

          <Field label="Segment Name" required>
            <TextInput
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Downtown District, Hauler 1"
              required
            />
          </Field>

          <Field label="Short Code / Name">
            <TextInput
              value={form.shortName}
              onChange={(e) => set({ shortName: e.target.value })}
              placeholder="e.g. DT, H1, EDM-TOP"
            />
          </Field>

          {form.type !== 'Top' && (
            <Field label="Parent Segment">
              <Select
                value={parentNameById[form.parentId] || '(No Parent / Top Level)'}
                onChange={(e) => {
                  const val = e.target.value;
                  set({ parentId: parentIdByName[val] || '' });
                }}
                options={parentOptions}
              />
              <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                Parent must be higher in the hierarchy than this segment within the same service provider.
              </p>
            </Field>
          )}

          <div className="pt-2">
            <Checkbox
              checked={form.delaySharing}
              onChange={(e) => set({ delaySharing: e.target.checked })}
              label="Delay Sharing"
            />
            <p className="mt-0.5 ml-6 text-[11px] text-ink-muted">
              Delays record calculation propagation for high-frequency operational updates.
            </p>
          </div>

          {form.delaySharing && (
            <Field label="Delay Duration (seconds)">
              <TextInput
                type="number"
                value={form.delayDuration}
                onChange={(e) => set({ delayDuration: e.target.value })}
                placeholder="300"
              />
            </Field>
          )}
        </FieldSection>

        <FieldSection title="Record Sharing & Security">
          <Field label="Public Group ID">
            <TextInput
              value={form.publicGroupId}
              onChange={(e) => set({ publicGroupId: e.target.value })}
              placeholder="Auto-generated (e.g. 00G4M000002I9lQUAQ)"
              className="font-mono text-xs"
            />
            <p className="mt-1 text-[11px] text-ink-muted">
              Mapping identifier for automated group-based record security sharing.
            </p>
          </Field>
        </FieldSection>
      </div>
    </FormDrawer>
  );
}

export default function SegmentsDirectory() {
  const { toast, state } = useStore();
  const accountsQuery = useAccounts();
  const segmentsQuery = useSegments();
  const deleteSegment = useDeleteSegment();

  const accounts = accountsQuery.data || [];
  const segments = segmentsQuery.data || [];

  const user = state.currentUser;
  const isScopedSP = user?.persona === 'sp' && (user?.accountIds?.length || 0) > 0;
  const defaultUserAccId = isScopedSP ? user.accountIds[0] : '';

  const accessibleAccounts = useMemo(() => {
    if (!isScopedSP) return accounts;
    return accounts.filter((a) => user.accountIds.includes(a.id));
  }, [accounts, isScopedSP, user?.accountIds]);

  const [selectedAccountId, setSelectedAccountId] = useState(defaultUserAccId);
  const [selectedType, setSelectedType] = useState('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'table'
  const [editingSegment, setEditingSegment] = useState(null);
  const [drawerParentId, setDrawerParentId] = useState('');
  const [drawerAccountId, setDrawerAccountId] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [collapsedNodes, setCollapsedNodes] = useState({});

  useEffect(() => {
    if (isScopedSP && defaultUserAccId && !selectedAccountId) {
      setSelectedAccountId(defaultUserAccId);
    }
  }, [isScopedSP, defaultUserAccId, selectedAccountId]);

  const accountNameById = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a.name])),
    [accounts]
  );
  const accountIdByName = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.name, a.id])),
    [accounts]
  );
  const segmentNameById = useMemo(
    () => Object.fromEntries(segments.map((s) => [s.id, s.name])),
    [segments]
  );

  const filteredSegments = useMemo(() => {
    const accessibleAccIds = new Set(accessibleAccounts.map((a) => a.id));
    let list = segments.filter((s) => accessibleAccIds.has(s.accountId));
    if (selectedAccountId) {
      list = list.filter((s) => s.accountId === selectedAccountId);
    }
    if (selectedType !== 'All') {
      list = list.filter((s) => s.type === selectedType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.shortName?.toLowerCase().includes(q) ||
          s.type?.toLowerCase().includes(q) ||
          s.publicGroupId?.toLowerCase().includes(q) ||
          accountNameById[s.accountId]?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [segments, accessibleAccounts, selectedAccountId, selectedType, search, accountNameById]);

  // Group by account for tree display
  const segmentsByAccount = useMemo(() => {
    const map = {};
    filteredSegments.forEach((s) => {
      if (!map[s.accountId]) map[s.accountId] = [];
      map[s.accountId].push(s);
    });
    return map;
  }, [filteredSegments]);

  const toggleNode = (nodeId) => {
    setCollapsedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const openNewRoot = (accId = '') => {
    setEditingSegment(null);
    setDrawerAccountId(accId || selectedAccountId || accessibleAccounts[0]?.id || '');
    setDrawerParentId('');
    setIsDrawerOpen(true);
  };

  const openNewChild = (parentSeg) => {
    setEditingSegment(null);
    setDrawerAccountId(parentSeg.accountId);
    setDrawerParentId(parentSeg.id);
    setIsDrawerOpen(true);
  };

  const openEdit = (seg) => {
    setEditingSegment(seg);
    setDrawerAccountId(seg.accountId);
    setDrawerParentId(seg.parentId || '');
    setIsDrawerOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSegment.mutateAsync(deleteTarget.id);
      toast(`Segment "${deleteTarget.name}" deleted successfully`);
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to delete segment.'), 'danger');
    } finally {
      setDeleteTarget(null);
    }
  };

  const renderTreeNodes = (accountSegments, parentId = null, depth = 0) => {
    const children = accountSegments.filter((s) => (s.parentId || null) === (parentId || null));
    if (!children.length) return null;

    return children.map((seg) => {
      const cfg = TYPE_CONFIG[seg.type] || TYPE_CONFIG.District;
      const subChildren = accountSegments.filter((s) => s.parentId === seg.id);
      const isCollapsed = !!collapsedNodes[seg.id];

      return (
        <div key={seg.id} className="space-y-1.5">
          <div
            className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3.5 transition-all hover:border-line-strong hover:bg-elevated/70 hover:shadow-raise"
            style={{ marginLeft: `${depth * 28}px` }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {/* Toggle expand/collapse if has subchildren, otherwise branch connector */}
              {subChildren.length > 0 ? (
                <button
                  type="button"
                  onClick={() => toggleNode(seg.id)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink-muted transition-colors hover:bg-elevated hover:text-ink"
                  title={isCollapsed ? 'Expand branch' : 'Collapse branch'}
                >
                  <Icon
                    name={isCollapsed ? 'chevronRight' : 'chevronDown'}
                    size={14}
                    className="transition-transform"
                  />
                </button>
              ) : depth > 0 ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center text-ink-faint">
                  <Icon name="chevronRight" size={13} />
                </div>
              ) : (
                <div className="w-2 shrink-0" />
              )}

              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${cfg.iconBg}`}
              >
                <Icon name="layers" size={15} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(seg)}
                    className="truncate text-left text-sm font-semibold text-ink transition-colors hover:text-brand"
                  >
                    {seg.name}
                  </button>
                  {seg.shortName && (
                    <span className="rounded bg-elevated px-1.5 py-0.5 text-[10px] font-bold text-ink-muted">
                      {seg.shortName}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold tracking-wide ${cfg.pillClass}`}
                  >
                    {seg.type}
                  </span>
                  {subChildren.length > 0 && (
                    <span className="rounded bg-elevated/80 px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                      {subChildren.length} {subChildren.length === 1 ? 'child' : 'children'}
                    </span>
                  )}
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-2.5 text-xs text-ink-faint">
                  {!selectedAccountId && (
                    <span className="font-medium text-ink-muted">
                      {accountNameById[seg.accountId] || 'Unknown SP'}
                    </span>
                  )}
                  {seg.parentId && (
                    <span>
                      Parent: <strong className="text-ink-muted">{segmentNameById[seg.parentId]}</strong>
                    </span>
                  )}
                  {seg.publicGroupId && (
                    <span className="font-mono text-[11px] text-ink-faint">
                      ID: {seg.publicGroupId}
                    </span>
                  )}
                  {seg.delaySharing && (
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      Delay: {seg.delayDuration}s
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 opacity-90 transition-opacity group-hover:opacity-100">
              {seg.type !== 'Division' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openNewChild(seg)}
                  className="h-8 px-2.5 text-xs text-brand hover:bg-brand/10 hover:text-brand"
                  title={`Add child segment under ${seg.name}`}
                >
                  <Icon name="plus" size={12} className="mr-1" />
                  Sub-Segment
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEdit(seg)}
                className="h-8 px-2.5 text-xs"
              >
                <Icon name="edit" size={12} className="mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(seg)}
                className="h-8 px-2 text-xs text-danger hover:bg-danger/10 hover:text-danger"
                aria-label={`Delete ${seg.name}`}
              >
                <Icon name="trash" size={13} />
              </Button>
            </div>
          </div>

          {!isCollapsed && renderTreeNodes(accountSegments, seg.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <Page wide>
      <PageHeader
        overline="Service Providers & Governance"
        title="Service Provider Segments"
        description="Manage organizational hierarchy, territory partitions, and record-sharing boundaries across service providers."
        meta={`${filteredSegments.length} ${filteredSegments.length === 1 ? 'segment' : 'segments'} total`}
        actions={
          <Button variant="primary" onClick={() => openNewRoot()}>
            <Icon name="plus" size={14} className="mr-1.5" />
            New Segment
          </Button>
        }
      />

      {/* Hierarchy Info Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 text-xs text-ink-muted dark:border-cyan-500/20 dark:bg-cyan-500/5">
        <div className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-400">
          <Icon name="info" size={15} />
        </div>
        <div className="leading-relaxed">
          <span className="font-semibold text-ink">Hierarchy Rules: </span>
          Segments follow the structure{' '}
          <strong className="text-ink">Top → Market Area → District → Division</strong>. A parent
          segment automatically inherits read access to all child segment records and operational data.
        </div>
      </div>

      <AsyncState query={segmentsQuery}>
        <div className="space-y-4">
          <Panel className="p-0">
            <Toolbar className="justify-between">
              <SearchField
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search segments by name, code, group ID..."
                className="w-full sm:w-80"
              />
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Account Filter Dropdown */}
                <div className="min-w-[16rem]">
                  <Select
                    value={
                      selectedAccountId
                        ? accountNameById[selectedAccountId]
                        : accessibleAccounts.length === 1
                        ? accessibleAccounts[0].name
                        : 'All Service Providers'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'All Service Providers') setSelectedAccountId('');
                      else setSelectedAccountId(accountIdByName[val] || '');
                    }}
                    options={
                      accessibleAccounts.length > 1
                        ? ['All Service Providers', ...accessibleAccounts.map((a) => a.name)]
                        : accessibleAccounts.map((a) => a.name)
                    }
                  />
                </div>

                {/* View Switcher */}
                <div className="flex items-center rounded-lg border border-line bg-surface p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('tree')}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      viewMode === 'tree'
                        ? 'bg-elevated font-semibold text-ink shadow-sm'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    <Icon name="layers" size={13} />
                    Tree
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      viewMode === 'table'
                        ? 'bg-elevated font-semibold text-ink shadow-sm'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    <Icon name="grid" size={13} />
                    Table
                  </button>
                </div>
              </div>
            </Toolbar>
          </Panel>

          {/* Type Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {['All', ...SEGMENT_TYPES].map((type) => {
              const active = selectedType === type;
              const count =
                type === 'All'
                  ? filteredSegments.length
                  : filteredSegments.filter((s) => s.type === type).length;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? 'bg-ink text-surface shadow-sm dark:bg-surface dark:text-ink'
                      : 'border border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink'
                  }`}
                >
                  <span>{type}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      active
                        ? 'bg-surface/20 text-surface dark:bg-ink/20 dark:text-ink'
                        : 'bg-elevated text-ink-muted'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Views */}
          {viewMode === 'tree' ? (
            <div className="space-y-6">
              {Object.keys(segmentsByAccount).length === 0 ? (
                <Panel className="p-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-elevated text-ink-muted">
                    <Icon name="layers" size={24} />
                  </div>
                  <h3 className="text-sm font-semibold text-ink">No segments found</h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    {search || selectedType !== 'All'
                      ? 'Try adjusting your search query or type filters.'
                      : 'Create a segment to begin organizing your territory hierarchy.'}
                  </p>
                  {(search || selectedType !== 'All') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearch('');
                        setSelectedType('All');
                      }}
                      className="mt-3 text-xs"
                    >
                      Clear Filters
                    </Button>
                  )}
                </Panel>
              ) : (
                Object.entries(segmentsByAccount).map(([accId, accSegments]) => {
                  const accountName = accountNameById[accId] || 'Service Provider';
                  return (
                    <Panel key={accId} className="space-y-4 p-4 sm:p-5">
                      {/* Account Card Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                            <Icon name="building" size={16} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-ink">{accountName}</h3>
                            <p className="text-[11px] text-ink-faint">
                              {accSegments.length} {accSegments.length === 1 ? 'segment' : 'segments'} configured
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openNewRoot(accId)}
                          className="h-8 px-2.5 text-xs text-brand hover:bg-brand/10 hover:text-brand"
                        >
                          <Icon name="plus" size={12} className="mr-1" />
                          Add to this provider
                        </Button>
                      </div>

                      {/* Tree Render */}
                      <div className="space-y-2">
                        {renderTreeNodes(accSegments, null, 0)}
                      </div>
                    </Panel>
                  );
                })
              )}
            </div>
          ) : (
            <Panel className="p-0">
              <Table
                columns={[
                  'Segment Name',
                  'Type',
                  'Short Code',
                  'Service Provider',
                  'Parent Segment',
                  'Public Group ID',
                  'Delay Sharing',
                  '',
                ]}
              >
                {filteredSegments.map((seg) => {
                  const cfg = TYPE_CONFIG[seg.type] || TYPE_CONFIG.District;
                  return (
                    <tr key={seg.id} className="interactive hover:bg-elevated/70">
                      <td className="max-w-[14rem] truncate px-4 py-3 font-semibold text-ink">
                        <button
                          type="button"
                          onClick={() => openEdit(seg)}
                          className="hover:text-brand hover:underline"
                        >
                          {seg.name}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${cfg.pillClass}`}
                        >
                          {seg.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {seg.shortName ? (
                          <span className="rounded bg-elevated px-1.5 py-0.5 text-[11px] font-bold text-ink-muted">
                            {seg.shortName}
                          </span>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="max-w-[12rem] truncate px-4 py-3 text-ink-muted">
                        {accountNameById[seg.accountId] || '—'}
                      </td>
                      <td className="max-w-[12rem] truncate px-4 py-3 text-ink-muted">
                        {segmentNameById[seg.parentId] || (
                          <span className="text-ink-faint">Top Level</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                        {seg.publicGroupId || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {seg.delaySharing ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            {seg.delayDuration}s
                          </span>
                        ) : (
                          <span className="text-ink-faint">Instant</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(seg)}
                            className="h-7 px-2 text-xs"
                          >
                            <Icon name="edit" size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(seg)}
                            className="h-7 px-2 text-xs text-danger hover:bg-danger/10 hover:text-danger"
                          >
                            <Icon name="trash" size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </Table>
            </Panel>
          )}
        </div>
      </AsyncState>

      {/* Slide-over Create / Edit Drawer */}
      {isDrawerOpen && (
        <SegmentEditorDrawer
          accounts={accessibleAccounts}
          segments={segments}
          segment={editingSegment}
          defaultAccountId={drawerAccountId || selectedAccountId || accessibleAccounts[0]?.id || ''}
          defaultParentId={drawerParentId}
          onClose={() => {
            setIsDrawerOpen(false);
            setEditingSegment(null);
            setDrawerParentId('');
          }}
          onSaved={() => segmentsQuery.refetch?.()}
        />
      )}

      {/* Delete Confirmation Safeguard */}
      {deleteTarget && (
        <ConfirmDialog
          open={true}
          title="Delete Service Provider Segment"
          description={`Are you sure you want to delete "${deleteTarget.name}"? Child segments and associated records may be affected.`}
          confirmLabel="Delete Segment"
          cancelLabel="Cancel"
          severity="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Page>
  );
}
