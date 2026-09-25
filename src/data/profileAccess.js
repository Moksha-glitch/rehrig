export const SEED_PROFILES = [
  {
    id: 'vp1',
    role: 'Service Provider Admin',
    access: 'SP: All access · Screen: All access',
    status: 'Active',
    description: 'Full operator access across every service provider and screen.',
    created: 'Hansie',
    createdDate: '14/01/26',
    lastUpdatedBy: 'Hansie',
    lastUpdatedDate: '14/01/26',
    preset: 'all',
  },
  {
    id: 'vp2',
    role: 'Account Manager',
    access: 'SP: All access · Screen: Partial access',
    status: 'Active',
    description: 'Account-level access with a reduced screen set.',
    created: 'Hansie',
    createdDate: '14/01/26',
    lastUpdatedBy: 'Hansie',
    lastUpdatedDate: '14/01/26',
    preset: 'partial',
  },
  {
    id: 'vp3',
    role: 'Fleet Manager',
    access: 'SP: 14 · Screen: Partial access',
    status: 'Active',
    description: 'Fleet, trucks, and dispatch for assigned providers.',
    created: 'Jacques',
    createdDate: '22/02/26',
    lastUpdatedBy: 'Jacques',
    lastUpdatedDate: '22/02/26',
    preset: 'partial',
  },
  {
    id: 'vp4',
    role: 'Asset Manager',
    access: 'SP: 14 · Screen: Partial access',
    status: 'Active',
    description: 'Assets, products, and yard inventory.',
    created: 'Jacques',
    createdDate: '22/02/26',
    lastUpdatedBy: 'Jacques',
    lastUpdatedDate: '22/02/26',
    preset: 'partial',
  },
  {
    id: 'vp5',
    role: 'Division Manager',
    access: 'SP: 8 · Screen: Partial access',
    status: 'Active',
    description: 'Division-scoped operations and reporting.',
    created: 'Jacques',
    createdDate: '25/02/26',
    lastUpdatedBy: 'Priya',
    lastUpdatedDate: '02/03/26',
    preset: 'partial',
  },
  {
    id: 'vp6',
    role: 'Driver / Maintenance Admin',
    access: 'SP: 3 · Screen: Mobile only',
    status: 'Active',
    description: 'Mobile driver tools and maintenance admin.',
    created: 'Hansie',
    createdDate: '02/03/26',
    lastUpdatedBy: 'Priya',
    lastUpdatedDate: '18/03/26',
    preset: 'mobile',
  },
  {
    id: 'vp7',
    role: 'Industrial Container Driver',
    access: 'SP: 3 · Screen: Mobile only',
    status: 'Active',
    description: 'Industrial container routes on the driver app.',
    created: 'Hansie',
    createdDate: '02/03/26',
    lastUpdatedBy: 'Priya',
    lastUpdatedDate: '18/03/26',
    preset: 'mobile',
  },
  {
    id: 'vp8',
    role: 'Maintenance Yard Manager',
    access: 'SP: 1 · Screen: View only',
    status: 'Inactive',
    description: 'Yard inventory visibility without edit rights.',
    created: 'Priya',
    createdDate: '18/03/26',
    lastUpdatedBy: 'Priya',
    lastUpdatedDate: '18/03/26',
    preset: 'view',
  },
  {
    id: 'PROF-SPUSER',
    role: 'Service Provider User',
    access: 'Segments: 1 · Screen: Partial access',
    status: 'Active',
    description: 'Day-to-day operator limited to assigned segments.',
    created: 'Helena',
    createdDate: '12/08/26',
    lastUpdatedBy: 'Helena',
    lastUpdatedDate: '12/08/26',
    preset: 'partial',
  },
];

