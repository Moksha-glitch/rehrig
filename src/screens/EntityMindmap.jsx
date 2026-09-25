import React, { useMemo } from 'react';
import Icon from '../components/Icon.jsx';
import { Badge, Button, EmptyState, Page, PageHeader, Panel } from '../components/UI.jsx';
import { useRecords } from '../hooks/useRecords.js';
import { useStore } from '../state/AppStore.jsx';

const NODE_TINT = {
  account: 'text-brand',
  top: 'text-accent',
  child: 'text-ink',
  leaf: 'text-ink-muted',
};

function Node({ tint, label, meta, onClick }) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className={`min-w-[11rem] rounded-lg border border-line bg-elevated/40 px-3 py-2 text-left ${
        onClick ? 'hover:bg-brand-soft' : 'cursor-default'
      }`}
    >
      <p className={`text-sm font-semibold ${NODE_TINT[tint] || 'text-ink'}`}>{label}</p>
      {meta && <p className="mt-0.5 text-[11px] text-ink-muted">{meta}</p>}
    </button>
  );
}

export default function EntityMindmap({ embedded = false, onClose }) {
  const { navigate, scopedAccounts, state } = useStore();
  const segmentsQuery = useRecords('segments');
  const contactsQuery = useRecords('contacts');
  const customersQuery = useRecords('customers');
  const locationsQuery = useRecords('locations');
  const assetsQuery = useRecords('assets');
  const routesQuery = useRecords('routes');
  const productsQuery = useRecords('products');

  const accountName = scopedAccounts?.[0]?.name || state.currentUser?.accountName || '';
  const byAccount = (rows) => (accountName ? rows.filter((row) => row.account === accountName) : rows);

  const tree = useMemo(() => {
    const segments = byAccount(segmentsQuery.data?.data || []);
    const tops = segments.filter((row) => !row.parent);
    const childrenOf = (name) => segments.filter((row) => row.parent === name);
    const countFor = (segmentName, rows, keys = ['segment', 'serviceProviderSegment']) =>
      rows.filter((row) => keys.some((key) => row[key] === segmentName)).length;
    const contacts = byAccount(contactsQuery.data?.data || []);
    const customers = byAccount(customersQuery.data?.data || []);
    const locations = byAccount(locationsQuery.data?.data || []);
    const assets = byAccount(assetsQuery.data?.data || []);
    const routes = byAccount(routesQuery.data?.data || []);
    const products = byAccount(productsQuery.data?.data || []);
    return {
      tops,
      childrenOf,
      leaves: (segmentName) => [
        { label: 'Contacts', count: countFor(segmentName, contacts), module: 'contacts' },
        { label: 'Customers', count: countFor(segmentName, customers), module: 'manageAccount' },
        { label: 'Locations', count: countFor(segmentName, locations), module: 'locations' },
        { label: 'Assets', count: countFor(segmentName, assets), module: 'assets' },
        { label: 'Routes', count: countFor(segmentName, routes), module: 'routes' },
        { label: 'Products', count: countFor(segmentName, products), module: 'products' },
      ],
    };
  }, [
    accountName,
    segmentsQuery.data,
    contactsQuery.data,
    customersQuery.data,
    locationsQuery.data,
    assetsQuery.data,
    routesQuery.data,
    productsQuery.data,
  ]);

  const open = (module) => {
    navigate(module);
    onClose?.();
  };

  const body = (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-panel border border-line bg-elevated/40 px-4 py-3">
        <Icon name="layers" size={16} className="text-brand" />
        <div>
          <p className="text-sm font-semibold text-ink">4-level entity tree</p>
          <p className="text-[11px] text-ink-muted">Account · Top segment · Child segment · Operational objects</p>
        </div>
      </div>

      <Node tint="account" label={accountName || 'Service provider'} meta="Level 1 · Account" />

      {tree.tops.length ? (
        tree.tops.map((top) => (
          <div key={top.id || top.name} className="ml-4 space-y-3 border-l border-line pl-4">
            <Node
              tint="top"
              label={top.segmentName || top.name}
              meta={`Level 2 · ${top.type || 'Top'}`}
              onClick={() => open('segments')}
            />
            {tree.childrenOf(top.segmentName || top.name).map((child) => (
              <div key={child.id || child.name} className="ml-4 space-y-2 border-l border-line pl-4">
                <Node
                  tint="child"
                  label={child.segmentName || child.name}
                  meta={`Level 3 · ${child.type || 'District'}`}
                  onClick={() => open('segments')}
                />
                <div className="ml-2 flex flex-wrap gap-2">
                  {tree.leaves(child.segmentName || child.name).map((leaf) => (
                    <button
                      key={leaf.label}
                      type="button"
                      onClick={() => open(leaf.module)}
                      className="rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-muted hover:bg-elevated"
                    >
                      {leaf.label} <Badge color="slate">{leaf.count}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      ) : (
        <EmptyState title="No segments" description="Segments for this account will appear as the mindmap tree." />
      )}
    </div>
  );

  if (embedded) {
    return (
      <Panel padded>
        <div className="mb-4 flex items-center justify-between">
          <p className="type-overline">Mindmap</p>
          {onClose && (
            <Button variant="secondary" className="!px-2.5 !py-1.5 text-xs" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
        {body}
      </Panel>
    );
  }

  return (
    <Page>
      <PageHeader
        overline="Account"
        title="Mindmap"
        description="The service-provider entity tree from the HTML account workspace."
      />
      <Panel padded>{body}</Panel>
    </Page>
  );
}
