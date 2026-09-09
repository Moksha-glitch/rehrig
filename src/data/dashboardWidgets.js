export const DASHBOARD_WIDGETS = [
  { id: 'kpi-tiles', title: 'KPI Tiles', category: 'Overview', span: 12 },
  { id: 'hot-ticket-aging', title: 'Hot Ticket Aging', category: 'Operations', span: 8 },
  { id: 'ops-health', title: 'Ops Health', category: 'Fleet', span: 4 },
  { id: 'live-dispatches', title: 'Live Dispatches', category: 'Dispatch', span: 4 },
  { id: 'priority-wos', title: 'Priority Work Orders', category: 'Operations', span: 4 },
  { id: 'setup-checklist', title: 'Setup Checklist', category: 'Configuration', span: 4 },
  { id: 'missed-pickups', title: 'Missed Pickups 30d', category: 'Operations', span: 4 },
  { id: 'sla-by-account', title: 'SLA % by Service Provider', category: 'Compliance', span: 6 },
  { id: 'tip-history', title: 'Tip History', category: 'Collections', span: 6 },
  { id: 'my-work-orders', title: 'My Work Orders', category: 'Operations', span: 4 },
  { id: 'active-dispatches', title: 'Active Dispatches', category: 'Dispatch', span: 4 },
  { id: 'open-work-orders', title: 'Open Work Orders', category: 'Operations', span: 4 },
  { id: 'trucks-in-field', title: 'Trucks in Field', category: 'Fleet', span: 4 },
  { id: 'tons-collected-today', title: 'Tons Collected Today', category: 'Collections', span: 4 },
  { id: 'truck-utilization', title: 'Truck Utilization', category: 'Fleet', span: 6 },
  { id: 'wo-opened-closed', title: 'WO Opened vs Closed', category: 'Operations', span: 6 },
  { id: 'assets-by-family', title: 'Assets by Family', category: 'Assets', span: 4 },
  { id: 'providers-by-industry', title: 'Providers by Industry', category: 'Overview', span: 4 },
];

export const DASHBOARD_WIDGET_BY_ID = Object.fromEntries(
  DASHBOARD_WIDGETS.map((widget) => [widget.id, widget])
);

export const DASHBOARD_ROLE_PRESETS = {
  Default: [
    'kpi-tiles',
    'hot-ticket-aging',
    'ops-health',
    'live-dispatches',
    'priority-wos',
    'missed-pickups',
    'truck-utilization',
    'wo-opened-closed',
  ],
  'Field Tech': ['kpi-tiles', 'my-work-orders', 'live-dispatches', 'priority-wos'],
  Analyst: ['kpi-tiles', 'sla-by-account', 'hot-ticket-aging', 'missed-pickups'],
  Customer: ['kpi-tiles', 'my-work-orders'],
};

export function dashboardPresetFor(user) {
  const role = user?.persona === 'customer' ? 'Customer' : user?.role;
  return [...(DASHBOARD_ROLE_PRESETS[role] || DASHBOARD_ROLE_PRESETS.Default)];
}

export const ANALYTICS_DASHBOARDS = [
  {
    id: 'operations',
    name: 'Operations',
    description: 'Hot tickets, work-order volume, and pickup exceptions.',
    widgets: ['kpi-tiles', 'hot-ticket-aging', 'priority-wos', 'wo-opened-closed', 'missed-pickups'],
  },
  {
    id: 'fleet',
    name: 'Fleet Health',
    description: 'Truck utilization, live dispatches, and field status.',
    widgets: ['kpi-tiles', 'ops-health', 'live-dispatches', 'truck-utilization', 'trucks-in-field'],
  },
  {
    id: 'sla',
    name: 'SLA & Compliance',
    description: 'Service levels by provider and aging queues.',
    widgets: ['sla-by-account', 'hot-ticket-aging', 'missed-pickups', 'wo-opened-closed'],
  },
  {
    id: 'collections',
    name: 'Collections',
    description: 'Tons, tip history, and asset mix.',
    widgets: ['tons-collected-today', 'tip-history', 'missed-pickups', 'assets-by-family'],
  },
];

export const WIDGET_CATEGORIES = [
  'Collections',
  'Operations',
  'Fleet',
  'Dispatch',
  'Compliance',
  'Overview',
  'Assets',
];

export const WIDGET_SPANS = [
  { value: 4, label: 'Small' },
  { value: 6, label: 'Half' },
  { value: 8, label: 'Wide' },
  { value: 12, label: 'Full width' },
];

export function blankCustomWidget(overrides = {}) {
  return {
    id: null,
    title: '',
    description: '',
    category: 'Collections',
    kind: 'table',
    span: 12,
    table: null,
    chart: null,
    placeOn: 'home',
    dashboardName: '',
    source: 'assistant',
    ...overrides,
  };
}

export function validateCustomWidget(draft) {
  if (!String(draft?.title || '').trim()) return 'Widget name is required.';
  if (!draft?.category) return 'Category is required.';
  if (!draft?.kind) return 'Visualization is required.';
  if (!draft?.placeOn) return 'Choose where to place this widget.';
  if (draft.placeOn === 'new' && !String(draft.dashboardName || '').trim()) {
    return 'Dashboard name is required.';
  }
  if (draft.kind === 'table' && !draft.table) return 'This widget needs a table.';
  if (draft.kind === 'chart' && !draft.chart) return 'This widget needs a chart.';
  return '';
}