export const PROFILE_SCREEN_MODULES = [
  {
    module: 'Platform Access & Identity',
    screens: [
      'Login Page',
      'Forgot Password / Reset Password',
      'Your Account (personal preferences)',
      'Login History / Security Audit',
    ],
  },
  {
    module: 'Home Dashboard',
    screens: [
      'Home — SP Admin View',
      'Home — SP Segment Admin View',
      'Customize Home (slide-over)',
      'App Launcher',
    ],
  },
  {
    module: 'Contacts',
    screens: [
      {
        name: 'Contacts List',
        fields: [
          'First Name',
          'Last Name',
          'Email',
          'Phone',
          'Role Title',
          'Profile',
          'Segment',
          'Status',
          'Enabled as Customer User',
        ],
      },
      'New / Edit Contact',
      'Contact Detail (popup)',
    ],
  },
  {
    module: 'Segments',
    screens: [
      { name: 'Service Provider Segments List', fields: ['Segment Name', 'Type', 'Parent Segment', 'Service Provider'] },
      'New / Edit Segment',
    ],
  },
  {
    module: 'Product Configuration',
    screens: [
      {
        name: 'Product Master Catalog List',
        fields: [
          'Product Name',
          'Product Code',
          'Product Size',
          'Service Type',
          'Service Category',
          'Product Description',
          'Active',
          'Product Family',
          'External ID',
        ],
      },
      'New / Edit Master Product',
      {
        name: 'Service Provider Products List',
        fields: ['Product (Master)', 'Resident-Facing Name', 'Product Code', 'Service Category', 'Status', 'Family'],
      },
      'New / Edit Service Provider Product',
    ],
  },
  {
    module: 'Request Types & Resolution Codes',
    screens: [
      { name: 'Request Types List', fields: ['Request Type', 'Workflow Type', 'Category'] },
      'New / Edit Request Type',
      { name: 'Resolution Codes List', fields: ['Resolution Code', 'Workflow Type'] },
      'New / Edit Resolution Code',
      'Request Type Resolution Codes (RRC) List',
      'New / Edit RRC Record',
    ],
  },
  {
    module: 'Rehrig Master Configuration',
    screens: [
      { name: 'Service Types List', fields: ['Type Name', 'Category', 'Active'] },
      'New / Edit Service Type',
      { name: 'Location Types List', fields: ['Type Name', 'Category', 'Active'] },
      'New / Edit Location Type',
      {
        name: 'Route Profile Templates List',
        fields: [
          'Profile Name',
          'Start Location',
          'End Location',
          'Service Type',
          '# Trucks',
          'Start Time',
          'Duration',
          'Segment',
        ],
      },
      'New / Edit Route Profile Template',
      {
        name: 'Service Notification Config List',
        fields: [
          'Enable Notification Toggle',
          'Message Limit',
          'Time Zone',
          'Phone Call Window',
          'SMS Window',
          'Email Window',
          'Notification Trigger Logic',
          'Message Templates',
          'Twilio Credentials',
          'SendGrid Credentials',
        ],
      },
      'New / Edit Service Notification Config',
      { name: 'Device Master Registry List', fields: ['Device ID', 'Device Name', 'Device Type'] },
      'New / Edit Device',
      { name: 'Truck Master Registry List', fields: ['Truck ID', 'Truck Name', 'Truck Type'] },
      'New / Edit Truck (Master Registry)',
      { name: 'API Integrations List', fields: ['Name', 'Description', 'Endpoint', 'Status', 'Calls / 30 days'] },
      'New / Edit API Integration',
    ],
  },
  {
    module: 'Customers & Manage Account',
    screens: [
      {
        name: 'Customers List',
        fields: [
          'Customer Account Number',
          'Customer Name',
          'Phone',
          'Email',
          'Segment',
          'Custom 1',
          'Custom 2',
          'Custom 3',
          'Custom 4',
          'Custom 5',
          'Custom 6',
          'Notes',
        ],
      },
      'New / Edit Customer',
      {
        name: 'Locations List',
        fields: [
          'House Number',
          'Street Name',
          'Unit Number',
          'City',
          'State/Province',
          'Postal Code',
          'County',
          'Zone',
          'Site ID',
          'Parcel ID',
          'Latitude',
          'Longitude',
          'Location Type',
          'Warehouse',
        ],
      },
      'New / Edit Location',
      'Manage Customers — Search Screen',
      'Manage Customers — Account Detail View',
      'Manage Customers — Asset Action Panel',
      'Manage Customers — Assign New Asset Modal',
      'Manage Customers — Tip History View',
      'Manage Customers — Map Asset View',
      'Manage Customers — Observation History View',
      'Mass Upload Customers',
    ],
  },
  {
    module: 'Assets & Trucks',
    screens: [
      {
        name: 'Assets List',
        fields: [
          'Asset Name / Serial Number',
          'Product',
          'Status',
          'Account',
          'Home Location',
          'Customer Location',
          'Warehouse',
          'Install Date',
        ],
      },
      'New / Edit Asset',
      'Asset Import — Standard',
      'Asset Import — Legacy / Cart System',
      {
        name: 'Trucks List',
        fields: ['Truck Name', 'Truck #', 'Status', 'Service Type', 'Driver', 'Segment', 'Service Provider'],
      },
      'New / Edit Truck',
    ],
  },
  {
    module: 'Work Orders',
    screens: [
      {
        name: 'Work Orders List',
        fields: [
          'Work Order # (Case)',
          'LUID (External Order ID)',
          'Customer',
          'Request Type',
          'Subject',
          'Due Date',
          'Priority',
          'Status',
          'Service Type',
          'Asset Type',
          'Asset Size',
          'Dispatch Number',
          'Route ID',
          'Stop Number',
          'Hot Ticket',
          'Resolution Code',
          'Number of Attempts',
          'Last Attempt Date/Time',
          'Attempt Lat/Long',
          'Notification Required',
          'Notification Sent',
          'Notification Channel',
          'Sent Date/Time',
          'Photo URL 1',
          'Photo URL 2',
          'Created Date',
          'Last Modified By',
        ],
      },
      'Work Order Source Picker',
      'New / Edit Work Order',
      'WOIT — Stage 1: Upload',
      'WOIT — Stage 2: Preview Mapping',
      'WOIT — Stage 3: Validate Sample',
      'WOIT — Stage 4: Commit',
    ],
  },
  {
    module: 'Routing & Dispatch',
    screens: [
      {
        name: 'Routes List',
        fields: [
          'Route Name',
          'Route Number',
          'Collection Day(s)',
          'Frequency',
          'Collection Type',
          'Stop Interval',
          'Truck Assignment',
          'Driver Assignment',
          'Average Tips',
          'Service Provider',
          'Segment',
        ],
      },
      'New / Edit Route',
      {
        name: 'Dispatch — Route Table / Grid View',
        fields: [
          'Dispatch Number',
          'Dispatch Date',
          'Dispatch ID',
          'Route ID',
          'Dispatch Status',
          'Truck Number',
          'Driver ID',
          'Stop Number',
          'Created By',
          'Last Modified By',
        ],
      },
      'Dispatch — Lasso Routing View',
      'Dispatch — Manage Profiles',
      'Dispatch — Publish Confirmation',
    ],
  },
  {
    module: 'Map Center',
    screens: [
      'Map Center — Main Map View',
      'Map Center — Address Search Panel',
      'Map Center — Route Progress View',
    ],
  },
  {
    module: 'Telematics / Tips',
    screens: [
      {
        name: 'Individual Tips / Non-Tip Events List',
        fields: [
          'Event Date / Time',
          'Customer Location',
          'Collection Route',
          'Tipped',
          'Truck #',
          'RFID Reference',
          'Distance',
        ],
      },
      'New / Edit Individual Tip',
      {
        name: 'Aggregated Truck and Tips List',
        fields: ['Date', 'Truck #', '# Tips', 'Total Distance', 'Idle Time (min)', 'Speeding Events'],
      },
      'New / Edit Aggregated Tip Record',
    ],
  },
  {
    module: 'Service Notifications',
    screens: [
      {
        name: 'Service Notifications List (account-level)',
        fields: [
          'Notification Name',
          'Status',
          'Channel',
          'Notify Days (Trigger)',
          'Trigger Event',
          'From Email',
          'Email Subject',
          'Message Body',
          'Window Start',
          'Window End',
        ],
      },
      'New / Edit Service Notification',
    ],
  },
  { module: 'Notes & Attachments', screens: ['Notes & Attachments List', 'New Note'] },
  { module: 'Driver Mobile App', screens: ['Mobile — Service Provider Admin View'] },
  { module: 'Activity Feed', screens: ['Activity Feed (Chatter equivalent)'] },
  {
    module: 'Integration & Device Mapping',
    screens: ['WO Service Provider Mapping', 'Truck Device Sync'],
  },
];

