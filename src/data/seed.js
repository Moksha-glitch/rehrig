// Seed fixtures for Vision Pulse (Spec Ch.1, Ch.12, Ch.21, Ch.23).
import {
  enrichAccounts,
  enrichContacts,
  mapHtmlApiIntegrations,
  mapHtmlAssetTypes,
  mapHtmlDevices,
  mapHtmlLocationTypes,
  mapHtmlNotificationConfig,
  mapHtmlProductTypes,
  mapHtmlServiceTypes,
  mapHtmlTagSchemes,
  mapHtmlTruckTypes,
} from './v63SeedAdapters.js';

// ---- Seed users across the three personas (Ch.1) ----
export const USERS = [
  // rehrig persona
  { id: 'u-hrehrig', alias: 'hrehrig', name: 'Helena Rehrig', firstName: 'Helena', email: 'helena@vision.io', persona: 'rehrig', role: 'Admin', scopeLabel: 'All accounts', active: true, accountIds: [], segmentIds: [] },
  { id: 'u-avolkov', alias: 'avolkov', name: 'Anton Volkov', firstName: 'Anton', email: 'anton@vision.io', persona: 'rehrig', role: 'Admin', scopeLabel: 'All accounts', active: true, accountIds: [], segmentIds: [] },
  // sp persona
  { id: 'u-ywagn', alias: 'ywagn', name: 'Yolanda Wagner', firstName: 'Yolanda', email: 'yolanda@vision.io', persona: 'sp', role: 'Admin', scopeLabel: 'All accounts', active: true, accountIds: [], segmentIds: [] },
  { id: 'u-mchen', alias: 'mchen', name: 'Marcus Chen', firstName: 'Marcus', email: 'marcus@vision.io', persona: 'sp', role: 'Ops Manager', scopeLabel: 'All accounts', active: true, accountIds: [], segmentIds: [] },
  { id: 'u-dthorn', alias: 'dthorn', name: 'David Thornton', firstName: 'David', email: 'david@vision.io', persona: 'sp', role: 'Field Tech', scopeLabel: 'Edmonton AB only', active: true, accountIds: ['acc-212880'], segmentIds: [] },
  { id: 'u-praman', alias: 'praman', name: 'Priya Ramanathan', firstName: 'Priya', email: 'priya@vision.io', persona: 'sp', role: 'Analyst', scopeLabel: 'All accounts (Inactive)', active: false, accountIds: [], segmentIds: [] },
  { id: 'u-skami', alias: 'skami', name: 'Sarah Kaminski', firstName: 'Sarah', email: 'sarah@vision.io', persona: 'sp', role: 'Dispatcher', scopeLabel: 'Toronto Waste Services only', active: true, accountIds: ['acc-212883'], segmentIds: [] },
  { id: 'u-jortiz', alias: 'jortiz', name: 'Jordan Ortiz', firstName: 'Jordan', email: 'jordan@vision.io', persona: 'sp', role: 'Maintenance Admin', scopeLabel: 'Edmonton AB only', active: true, accountIds: ['acc-212880'], segmentIds: [] },
  { id: 'u-rmedam', alias: 'rmedam', name: 'Ravindra Medam', firstName: 'Ravindra', email: 'ravi.medam@vision.io', persona: 'sp', role: 'Admin', scopeLabel: 'All accounts', active: true, accountIds: [], segmentIds: [] },
  { id: 'u-lchen', alias: 'lchen', name: 'Lena Chen', firstName: 'Lena', email: 'lena@vision.io', persona: 'sp', role: 'Segment Admin', scopeLabel: 'Downtown District only', active: true, accountIds: ['acc-212880'], segmentIds: ['seg-3'] },
  { id: 'u-jweth', alias: 'jweth', name: 'Janeal Wetherbee', firstName: 'Janeal', email: 'janeal.wetherbee@edmontonab.example.com', persona: 'sp', role: 'Service Provider User', scopeLabel: 'Edmonton AB', active: true, accountIds: ['acc-212880'], segmentIds: [] },
  // customer persona
  { id: 'u-sobrien', alias: 'sobrien', name: "Sam O'Brien", firstName: 'Sam', email: 'sam.obrien@example.com', persona: 'customer', role: 'Portal User', scopeLabel: 'Edmonton AB', active: true, accountIds: ['acc-212880'], segmentIds: ['seg-2'], customerId: 'C-4765577', segment: 'Edmonton AB' },
  { id: 'u-npetrov', alias: 'npetrov', name: 'Nadia Petrov', firstName: 'Nadia', email: 'n.petrov@example.com', persona: 'customer', role: 'Portal User', scopeLabel: 'Edmonton AB', active: true, accountIds: ['acc-212880'], segmentIds: ['seg-2'], customerId: 'C-4765578', segment: 'Edmonton AB' },
];

