import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Icon from '../components/Icon.jsx';
import {
  Badge,
  Button,
  Checkbox,
  Field,
  FieldSection,
  FormDrawer,
  Page,
  PageHeader,
  Panel,
  Select,
  StatStrip,
  TextInput,
  AsyncState,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useRecords } from '../hooks/useRecords.js';
import { useReportSpecs } from '../hooks/useConfig.js';
import { getErrorMessage } from '../lib/errors.js';
import { useAccounts } from '../hooks/useAccounts.js';
import {
  useWorkspaceMutations,
  useWorkspaceSettings,
} from '../hooks/useConfig.js';
import {
  ANALYTICS_DASHBOARDS,
  catalogWithCustomWidgets,
  customWidgetsFromSettings,
  dashboardPresetFor,
  removeCustomWidget,
} from '../data/dashboardWidgets.js';
import { PlaybookChart, PlaybookTable } from '../components/AssistantAnswer.jsx';

const AGING_COLORS = ['#0f7b55', '#8b969f', '#c27803', '#b42318'];

function parseRecordDate(value) {
  if (!value) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function localDateKey(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-');
}

function greetingFor(date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function isOpenWorkOrder(row) {
  return !['Closed', 'Complete', 'Cancelled'].includes(row.caseStatus || row.status);
}

function OpsBar({ label, value, target, warn }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-ink-muted">{label}</span>
        <span className="mono flex items-center gap-1 font-semibold tabular-nums text-ink">
          {warn && <Icon name="alert" size={13} className="text-warn" />}
          {value}%
        </span>
      </div>
      <div className="h-1 w-full bg-elevated">
        <div
          className={`h-1 transition-all duration-soft ease-out ${warn ? 'bg-warn' : 'bg-ink'}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="mt-1.5 text-[11px] text-ink-faint">{target}</div>
    </div>
  );
}

function WidgetShell({ widget, index, count, onMove, onRemove, onDragStart, onDrop, children }) {
  const spanClass = {
    4: 'lg:col-span-4',
    6: 'lg:col-span-6',
    8: 'lg:col-span-8',
    12: 'lg:col-span-12',
  }[widget.span] || 'lg:col-span-4';
  return (
    <Panel
      className={spanClass}
      padded
    >
      <div
        draggable
        onDragStart={(event) => onDragStart(event, widget.id)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => onDrop(event, widget.id)}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="type-overline">{widget.category}</p>
            <h2 className="mt-1 font-display text-title-sm text-ink">{widget.title}</h2>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            <button
              type="button"
              className="btn-secondary px-2 py-1.5"
              onClick={() => onMove(index, -1)}
              disabled={index === 0}
              aria-label={`Move ${widget.title} up`}
            >
              <Icon name="chevronDown" size={13} className="rotate-180" />
            </button>
            <button
              type="button"
              className="btn-secondary px-2 py-1.5"
              onClick={() => onMove(index, 1)}
              disabled={index === count - 1}
              aria-label={`Move ${widget.title} down`}
            >
              <Icon name="chevronDown" size={13} />
            </button>
            <button
              type="button"
              className="btn-secondary px-2 py-1.5 text-danger"
              onClick={() => onRemove(widget.id)}
              aria-label={`Remove ${widget.title}`}
            >
              <Icon name="x" size={13} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </Panel>
  );
}

function RecordList({ rows, empty, render }) {
  return rows.length ? (
    <ul className="divide-y divide-line border-y border-line">{rows.map(render)}</ul>
  ) : (
    <p className="py-8 text-center text-sm text-ink-muted">{empty}</p>
  );
}

export default function Dashboard({ variant = 'home' }) {
  const { state, navigate, toast } = useStore();
  const isAnalytics = variant === 'analytics';
  const [activeDashboardId, setActiveDashboardId] = useState(ANALYTICS_DASHBOARDS[0].id);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateSource, setTemplateSource] = useState('');
  const [templateWidgets, setTemplateWidgets] = useState([]);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [templateError, setTemplateError] = useState('');
  const workOrdersQuery = useRecords('workOrders');
  const dispatchesQuery = useRecords('dispatches');
  const trucksQuery = useRecords('trucks');
  const assetsQuery = useRecords('assets');
  const tipsQuery = useRecords('aggregatedTips');
  const accountsQuery = useAccounts();
  const settingsQuery = useWorkspaceSettings();
  const reportsQuery = useReportSpecs();
  const pinnedReports = (reportsQuery.data || []).filter((spec) => spec.pinHome || spec.favorite);
  const { update: updateWorkspace } = useWorkspaceMutations();
  const workOrders = workOrdersQuery.data?.data || [];
  const dispatches = dispatchesQuery.data?.data || [];
  const trucks = trucksQuery.data?.data || [];
  const assets = assetsQuery.data?.data || [];
  const tips = tipsQuery.data?.data || [];
  const accounts = accountsQuery.data || [];
  const user = state.currentUser;
  const userKey = user?.id || user?.email || 'anonymous';
  const storedLayout = settingsQuery.data?.dashboardLayouts?.[userKey];
  const savedTemplates = settingsQuery.data?.dashboardTemplates || [];
  const customWidgets = customWidgetsFromSettings(settingsQuery.data);
  const catalog = catalogWithCustomWidgets(customWidgets);
  const customWidgetById = Object.fromEntries(customWidgets.map((item) => [item.id, item]));
  const dashboards = [...ANALYTICS_DASHBOARDS, ...savedTemplates];
  const analyticsDashboard =
    dashboards.find((item) => item.id === activeDashboardId) || dashboards[0];
  const isCustomTemplate = savedTemplates.some((item) => item.id === analyticsDashboard?.id);
  const fallbackLayout = dashboardPresetFor(user);
  const initialLayout = Array.isArray(storedLayout)
    ? storedLayout.filter((id) => catalog.byId[id])
    : fallbackLayout;
  const [layoutState, setLayoutState] = useState({ userKey, ids: initialLayout });
  const homeLayout = layoutState.userKey === userKey ? layoutState.ids : initialLayout;
  const layout = isAnalytics ? analyticsDashboard?.widgets || [] : homeLayout;
  const [draggedId, setDraggedId] = useState(null);

  useEffect(() => {
    setLayoutState({ userKey, ids: initialLayout });
  }, [userKey, JSON.stringify(storedLayout)]);

  const persistLayout = async (next) => {
    setLayoutState({ userKey, ids: next });
    try {
      if (isAnalytics && isCustomTemplate) {
        await updateWorkspace.mutateAsync({
          dashboardTemplates: savedTemplates.map((item) =>
            item.id === analyticsDashboard.id ? { ...item, widgets: next } : item
          ),
        });
        return;
      }
      await updateWorkspace.mutateAsync({
        dashboardLayouts: {
          ...(settingsQuery.data?.dashboardLayouts || {}),
          [userKey]: next,
        },
      });
    } catch (error) {
      toast(getErrorMessage(error, 'Unable to save dashboard layout.'), 'danger');
    }
  };

  const openTemplateDrawer = () => {
    setTemplateName('');
    setTemplateDescription('');
    setTemplateSource('');
    setTemplateWidgets(analyticsDashboard?.widgets ? [...analyticsDashboard.widgets] : []);
    setTemplateError('');
    setTemplateOpen(true);
  };

  const applyTemplateSource = (sourceId) => {
    setTemplateSource(sourceId);
    if (!sourceId) return;
    const source = [...ANALYTICS_DASHBOARDS, ...savedTemplates].find((item) => item.id === sourceId);
    if (source?.widgets) setTemplateWidgets([...source.widgets]);
  };

  const saveTemplate = async (event) => {
    event.preventDefault();
    if (!templateName.trim()) {
      setTemplateError('Template name is required.');
      return;
    }
    if (!templateWidgets.length) {
      setTemplateError('Select at least one widget for this template.');
      return;
    }
    setTemplateBusy(true);
    setTemplateError('');
    const template = {
      id: `dash-${Date.now()}`,
      name: templateName.trim(),
      description: templateDescription.trim() || 'Custom dashboard template.',
      widgets: templateWidgets.filter((id) => catalog.byId[id]),
    };
    try {
      await updateWorkspace.mutateAsync({
        dashboardTemplates: [...savedTemplates, template],
      });
      setActiveDashboardId(template.id);
      setTemplateOpen(false);
      toast('Dashboard template created');
    } catch (error) {
      setTemplateError(getErrorMessage(error, 'Unable to save dashboard template.'));
    } finally {
      setTemplateBusy(false);
    }
  };

  const handleRemoveWidget = async (widgetId) => {
    if (customWidgetById[widgetId]) {
      const next = removeCustomWidget(settingsQuery.data || {}, widgetId, userKey);
      setLayoutState({
        userKey,
        ids: Array.isArray(next.dashboardLayouts?.[userKey])
          ? next.dashboardLayouts[userKey]
          : layout.filter((id) => id !== widgetId),
      });
      try {
        await updateWorkspace.mutateAsync(next);
        toast('Widget deleted');
      } catch (error) {
        toast(getErrorMessage(error, 'Unable to delete widget.'), 'danger');
      }
      return;
    }
    persistLayout(layout.filter((item) => item !== widgetId));
  };

  const deleteTemplate = async () => {
    if (!isCustomTemplate) return;
    try {
      await updateWorkspace.mutateAsync({
        dashboardTemplates: savedTemplates.filter((item) => item.id !== analyticsDashboard.id),
      });
      setActiveDashboardId(ANALYTICS_DASHBOARDS[0].id);
      toast('Dashboard template deleted');
    } catch (error) {
      toast(getErrorMessage(error, 'Unable to delete dashboard template.'), 'danger');
    }
  };

  const moveWidget = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= layout.length) return;
    const next = [...layout];
    [next[index], next[target]] = [next[target], next[index]];
    persistLayout(next);
  };

  const dropWidget = (event, targetId) => {
    event?.preventDefault?.();
    if (!draggedId || draggedId === targetId) return;
    const next = layout.filter((id) => id !== draggedId);
    const insertAt = next.indexOf(targetId);
    if (insertAt < 0) return;
    next.splice(insertAt, 0, draggedId);
    setDraggedId(null);
    persistLayout(next);
  };

  const openWorkOrders = workOrders.filter(isOpenWorkOrder);
  const activeDispatches = dispatches.filter((row) =>
    ['In Route', 'In Progress', 'Scheduled'].includes(row.status)
  );
  const activeTrucks = trucks.filter((row) => row.status === 'Active');
  const now = new Date();
  const todayKey = localDateKey(now);
  const todayTons = tips
    .filter((row) => row.date === todayKey)
    .reduce((sum, row) => sum + Number(row.tons || 0), 0);
  const ownerValues = [user?.id, user?.alias, user?.name, user?.email].filter(Boolean);
  const myWorkOrders = workOrders.filter(
    (row) => ownerValues.includes(row.owner) || (user?.customerId && row.customerId === user.customerId)
  );
  const priorityWorkOrders = [...openWorkOrders]
    .sort((a, b) => {
      const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return (rank[a.priority] ?? 4) - (rank[b.priority] ?? 4);
    })
    .slice(0, 5);
  const agingRows = [...openWorkOrders
    .filter((row) => row.hotTicket || ['Critical', 'High'].includes(row.priority))
    .reduce((groups, row) => {
      const openedAt = parseRecordDate(row.requestDate || row.createdAt || row.dueDate);
      if (!openedAt) return groups;
      const hours = Math.max(0, (now.getTime() - openedAt.getTime()) / 36e5);
      const bucket = hours < 24 ? 0 : hours < 48 ? 1 : hours < 72 ? 2 : 3;
      const name = row.account || 'Unassigned account';
      const buckets = groups.get(name) || [0, 0, 0, 0];
      buckets[bucket] += 1;
      groups.set(name, buckets);
      return groups;
    }, new Map()).entries()].map(([name, buckets]) => ({
      name,
      buckets,
      total: buckets.reduce((sum, value) => sum + value, 0),
    }));
  const trendStart = new Date(now);
  trendStart.setHours(0, 0, 0, 0);
  trendStart.setDate(trendStart.getDate() - 29);
  const missedPickups = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(trendStart);
    date.setDate(trendStart.getDate() + index);
    return { day: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), dateKey: localDateKey(date), count: 0 };
  });
  workOrders.forEach((row) => {
    if (!/missed pickup/i.test(`${row.requestType || ''} ${row.subject || ''}`)) return;
    const date = parseRecordDate(row.requestDate || row.createdAt || row.dueDate);
    const point = date && missedPickups.find((item) => item.dateKey === localDateKey(date));
    if (point) point.count += 1;
  });
  const tipHistory = [...tips.reduce((groups, row) => {
    if (!row.date) return groups;
    groups.set(row.date, (groups.get(row.date) || 0) + Number(row.tons || 0));
    return groups;
  }, new Map()).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, tons]) => ({
      date: new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      tons,
    }));
  const slaRows = [...workOrders.reduce((groups, row) => {
    if (!row.account || !row.dueDate || !row.completionDate || !['Closed', 'Complete'].includes(row.status)) return groups;
    const due = parseRecordDate(row.dueDate);
    const completed = parseRecordDate(row.completionDate);
    if (!due || !completed) return groups;
    const current = groups.get(row.account) || { total: 0, met: 0 };
    current.total += 1;
    if (completed <= due) current.met += 1;
    groups.set(row.account, current);
    return groups;
  }, new Map()).entries()].map(([name, value]) => ({
    name,
    value: Math.round((value.met / value.total) * 100),
    detail: `${value.met}/${value.total} completed by due date`,
  }));
  const woOpenedClosed = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (13 - index));
    return {
      dateKey: localDateKey(date),
      day: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      opened: 0,
      closed: 0,
    };
  });
  workOrders.forEach((row) => {
    const opened = parseRecordDate(row.requestDate || row.createdAt);
    const openedPoint = opened && woOpenedClosed.find((item) => item.dateKey === localDateKey(opened));
    if (openedPoint) openedPoint.opened += 1;
    if (!['Closed', 'Complete'].includes(row.status)) return;
    const closed = parseRecordDate(row.completionDate || row.closedDate);
    const closedPoint = closed && woOpenedClosed.find((item) => item.dateKey === localDateKey(closed));
    if (closedPoint) closedPoint.closed += 1;
  });
  const assetsByFamily = [...assets.reduce((groups, row) => {
    const name = row.family || row.product || 'Unclassified';
    groups.set(name, (groups.get(name) || 0) + 1);
    return groups;
  }, new Map()).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));
  const providersByIndustry = [...accounts.reduce((groups, row) => {
    const name = row.industry || 'Other';
    groups.set(name, (groups.get(name) || 0) + 1);
    return groups;
  }, new Map()).entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
  const truckByStatus = [...trucks.reduce((groups, row) => {
    const name = row.status || 'Unknown';
    groups.set(name, (groups.get(name) || 0) + 1);
    return groups;
  }, new Map()).entries()].map(([name, count]) => ({ name, count }));
  const completedDispatches = dispatches.filter((row) => row.status === 'Complete').length;
  const completedWorkOrders = workOrders.filter((row) => ['Closed', 'Complete'].includes(row.status)).length;
  const readiness = [
    { label: 'Provider records', count: accounts.length },
    { label: 'Work order records', count: workOrders.length },
    { label: 'Dispatch records', count: dispatches.length },
    { label: 'Fleet records', count: trucks.length },
    { label: 'Tip records', count: tips.length },
  ];

  const renderWidget = (id) => {
    const custom = customWidgetById[id];
    if (custom) {
      return (
        <div>
          {custom.description ? <p className="mb-3 text-xs text-ink-muted">{custom.description}</p> : null}
          {custom.kind === 'chart' && custom.chart ? <PlaybookChart chart={custom.chart} /> : null}
          {custom.kind === 'table' && custom.table ? <PlaybookTable table={custom.table} /> : null}
        </div>
      );
    }
    if (id === 'kpi-tiles') {
      return <StatStrip compact items={[
        { label: 'Active dispatches', value: activeDispatches.length, hint: 'In route or in progress' },
        { label: 'Open work orders', value: openWorkOrders.length, hint: 'Awaiting completion' },
        { label: 'Trucks in field', value: activeTrucks.length, hint: `of ${trucks.length} tracked` },
        { label: 'Tons collected today', value: todayTons.toFixed(1), hint: todayKey },
      ]} />;
    }
    if (id === 'hot-ticket-aging') {
      return <div className="space-y-4">{agingRows.length ? agingRows.map((row) => (
        <div key={row.name}>
          <div className="mb-1.5 flex justify-between gap-2 text-xs"><span className="min-w-0 truncate">{row.name}</span><span className="mono shrink-0">{row.total}</span></div>
          <div className="flex h-3 overflow-hidden bg-elevated">{row.buckets.map((value, index) => value ? (
            <span key={index} style={{ width: `${value / row.total * 100}%`, background: AGING_COLORS[index] }} />
          ) : null)}</div>
        </div>
      )) : <p className="py-6 text-center text-sm text-ink-muted">No hot tickets with aging data.</p>}</div>;
    }
    if (id === 'ops-health') {
      const fleetRate = trucks.length ? Math.round(activeTrucks.length / trucks.length * 100) : 0;
      const dispatchRate = dispatches.length ? Math.round(completedDispatches / dispatches.length * 100) : 0;
      const resolutionRate = workOrders.length ? Math.round(completedWorkOrders / workOrders.length * 100) : 0;
      return <div className="space-y-5">
        <OpsBar label="Fleet utilization" value={fleetRate} target={`${activeTrucks.length}/${trucks.length} active`} />
        <OpsBar label="Dispatch completion" value={dispatchRate} target={`${completedDispatches}/${dispatches.length} complete`} />
        <OpsBar label="WO resolution" value={resolutionRate} target={`${completedWorkOrders}/${workOrders.length} resolved`} />
      </div>;
    }
    if (id === 'missed-pickups') {
      return <div className="h-44"><ResponsiveContainer width="100%" height="100%"><LineChart data={missedPickups}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6ebe8" /><XAxis dataKey="day" tick={{ fontSize: 9 }} interval={6} />
        <YAxis tick={{ fontSize: 9 }} /><Tooltip /><Line type="monotone" dataKey="count" stroke="#b42318" dot={false} />
      </LineChart></ResponsiveContainer></div>;
    }
    if (id === 'sla-by-account') {
      return slaRows.length ? <div className="space-y-3">{slaRows.map((row) => (
        <div key={row.name}><div className="flex justify-between text-xs"><span>{row.name}</span><span className="mono font-semibold">{row.value}%</span></div>
          <div className="mt-1 h-2 bg-elevated"><div className="h-2 bg-brand" style={{ width: `${row.value}%` }} /></div>
          <p className="mt-1 text-[11px] text-ink-faint">{row.detail}</p></div>
      ))}</div> : <p className="py-6 text-center text-sm text-ink-muted">No completed work orders include both due and completion dates.</p>;
    }
    if (id === 'tip-history') {
      return tipHistory.length ? <div className="h-44"><ResponsiveContainer width="100%" height="100%"><LineChart data={tipHistory}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6ebe8" /><XAxis dataKey="date" tick={{ fontSize: 9 }} />
        <YAxis tick={{ fontSize: 9 }} /><Tooltip /><Line type="monotone" dataKey="tons" stroke="#0b5f49" dot={false} />
      </LineChart></ResponsiveContainer></div> : <p className="py-6 text-center text-sm text-ink-muted">No tip history yet.</p>;
    }
    if (id === 'setup-checklist') {
      return <ul className="divide-y divide-line border-y border-line">{readiness.map((item) => (
        <li key={item.label} className="flex items-center justify-between py-2.5 text-sm"><span>{item.label}</span>
          <span className="flex items-center gap-2 text-ink-muted">{item.count}<Icon name={item.count ? 'checkCircle' : 'alert'} size={14} /></span></li>
      ))}</ul>;
    }
    if (id === 'trucks-in-field') {
      return <><p className="font-display text-3xl font-semibold text-ink">{activeTrucks.length}</p><p className="mt-1 text-xs text-ink-muted">Active of {trucks.length} tracked trucks</p></>;
    }
    if (id === 'tons-collected-today') {
      return <><p className="font-display text-3xl font-semibold text-ink">{todayTons.toFixed(1)}</p><p className="mt-1 text-xs text-ink-muted">Tons recorded for {todayKey}</p></>;
    }
    if (id === 'open-work-orders') {
      return <><p className="font-display text-3xl font-semibold text-ink">{openWorkOrders.length}</p><Button variant="ghost" onClick={() => navigate('workOrders')} className="mt-3">Open queue</Button></>;
    }
    if (id === 'truck-utilization') {
      const rate = trucks.length ? Math.round(activeTrucks.length / trucks.length * 100) : 0;
      return <div className="space-y-4">
        <OpsBar label="Active trucks" value={rate} target={`${activeTrucks.length}/${trucks.length} in field`} />
        {truckByStatus.map((row) => (
          <div key={row.name} className="flex justify-between text-xs">
            <span>{row.name}</span>
            <span className="mono font-semibold">{row.count}</span>
          </div>
        ))}
      </div>;
    }
    if (id === 'wo-opened-closed') {
      return <div className="h-44"><ResponsiveContainer width="100%" height="100%"><LineChart data={woOpenedClosed}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6ebe8" /><XAxis dataKey="day" tick={{ fontSize: 9 }} interval={3} />
        <YAxis allowDecimals={false} tick={{ fontSize: 9 }} /><Tooltip />
        <Line type="monotone" dataKey="opened" stroke="#0b5f49" dot={false} name="Opened" />
        <Line type="monotone" dataKey="closed" stroke="#8b969f" dot={false} name="Closed" />
      </LineChart></ResponsiveContainer></div>;
    }
    if (id === 'assets-by-family') {
      const max = assetsByFamily[0]?.count || 1;
      return assetsByFamily.length ? <div className="space-y-3">{assetsByFamily.map((row) => (
        <div key={row.name}><div className="flex justify-between text-xs"><span className="truncate">{row.name}</span><span className="mono font-semibold">{row.count}</span></div>
          <div className="mt-1 h-2 bg-elevated"><div className="h-2 bg-brand" style={{ width: `${(row.count / max) * 100}%` }} /></div></div>
      ))}</div> : <p className="py-6 text-center text-sm text-ink-muted">No assets to group.</p>;
    }
    if (id === 'providers-by-industry') {
      const max = providersByIndustry[0]?.count || 1;
      return providersByIndustry.length ? <div className="space-y-3">{providersByIndustry.map((row) => (
        <div key={row.name}><div className="flex justify-between text-xs"><span>{row.name}</span><span className="mono font-semibold">{row.count}</span></div>
          <div className="mt-1 h-2 bg-elevated"><div className="h-2 bg-ink" style={{ width: `${(row.count / max) * 100}%` }} /></div></div>
      ))}</div> : <p className="py-6 text-center text-sm text-ink-muted">No providers to group.</p>;
    }
    const isMyWork = id === 'my-work-orders';
    const isDispatch = id === 'live-dispatches' || id === 'active-dispatches';
    const rows = isDispatch ? activeDispatches.slice(0, 5) : isMyWork ? myWorkOrders.slice(0, 5) : priorityWorkOrders;
    return <RecordList rows={rows} empty={isDispatch ? 'No active dispatches.' : 'No matching work orders.'} render={(row) => (
      <li key={row.id || row.number} className="py-3">
        <button
          type="button"
          className="w-full text-left interactive"
          onClick={() => navigate(isDispatch ? 'dispatches' : 'workOrders', { recordId: row.id })}
        >
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium">{row.subject || row.dispatchNumber || row.number || row.id}</span>
            <Badge color={isDispatch ? 'cyan' : 'amber'}>{row.caseStatus || row.status || row.priority}</Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-muted">
            {row.account || 'Unassigned'}
            {row.owner ? ` · ${row.owner}` : ''}
            {isDispatch && row.progress != null ? ` · ${row.progress}%` : ''}
          </p>
        </button>
      </li>
    )} />;
  };

  const first = user?.firstName || 'there';
  const available = catalog.widgets.filter((widget) => !layout.includes(widget.id));
  const loading = workOrdersQuery.isLoading || dispatchesQuery.isLoading || trucksQuery.isLoading || assetsQuery.isLoading || tipsQuery.isLoading || accountsQuery.isLoading || settingsQuery.isLoading;

  return (
    <Page wide>
      <PageHeader
        overline={
          isAnalytics
            ? 'Analytics'
            : user?.segmentIds?.length
              ? `Home — SP Segment Admin View · ${now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
              : `Home · ${now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
        }
        title={isAnalytics ? 'Dashboards' : `${greetingFor(now)}, ${first}.`}
        description={
          isAnalytics
            ? analyticsDashboard?.description
            : user?.segmentIds?.length
              ? `${openWorkOrders.length} open work orders · ${activeDispatches.length} active dispatches · scoped to ${user.scopeLabel || 'assigned segments'}`
              : `${openWorkOrders.length} open work orders · ${activeDispatches.length} active dispatches`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isAnalytics && (
              <Button variant="primary" onClick={openTemplateDrawer}>
                <Icon name="plus" size={16} /> New dashboard
              </Button>
            )}
            {isAnalytics && isCustomTemplate && (
              <Button variant="secondary" onClick={deleteTemplate}>
                Delete template
              </Button>
            )}
            {!isAnalytics && (
              <Button variant="secondary" onClick={() => persistLayout(fallbackLayout)}>
                Reset layout
              </Button>
            )}
            {(!isAnalytics || isCustomTemplate) && available.length ? (
              <Select
                value=""
                placeholder="Add widget…"
                aria-label="Add dashboard widget"
                options={available.map((widget) => ({ value: widget.id, label: widget.title }))}
                onChange={(event) => event.target.value && persistLayout([...layout, event.target.value])}
              />
            ) : null}
          </div>
        }
      />
      {!isAnalytics && pinnedReports.length > 0 && (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {pinnedReports.slice(0, 8).map((spec) => (
            <button
              key={spec.id}
              type="button"
              onClick={() => navigate('reports', { reportId: spec.id })}
              className="rounded-2xl border border-line bg-surface px-4 py-3 text-left hover:border-line-strong hover:bg-elevated"
            >
              <p className="type-overline">Pinned report</p>
              <p className="mt-1 text-sm font-semibold text-ink">{spec.name}</p>
              <p className="mt-1 text-[12px] text-ink-muted">{spec.lastRun || spec.desc || 'Open in Reports'}</p>
            </button>
          ))}
        </div>
      )}
      {isAnalytics && (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {dashboards.map((item) => {
            const active = item.id === analyticsDashboard.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveDashboardId(item.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                  active
                    ? 'border-brand bg-brand-soft shadow-hairline'
                    : 'border-line bg-surface hover:border-line-strong hover:bg-elevated'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon name="grid" size={15} className={active ? 'text-brand' : 'text-ink-faint'} />
                  <span className={`text-sm font-semibold ${active ? 'text-brand' : 'text-ink'}`}>
                    {item.name}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-snug text-ink-muted">{item.description}</p>
                {savedTemplates.some((template) => template.id === item.id) && (
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                    Template
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
      <AsyncState loading={loading} error={workOrdersQuery.isError ? getErrorMessage(workOrdersQuery.error) : null} onRetry={() => {
        workOrdersQuery.refetch(); dispatchesQuery.refetch(); trucksQuery.refetch(); assetsQuery.refetch(); tipsQuery.refetch(); accountsQuery.refetch(); settingsQuery.refetch();
      }}>
        {layout.length ? (
          <div className={`${isAnalytics ? '' : 'mt-6 '}grid grid-cols-1 gap-6 lg:grid-cols-12`}>
            {layout.map((id, index) => {
              const widget = catalog.byId[id];
              if (!widget) return null;
              if (isAnalytics && !isCustomTemplate) {
                return (
                  <Panel key={id} className={{ 4: 'lg:col-span-4', 6: 'lg:col-span-6', 8: 'lg:col-span-8', 12: 'lg:col-span-12' }[widget.span] || 'lg:col-span-4'} padded>
                    <p className="type-overline">{widget.category}</p>
                    <h2 className="mt-1 mb-4 font-display text-title-sm text-ink">{widget.title}</h2>
                    {renderWidget(id)}
                  </Panel>
                );
              }
              return <WidgetShell key={id} widget={widget} index={index} count={layout.length} onMove={moveWidget}
                onRemove={handleRemoveWidget}
                onDragStart={(event, widgetId) => { setDraggedId(widgetId); event.dataTransfer.effectAllowed = 'move'; }}
                onDrop={dropWidget}>{renderWidget(id)}</WidgetShell>;
            })}
          </div>
        ) : (
          <Panel padded className="mt-6 text-center"><p className="text-sm text-ink-muted">Add a widget to build your dashboard.</p></Panel>
        )}
      </AsyncState>
      {templateOpen && (
        <FormDrawer
          onClose={() => setTemplateOpen(false)}
          onSubmit={saveTemplate}
          title="New dashboard template"
          description="Name the canvas, pick a starting layout, and choose the widgets this template should include."
          wide
          dirty={!!templateName || !!templateDescription || templateWidgets.length > 0}
          busy={templateBusy}
          error={templateError}
          submitLabel="Create template"
        >
          <FieldSection title="Template">
            <Field label="Dashboard name" required>
              <TextInput
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder="e.g. Night dispatch"
                autoFocus
              />
            </Field>
            <Field label="Start from">
              <Select
                value={templateSource}
                onChange={(event) => applyTemplateSource(event.target.value)}
                options={[
                  { value: '', label: 'Blank / current selection' },
                  ...dashboards.map((item) => ({ value: item.id, label: item.name })),
                ]}
              />
            </Field>
            <Field label="Description" span2>
              <TextInput
                value={templateDescription}
                onChange={(event) => setTemplateDescription(event.target.value)}
                placeholder="What this dashboard is for"
              />
            </Field>
          </FieldSection>
          <FieldSection title="Widgets" className="border-t border-line pt-5">
            <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
              {catalog.widgets.map((widget) => (
                <Checkbox
                  key={widget.id}
                  label={widget.title}
                  checked={templateWidgets.includes(widget.id)}
                  onChange={(event) =>
                    setTemplateWidgets((current) =>
                      event.target.checked
                        ? [...current, widget.id]
                        : current.filter((id) => id !== widget.id)
                    )
                  }
                />
              ))}
            </div>
          </FieldSection>
        </FormDrawer>
      )}
    </Page>
  );
}