export const TOTAL_PROFILE_SCREENS = PROFILE_SCREEN_MODULES.reduce(
  (sum, group) => sum + group.screens.length,
  0
);

function screenName(entry) {
  return typeof entry === 'string' ? entry : entry.name;
}

function screenFields(entry) {
  return typeof entry === 'string' ? null : entry.fields || null;
}

const PROFILE_FOCUS_MODULES = {
  'Account Manager': ['Contacts', 'Segments', 'Customers & Manage Account', 'Service Notifications'],
  'Fleet Manager': ['Assets & Trucks', 'Routing & Dispatch', 'Map Center'],
  'Asset Manager': ['Assets & Trucks', 'Product Configuration', 'Work Orders'],
  'Division Manager': [
    'Contacts',
    'Segments',
    'Customers & Manage Account',
    'Assets & Trucks',
    'Work Orders',
    'Routing & Dispatch',
  ],
};

function flagsForPreset(group, entry, index, preset, role) {
  if (preset === 'all' || preset === true) {
    return { view: true, edit: true, create: true, delete: true };
  }
  if (preset === 'none' || preset === 'off' || preset === false) {
    return { view: false, edit: false, create: false, delete: false };
  }
  if (preset === 'view') return { view: true, edit: false, create: false, delete: false };
  if (preset === 'mobile') {
    const on = group.module === 'Driver Mobile App';
    return { view: on, edit: on, create: false, delete: false };
  }
  const focus = PROFILE_FOCUS_MODULES[role];
  if (focus) {
    const on = focus.includes(group.module);
    return { view: on, edit: on, create: on, delete: on };
  }
  const operational = [
    'Home Dashboard',
    'Contacts',
    'Customers & Manage Account',
    'Assets & Trucks',
    'Work Orders',
    'Routing & Dispatch',
    'Activity Feed',
  ];
  if (!operational.includes(group.module)) {
    return { view: false, edit: false, create: false, delete: false };
  }
  if (index === 0) {
    return {
      view: true,
      edit: group.module === 'Home Dashboard',
      create: false,
      delete: false,
    };
  }
  return {
    view: group.module === 'Home Dashboard',
    edit: false,
    create: false,
    delete: false,
  };
}

