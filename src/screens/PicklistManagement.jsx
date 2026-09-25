import React, { useMemo, useState } from 'react';
import { Page, PageHeader, Panel, SearchField, Table, activateRow } from '../components/UI.jsx';
import { PICKLISTS } from '../data/picklists.js';

function titleCase(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();
}

export default function PicklistManagement() {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const rows = useMemo(
    () =>
      Object.entries(PICKLISTS).map(([key, values]) => ({
        key,
        name: titleCase(key),
        count: Array.isArray(values) ? values.filter((value) => value && value !== '--None--').length : 0,
        values: Array.isArray(values) ? values : [],
      })),
    []
  );
  const visible = rows.filter((row) => row.name.toLowerCase().includes(q.trim().toLowerCase()));
  const current = rows.find((row) => row.key === selected) || null;

  return (
    <Page>
      <PageHeader
        overline="Configuration"
        title={current ? current.name : 'Picklist Management'}
        description={
          current
            ? `${current.count} values on this picklist.`
            : 'Platform picklists used by work orders, assets, and onboarding forms.'
        }
      />
      {current ? (
        <Panel>
          <button
            type="button"
            className="link-brand mb-3 px-5 pt-4 text-sm font-medium"
            onClick={() => setSelected(null)}
          >
            ← Back to Picklist Management
          </button>
          <Table columns={['Value', 'Active']}>
            {current.values
              .filter((value) => value && value !== '--None--')
              .map((value) => (
                <tr key={value}>
                  <td className="px-4 py-3 font-medium text-ink sm:px-5">{value}</td>
                  <td className="px-4 py-3 text-ink-muted sm:px-5">Active</td>
                </tr>
              ))}
          </Table>
        </Panel>
      ) : (
        <Panel>
          <div className="px-5 py-3">
            <SearchField value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search picklists…" />
          </div>
          <Table columns={['Picklist', 'Values']}>
            {visible.map((row) => (
              <tr
                key={row.key}
                className="interactive cursor-pointer hover:bg-elevated/70"
                onClick={(event) => activateRow(event, () => setSelected(row.key))}
              >
                <td className="px-4 py-3.5 font-medium text-ink sm:px-5">{row.name}</td>
                <td className="px-4 py-3.5 text-ink-muted sm:px-5">{row.count}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}
    </Page>
  );
}
