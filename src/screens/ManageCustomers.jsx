import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Badge,
  Button,
  EmptyState,
  Page,
  PageHeader,
  Panel,
  SearchField,
  Select,
  Table,
  AsyncState,
  activateRow,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useRecords } from '../hooks/useRecords.js';
import { getErrorMessage } from '../lib/errors.js';
import CustomerMapPanel from '../components/CustomerMapPanel.jsx';

function locName(location) {
  return location?.locationName || location?.name || '';
}

function locZip(location) {
  return location?.zipCode || location?.zip || '';
}

function siteOf(record) {
  return record?.customerLocation || record?.customer || record?.location || record?.customerAccount || '';
}

function matchesSite(record, location) {
  if (!record || !location) return false;
  const site = String(siteOf(record)).toLowerCase();
  const names = [locName(location), location.address, location.street, `${location.houseNumber || ''} ${location.street || ''}`]
    .map((value) => String(value || '').toLowerCase().trim())
    .filter(Boolean);
  return names.some((name) => site === name || site.includes(name) || name.includes(site));
}

function matchCustomer(customer, query, junctions, locations) {
  if (!query) return { matched: true, tag: null };
  const term = query.toLowerCase();
  if (String(customer.customerId || '').toLowerCase().includes(term)) return { matched: true, tag: 'Account #' };
  if (String(customer.customerNumber || '').toLowerCase().includes(term)) return { matched: true, tag: 'Account #' };
  if (String(customer.name || '').toLowerCase().includes(term)) return { matched: true, tag: 'Customer Name' };
  if (String(customer.phone || '').toLowerCase().includes(term)) return { matched: true, tag: 'Phone' };
  if (String(customer.email || '').toLowerCase().includes(term)) return { matched: true, tag: 'Email' };
  const links = junctions.filter((row) => row.customer === customer.id && row.isActive !== false);
  for (const link of links) {
    const location = locations.find((item) => item.id === link.location);
    if (!location) continue;
    if (String(location.houseNumber || '').toLowerCase().includes(term)) return { matched: true, tag: 'House Number' };
    if (String(location.street || '').toLowerCase().includes(term)) return { matched: true, tag: 'Street' };
    if (String(location.unitNumber || '').toLowerCase().includes(term)) return { matched: true, tag: 'Unit #' };
    if (String(location.city || '').toLowerCase().includes(term)) return { matched: true, tag: 'City' };
    if (String(locZip(location)).toLowerCase().includes(term)) return { matched: true, tag: 'Postal Code' };
    if (String(locName(location)).toLowerCase().includes(term)) return { matched: true, tag: 'Location' };
    if (String(location.address || '').toLowerCase().includes(term)) return { matched: true, tag: 'Address' };
  }
  return { matched: false, tag: null };
}

function activeLocation(customer, junctions, locations) {
  const link = junctions.find((row) => row.customer === customer?.id && row.isActive !== false);
  return link ? locations.find((item) => item.id === link.location) || null : null;
}