export function buildScreenModules(preset = 'all', role) {
  return PROFILE_SCREEN_MODULES.map((group) => ({
    module: group.module,
    expanded: false,
    screens: group.screens.map((entry, index) => {
      const access = flagsForPreset(group, entry, index, preset, role);
      const fields = screenFields(entry);
      return {
        id: `${group.module.slice(0, 3)}-${index}`,
        name: screenName(entry),
        view: access.view,
        edit: access.edit,
        create: access.create,
        delete: access.delete,
        expanded: false,
        fields: fields
          ? fields.map((name, fieldIndex) => ({
              id: `${group.module.slice(0, 3)}-${index}-f${fieldIndex}`,
              name,
              view: access.view,
              edit: access.edit,
            }))
          : null,
      };
    }),
  }));
}

export function collectFlags(screen) {
  const flags = [!!screen.view, !!screen.edit, !!screen.create, !!screen.delete];
  (screen.fields || []).forEach((field) => {
    flags.push(!!field.view, !!field.edit);
  });
  return flags;
}

export function accessStateFromFlags(flags) {
  const on = flags.filter(Boolean).length;
  if (on === 0) return 'off';
  if (on === flags.length) return 'on';
  return 'partial';
}

export function screenAccessState(screen) {
  return accessStateFromFlags(collectFlags(screen));
}

