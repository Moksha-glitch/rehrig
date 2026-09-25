import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, '_tmp_v63_data');

function loadRaw(name) {
  const raw = fs.readFileSync(path.join(srcDir, `${name}.raw.js`), 'utf8');
  const transformed = raw.replace(/!0/g, 'true').replace(/!1/g, 'false');
  return Function(`"use strict"; return (${transformed});`)();
}

const FAMILY_BY_PRODUCT = {
  '96 Gallon Trash': 'Roll-Out Cart',
  '120 Liter Trash': 'Roll-Out Cart',
  '3 YD Garbage Bin Trash': 'Bin',
};

function first(value) {
  return Array.isArray(value) ? value[0] || '' : value ?? '';
}

function locationAddress(loc) {
  return [loc.houseNumber, loc.street, loc.unitNumber, loc.city, loc.state, loc.zipCode]
    .filter(Boolean)
    .join(', ');
}

function overlay(record, aliases) {
  const next = { ...record };
  for (const [reactKey, htmlKey] of Object.entries(aliases)) {
    if (next[reactKey] == null || next[reactKey] === '') {
      const value = typeof htmlKey === 'function' ? htmlKey(record) : record[htmlKey];
      if (value !== undefined) next[reactKey] = value;
    }
  }
  return next;
}

const workOrders = loadRaw('workOrders').map((row) =>
  overlay(
    {
      ...row,
      notifyVia: Array.isArray(row.notifyVia) ? row.notifyVia.join(', ') : row.notifyVia || '',
    },
    {
    number: 'workOrderNumber',
    owner: 'workOrderOwner',
    status: 'caseStatus',
    customer: 'customerAccount',
    location: 'customerLocation',
    attempts: 'numberOfAttempts',
    collectionRoute: 'collectionRouteNumber',
    luid: 'workOrderLuid',
    attachments: 'numberOfAttachments',
  })
);

const dispatches = loadRaw('dispatches').map((row) =>
  overlay(
    {
      ...row,
      serviceType: first(row.serviceType),
    },
    {
      number: 'dispatchNumber',
      mrp: 'maintenanceRouteProfile',
      segment: 'serviceProviderSegment',
    }
  )
);

const assets = loadRaw('assets').map((row) =>
  overlay(
    {
      ...row,
      family: FAMILY_BY_PRODUCT[row.product] || row.family || '',
      conditions: Array.isArray(row.containerConditions)
        ? row.containerConditions.join(', ')
        : row.containerConditions || '',
    },
    {
      name: 'assetName',
      serial: 'serialNumber',
      status: 'assetStatus',
      subStatus: 'assetSubStatus',
      rfid: 'rfidNumber',
      location: 'customerLocation',
      recordType: 'assetRecordType',
      competitor: 'competitorAsset',
      unvalidated: 'unvalidatedSerialNumber',
      container: 'containerNumber',
    }
  )
);

const trucks = loadRaw('trucks').map((row) =>
  overlay(
    {
      ...row,
      driver: row.driver === '—' ? '' : row.driver,
    },
    {
      name: 'truckName',
      number: 'truckNumber',
      warehouse: 'warehouseLocation',
    }
  )
);

const locations = loadRaw('locations').map((row) =>
  overlay(
    {
      ...row,
      address: locationAddress(row),
    },
    {
      name: 'locationName',
      number: 'locationNumber',
      type: 'locationType',
      zip: 'zipCode',
      unit: 'unitNumber',
      trashRoute: 'trashCollectionRoute',
      recycleRoute: 'recycleCollectionRoute',
      organicRoute: 'organicCollectionRoute',
      yardRoute: 'yardWasteRoute',
    }
  )
);

const locationById = Object.fromEntries(locations.map((loc) => [loc.id, loc]));
const customerLocations = loadRaw('customerLocations');

const customers = loadRaw('customers').map((row) => {
  const junctions = customerLocations.filter((item) => item.customer === row.id);
  const preferred = junctions.find((item) => item.isActive) || junctions[0];
  const loc = preferred ? locationById[preferred.location] : null;
  return overlay(
    {
      ...row,
      locationId: loc?.id || '',
      location: loc?.locationName || loc?.name || '',
      address: loc ? loc.address : '',
    },
    {
      mobile: 'mobilePhone',
    }
  );
});

const routes = loadRaw('routes').map((row) =>
  overlay(row, {
    duration: 'configuredDuration',
    startTime: 'configuredStartTime',
    segment: 'serviceProviderSegment',
  })
);