// ---- The six existing Service Provider accounts (Ch.23) ----
const SEED_ACCOUNTS = [
  {
    id: 'acc-212880',
    name: 'Edmonton AB',
    uid: '212880',
    type: 'Customer',
    industry: 'Finance',
    phone: '(886) 742-8232',
    owner: 'ywagn',
    ownerName: 'Yolanda Wagner',
    website: 'support.rehrigpacific.com',
    description: 'Edmonton Account',
    employees: 220,
    numberOfWeeks: 52,
    jdEdwardsId: '205024',
    serviceTypes: ['Commercial', 'Residential'],
    serviceModules: 'WO, Dispatch, Tips',
    hardwareType: 'RFID + Arm-lift',
    trackObservations: true,
    trackSafetyEvents: true,
    enableAutoWO: true,
    enableAutoHotTicket: true,
    autoHotTicketDays: 1,
    enableMoveBurntCarts: true,
    isTableauCloud: true,
    inactive: false,
    supportEmail: 'rehrigtechsupport@rehrig.com',
    notif: {
      enableTab: true, send: true, messageLimit: 1, timeZone: 'Asia/Kolkata',
      startTime: '08:00', endTime: '19:00', emailSendTime: '22:56', smsSendTime: '15:00',
      smsFailed: false, phoneFailed: false, sendGridFailed: false,
    },
    billing: { country: 'Canada', street: '12802 58th Street NW', city: 'Edmonton', state: 'Alberta', zip: 'T5A 4L3' },
    shipping: { country: 'Canada', street: '12804 58th Street NW', city: 'Edmonton', state: 'Alberta', zip: 'T5A 4L3' },
    paymentRequired: false,
    apiIntegrated: false,
    onboardingComplete: true,
    residents: 1,
    addedDate: '2024-03-02',
    createdBy: 'Yolanda Wagner, 3/2/2024, 9:14 AM',
    lastModifiedBy: 'Helena Rehrig, 6/29/2026, 4:02 PM',
  },
  {
    id: 'acc-212881',
    name: 'Calgary Metro Waste',
    uid: '212881',
    type: 'Customer',
    industry: 'Municipal',
    phone: '(403) 555-0142',
    owner: 'mchen',
    ownerName: 'Marcus Chen',
    website: 'calgarymetro.ca',
    description: 'Calgary municipal contract',
    employees: 140,
    numberOfWeeks: 52,
    jdEdwardsId: '205025',
    serviceTypes: ['Residential'],
    serviceModules: 'WO, Dispatch',
    hardwareType: 'RFID',
    trackObservations: true,
    trackSafetyEvents: true,
    enableAutoWO: true,
    enableAutoHotTicket: false,
    autoHotTicketDays: 1,
    enableMoveBurntCarts: false,
    isTableauCloud: false,
    inactive: false,
    supportEmail: 'help@calgarymetrowaste.ca',
    notif: {
      enableTab: true, send: true, messageLimit: 3, timeZone: 'America/Edmonton',
      startTime: '06:00', endTime: '18:00', emailSendTime: '08:00', smsSendTime: '09:00',
      smsFailed: false, phoneFailed: false, sendGridFailed: false,
    },
    billing: { country: 'Canada', street: '800 Macleod Trail SE', city: 'Calgary', state: 'Alberta', zip: 'T2G 2M3' },
    shipping: { country: 'Canada', street: '800 Macleod Trail SE', city: 'Calgary', state: 'Alberta', zip: 'T2G 2M3' },
    paymentRequired: false,
    apiIntegrated: true,
    onboardingComplete: true,
    residents: 1,
    addedDate: '2024-06-04',
    createdBy: 'Ravindra Medam, 6/4/2024, 10:31 AM',
    lastModifiedBy: 'Ravindra Medam, 6/20/2026, 1:12 PM',
  },
  {
    id: 'acc-212882',
    name: 'Vancouver Sanitation Co',
    uid: '212882',
    type: 'Prospect',
    industry: 'Environmental',
    phone: '(604) 555-8891',
    owner: 'rmedam',
    ownerName: 'Ravindra Medam',
    website: 'vansanitation.co',
    description: 'Commercial sanitation contractor for Greater Vancouver.',
    employees: 90,
    numberOfWeeks: 52,
    jdEdwardsId: '',
    serviceTypes: ['Commercial'],
    serviceModules: 'WO',
    hardwareType: 'None',
    trackObservations: false,
    trackSafetyEvents: false,
    enableAutoWO: false,
    enableAutoHotTicket: false,
    autoHotTicketDays: 1,
    enableMoveBurntCarts: false,
    isTableauCloud: false,
    inactive: false,
    supportEmail: '',
    notif: {
      enableTab: true, send: false, messageLimit: 0, timeZone: 'America/Los_Angeles',
      startTime: '07:00', endTime: '20:00', emailSendTime: '08:00', smsSendTime: '09:00',
      smsFailed: false, phoneFailed: false, sendGridFailed: false,
    },
    billing: { country: 'Canada', street: '453 W 12th Ave', city: 'Vancouver', state: 'British Columbia', zip: 'V5Y 1V4' },
    shipping: { country: 'Canada', street: '453 W 12th Ave', city: 'Vancouver', state: 'British Columbia', zip: 'V5Y 1V4' },
    paymentRequired: false,
    apiIntegrated: false,
    onboardingComplete: false,
    residents: 1,
    addedDate: '2024-09-21',
    createdBy: 'Ravindra Medam, 9/21/2024, 2:45 PM',
    lastModifiedBy: 'Ravindra Medam, 5/3/2026, 11:20 AM',
  },
  {
    id: 'acc-212883',
    name: 'Toronto Waste Services',
    uid: '212883',
    type: 'Customer',
    industry: 'Municipal',
    phone: '(416) 555-2100',
    owner: 'ywagn',
    ownerName: 'Yolanda Wagner',
    website: 'torontows.ca',
    description: 'Toronto commercial + residential',
    employees: 310,
    numberOfWeeks: 52,
    jdEdwardsId: '205027',
    serviceTypes: ['Commercial', 'Residential'],
    serviceModules: 'WO, Dispatch, Tips, Notifications, Payments',
    hardwareType: 'RFID + Arm-lift',
    trackObservations: true,
    trackSafetyEvents: true,
    enableAutoWO: true,
    enableAutoHotTicket: true,
    autoHotTicketDays: 2,
    enableMoveBurntCarts: true,
    isTableauCloud: true,
    inactive: false,
    supportEmail: 'support@torontowaste.ca',
    notif: {
      enableTab: true, send: true, messageLimit: 2, timeZone: 'America/Toronto',
      startTime: '07:00', endTime: '20:00', emailSendTime: '08:00', smsSendTime: '09:00',
      smsFailed: false, phoneFailed: false, sendGridFailed: false,
    },
    billing: { country: 'Canada', street: '100 Queen St W', city: 'Toronto', state: 'Ontario', zip: 'M5H 2N2' },
    shipping: { country: 'Canada', street: '100 Queen St W', city: 'Toronto', state: 'Ontario', zip: 'M5H 2N2' },
    paymentRequired: false,
    apiIntegrated: true,
    onboardingComplete: true,
    residents: 1,
    addedDate: '2025-01-08',
    createdBy: 'Ravindra Medam, 1/8/2025, 8:52 AM',
    lastModifiedBy: 'Sarah Kaminski, 7/1/2026, 7:40 AM',
  },
  {
    id: 'acc-212884',
    name: 'Winnipeg Green Bins Ltd',
    uid: '212884',
    type: 'Customer',
    industry: 'Environmental',
    phone: '(204) 555-7712',
    owner: 'mchen',
    ownerName: 'Marcus Chen',
    website: 'wpggreenbins.ca',
    description: 'Residential only - inactive contract',
    employees: 45,
    numberOfWeeks: 52,
    jdEdwardsId: '205028',
    serviceTypes: ['Residential'],
    serviceModules: '',
    hardwareType: 'None',
    trackObservations: false,
    trackSafetyEvents: false,
    enableAutoWO: false,
    enableAutoHotTicket: false,
    autoHotTicketDays: 1,
    enableMoveBurntCarts: false,
    isTableauCloud: false,
    inactive: true,
    supportEmail: '',
    notif: {
      enableTab: true, send: false, messageLimit: 0, timeZone: 'America/Chicago',
      startTime: '07:00', endTime: '20:00', emailSendTime: '08:00', smsSendTime: '09:00',
      smsFailed: false, phoneFailed: false, sendGridFailed: false,
    },
    billing: { country: 'Canada', street: '510 Main St', city: 'Winnipeg', state: 'Manitoba', zip: 'R3B 1B9' },
    shipping: { country: 'Canada', street: '510 Main St', city: 'Winnipeg', state: 'Manitoba', zip: 'R3B 1B9' },
    paymentRequired: false,
    apiIntegrated: false,
    onboardingComplete: true,
    residents: 0,
    addedDate: '2025-03-14',
    createdBy: 'Ravindra Medam, 3/14/2025, 3:18 PM',
    lastModifiedBy: 'Ravindra Medam, 4/1/2026, 9:05 AM',
  },
  {
    id: 'acc-212885',
    name: 'Fairfax County VA',
    uid: '212885',
    type: 'Customer',
    industry: 'Municipal',
    phone: '(703) 555-9100',
    owner: 'ywagn',
    ownerName: 'Yolanda Wagner',
    website: 'fairfaxcounty.gov',
    description: 'Payment-gated resident portal',
    employees: 180,
    numberOfWeeks: 52,
    jdEdwardsId: '205029',
    serviceTypes: ['Residential'],
    serviceModules: 'WO, Dispatch, Payments',
    hardwareType: 'RFID',
    trackObservations: true,
    trackSafetyEvents: true,
    enableAutoWO: true,
    enableAutoHotTicket: true,
    autoHotTicketDays: 1,
    enableMoveBurntCarts: false,
    isTableauCloud: true,
    inactive: false,
    supportEmail: 'support@fairfaxcounty.gov',
    notif: {
      enableTab: true, send: true, messageLimit: 2, timeZone: 'America/New_York',
      startTime: '06:00', endTime: '18:00', emailSendTime: '08:00', smsSendTime: '09:00',
      smsFailed: false, phoneFailed: false, sendGridFailed: false,
    },
    billing: { country: 'United States', street: '12000 Government Center Pkwy', city: 'Fairfax', state: 'Virginia', zip: '22035' },
    shipping: { country: 'United States', street: '12000 Government Center Pkwy', city: 'Fairfax', state: 'Virginia', zip: '22035' },
    paymentRequired: true,
    apiIntegrated: false,
    onboardingComplete: true,
    residents: 1,
    addedDate: '2025-05-27',
    createdBy: 'Yolanda Wagner, 5/27/2025, 1:47 PM',
    lastModifiedBy: 'Helena Rehrig, 6/30/2026, 5:15 PM',
  },
];