export function persistableWidget(draft) {
  const kind = draft.kind === 'chart' ? 'chart' : 'table';
  return {
    id: draft.id || `wgt-${Date.now()}`,
    title: String(draft.title || '').trim(),
    description: String(draft.description || '').trim(),
    category: draft.category || 'Collections',
    kind,
    span: Number(draft.span) || 12,
    table: kind === 'table' ? draft.table || null : null,
    chart: kind === 'chart' ? draft.chart || null : null,
    source: draft.source || 'assistant',
    createdAt: draft.createdAt || new Date().toISOString(),
  };
}

export function customWidgetsFromSettings(settings = {}) {
  const saved = Array.isArray(settings.customWidgets) ? settings.customWidgets : [];
  const pins = Array.isArray(settings.assistantPins) ? settings.assistantPins : [];
  const fromPins = pins
    .filter((pin) => !saved.some((widget) => widget.id === pin.id || widget.title === pin.title))
    .map((pin) =>
      persistableWidget({
        id: String(pin.id || '').replace(/^pin-/, 'wgt-') || undefined,
        title: pin.title,
        kind: pin.kind,
        table: pin.table,
        chart: pin.chart,
        category: 'Collections',
        span: 12,
      })
    );
  return [...saved, ...fromPins];
}

export function catalogWithCustomWidgets(customWidgets = []) {
  const custom = customWidgets.map((widget) => ({
    id: widget.id,
    title: widget.title,
    category: widget.category || 'Collections',
    span: Number(widget.span) || 12,
    custom: true,
  }));
  const widgets = [...DASHBOARD_WIDGETS, ...custom];
  return {
    widgets,
    byId: Object.fromEntries(widgets.map((widget) => [widget.id, widget])),
  };
}

function withWidgetId(ids, widgetId) {
  return ids.includes(widgetId) ? ids : [...ids, widgetId];
}

export function placeCustomWidget(settings, widget, { userKey, user } = {}) {
  const customWidgets = [...customWidgetsFromSettings(settings).filter((item) => item.id !== widget.id), widget];
  const dashboardLayouts = { ...(settings.dashboardLayouts || {}) };
  let dashboardTemplates = [...(settings.dashboardTemplates || [])];
  let placedOn = 'Home';

  if (widget.placeOn === 'new') {
    const template = {
      id: `dash-${Date.now()}`,
      name: String(widget.dashboardName || widget.title).trim(),
      description: widget.description || `Dashboard for ${widget.title}.`,
      widgets: [widget.id],
    };
    dashboardTemplates = [...dashboardTemplates, template];
    placedOn = template.name;
  } else if (widget.placeOn && widget.placeOn !== 'home') {
    const existing = dashboardTemplates.find((item) => item.id === widget.placeOn);
    const builtIn = ANALYTICS_DASHBOARDS.find((item) => item.id === widget.placeOn);
    if (existing) {
      dashboardTemplates = dashboardTemplates.map((item) =>
        item.id === widget.placeOn ? { ...item, widgets: withWidgetId(item.widgets || [], widget.id) } : item
      );
      placedOn = existing.name;
    } else if (builtIn) {
      const copyId = `dash-${builtIn.id}-custom`;
      const found = dashboardTemplates.find((item) => item.id === copyId);
      if (found) {
        dashboardTemplates = dashboardTemplates.map((item) =>
          item.id === copyId ? { ...item, widgets: withWidgetId(item.widgets || [], widget.id) } : item
        );
      } else {
        dashboardTemplates = [
          ...dashboardTemplates,
          {
            id: copyId,
            name: `${builtIn.name} (custom)`,
            description: builtIn.description,
            widgets: withWidgetId(builtIn.widgets || [], widget.id),
          },
        ];
      }
      placedOn = `${builtIn.name} (custom)`;
    } else {
      const current = Array.isArray(dashboardLayouts[userKey])
        ? dashboardLayouts[userKey]
        : dashboardPresetFor(user);
      dashboardLayouts[userKey] = withWidgetId(current, widget.id);
    }
  } else {
    const current = Array.isArray(dashboardLayouts[userKey])
      ? dashboardLayouts[userKey]
      : dashboardPresetFor(user);
    dashboardLayouts[userKey] = withWidgetId(current, widget.id);
  }

  return {
    changes: {
      customWidgets: customWidgets.map((item) => {
        const { placeOn: _placeOn, dashboardName: _dashboardName, ...rest } = item;
        return rest;
      }),
      dashboardLayouts,
      dashboardTemplates,
      assistantPins: [],
    },
    placedOn,
  };
}

export function removeCustomWidget(settings, widgetId, userKey) {
  const customWidgets = customWidgetsFromSettings(settings).filter((item) => item.id !== widgetId);
  const dashboardLayouts = { ...(settings.dashboardLayouts || {}) };
  if (userKey && Array.isArray(dashboardLayouts[userKey])) {
    dashboardLayouts[userKey] = dashboardLayouts[userKey].filter((id) => id !== widgetId);
  }
  Object.keys(dashboardLayouts).forEach((key) => {
    if (Array.isArray(dashboardLayouts[key])) {
      dashboardLayouts[key] = dashboardLayouts[key].filter((id) => id !== widgetId);
    }
  });
  const dashboardTemplates = (settings.dashboardTemplates || []).map((item) => ({
    ...item,
    widgets: (item.widgets || []).filter((id) => id !== widgetId),
  }));
  return { customWidgets, dashboardLayouts, dashboardTemplates };
}