const maintenanceRouteProfiles = loadRaw('maintProfiles').map((row) =>
  overlay(
    {
      ...row,
      status: 'Active',
    },
    {
      name: 'maintenanceRouteProfileName',
      segment: 'serviceProviderSegment',
    }
  )
);

const notesAttachments = loadRaw('notes').map((row) =>
  overlay(
    {
      ...row,
      type: 'Note',
      relatedTo: row.account,
    },
    {
      title: 'subject',
      createdBy: 'author',
    }
  )
);

const requestTypes = loadRaw('requestTypes');
const resolutionCodes = loadRaw('resolutionCodes');
const reqCodes = loadRaw('reqCodes').map((row) =>
  overlay(row, {
    rrcNumber: 'id',
    workflow: 'workflowType',
    attempts: 'numberOfAttempts',
  })
);

const seenResolutions = new Set();
const requestTypeResolutions = reqCodes
  .filter((row) => {
    const key = `${row.requestType}|${row.resolutionCode}`;
    if (seenResolutions.has(key)) return false;
    seenResolutions.add(key);
    return true;
  })
  .map((row) => ({
    name: row.requestType,
    resolution: row.resolutionCode,
    serviceType: row.workflowType === 'Swap' ? 'Residential' : 'Residential',
    active: true,
    account: row.account,
    sla: '',
    segment: row.segment,
  }));

const aggregatedTips = loadRaw('aggTips').map((row) =>
  overlay(row, {
    name: 'aggregatedName',
    tips: 'numTips',
  })
);

const individualTips = loadRaw('tips').map((row) =>
  overlay(
    {
      ...row,
      timestamp: String(row.eventStartDateTime || '').replace(' ', 'T'),
      type: row.wasTipped ? 'Tip' : 'Non-Tip',
    },
    {
      name: 'individualTipName',
      location: 'locationAddress',
      truck: 'sfdcTruckId',
      asset: 'assetSerial',
    }
  )
);

const serviceNotifications = loadRaw('notifications').map((row) =>
  overlay(
    {
      ...row,
      channel: 'Email',
      status: row.enableServiceNotifications ? 'Active' : 'Inactive',
    },
    {
      name: 'serviceNotificationName',
      trigger: 'toBeSentBasedOn',
    }
  )
);

const masterProducts = loadRaw('masterProducts').map((row) =>
  overlay(row, {
    name: 'productName',
    family: 'productFamily',
    code: (record) => record.id,
  })
);

const products = loadRaw('products').map((row) =>
  overlay(
    {
      ...row,
      status: row.active ? 'Active' : 'Inactive',
    },
    {
      number: 'sppNumber',
      product: 'productName',
      code: 'productCode',
      size: 'productSize',
      sizeType: 'productSizeType',
      category: 'serviceCategory',
      family: 'productFamily',
      description: 'productDescription',
    }
  )
);

const records = {
  workOrders,
  dispatches,
  assets,
  trucks,
  locations,
  customers,
  customerLocations,
  routes,
  maintenanceRouteProfiles,
  notesAttachments,
  requestTypes,
  resolutionCodes,
  reqCodes,
  requestTypeResolutions,
  aggregatedTips,
  individualTips,
  serviceNotifications,
  masterProducts,
  products,
};

const header = `// Mapped operational records from Vision V6.3 Segment-based prototype.
// Native HTML fields are kept; React list/drawer aliases are filled alongside them.
export const V63_RECORDS = `;

fs.writeFileSync(
  path.join(root, 'src/data/v63Records.js'),
  `${header}${JSON.stringify(records, null, 2)};\n`,
  'utf8'
);

const config = loadRaw('configItems');
const reports = loadRaw('savedReports');
const contacts = loadRaw('contacts');
const accounts = loadRaw('accounts');
const apiIntegrations = loadRaw('apiIntegrations');

fs.writeFileSync(
  path.join(root, 'src/data/v63HtmlExtras.js'),
  `// HTML V6.3 extras used by seed.js (config, contacts, reports, accounts).
export const V63_CONFIG = ${JSON.stringify(config, null, 2)};

export const V63_CONTACTS = ${JSON.stringify(contacts, null, 2)};

export const V63_ACCOUNTS = ${JSON.stringify(accounts, null, 2)};

export const V63_API_INTEGRATIONS = ${JSON.stringify(apiIntegrations, null, 2)};

export const V63_SAVED_REPORTS = ${JSON.stringify(reports, null, 2)};
`,
  'utf8'
);

const counts = Object.fromEntries(
  Object.entries(records).map(([key, value]) => [key, value.length])
);
console.log('wrote v63Records', counts);
console.log('config keys', Object.keys(config).map((key) => `${key}:${config[key].length}`).join(' '));