export const ACCOUNTS = enrichAccounts(SEED_ACCOUNTS);

// ---- Master Product Catalog (Ch.12, Ch.21) ----
export const MASTER_CATALOG = [
  { code: 'MPR-001', name: '120 Liter Trash', family: 'Roll-Out Cart', serviceType: 'Trash', category: 'Residential', size: '120 L', active: true },
  { code: 'MPR-002', name: '240 Liter Trash', family: 'Roll-Out Cart', serviceType: 'Trash', category: 'Residential', size: '240 L', active: true },
  { code: 'MPR-003', name: '360 Liter Organics Universal Cart', family: 'Universal Cart', serviceType: 'Organics', category: 'Residential', size: '360 L', active: true },
  { code: 'MPR-004', name: '96 Gallon Trash', family: 'Roll-Out Cart', serviceType: 'Trash', category: 'Residential', size: '96 gal', active: true },
  { code: 'MPR-005', name: '3 YD Garbage Bin Trash', family: 'Bin', serviceType: 'Trash', category: 'Commercial', size: '3 YD', active: true },
  { code: 'MPR-006', name: '4 YD Garbage Bin Trash', family: 'Bin', serviceType: 'Trash', category: 'Commercial', size: '4 YD', active: true },
  { code: 'MPR-007', name: '3 YD Recycle Bin Recycling', family: 'Bin', serviceType: 'Recycling', category: 'Commercial', size: '3 YD', active: true },
  { code: 'MPR-008', name: '1100 Liter Universal', family: 'Bulk Container', serviceType: 'Multi', category: 'Industrial', size: '1100 L', active: true },
];

