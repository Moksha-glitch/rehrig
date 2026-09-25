/** Shared primary navigation trees by persona (left sidebar).
 *  Items and labels follow Vision V1.3 BA HTML. Folder chrome follows Figma.
 */

export const NAV = {
  rehrig: [
    { type: 'item', key: 'home', module: 'home', label: 'Home', icon: 'home' },
    {
      type: 'section',
      label: 'ACTIVITIES',
      icon: 'clipboard',
      children: [
        { key: 'accounts', module: 'accounts', label: 'Accounts', icon: 'building' },
        { key: 'contacts', module: 'contacts', label: 'Contacts', icon: 'user' },
        { key: 'customers', module: 'customers', label: 'Customers', icon: 'users' },
        {
          key: 'products',
          module: 'account',
          params: { tab: 'products' },
          label: 'Service Provider Products',
          icon: 'package',
        },
        {
          key: 'segments',
          module: 'account',
          params: { tab: 'segments' },
          label: 'Service Provider Segments',
          icon: 'layers',
        },
        { key: 'routes', module: 'account', params: { tab: 'routes' }, label: 'Routes', icon: 'route' },
        {
          key: 'notifications',
          module: 'account',
          params: { tab: 'notifications' },
          label: 'Service Notifications',
          icon: 'bell',
        },
      ],
    },
    {
      type: 'section',
      label: 'ANALYTICS',
      icon: 'barChart',
      children: [
        { key: 'chatter', module: 'activity', label: 'Activity', icon: 'activity' },
        { key: 'dashboards', module: 'dashboards', label: 'Dashboards', icon: 'grid' },
        { key: 'reports', module: 'reports', label: 'Reports', icon: 'barChart' },
        { key: 'reportSubscriptions', module: 'reportSubscriptions', label: 'Report Subscriptions', icon: 'mail' },
      ],
    },
    {
      type: 'section',
      label: 'CONFIGURATION',
      icon: 'settings',
      children: [
        {
          key: 'profileMgmtNav',
          module: 'setup',
          params: { section: 'profileMgmt' },
          label: 'Profile Management',
          icon: 'user',
        },
        {
          key: 'userMgmtNav',
          module: 'setup',
          params: { section: 'userMgmt' },
          label: 'User Management',
          icon: 'users',
        },
        { key: 'masterProducts', module: 'masterProducts', label: 'Master Product Catalog', icon: 'package' },
        { key: 'productTypes', module: 'productTypes', label: 'Product', icon: 'package' },
        { key: 'device', module: 'device', label: 'Device', icon: 'smartphone' },
        { key: 'truck', module: 'truck', label: 'Truck', icon: 'truck' },
        { key: 'tagScheme', module: 'tagScheme', label: 'Tag Scheme', icon: 'layers' },
        { key: 'apiIntegrations', module: 'apiIntegrations', label: 'API Integrations', icon: 'network' },
      ],
    },
    { type: 'item', key: 'inbox', module: 'notifications', label: 'Notifications', icon: 'bell' },
  ],
  sp: [
    { type: 'item', key: 'home', module: 'home', label: 'Home', icon: 'home' },
    {
      type: 'section',
      label: 'ACTIVITIES',
      icon: 'clipboard',
      children: [
        { key: 'assets', module: 'assets', label: 'Assets', icon: 'box', countKind: 'assets' },
        { key: 'dispatches', module: 'dispatches', label: 'Dispatches', icon: 'send', countKind: 'dispatches' },
        { key: 'locations', module: 'locations', label: 'Locations', icon: 'mapPin', countKind: 'locations' },
        { key: 'manageAccount', module: 'manageAccount', label: 'Manage Customers', icon: 'users', countKind: 'customers' },
        { key: 'routes', module: 'routes', label: 'Routes', icon: 'route', countKind: 'routes' },
        {
          key: 'notifications',
          module: 'serviceNotifications',
          label: 'Service Notifications',
          icon: 'bell',
          countKind: 'serviceNotifications',
        },
        { key: 'support', module: 'support', label: 'Support', icon: 'help' },
        { key: 'tips', module: 'individualTips', label: 'Tips & Non-Tips', icon: 'layers', countKind: 'individualTips' },
        { key: 'workOrders', module: 'workOrders', label: 'Work Orders', icon: 'clipboard', countKind: 'workOrders' },
        { key: 'mapCenter', module: 'mapCenter', label: 'Map Center', icon: 'map' },
        { key: 'mindmap', module: 'mindmap', label: 'Mindmap', icon: 'layers' },
        { key: 'notesAttachments', module: 'notesAttachments', label: 'Notes & Attachments', icon: 'clipboard', countKind: 'notesAttachments' },
      ],
    },
    {
      type: 'section',
      label: 'ANALYTICS',
      icon: 'barChart',
      children: [
        { key: 'chatter', module: 'activity', label: 'Activity', icon: 'activity' },
        { key: 'dashboards', module: 'dashboards', label: 'Dashboards', icon: 'grid' },
        {
          key: 'reports',
          module: 'reports',
          label: 'Reports',
          icon: 'barChart',
          children: [
            { key: 'reports-workOrders', module: 'reports', params: { reportCategory: 'workOrders' }, label: 'Work Orders', icon: 'clipboard' },
            { key: 'reports-routes', module: 'reports', params: { reportCategory: 'routes' }, label: 'Routes', icon: 'route' },
            { key: 'reports-dispatches', module: 'reports', params: { reportCategory: 'dispatches' }, label: 'Dispatches', icon: 'send' },
            { key: 'reports-assets', module: 'reports', params: { reportCategory: 'assets' }, label: 'Assets', icon: 'box' },
            { key: 'reports-trucks', module: 'reports', params: { reportCategory: 'trucks' }, label: 'Trucks', icon: 'truck' },
            { key: 'reports-segments', module: 'reports', params: { reportCategory: 'segments' }, label: 'Segments', icon: 'layers' },
          ],
        },
      ],
    },
    {
      type: 'section',
      label: 'CONFIGURATION',
      icon: 'settings',
      children: [
        {
          key: 'profileMgmtNav',
          module: 'setup',
          params: { section: 'profileMgmt' },
          label: 'Profile Management',
          icon: 'user',
        },
        {
          key: 'userMgmtNav',
          module: 'setup',
          params: { section: 'userMgmt' },
          label: 'User Management',
          icon: 'users',
        },
        {
          key: 'requestTypes',
          module: 'requestTypes',
          label: 'Request Types',
          icon: 'clipboard',
          countKind: 'requestTypes',
        },
        {
          key: 'resolutionCodes',
          module: 'resolutionCodes',
          label: 'Resolution Codes',
          icon: 'check',
          countKind: 'resolutionCodes',
        },
        {
          key: 'reqCodes',
          module: 'reqCodes',
          label: 'Request Type & Resolution Codes',
          icon: 'layers',
          countKind: 'reqCodes',
        },
        {
          key: 'serviceNotifConfig',
          module: 'notificationConfig',
          label: 'Service Notification Config',
          icon: 'bell',
        },
        {
          key: 'segments',
          module: 'segments',
          label: 'Service Provider Segments',
          icon: 'layers',
          countKind: 'segments',
        },
        { key: 'trucks', module: 'trucks', label: 'Trucks', icon: 'truck', countKind: 'trucks' },
        { key: 'picklists', module: 'picklists', label: 'Picklist Management', icon: 'sliders' },
        {
          key: 'maintenanceRouteProfiles',
          module: 'maintenanceRouteProfiles',
          label: 'Route Profile Templates',
          icon: 'route',
          countKind: 'maintenanceRouteProfiles',
        },
      ],
    },
  ],
  customer: [
    { type: 'item', key: 'home', module: 'home', label: 'Home', icon: 'home' },
    {
      type: 'section',
      label: 'ACTIVITIES',
      icon: 'clipboard',
      children: [
        { key: 'myAccount', module: 'myAccount', label: 'My Account', icon: 'building' },
        { key: 'myLocations', module: 'myLocations', label: 'My Locations', icon: 'mapPin' },
        { key: 'myWorkOrders', module: 'myWorkOrders', label: 'My Work Orders', icon: 'clipboard' },
        { key: 'myNotifications', module: 'myNotifications', label: 'Notifications', icon: 'bell' },
      ],
    },
  ],
};