export function moduleAccessState(group) {
  return accessStateFromFlags(group.screens.flatMap(collectFlags));
}

export function buildProviderTree(accounts = [], segments = [], options = {}) {
  const checked = options.checked !== false;
  if (!accounts.length) {
    return [
      {
        id: 'sp1',
        name: 'Service Provider 1',
        checked,
        segments: [
          { id: 'sp1-seg1', name: 'Segment 1', checked },
          { id: 'sp1-seg2', name: 'Segment 2', checked },
          { id: 'sp1-seg3', name: 'Segment 3', checked },
        ],
      },
      {
        id: 'sp2',
        name: 'Service Provider 2',
        checked,
        segments: [
          { id: 'sp2-seg1', name: 'Segment 1', checked },
          { id: 'sp2-seg2', name: 'Segment 2', checked },
        ],
      },
    ];
  }

  return accounts.map((account) => {
    const kids = segments.filter((segment) => segment.accountId === account.id);
    return {
      id: account.id,
      name: account.name,
      checked,
      segments: kids.map((segment) => ({
        id: segment.id,
        name: segment.name || segment.segmentName,
        type: segment.type || '',
        checked,
      })),
    };
  });
}

export function buildSPSegmentProvider(account, segments = [], options = {}) {
  const allSelected = options.checked === true;
  const kids = account
    ? segments.filter(
        (segment) => segment.accountId === account.id || segment.account === account.name
      )
    : [];
  return [
    {
      id: account?.id || 'self',
      name: account?.name || 'This account',
      checked: allSelected,
      segments: kids.map((segment) => ({
        id: segment.id,
        name: segment.name || segment.segmentName,
        type: segment.type || '',
        checked: false,
      })),
    },
  ];
}

export function hasAccessSelection(providers = []) {
  return providers.some(
    (provider) => provider.checked || provider.segments?.some((segment) => segment.checked)
  );
}

export function countSelectedSegments(providers = []) {
  return providers.reduce(
    (sum, provider) =>
      sum + (provider.checked ? provider.segments?.length || 0 : provider.segments?.filter((segment) => segment.checked).length || 0),
    0
  );
}

export function summarizeProfileAccess(providers, screens, persona) {
  const selectedProviders = providers.filter(
    (provider) => provider.checked || provider.segments.some((segment) => segment.checked)
  ).length;
  const selectedSegments = countSelectedSegments(providers);
  const enabledScreens = screens.reduce(
    (sum, group) =>
      sum +
      group.screens.filter(
        (screen) => screen.view || screen.edit || screen.create || screen.delete || screen.enabled
      ).length,
    0
  );
  const totalScreens = screens.reduce((sum, group) => sum + group.screens.length, 0);
  const allProviders = selectedProviders === providers.length && providers.length > 0;
  const allSegments = persona === 'sp' && !!providers[0]?.checked;
  const allScreens = enabledScreens === totalScreens && totalScreens > 0;
  const noScreens = enabledScreens === 0;

  const scopeLabel = persona === 'sp'
    ? allSegments
      ? 'All access'
      : String(selectedSegments)
    : allProviders
      ? 'All access'
      : String(selectedProviders);
  let screenLabel = 'Partial access';
  if (allScreens) screenLabel = 'All access';
  else if (noScreens) screenLabel = 'None';
  else if (enabledScreens <= 2) screenLabel = 'Mobile only';

  return `${persona === 'sp' ? 'Segments' : 'SP'}: ${scopeLabel} · Screen: ${screenLabel}`;
}