export default function ManageCustomers() {
  const { navigate, isScoped, scopedAccounts } = useStore();
  const customersQuery = useRecords('customers');
  const locationsQuery = useRecords('locations');
  const junctionsQuery = useRecords('customerLocations');
  const assetsQuery = useRecords('assets');
  const tipsQuery = useRecords('individualTips');
  const workOrdersQuery = useRecords('workOrders');

  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState(null);
  const [searchIn, setSearchIn] = useState('accounts');
  const [status, setStatus] = useState('active');
  const [selectedId, setSelectedId] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);

  const customers = customersQuery.data?.data || [];
  const locations = locationsQuery.data?.data || [];
  const junctions = junctionsQuery.data?.data || [];
  const assets = assetsQuery.data?.data || [];
  const tips = tipsQuery.data?.data || [];
  const workOrders = workOrdersQuery.data?.data || [];

  const accountNames = useMemo(() => {
    if (!isScoped) return null;
    return new Set((scopedAccounts || []).map((account) => account.name));
  }, [isScoped, scopedAccounts]);

  const scopedCustomers = useMemo(
    () => (accountNames ? customers.filter((row) => accountNames.has(row.account)) : customers),
    [customers, accountNames]
  );
  const scopedLocations = useMemo(
    () => (accountNames ? locations.filter((row) => accountNames.has(row.account)) : locations),
    [locations, accountNames]
  );
  const scopedJunctions = useMemo(
    () => (accountNames ? junctions.filter((row) => accountNames.has(row.account)) : junctions),
    [junctions, accountNames]
  );
  const scopedAssets = useMemo(
    () => (accountNames ? assets.filter((row) => accountNames.has(row.account)) : assets),
    [assets, accountNames]
  );
  const scopedWorkOrders = useMemo(
    () => (accountNames ? workOrders.filter((row) => accountNames.has(row.account)) : workOrders),
    [workOrders, accountNames]
  );

  const activeCustomerIds = useMemo(
    () => new Set(scopedJunctions.filter((row) => row.isActive !== false).map((row) => row.customer)),
    [scopedJunctions]
  );

  const searched = query !== null;
  const term = String(query || '').trim();

  const customerHits = useMemo(() => {
    if (!searched) return [];
    return scopedCustomers
      .filter((customer) => (status === 'active' ? activeCustomerIds.has(customer.id) : status === 'inactive' ? !activeCustomerIds.has(customer.id) : true))
      .map((customer) => {
        const hit = matchCustomer(customer, term, scopedJunctions, scopedLocations);
        if (!hit.matched) return null;
        const location = activeLocation(customer, scopedJunctions, scopedLocations);
        return { customer, location, tag: hit.tag };
      })
      .filter(Boolean);
  }, [searched, scopedCustomers, scopedJunctions, scopedLocations, status, term, activeCustomerIds]);

  const workOrderHits = useMemo(() => {
    if (!searched) return [];
    const needle = term.toLowerCase();
    return scopedWorkOrders.filter((row) => {
      if (!needle) return true;
      if (String(row.workOrderNumber || row.number || '').toLowerCase().includes(needle)) return true;
      const location = scopedLocations.find((item) => matchesSite(row, item));
      if (!location) return String(siteOf(row)).toLowerCase().includes(needle);
      return [location.houseNumber, location.street, location.city, locZip(location), locName(location)].some((value) =>
        String(value || '').toLowerCase().includes(needle)
      );
    });
  }, [searched, scopedWorkOrders, scopedLocations, term]);

  const assetHits = useMemo(() => {
    if (!searched) return [];
    const needle = term.toLowerCase();
    return scopedAssets.filter((row) => {
      if (!needle) return true;
      return [row.serial, row.serialNumber, row.rfid, row.rfidNumber, row.name, siteOf(row)].some((value) =>
        String(value || '').toLowerCase().includes(needle)
      );
    });
  }, [searched, scopedAssets, term]);

  const selected = scopedCustomers.find((customer) => customer.id === selectedId) || null;
  const selectedLocation = activeLocation(selected, scopedJunctions, scopedLocations);
  const selectedAssets = selectedLocation
    ? scopedAssets.filter((row) => matchesSite(row, selectedLocation))
    : [];
  const selectedWorkOrders = selectedLocation
    ? scopedWorkOrders.filter((row) => matchesSite(row, selectedLocation))
    : [];
  const selectedTips = selectedLocation
    ? tips.filter((row) => matchesSite(row, selectedLocation))
    : [];
  const selectedLocations = selectedLocation ? [selectedLocation] : [];

  const history = [
    ...selectedTips.map((tip) => ({
      id: tip.id,
      when: tip.timestamp || tip.eventStartDateTime,
      type: tip.type || (tip.wasTipped ? 'Tip' : 'Non-Tip'),
      detail: [tip.truck, tip.location].filter(Boolean).join(' · '),
    })),
    ...selectedWorkOrders.map((wo) => ({
      id: wo.id || wo.number,
      when: wo.completionDate || wo.dueDate || wo.requestDate,
      type: 'Work Order',
      detail: [wo.number || wo.workOrderNumber, wo.requestType, wo.caseStatus || wo.status].filter(Boolean).join(' · '),
    })),
    ...selectedLocations.map((loc) => ({
      id: loc.id || loc.number,
      when: loc.address || loc.city,
      type: 'Location',
      detail: [locName(loc), loc.city].filter(Boolean).join(' · '),
    })),
  ]
    .sort((a, b) => String(b.when || '').localeCompare(String(a.when || '')))
    .slice(0, 12);

  const loading = customersQuery.isLoading || locationsQuery.isLoading || junctionsQuery.isLoading;
  const error = [customersQuery, locationsQuery, junctionsQuery]
    .filter((item) => item.isError)
    .map((item) => getErrorMessage(item.error))
    .join(' ');

  const runSearch = (event) => {
    event?.preventDefault?.();
    setSelectedId(null);
    setMapOpen(false);
    setQuery(draft.trim());
  };

  const clearSearch = () => {
    setDraft('');
    setQuery(null);
    setSelectedId(null);
    setMapOpen(false);
  };

  const openFromWorkOrder = (row) => {
    const location = scopedLocations.find((item) => matchesSite(row, item));
    const link = location
      ? scopedJunctions.find((item) => item.location === location.id && item.isActive !== false)
      : null;
    if (link) {
      setSelectedId(link.customer);
      setMapOpen(false);
    }
  };

  return (
    <Page>
      <PageHeader
        overline="Activities"
        title="Manage Customers"
        description="Search by account #, name, phone, house number, street, city, or postal code. Related assets and work orders stay attached through the customer-location junction."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('customers')}>
              All customers
            </Button>
            {selected && (
              <Button variant="secondary" onClick={() => setSelectedId(null)}>
                Back to search
              </Button>
            )}
          </div>
        }
      />

      <AsyncState
        loading={loading}
        error={error || null}
        onRetry={() => {
          customersQuery.refetch?.();
          locationsQuery.refetch?.();
          junctionsQuery.refetch?.();
        }}
      >
        {!selected ? (
          <div className="space-y-5">
            <Panel padded>
              <form className="grid grid-cols-1 gap-3 lg:grid-cols-12" onSubmit={runSearch}>
                <div className="lg:col-span-5">
                  <SearchField
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Account #, name, phone, 12802, 58th Street, T5A…"
                    label="Search customers"
                  />
                </div>
                <div className="lg:col-span-2">
                  <Select
                    value={searchIn}
                    onChange={(event) => setSearchIn(event.target.value)}
                    options={[
                      { value: 'accounts', label: 'Customers' },
                      { value: 'workOrders', label: 'Work orders' },
                      { value: 'assets', label: 'Assets' },
                    ]}
                    aria-label="Search in"
                  />
                </div>
                <div className="lg:col-span-2">
                  <Select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    options={[
                      { value: 'active', label: 'Active sites' },
                      { value: 'inactive', label: 'Inactive sites' },
                      { value: 'all', label: 'All customers' },
                    ]}
                    aria-label="Site status"
                  />
                </div>
                <div className="flex flex-wrap gap-2 lg:col-span-3">
                  <Button type="submit" variant="primary">
                    Search
                  </Button>
                  <Button type="button" variant="secondary" onClick={clearSearch}>
                    Clear
                  </Button>
                </div>
              </form>
              <p className="mt-3 text-xs text-ink-muted">
                Location data is searched through customer-location records, the same way as the V6.3 workspace.
              </p>
            </Panel>

            {!searched ? (
              <Panel padded>
                <EmptyState
                  icon="search"
                  title="Search to load customer records"
                  description="Type an account number, customer name, phone, house number, street, city, or postal code, then search. Results stay on this page."
                />
              </Panel>
            ) : searchIn === 'accounts' ? (
              <Panel>
                <div className="border-b border-line px-5 py-3">
                  <p className="type-overline">{customerHits.length} customer{customerHits.length === 1 ? '' : 's'}</p>
                </div>
                {customerHits.length ? (
                  <Table columns={['Account #', 'Customer', 'Address', 'City', 'Matched on']}>
                    {customerHits.map(({ customer, location, tag }) => (
                      <tr
                        key={customer.id}
                        className="interactive cursor-pointer hover:bg-elevated/70"
                        onClick={(event) => activateRow(event, () => setSelectedId(customer.id))}
                      >
                        <td className="mono px-4 py-3 text-ink-muted">{customer.customerId || customer.customerNumber}</td>
                        <td className="px-4 py-3 font-medium text-ink">{customer.name}</td>
                        <td className="px-4 py-3 text-ink-muted">
                          {[location?.houseNumber, location?.street].filter(Boolean).join(' ') || locName(location) || '—'}
                        </td>
                        <td className="px-4 py-3 text-ink-muted">{location?.city || '—'}</td>
                        <td className="px-4 py-3">{tag ? <Badge color="blue">{tag}</Badge> : '—'}</td>
                      </tr>
                    ))}
                  </Table>
                ) : (
                  <EmptyState title="No customers matched" description="Try a house number, street, postal code, or switch to All customers." />
                )}
              </Panel>
            ) : searchIn === 'workOrders' ? (
              <Panel>
                <div className="border-b border-line px-5 py-3">
                  <p className="type-overline">{workOrderHits.length} work order{workOrderHits.length === 1 ? '' : 's'}</p>
                </div>
                {workOrderHits.length ? (
                  <Table columns={['Work Order', 'Subject', 'Status', 'Location']}>
                    {workOrderHits.map((row) => (
                      <tr
                        key={row.id || row.number}
                        className="interactive cursor-pointer hover:bg-elevated/70"
                        onClick={(event) => activateRow(event, () => openFromWorkOrder(row))}
                      >
                        <td className="mono px-4 py-3 text-ink">{row.workOrderNumber || row.number}</td>
                        <td className="px-4 py-3 text-ink-muted">{row.subject || row.requestType}</td>
                        <td className="px-4 py-3">
                          <Badge color="amber">{row.caseStatus || row.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-ink-muted">{siteOf(row) || '—'}</td>
                      </tr>
                    ))}
                  </Table>
                ) : (
                  <EmptyState title="No work orders matched" description="Search a work order number or a site address." />
                )}
              </Panel>
            ) : (
              <Panel>
                <div className="border-b border-line px-5 py-3">
                  <p className="type-overline">{assetHits.length} asset{assetHits.length === 1 ? '' : 's'}</p>
                </div>
                {assetHits.length ? (
                  <Table columns={['Asset', 'Serial', 'Status', 'Location']}>
                    {assetHits.map((row) => (
                      <tr key={row.id || row.serial} className="interactive hover:bg-elevated/70">
                        <td className="px-4 py-3 font-medium text-ink">{row.name || row.assetName}</td>
                        <td className="mono px-4 py-3 text-ink-muted">{row.serial || row.serialNumber}</td>
                        <td className="px-4 py-3">
                          <Badge color="cyan">{row.status || row.assetStatus}</Badge>
                        </td>
                        <td className="px-4 py-3 text-ink-muted">{siteOf(row) || '—'}</td>
                      </tr>
                    ))}
                  </Table>
                ) : (
                  <EmptyState title="No assets matched" description="Search a serial, RFID, or customer location." />
                )}
              </Panel>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
            <aside className="space-y-4 xl:sticky xl:top-4 xl:col-span-4">
              <Panel padded>
                <p className="type-overline">Account {selected.customerId || selected.customerNumber}</p>
                <p className="mt-1 font-display text-title-sm text-ink">{selected.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {[selectedLocation?.houseNumber, selectedLocation?.street, selectedLocation?.city, locZip(selectedLocation)]
                    .filter(Boolean)
                    .join(', ') || selected.address || 'No active location'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge color={selectedLocation ? 'green' : 'slate'}>
                    {selectedLocation ? 'Active site' : 'No active site'}
                  </Badge>
                  {selected.segment && <Badge color="blue">{selected.segment}</Badge>}
                </div>
                <div className="mt-4">
                  <Button variant={mapOpen ? 'primary' : 'secondary'} onClick={() => setMapOpen((open) => !open)}>
                    <Icon name="map" size={14} /> {mapOpen ? 'Hide map' : 'Map'}
                  </Button>
                </div>
              </Panel>

              <div className="grid grid-cols-1 gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2">
                {[
                  ['Email', selected.email],
                  ['Phone', selected.phone || selected.mobile],
                  ['Owner', selected.owner],
                  ['Service provider', selected.account],
                  ['Location', locName(selectedLocation) || selected.location],
                  ['Parent customer', selected.parentCustomer],
                ].map(([label, value]) => (
                  <div key={label} className="bg-surface px-4 py-3">
                    <p className="type-overline">{label}</p>
                    <p className="mt-1 truncate text-sm font-medium text-ink">{value || '—'}</p>
                  </div>
                ))}
              </div>

              {mapOpen && (
                <CustomerMapPanel
                  customer={selected}
                  locations={selectedLocations}
                  assets={selectedAssets}
                  onClose={() => setMapOpen(false)}
                />
              )}
            </aside>

            <section className="space-y-4 xl:col-span-8">
              <div className="grid grid-cols-1 gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-3">
                {[
                  ['Assets', selectedAssets.length, 'At this location'],
                  ['Work orders', selectedWorkOrders.length, 'Linked to this site'],
                  ['History', history.length, 'Tips, WOs, and locations'],
                ].map(([label, value, hint]) => (
                  <div key={label} className="bg-surface px-5 py-4">
                    <p className="type-overline">{label}</p>
                    <p className="mt-1 font-display text-[1.45rem] font-bold tracking-tight text-ink">{value}</p>
                    <p className="mt-1 text-[11px] text-ink-muted">{hint}</p>
                  </div>
                ))}
              </div>

              <Panel>
                <div className="border-b border-line px-5 py-3">
                  <p className="type-overline">Assets</p>
                </div>
                {selectedAssets.length ? (
                  <Table columns={['Asset Name', 'Serial', 'Status', 'Location', 'Product']}>
                    {selectedAssets.map((asset) => (
                      <tr key={asset.id || asset.serial} className="interactive hover:bg-elevated/70">
                        <td className="px-4 py-3 font-medium text-ink">{asset.name}</td>
                        <td className="mono px-4 py-3 text-ink-muted">{asset.serial || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge color="cyan">{asset.status || asset.assetStatus || '—'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-ink-muted">{siteOf(asset) || '—'}</td>
                        <td className="px-4 py-3 text-ink-muted">{asset.product || '—'}</td>
                      </tr>
                    ))}
                  </Table>
                ) : (
                  <EmptyState title="No assets" description="No assets are assigned to this customer’s active location." />
                )}
              </Panel>

              <Panel>
                <div className="border-b border-line px-5 py-3">
                  <p className="type-overline">Work orders</p>
                </div>
                {selectedWorkOrders.length ? (
                  <Table columns={['Work Order', 'Subject', 'Status', 'Due', 'Request Type']}>
                    {selectedWorkOrders.map((row) => (
                      <tr key={row.id || row.number} className="interactive hover:bg-elevated/70">
                        <td className="mono px-4 py-3 text-ink">{row.workOrderNumber || row.number}</td>
                        <td className="px-4 py-3 text-ink-muted">{row.subject || row.requestType || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge color="amber">{row.caseStatus || row.status || '—'}</Badge>
                        </td>
                        <td className="mono px-4 py-3 text-ink-muted">{row.dueDate || '—'}</td>
                        <td className="px-4 py-3 text-ink-muted">{row.requestType || '—'}</td>
                      </tr>
                    ))}
                  </Table>
                ) : (
                  <EmptyState title="No work orders" description="No work orders are linked to this customer’s active location." />
                )}
              </Panel>

              <Panel>
                <div className="border-b border-line px-5 py-3">
                  <p className="type-overline">History</p>
                </div>
                {history.length ? (
                  <Table columns={['When', 'Type', 'Detail']}>
                    {history.map((entry) => (
                      <tr key={`${entry.type}-${entry.id}`}>
                        <td className="mono px-4 py-3 text-ink-muted">{entry.when || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge color={entry.type === 'Work Order' ? 'amber' : 'slate'}>{entry.type}</Badge>
                        </td>
                        <td className="px-4 py-3 text-ink-muted">{entry.detail || '—'}</td>
                      </tr>
                    ))}
                  </Table>
                ) : (
                  <EmptyState title="No history" description="No tips, work orders, or locations are linked through this site." />
                )}
              </Panel>
            </section>
          </div>
        )}
      </AsyncState>
    </Page>
  );
}