export const MODULE_LABELS = {
  assistant: 'Vision AI',
  home: 'Home',
  accounts: 'Accounts',
  accountDetail: 'Service Provider',
  account: 'Service Provider',
  contacts: 'Contacts',
  customers: 'Customers',
  productTypes: 'Product',
  device: 'Device',
  truck: 'Truck',
  tagScheme: 'Tag Scheme',
  apiIntegrations: 'API Integrations',
  notificationConfig: 'Service Notification Config',
  setup: 'Workspace',
  workOrders: 'Work Orders',
  dispatches: 'Dispatches',
  assets: 'Assets',
  trucks: 'Trucks',
  locations: 'Locations',
  maintenanceRouteProfiles: 'Route Profile Templates',
  notesAttachments: 'Notes & Attachments',
  requestTypeResolutions: 'Request Type & Resolution Codes',
  requestTypes: 'Request Types',
  resolutionCodes: 'Resolution Codes',
  reqCodes: 'Request Type & Resolution Codes',
  individualTips: 'Tips & Non-Tips',
  aggregatedTips: 'Aggregated Tips',
  mapCenter: 'Map Center',
  manageAccount: 'Manage Customers',
  support: 'Support',
  picklists: 'Picklist Management',
  routes: 'Routes',
  serviceNotifications: 'Service Notifications',
  products: 'Service Provider Products',
  masterProducts: 'Master Product Catalog',
  reportSubscriptions: 'Report Subscriptions',
  bulkImport: 'WOIT Import',
  activity: 'Activity',
  chatter: 'Activity',
  analytics: 'Analytics',
  dashboards: 'Dashboards',
  reports: 'Reports',
  notifications: 'Notifications',
  myLocations: 'My Locations',
  myWorkOrders: 'My Work Orders',
  myNotifications: 'Notifications',
  myAccount: 'My Account',
  userAccount: 'Your Account',
  mindmap: 'Mindmap',
};

