/**
 * RBAC model (Spec Ch.1, Ch.4, Ch.5).
 *
 * Access is persona × role:
 *   - Persona picks the nav tree (rehrig | sp | customer)
 *   - Role / PSG filters which items inside that tree are visible and routable
 */

// Permission Set Group labels shown in the UI
export const ROLE_PSG = {
  'rehrig:Admin': 'Rehrig Admin PSG',
  'sp:Admin': 'SP Admin PSG',
  'sp:Ops Manager': 'SP Back-Office PSG',
  'sp:Field Tech': 'SP Field Tech PSG',
  'sp:Dispatcher': 'SP Dispatcher PSG',
  'sp:Analyst': 'SP Analyst (read-only)',
  'sp:Maintenance Admin': 'SP Maintenance Admin PSG',
  'customer:Portal User': 'Customer Portal',
};

/**
 * Allowed sidebar nav `key` values per persona:role.
 * `null` = every item in that persona's tree is allowed.
 */
export const ROLE_NAV_KEYS = {
  'rehrig:Admin': null,
  'sp:Admin': null,
  'sp:Ops Manager': [
    'home',
    'inbox',
    'assets',
    'customers',
    'dispatches',
    'locations',
    'manageAccount',
    'mapCenter',
    'notes',
    'routes',
    'notifications',
    'tips',
    'aggregatedTips',
    'workOrders',
    'chatter',
    'dashboards',
    'reports',
    'reportSubscriptions',
    'products',
    'segments',
    'trucks',
  ],
  'sp:Field Tech': ['home', 'inbox', 'assets', 'workOrders', 'segments', 'chatter'],
  'sp:Dispatcher': [
    'home',
    'inbox',
    'assets',
    'locations',
    'dispatches',
    'notes',
    'workOrders',
    'tips',
    'aggregatedTips',
    'routes',
    'mapCenter',
    'segments',
    'reports',
    'reportSubscriptions',
    'chatter',
    'trucks',
  ],
  'sp:Analyst': [
    'home',
    'inbox',
    'reports',
    'dashboards',
    'reportSubscriptions',
    'tips',
    'aggregatedTips',
    'segments',
    'chatter',
  ],
  'sp:Maintenance Admin': ['home', 'inbox', 'assets', 'workOrders', 'trucks', 'maintProfiles', 'segments', 'chatter'],
  'customer:Portal User': null,
};

/**
 * Module keys the router may open for each persona:role.
 * Must stay in sync with ROLE_NAV_KEYS (and account-tab destinations).
 */
export const ROLE_MODULES = {
  'rehrig:Admin': [
    'home',
    'notifications',
    'accounts',
    'accountDetail',
    'account',
    'contacts',
    'customers',
    'masterProducts',
    'reportSubscriptions',
    'productTypes',
    'device',
    'truck',
    'tagScheme',
    'apiIntegrations',
    'analytics',
    'dashboards',
    'reports',
    'activity',
    'setup',
    'userAccount',
    'onboarding',
    'contractOnboarding',
  ],
  'sp:Admin': [
    'home',
    'notifications',
    'account',
    'assets',
    'locations',
    'dispatches',
    'workOrders',
    'trucks',
    'customers',
    'manageAccount',
    'routes',
    'serviceNotifications',
    'products',
    'maintenanceRouteProfiles',
    'notesAttachments',
    'requestTypeResolutions',
    'requestTypes',
    'resolutionCodes',
    'reqCodes',
    'individualTips',
    'aggregatedTips',
    'analytics',
    'dashboards',
    'reports',
    'reportSubscriptions',
    'activity',
    'notificationConfig',
    'setup',
    'userAccount',
    'bulkImport',
    'mapCenter',
  ],
  'sp:Ops Manager': [
    'home',
    'notifications',
    'account',
    'assets',
    'locations',
    'dispatches',
    'workOrders',
    'trucks',
    'customers',
    'manageAccount',
    'routes',
    'serviceNotifications',
    'products',
    'notesAttachments',
    'individualTips',
    'aggregatedTips',
    'analytics',
    'dashboards',
    'reports',
    'reportSubscriptions',
    'activity',
    'userAccount',
    'mapCenter',
    'bulkImport',
  ],
  'sp:Field Tech': ['home', 'notifications', 'account', 'assets', 'workOrders', 'activity', 'userAccount'],
  'sp:Maintenance Admin': [
    'home',
    'notifications',
    'account',
    'assets',
    'workOrders',
    'trucks',
    'maintenanceRouteProfiles',
    'activity',
    'userAccount',
  ],
  'sp:Dispatcher': [
    'home',
    'notifications',
    'account',
    'assets',
    'locations',
    'dispatches',
    'workOrders',
    'trucks',
    'notesAttachments',
    'individualTips',
    'aggregatedTips',
    'routes',
    'analytics',
    'dashboards',
    'reports',
    'reportSubscriptions',
    'activity',
    'userAccount',
    'mapCenter',
  ],
  'sp:Analyst': [
    'home',
    'notifications',
    'account',
    'individualTips',
    'aggregatedTips',
    'analytics',
    'dashboards',
    'reports',
    'reportSubscriptions',
    'activity',
    'userAccount',
  ],
  'customer:Portal User': [
    'home',
    'myLocations',
    'myWorkOrders',
    'myNotifications',
    'myAccount',
    'userAccount',
  ],
};

