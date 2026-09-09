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
  Table,
  Toolbar,
  AsyncState,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useRecords } from '../hooks/useRecords.js';
import { getErrorMessage } from '../lib/errors.js';

function belongsToCustomer(record, customer) {
  if (!record || !customer) return false;
  const keys = [customer.name, customer.customerNumber, customer.id]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  return [
    record.customer,
    record.customerId,
    record.account,
    record.location,
    record.name,
  ].some((value) => value != null && keys.includes(String(value).toLowerCase()));
}

export default function ManageCustomers() {
  const { navigate } = useStore();
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const customersQuery = useRecords('customers');
  const assetsQuery = useRecords('assets');
  const tipsQuery = useRecords('individualTips');
  const workOrdersQuery = useRecords('workOrders');
  const locationsQuery = useRecords('locations');

  const customers = customersQuery.data?.data || [];
  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      [customer.customerNumber, customer.name, customer.email, customer.phone, customer.segment, customer.account]
        .some((value) => String(value || '').toLowerCase().includes(term))
    );
  }, [customers, q]);

  const selected = customers.find((customer) => customer.id === selectedId) || matches[0] || null;
  const assets = (assetsQuery.data?.data || []).filter((row) => belongsToCustomer(row, selected) || row.location && selected?.name && String(row.location).toLowerCase().includes(String(selected.name).toLowerCase()));
  const tips = (tipsQuery.data?.data || []).filter((row) => belongsToCustomer(row, selected));
  const workOrders = (workOrdersQuery.data?.data || []).filter((row) => belongsToCustomer(row, selected));
  const locations = (locationsQuery.data?.data || []).filter((row) => belongsToCustomer(row, selected));

  const loading = customersQuery.isLoading;
  const error = customersQuery.isError ? getErrorMessage(customersQuery.error) : null;

  return (
    <Page>
      <PageHeader
        overline="Activities"
        title="Manage Customers"
        description="Search a customer, then review assets, tips, history, and map location."
        actions={
          <Button variant="secondary" onClick={() => navigate('customers')}>
            Open customers list
          </Button>
        }
      />

      <AsyncState loading={loading} error={error} onRetry={() => customersQuery.refetch()}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Panel className="lg:col-span-4">
            <Toolbar>
              <SearchField
                value={q}
                onChange={(event) => {
                  setQ(event.target.value);
                  setSelectedId(null);
                }}
                placeholder="Search this list"
                label="Search customers"
              />
            </Toolbar>
            {matches.length === 0 ? (
              <EmptyState
                title={q.trim() ? `No records match "${q.trim()}"` : 'No customers'}
                description="Try another name, customer number, or email."
              />
            ) : (
              <ul className="divide-y divide-line">
                {matches.map((customer) => {
                  const active = selected?.id === customer.id;
                  return (
                    <li key={customer.id}>
                      <button
                        type="button"
                        className={`flex w-full flex-col px-4 py-3 text-left interactive ${
                          active ? 'bg-elevated' : 'hover:bg-elevated/70'
                        }`}
                        onClick={() => setSelectedId(customer.id)}
                      >
                        <span className="text-sm font-medium text-ink">{customer.name}</span>
                        <span className="mt-0.5 font-mono text-xs text-ink-muted">
                          {customer.customerNumber || '—'} · {customer.segment || customer.account || '—'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <div className="space-y-5 lg:col-span-8">
            {!selected ? (
              <Panel padded>
                <EmptyState title="Select a customer" description="Choose a customer from the list to see assets and history." />
              </Panel>
            ) : (
              <>
                <Panel padded>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="type-overline">Customer</p>
                      <p className="mt-1 font-display text-title-sm text-ink">{selected.name}</p>
                      <p className="mt-1 text-sm text-ink-muted">
                        {selected.email || '—'} · {selected.phone || '—'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          navigate('mapCenter', {
                            account: selected.account,
                            customer: selected.name,
                          })
                        }
                      >
                        <Icon name="map" size={14} /> Map
                      </Button>
                      <Button variant="secondary" onClick={() => navigate('individualTips')}>
                        Tips
                      </Button>
                    </div>
                  </div>
                </Panel>

                <Panel>
                  <div className="border-b border-line px-5 py-3">
                    <p className="type-overline">Assets</p>
                  </div>
                  {assets.length ? (
                    <Table columns={['Asset Name', 'Serial', 'Status', 'Location', 'Product']}>
                      {assets.map((asset) => (
                        <tr key={asset.id || asset.serial} className="interactive hover:bg-elevated/70">
                          <td className="px-4 py-3 font-medium text-ink">{asset.name}</td>
                          <td className="mono px-4 py-3 text-ink-muted">{asset.serial || '—'}</td>
                          <td className="px-4 py-3">
                            <Badge color="cyan">{asset.status || '—'}</Badge>
                          </td>
                          <td className="px-4 py-3 text-ink-muted">{asset.location || '—'}</td>
                          <td className="px-4 py-3 text-ink-muted">{asset.product || '—'}</td>
                        </tr>
                      ))}
                    </Table>
                  ) : (
                    <EmptyState title="No assets" description="No assets are linked to this customer yet." />
                  )}
                </Panel>

                <Panel>
                  <div className="border-b border-line px-5 py-3">
                    <p className="type-overline">History</p>
                  </div>
                  <Table columns={['When', 'Type', 'Detail']}>
                    {[
                      ...tips.map((tip) => ({
                        id: tip.id,
                        when: tip.timestamp,
                        type: tip.type || (tip.wasTipped ? 'Tip' : 'Non-Tip'),
                        detail: [tip.truck, tip.location].filter(Boolean).join(' · '),
                      })),
                      ...workOrders.map((wo) => ({
                        id: wo.id || wo.number,
                        when: wo.completionDate || wo.dueDate || wo.requestDate,
                        type: 'Work Order',
                        detail: [wo.number, wo.requestType, wo.status].filter(Boolean).join(' · '),
                      })),
                      ...locations.map((loc) => ({
                        id: loc.id || loc.number,
                        when: loc.address,
                        type: 'Location',
                        detail: [loc.name, loc.city].filter(Boolean).join(' · '),
                      })),
                    ]
                      .sort((a, b) => String(b.when || '').localeCompare(String(a.when || '')))
                      .slice(0, 12)
                      .map((entry) => (
                        <tr key={`${entry.type}-${entry.id}`}>
                          <td className="mono px-4 py-3 text-ink-muted">{entry.when || '—'}</td>
                          <td className="px-4 py-3">
                            <Badge color={entry.type === 'Work Order' ? 'amber' : 'slate'}>{entry.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-ink-muted">{entry.detail || '—'}</td>
                        </tr>
                      ))}
                  </Table>
                </Panel>
              </>
            )}
          </div>
        </div>
      </AsyncState>
    </Page>
  );
}