function filterNavItem(item, canNav, parentAllowed = false) {
  const allowed = canNav(item.key) || parentAllowed;
  if (!allowed && !(item.children || []).length) return null;
  if (!item.children?.length) return allowed ? item : null;
  const children = item.children
    .map((child) => filterNavItem(child, canNav, allowed || canNav(item.key)))
    .filter(Boolean);
  if (!allowed && !children.length) return null;
  return { ...item, children };
}

export function filterNavTree(tree, canNav) {
  return tree
    .map((n) => {
      if (n.type === 'item') return filterNavItem(n, canNav);
      const children = (n.children || []).map((c) => filterNavItem(c, canNav)).filter(Boolean);
      if (!children.length) return null;
      return { ...n, children };
    })
    .filter(Boolean);
}

/** Flat list of destinations in a persona tree, tagged with their group label. */
export function flattenNavDestinations(tree) {
  return tree.flatMap((node) => {
    if (node.type === 'item') return [{ ...node, group: null }];
    return (node.children || []).flatMap((child) => [
      { ...child, group: node.label },
      ...((child.children || []).map((nested) => ({ ...nested, group: child.label }))),
    ]);
  });
}

export function isNavItemActive(item, activeModule, activeParams = {}) {
  if (item.module !== activeModule) return false;
  if (item.params?.reportCategory) return activeParams.reportCategory === item.params.reportCategory;
  if (item.params?.tab) return item.params.tab === activeParams.tab;
  if (item.params?.section) {
    const currentSection = activeParams.section || 'profileMgmt';
    return item.params.section === currentSection;
  }
  if (item.params?.view) return item.params.view === activeParams.view;
  if (activeModule === 'home') return item.key === 'home';
  return true;
}

