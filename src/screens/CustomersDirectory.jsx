import React, { useMemo, useState } from 'react';
import {
  Badge,
  Table,
  Page,
  PageHeader,
  Panel,
  Toolbar,
  SearchField,
  AsyncState,
  activateRow,
} from '../components/UI.jsx';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts, useSegments, useUsers } from '../hooks/useAccounts.js';
import { getErrorMessage } from '../lib/errors.js';

export default function CustomersDirectory() {
  const { navigate, isScoped, assistantOpen } = useStore();
  const [quickView, setQuickView] = useState(null);
  const accountsQuery = useAccounts();
  const usersQuery = useUsers();
  const segmentsQuery = useSegments();
  const [q, setQ] = useState('');
  const compact = assistantOpen;
  const accounts = accountsQuery.data || [];
  const accById = useMemo(
    () => Object.fromEntries(accounts.map((account) => [account.id, account])),
    [accounts]
  );
  const segById = useMemo(
    () => Object.fromEntries((segmentsQuery.data || []).map((segment) => [segment.id, segment])),
    [segmentsQuery.data]
  );

  const customers = useMemo(
    () => (usersQuery.data || []).filter((user) => user.persona === 'customer'),
    [usersQuery.data]
  );

  const rows = customers.filter((customer) => {
    const providerNames = (customer.accountIds || [])
      .map((id) => accById[id]?.name)
      .filter(Boolean)
      .join(' ');
    const segmentNames = (customer.segmentIds || [])
      .map((id) => segById[id]?.name || segById[id]?.segmentName)
      .filter(Boolean)
      .join(' ');
    return [customer.name, customer.email, customer.customerId, customer.scopeLabel, customer.segment, providerNames, segmentNames].some(
      (value) => String(value || '').toLowerCase().includes(q.trim().toLowerCase())
    );
  });

  return (
    <Page>
      <PageHeader
        overline="Service Providers"
        title="Customers"
        description={`${rows.length} of ${customers.length} customers${
          isScoped ? ' in your scope' : ' across all service providers'
        }.`}
      />

      <AsyncState
        loading={accountsQuery.isLoading || usersQuery.isLoading}
        error={
          accountsQuery.isError || usersQuery.isError
            ? getErrorMessage(accountsQuery.error || usersQuery.error)
            : null
        }
        onRetry={() => {
          accountsQuery.refetch();
          usersQuery.refetch();
        }}
      >
        <Panel>
          <Toolbar>
            <SearchField
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search customers…"
              label="Search customers"
            />
          </Toolbar>
          <Table
            columns={[
              'Customer #',
              'Customer Name',
              { label: 'Email', className: compact ? 'hidden' : '' },
              'Service Provider',
              'Segment',
              { label: 'Scope', className: compact ? 'hidden' : '' },
              'Status',
            ]}
          >
            {rows.map((customer) => {
              const provider =
                (customer.accountIds || []).map((id) => accById[id]).find(Boolean) || null;
              const segmentLabel =
                (customer.segmentIds || [])
                  .map((id) => segById[id]?.name || segById[id]?.segmentName)
                  .filter(Boolean)
                  .join(', ') ||
                customer.segment ||
                '—';
              return (
                <tr
                  key={customer.id}
                  className="interactive cursor-pointer hover:bg-elevated/70"
                  onClick={(event) =>
                    activateRow(event, () =>
                      navigate('accountDetail', {
                        accountId: provider?.id || customer.accountIds?.[0],
                        tab: 'customers',
                      })
                    )
                  }
                >
                  <td className="mono px-4 py-3.5 text-ink-muted sm:px-5">
                    {customer.customerId || '—'}
                  </td>
                  <td className="min-w-0 truncate px-4 py-3.5 font-medium text-ink sm:px-5">
                    {customer.name}
                  </td>
                  <td
                    className={`max-w-[14rem] truncate px-4 py-3.5 text-ink-muted sm:px-5 ${
                      compact ? 'hidden' : ''
                    }`}
                  >
                    {customer.email || '—'}
                  </td>
                  <td className="max-w-[12rem] truncate px-4 py-3.5 text-ink-muted sm:px-5">
                    {provider?.name || '—'}
                  </td>
                  <td className="max-w-[12rem] truncate px-4 py-3.5 text-ink-muted sm:px-5">
                    {segmentLabel}
                  </td>
                  <td
                    className={`max-w-[8rem] truncate px-4 py-3.5 text-ink-muted sm:px-5 ${
                      compact ? 'hidden' : ''
                    }`}
                  >
                    {customer.scopeLabel || '—'}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <Badge color={customer.active === false ? 'slate' : 'green'}>
                      {customer.active === false ? 'Inactive' : 'Active'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td
                  colSpan={compact ? 5 : 7}
                  className="px-4 py-8 text-center text-sm text-ink-faint"
                >
                  {q ? 'No customers match this search.' : 'No customers are available.'}
                </td>
              </tr>
            )}
          </Table>
        </Panel>
      </AsyncState>
    </Page>
  );
}
