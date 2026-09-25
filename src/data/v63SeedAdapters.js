import {
  V63_ACCOUNTS,
  V63_API_INTEGRATIONS,
  V63_CONFIG,
  V63_CONTACTS,
} from './v63HtmlExtras.js';

export function mapHtmlServiceTypes() {
  return V63_CONFIG.serviceTypes.map((row) => ({
    ...row,
    containerColour: row.containerColor,
    requiresSpecialHandlingLicense: row.specialLicense,
    availableForResidential: row.residential,
    availableForCommercial: row.commercial,
    isActive: row.active,
    serviceCode: row.code,
    wasteStreamCategory:
      row.wasteStream === 'Hazardous'
        ? 'Hazardous'
        : row.wasteStream === 'Recycling'
          ? 'Recycling'
          : row.wasteStream === 'Organics'
            ? 'Organics'
            : row.wasteStream === 'Bulk'
              ? 'Bulk'
              : 'Trash',
  }));
}

export function mapHtmlLocationTypes() {
  return V63_CONFIG.locationTypes.map((row) => ({
    ...row,
    needsSegment: row.requiresSegment,
    sort: row.sortOrder,
    typeCode: row.code,
    isActive: row.active,
  }));
}

export function mapHtmlAssetTypes() {
  return V63_CONFIG.assetTypes.map((row, index) => ({
    ...row,
    code: row.code || row.name,
    category: row.category || row.name,
    sortOrder: (index + 1) * 10,
    isActive: row.enabled !== false,
  }));
}

export function mapHtmlProductTypes() {
  return V63_CONFIG.productTypes.map((row) => ({
    ...row,
    category: row.serviceCategory,
    isActive: row.active,
  }));
}

export function mapHtmlDevices() {
  return V63_CONFIG.device.map((row) => ({
    ...row,
    name: row.deviceId,
    code: row.deviceId,
    type: row.deviceType,
    manufacturer: 'Venture',
    isActive: row.status === 'Active' || row.enabled,
    description: [row.serviceProviderName, row.segmentName, row.truckNumber].filter(Boolean).join(' · '),
  }));
}

export function mapHtmlTruckTypes() {
  return V63_CONFIG.truck.map((row) => ({
    ...row,
    name: row.truckId,
    code: row.truckId,
    type: row.truckType,
    isActive: row.status === 'Active' || row.enabled,
    description: [row.serviceType, row.warehouseLocation].filter(Boolean).join(' · '),
  }));
}

export function mapHtmlTagSchemes() {
  return V63_CONFIG.tagScheme.map((row) => ({ ...row }));
}

export function mapHtmlNotificationConfig() {
  return V63_CONFIG.serviceNotifConfig.map((row) => ({
    ...row,
    event: row.event,
    channel: row.channel,
    priority: row.priority,
  }));
}

export function mapHtmlApiIntegrations() {
  const operational = V63_API_INTEGRATIONS.map((row) => ({
    id: row.id,
    name: row.account,
    endpoint: row.endpoint,
    status: row.status,
    calls30d: row.callsLast30d,
    lastCall: row.lastCall,
    migrationImpact: row.migrationImpact,
    description: row.migrationImpact,
  }));
  const platform = (V63_CONFIG.apiIntegrations || []).map((row) => ({
    id: row.id,
    name: row.name,
    endpoint: row.endpoint,
    status: row.status,
    calls30d: row.callsLast30d,
    description: row.description,
  }));
  return [...operational, ...platform];
}

export function enrichContacts(contacts) {
  const htmlById = Object.fromEntries(V63_CONTACTS.map((row) => [row.id, row]));
  return contacts.map((contact) => {
    const html = htmlById[contact.id];
    if (!html) return contact;
    return {
      ...contact,
      nickName: html.nickName,
      fax: html.fax,
      reportsTo: html.reportsTo || contact.reportsTo || '',
      mailingCountry: html.mailingCountry,
      mailingStreet: html.mailingStreet,
      mailingCity: html.mailingCity,
      mailingState: html.mailingState,
      mailingZip: html.mailingZip,
      account: html.account,
    };
  });
}

export function enrichAccounts(accounts) {
  const htmlByUid = Object.fromEntries(V63_ACCOUNTS.map((row) => [String(row.serviceProviderUID), row]));
  return accounts.map((account) => {
    const html = htmlByUid[String(account.uid)];
    if (!html) return account;
    return {
      ...account,
      accountType: html.accountType,
      parentAccount: html.parentAccount,
      website: html.website || account.website,
      description: html.description || account.description,
      employees: html.employees ?? account.employees,
      supportEmail: html.supportEmail || account.supportEmail,
      serviceModules: html.serviceModules || account.serviceModules,
      billing: {
        country: html.billingCountry === 'USA' ? 'United States' : html.billingCountry,
        street: html.billingStreet,
        city: html.billingCity,
        state: html.billingState,
        zip: html.billingZip,
      },
      shipping: {
        country: html.shippingCountry === 'USA' ? 'United States' : html.shippingCountry,
        street: html.shippingStreet,
        city: html.shippingCity,
        state: html.shippingState,
        zip: html.shippingZip,
      },
    };
  });
}

export { V63_SAVED_REPORTS } from './v63HtmlExtras.js';