function titleCaseSection(label) {
  return String(label || '')
    .toLowerCase()
    .replace(/^\w/, (char) => char.toUpperCase());
}

export const ACCOUNT_TAB_LABELS = {
  details: 'Details',
  contacts: 'Contacts',
  customers: 'Customers',
  products: 'Service Provider Products',
  segments: 'Service Provider Segments',
  routes: 'Routes',
  notifications: 'Service Notifications',
};

export const SETUP_SECTION_LABELS = {
  profileMgmt: 'Profile Management',
  userMgmt: 'User Management',
};

export const REPORT_CATEGORY_LABELS = {
  workOrders: 'Work Orders',
  routes: 'Routes',
  dispatches: 'Dispatches',
  assets: 'Assets',
  trucks: 'Trucks',
  segments: 'Segments',
};

function crumb(label, module = null, params = {}) {
  return { label, module, params };
}

function findNavMatch(tree, module, params) {
  for (const node of tree) {
    if (node.type === 'item' && isNavItemActive(node, module, params)) {
      return { section: null, item: node, nested: null };
    }
    if (node.type !== 'section') continue;
    for (const child of node.children || []) {
      const nested = (child.children || []).find((entry) => isNavItemActive(entry, module, params));
      if (nested) return { section: node, item: child, nested };
    }
    const child = (node.children || []).find((entry) => {
      if (entry.children?.length) return false;
      return isNavItemActive(entry, module, params);
    });
    if (child) return { section: node, item: child, nested: null };
    const folder = (node.children || []).find(
      (entry) => entry.module === module && entry.children?.length
    );
    if (folder) return { section: node, item: folder, nested: null };
  }
  return null;
}

export function buildBreadcrumbs(tree, module, params = {}, extras = {}) {
  const crumbs = [crumb('Home', 'home')];
  if (!module || module === 'home') return crumbs;

  const match = findNavMatch(tree, module, params);
  if (match) {
    if (match.section) crumbs.push(crumb(titleCaseSection(match.section.label)));
    if (match.item) {
      crumbs.push(crumb(match.item.label, match.item.module, match.item.params || {}));
    }
    if (match.nested) {
      crumbs.push(crumb(match.nested.label, match.nested.module, match.nested.params || {}));
    }
  } else {
    crumbs.push(crumb(MODULE_LABELS[module] || extras.fallbackLabel || module, module, params));
  }

  if ((module === 'account' || module === 'accountDetail') && extras.accountName) {
    const last = crumbs[crumbs.length - 1];
    if (last?.label !== extras.accountName) {
      crumbs.push(crumb(extras.accountName, module, { ...params, tab: params.tab || 'details' }));
    }
  }
  if ((module === 'account' || module === 'accountDetail') && params.tab && params.tab !== 'details') {
    const tabLabel = ACCOUNT_TAB_LABELS[params.tab] || params.tab;
    if (crumbs[crumbs.length - 1]?.label !== tabLabel) {
      crumbs.push(crumb(tabLabel, module, { ...params, tab: params.tab }));
    }
  }
  if (module === 'setup' && params.section && SETUP_SECTION_LABELS[params.section]) {
    const sectionLabel = SETUP_SECTION_LABELS[params.section];
    if (crumbs[crumbs.length - 1]?.label !== sectionLabel) {
      crumbs.push(crumb(sectionLabel, 'setup', { section: params.section }));
    }
  }
  if (module === 'reports' && params.reportCategory && REPORT_CATEGORY_LABELS[params.reportCategory]) {
    const categoryLabel = REPORT_CATEGORY_LABELS[params.reportCategory];
    if (crumbs[crumbs.length - 1]?.label !== categoryLabel) {
      crumbs.push(crumb(categoryLabel, 'reports', { reportCategory: params.reportCategory }));
    }
  }
  if (params.recordId && extras.recordLabel) {
    crumbs.push(crumb(extras.recordLabel, module, params));
  }

  return crumbs.filter((entry, index, list) => index === 0 || entry.label !== list[index - 1].label);
}