// Products shown on Wizard Step 5 (Ch.12.1 - six products)
export const WIZARD_PRODUCTS = ['MPR-001', 'MPR-002', 'MPR-004', 'MPR-005', 'MPR-006', 'MPR-007'];

// ---- API Integrations at launch (Ch.21.5) ----
export const API_INTEGRATIONS = mapHtmlApiIntegrations();

// ---- Service Notification Config rules (Ch.21, Ch.21.6) ----
export const NOTIFICATION_CONFIG = mapHtmlNotificationConfig();

// ---- Master configuration vocabularies from V6.3 ----
export const CONFIG_SERVICE_TYPES = mapHtmlServiceTypes();
export const CONFIG_LOCATION_TYPES = mapHtmlLocationTypes();
export const CONFIG_ASSET_TYPES = mapHtmlAssetTypes();
export const CONFIG_PRODUCT_TYPES = mapHtmlProductTypes();
export const CONFIG_DEVICES = mapHtmlDevices();
export const CONFIG_TRUCKS = mapHtmlTruckTypes();
export const CONFIG_TAG_SCHEMES = mapHtmlTagSchemes();

// ---- Related records for account detail tabs ----
const SEED_CONTACTS = [
  { id: 'CON-001', accountId: 'acc-212880', salutation: 'Ms.', firstName: 'Yolanda', lastName: 'Wagner', name: 'Yolanda Wagner', email: 'y.wagner@edmontonab.ca', phone: '(886) 742-8232', mobile: '(780) 555-1122', title: 'Ops Director', roleTitle: 'Service Provider Admin', segment: 'Edmonton AB', segmentId: 'seg-2', isUserCreated: true, isUserActive: true, department: 'Operations' },
  { id: 'CON-002', accountId: 'acc-212880', salutation: 'Mr.', firstName: 'David', lastName: 'Thornton', name: 'David Thornton', email: 'd.thornton@edmontonab.ca', phone: '(886) 742-8241', mobile: '(780) 555-3344', title: 'Route Supervisor', roleTitle: 'Maintenance Admin', segment: 'Hauler 1', segmentId: 'seg-3', isUserCreated: true, isUserActive: true, department: 'Field Ops', reportsTo: 'Yolanda Wagner' },
  { id: 'CON-003', accountId: 'acc-212880', salutation: 'Mr.', firstName: 'Kevin', lastName: 'Abrams', name: 'Kevin Abrams', email: 'kabrams@edmontonab.ca', phone: '(886) 742-8250', mobile: '', title: 'VP Operations', roleTitle: 'Top-Level Executive', segment: 'Hauler 2', segmentId: 'seg-4', isUserCreated: false, isUserActive: false, department: 'Executive' },
  { id: 'CON-004', accountId: 'acc-212880', salutation: 'Ms.', firstName: 'Nadia', lastName: 'Aimal', name: 'Nadia Aimal', email: 'n.aimal@edmontonab.ca', phone: '(886) 742-8232', mobile: '', title: 'Fleet Coordinator', roleTitle: 'Maintenance Admin', segment: 'Edmonton AB Communal', segmentId: 'seg-6', isUserCreated: true, isUserActive: true, department: 'Operations', reportsTo: 'Yolanda Wagner' },
  { id: 'CON-005', accountId: 'acc-212881', salutation: 'Mr.', firstName: 'Marcus', lastName: 'Chen', name: 'Marcus Chen', email: 'm.chen@calgarymetro.ca', phone: '(403) 555-0142', mobile: '(403) 555-2200', title: 'Fleet Manager', roleTitle: 'Service Provider Admin', segment: 'Calgary Metro', segmentId: 'seg-20', isUserCreated: true, isUserActive: true, department: 'Operations' },
  { id: 'CON-006', accountId: 'acc-212883', salutation: 'Ms.', firstName: 'Sarah', lastName: 'Kaminski', name: 'Sarah Kaminski', email: 's.kaminski@torontows.ca', phone: '(416) 555-2101', mobile: '(416) 555-3011', title: 'Senior Dispatcher', roleTitle: 'Dispatcher', segment: 'Toronto Central', segmentId: 'seg-31', isUserCreated: true, isUserActive: true, department: 'Dispatch' },
  { id: 'CON-007', accountId: 'acc-212882', salutation: 'Ms.', firstName: 'Priya', lastName: 'Ramanathan', name: 'Priya Ramanathan', email: 'p.raman@vansan.com', phone: '(604) 555-8891', mobile: '', title: 'General Manager', roleTitle: 'Top-Level Executive', segment: 'Vancouver West', segmentId: 'seg-41', isUserCreated: true, isUserActive: true, department: 'Executive' },
];

