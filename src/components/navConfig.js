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
        { key: 'assets', module: 'assets', label: 'Assets / Trucks', icon: 'box' },
        { key: 'customers', module: 'customers', label: 'Customers', icon: 'user' },
        { key: 'dispatches', module: 'dispatches', label: 'Dispatches', icon: 'send' },
        { key: 'locations', module: 'locations', label: 'Locations', icon: 'mapPin' },
        { key: 'manageAccount', module: 'manageAccount', label: 'Manage Customers', icon: 'users' },
        { key: 'mapCenter', module: 'mapCenter', label: 'Map Center', icon: 'map' },
        { key: 'notes', module: 'notesAttachments', label: 'Notes & Attachments', icon: 'paperclip' },
        { key: 'routes', module: 'routes', label: 'Routes', icon: 'route' },
        {
          key: 'notifications',
          module: 'serviceNotifications',
          label: 'Service Notifications',
          icon: 'bell',
        },
        { key: 'tips', module: 'individualTips', label: 'Tips & Non-Tips', icon: 'layers' },
        { key: 'aggregatedTips', module: 'aggregatedTips', label: 'Aggregated Tips', icon: 'layers' },
        { key: 'workOrders', module: 'workOrders', label: 'Work Orders', icon: 'clipboard' },
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
        {
          key: 'requestTypes',
          module: 'requestTypes',
          label: 'Request Types',
          icon: 'clipboard',
        },
        {
          key: 'resolutionCodes',
          module: 'resolutionCodes',
          label: 'Resolution Codes',
          icon: 'check',
        },
        {
          key: 'reqCodes',
          module: 'reqCodes',
          label: 'Request Type & Resolution Codes',
          icon: 'layers',
        },
        {
          key: 'maintProfiles',
          module: 'maintenanceRouteProfiles',
          label: 'Route Profile Templates',
          icon: 'wrench',
        },
        {
          key: 'serviceNotifConfig',
          module: 'notificationConfig',
          label: 'Service Notification Config',
          icon: 'bell',
        },
        {
          key: 'products',
          module: 'products',
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
        { key: 'trucks', module: 'trucks', label: 'Trucks', icon: 'truck' },
      ],
    },
    { type: 'item', key: 'inbox', module: 'notifications', label: 'Notifications', icon: 'bell' },
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
  assets: 'Assets / Trucks',
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
};

export function filterNavTree(tree, canNav) {
  return tree
    .map((n) => {
      if (n.type === 'item') return canNav(n.key) ? n : null;
      const children = (n.children || []).filter((c) => canNav(c.key));
      if (!children.length) return null;
      return { ...n, children };
    })
    .filter(Boolean);
}

/** Flat list of destinations in a persona tree, tagged with their group label. */
export function flattenNavDestinations(tree) {
  return tree.flatMap((node) =>
    node.type === 'item'
      ? [{ ...node, group: null }]
      : (node.children || []).map((child) => ({ ...child, group: node.label }))
  );
}

export function isNavItemActive(item, activeModule, activeParams = {}) {
  if (item.module !== activeModule) return false;
  if (item.params?.tab) return item.params.tab === activeParams.tab;
  if (item.params?.section) {
    const currentSection = activeParams.section || 'userMgmt';
    return item.params.section === currentSection;
  }
  if (item.params?.view) return item.params.view === activeParams.view;
  if (activeModule === 'home') return item.key === 'home';
  return true;
}