/** Account-detail tabs each SP role may open */
export const ROLE_ACCOUNT_TABS = {
  'sp:Admin': ['details', 'contacts', 'customers', 'products', 'segments', 'routes', 'notifications'],
  'sp:Ops Manager': ['details', 'contacts', 'customers', 'products', 'segments', 'routes', 'notifications'],
  'sp:Field Tech': ['details', 'segments'],
  'sp:Dispatcher': ['details', 'segments', 'routes'],
  'sp:Analyst': ['details', 'segments'],
  'sp:Maintenance Admin': ['details', 'segments'],
  'rehrig:Admin': ['details', 'contacts', 'customers', 'products', 'segments', 'routes', 'notifications'],
};

export function roleKey(user) {
  if (!user) return null;
  return `${user.persona}:${user.role}`;
}

export function getPsgLabel(user) {
  return ROLE_PSG[roleKey(user)] || 'No PSG';
}

export function getAllowedNavKeys(user) {
  const k = roleKey(user);
  if (!k) return [];
  return ROLE_NAV_KEYS[k] === undefined ? [] : ROLE_NAV_KEYS[k];
}

export function getAllowedModules(user) {
  const k = roleKey(user);
  return ROLE_MODULES[k] || [];
}

export function canAccessModuleForUser(user, moduleKey) {
  if (!user || !user.active) return false;
  return getAllowedModules(user).includes(moduleKey);
}

export function canAccessNavKey(user, navKey) {
  if (!user || !user.active) return false;
  const allowed = getAllowedNavKeys(user);
  if (allowed === null) return true;
  return allowed.includes(navKey);
}

export function canAccessAccountTab(user, tab) {
  if (!user || !user.active) return false;
  const tabs = ROLE_ACCOUNT_TABS[roleKey(user)];
  if (!tabs) return false;
  return tabs.includes(tab);
}

/** Who may preview the workspace as another persona (Rehrig admin only) */
export function canPreviewPersonasForUser(user) {
  return !!(user?.active && user.persona === 'rehrig' && user.role === 'Admin');
}

/** Who may create Service Provider accounts */
export function canCreateAccountsForUser(user) {
  return !!(user?.active && user.persona === 'rehrig' && user.role === 'Admin');
}

/** Who may create operational records (WO, Asset, …) */
export function canCreateRecordsForUser(user) {
  if (!user?.active) return false;
  if (user.persona === 'customer') return false;
  if (user.persona === 'rehrig') return false;
  if (user.role === 'Field Tech' || user.role === 'Analyst' || user.role === 'Read-Only') return false;
  return true;
}