export const CONTACTS = enrichContacts(SEED_CONTACTS);

export const SEGMENTS = [
  // Edmonton AB (acc-212880)
  { id: 'seg-1', accountId: 'acc-212880', name: 'Edmonton AB City', segmentName: 'Edmonton AB City', shortName: 'EDM-CITY', type: 'Top', parentId: null, delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002I9lQUAQ' },
  { id: 'seg-2', accountId: 'acc-212880', name: 'Edmonton AB', segmentName: 'Edmonton AB', shortName: 'EDM-MKT', type: 'Market Area', parentId: 'seg-1', delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002J0nUAJ' },
  { id: 'seg-3', accountId: 'acc-212880', name: 'Hauler 1', segmentName: 'Hauler 1', shortName: 'H1', type: 'District', parentId: 'seg-1', delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002K1oVBK' },
  { id: 'seg-4', accountId: 'acc-212880', name: 'Hauler 2', segmentName: 'Hauler 2', shortName: 'H2', type: 'District', parentId: 'seg-1', delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002L2pWCL' },
  { id: 'seg-5', accountId: 'acc-212880', name: 'Hauler 5', segmentName: 'Hauler 5', shortName: 'H5', type: 'District', parentId: 'seg-1', delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002M3qXDM' },
  { id: 'seg-6', accountId: 'acc-212880', name: 'Edmonton AB Communal', segmentName: 'Edmonton AB Communal', shortName: 'EDM-COM', type: 'Division', parentId: 'seg-1', delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002N4rYEN' },
  { id: 'seg-9', accountId: 'acc-212880', name: 'Test0420', segmentName: 'Test0420', shortName: 'T0420', type: 'Division', parentId: 'seg-2', delaySharing: false, delayDuration: 0, publicGroupId: '' },
 
  // Calgary Metro Waste (acc-212881)
  { id: 'seg-20', accountId: 'acc-212881', name: 'Calgary Metro', segmentName: 'Calgary Metro', shortName: 'CAL-TOP', type: 'Top', parentId: null, delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002Q7uBHQ' },
  { id: 'seg-21', accountId: 'acc-212881', name: 'Calgary North', segmentName: 'Calgary North', shortName: 'CAL-N', type: 'Market Area', parentId: 'seg-20', delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002R8vCIR' },
  { id: 'seg-22', accountId: 'acc-212881', name: 'Calgary South District', segmentName: 'Calgary South District', shortName: 'CAL-S', type: 'District', parentId: 'seg-21', delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002S9wDJS' },

  // Toronto Waste Services (acc-212883)
  { id: 'seg-30', accountId: 'acc-212883', name: 'Toronto Top', segmentName: 'Toronto Top', shortName: 'TOR-TOP', type: 'Top', parentId: null, delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002T0xEKT' },
  { id: 'seg-31', accountId: 'acc-212883', name: 'Toronto Central', segmentName: 'Toronto Central', shortName: 'TOR-CTR', type: 'Market Area', parentId: 'seg-30', delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002U1yFLU' },
  { id: 'seg-32', accountId: 'acc-212883', name: 'Toronto East Division', segmentName: 'Toronto East Division', shortName: 'TOR-E', type: 'Division', parentId: 'seg-31', delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002V2zGMV' },

  // Vancouver Sanitation Co (acc-212882)
  { id: 'seg-40', accountId: 'acc-212882', name: 'Vancouver Metro', segmentName: 'Vancouver Metro', shortName: 'VAN-TOP', type: 'Top', parentId: null, delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002W3aHNW' },
  { id: 'seg-41', accountId: 'acc-212882', name: 'Vancouver West', segmentName: 'Vancouver West', shortName: 'VAN-W', type: 'Market Area', parentId: 'seg-40', delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002X4bIOX' },

  // Winnipeg Green Bins Ltd (acc-212884)
  { id: 'seg-50', accountId: 'acc-212884', name: 'Winnipeg Central', segmentName: 'Winnipeg Central', shortName: 'WPG-TOP', type: 'Top', parentId: null, delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002Y5cJPY' },

  // Fairfax County VA (acc-212885)
  { id: 'seg-60', accountId: 'acc-212885', name: 'Fairfax County North', segmentName: 'Fairfax County North', shortName: 'FFX-TOP', type: 'Top', parentId: null, delaySharing: false, delayDuration: 0, publicGroupId: '00G4M000002Z6dKQZ' },
];

export const ROUTES = [
  { id: 'RTE-R014', accountId: 'acc-212880', routeNumber: 'FRI-MILL-2', recordType: 'Collection', dispatch: 'D-71628', routeUID: 'UID-R014', duration: '8h', startTime: '05:40', truck: 'TRK-101', driver: 'Frank Delaney', status: 'In Progress', collectionType: 'Trash', collectionDays: 'Friday', expectedContainers: 342, segment: 'Edmonton AB' },
  { id: 'RTE-TUE2', accountId: 'acc-212880', routeNumber: 'TUE-2', recordType: 'Collection', dispatch: 'D-71678', routeUID: 'UID-TUE2', duration: '8h', startTime: '05:45', truck: 'TRK-102', driver: 'Ravi Nair', status: 'In Progress', collectionType: 'Recycle', collectionDays: 'Tuesday', expectedContainers: 88, segment: 'Edmonton AB' },
  { id: 'RTE-WED1', accountId: 'acc-212880', routeNumber: 'WED-1', recordType: 'Collection', dispatch: 'D-72110', routeUID: 'UID-WED1', duration: '9h', startTime: '06:00', truck: 'TRK-201', driver: '', status: 'Planned', collectionType: 'Recycle', collectionDays: 'Wednesday', expectedContainers: 411, segment: 'Edmonton AB' },
  { id: 'RTE-M1', accountId: 'acc-212880', routeNumber: 'MAINT-1', recordType: 'Maintenance', dispatch: 'D-72425', routeUID: 'UID-M1', duration: '6h', startTime: '07:00', truck: 'TRK-103', driver: 'David Thornton', status: 'Draft', collectionType: '', collectionDays: 'Monday,Wednesday,Friday', expectedContainers: 24, segment: 'Hauler 3' },
  { id: 'RTE-R033', accountId: 'acc-212881', routeNumber: 'SAT-1', recordType: 'Collection', dispatch: 'D-72540', routeUID: 'UID-SAT1', duration: '10h', startTime: '05:30', truck: 'TRK-201', driver: '', status: 'Draft', collectionType: 'Trash', collectionDays: 'Saturday', expectedContainers: 220, segment: 'Calgary Metro' },
];

export const PRODUCTS_BY_ACCOUNT = {
  'acc-212880': [
    { id: 'SPP-5749', number: 'SPP-5749', code: '120LiterTrash', product: '120 Liter Trash', size: '120 Liter', sizeType: 'Liter', category: 'Residential', family: 'Roll-Out Cart' },
    { id: 'SPP-5751', number: 'SPP-5751', code: '360LiterOrganics', product: '360 Liter Organics Universal Cart', size: '360 Liter', sizeType: 'Liter', category: 'Residential', family: 'Universal Cart' },
    { id: 'SPP-5752', number: 'SPP-5752', code: '120LiterOrganics', product: '120 Liter Organics', size: '120 Liter', sizeType: 'Liter', category: 'Residential', family: 'Roll-Out Cart' },
    { id: 'SPP-5837', number: 'SPP-5837', code: '360LiterTrash', product: '360 Liter Trash Universal Cart', size: '360 Liter', sizeType: 'Liter', category: 'Residential', family: 'Universal Cart' },
    { id: 'SPP-5933', number: 'SPP-5933', code: '240LiterTrash', product: '240 Liter Trash', size: '240 Liter', sizeType: 'Liter', category: 'Residential', family: 'Roll-Out Cart' },
    { id: 'SPP-6255', number: 'SPP-6255', code: 'OBS3', product: '96 Gallon Trash', size: '96 Gallon', sizeType: 'Gallon', category: 'Residential', family: 'Roll-Out Cart' },
    { id: 'SPP-6253', number: 'SPP-6253', code: 'OBS1', product: '120 Liter Trash (Old)', size: '120 Liter', sizeType: 'Liter', category: 'Residential', family: 'Roll-Out Cart' },
    { id: 'SPP-6241', number: 'SPP-6241', code: 'CP3', product: '3 YD Garbage Bin Trash', size: '3 YD Garbage Bin', sizeType: 'Yard', category: 'Commercial', family: 'Bin' },
    { id: 'SPP-6242', number: 'SPP-6242', code: 'CP4', product: '4 YD Garbage Bin Trash', size: '4 YD Garbage Bin', sizeType: 'Yard', category: 'Commercial', family: 'Bin' },
    { id: 'SPP-6244', number: 'SPP-6244', code: 'RCP3', product: '3 YD Recycle Bin Recycling', size: '3 YD Recycle Bin', sizeType: 'Yard', category: 'Commercial', family: 'Bin' },
  ],
};

// KPI helpers for the SP dashboard (Ch. dashboard visuals from render)
export const HOT_TICKET_AGING = [
  { name: 'Edmonton AB', breach: true, total: 5, buckets: [2, 1, 1, 1] },
  { name: 'Calgary Metro Waste', breach: true, total: 8, buckets: [2, 2, 2, 2] },
  { name: 'Vancouver Sanitation Co', breach: false, total: 8, buckets: [3, 3, 2, 0] },
  { name: 'Toronto Waste Services', breach: false, total: 7, buckets: [4, 1, 2, 0] },
  { name: 'Fairfax County VA', breach: false, total: 4, buckets: [1, 3, 0, 0] },
];

export const MISSED_PICKUPS_30D = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  Trash: 3 + Math.round(3 * Math.abs(Math.sin(i / 2))),
  Recycle: 2 + Math.round(2 * Math.abs(Math.cos(i / 3))),
  Organic: 1 + Math.round(2 * Math.abs(Math.sin(i / 4 + 1))),
}));

export const LIVE_DISPATCHES = [
  { id: 'D-72110', account: 'Edmonton AB', truck: 'TRK-201', pct: 62 },
  { id: 'D-72114', account: 'Edmonton AB', truck: 'TRK-102 · Ravi Nair', pct: 41 },
];

export const PRIORITY_WORK_ORDERS = [
  { id: '03933942', priority: 'Medium', subject: 'Deliver — 96G cart', account: 'Edmonton AB', owner: 'Yolanda Wagner' },
  { id: '03933920', priority: 'Medium', subject: 'Inactive Account Removal', account: 'Edmonton AB', owner: 'Yolanda Wagner' },
  { id: '03933921', priority: 'High', subject: 'Missed Pickup — Downtown Multi', account: 'Edmonton AB', owner: 'Yolanda Wagner' },
];
