import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Badge,
  Button,
  EmptyState,
  Panel,
  Table,
  activateRow,
} from '../components/UI.jsx';

function localDateKey(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-');
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDateKey(date);
}

function dispatchKey(row) {
  return row.dispatchNumber || row.number || row.id;
}

function linkedWorkOrders(dispatch, workOrders) {
  const keys = [dispatchKey(dispatch), dispatch.id, dispatch.routeNumber]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  return (workOrders || []).filter((row) => {
    const refs = [row.dispatch, row.dispatchNumber, row.routeId, row.routeNumber]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());
    return refs.some((ref) => keys.includes(ref));
  });
}

function statsFor(dispatch, workOrders) {
  const linked = linkedWorkOrders(dispatch, workOrders);
  const total = linked.length;
  const closed = linked.filter((row) =>
    ['Closed', 'Complete'].includes(row.caseStatus || row.status)
  ).length;
  const attempted = linked.filter((row) => {
    const status = row.caseStatus || row.status;
    if (['Closed', 'Complete'].includes(status)) return false;
    return Number(row.attempts || 0) > 0 || status === 'In Progress';
  }).length;
  return {
    total,
    closed,
    attempted,
    planned: Math.max(0, total - closed - attempted),
  };
}

function groupKey(row) {
  const service = String(row.serviceType || row.collectionType || 'Other').trim();
  return service.charAt(0).toUpperCase() || 'Other';
}

export default function DispatchLanding({
  rows,
  workOrders = [],
  canCreate,
  onOpen,
  onCreate,
}) {
  const today = localDateKey(new Date());
  const [mode, setMode] = useState('open');
  const [dateFrom, setDateFrom] = useState(daysAgo(6));
  const [dateTo, setDateTo] = useState(today);
  const [collapsed, setCollapsed] = useState(() => new Set());

  const visible = useMemo(() => {
    if (mode === 'open') return rows.filter((row) => row.status !== 'Complete');
    return rows.filter(
      (row) =>
        row.status === 'Complete' &&
        (!row.routeDate || (row.routeDate >= dateFrom && row.routeDate <= dateTo))
    );
  }, [dateFrom, dateTo, mode, rows]);

  const groups = useMemo(() => {
    const next = {};
    visible.forEach((row) => {
      const key = groupKey(row);
      (next[key] = next[key] || []).push(row);
    });
    return Object.keys(next)
      .sort()
      .map((key) => ({ key, rows: next[key] }));
  }, [visible]);

  const toggle = (key) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {['open', 'completed'].map((value) => (
            <Button
              key={value}
              type="button"
              variant={mode === value ? 'primary' : 'secondary'}
              className="!px-3 !py-1.5 text-xs"
              onClick={() => setMode(value)}
            >
              {value === 'open' ? 'Open' : 'Completed'}
            </Button>
          ))}
          {mode === 'completed' && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <span>Completed between</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="field-input h-8 w-[9.5rem] text-xs"
                aria-label="Completed from"
              />
              <span>and</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="field-input h-8 w-[9.5rem] text-xs"
                aria-label="Completed to"
              />
            </div>
          )}
        </div>
        {canCreate && (
          <Button variant="primary" onClick={onCreate}>
            <Icon name="plus" size={16} /> Create New Dispatch
          </Button>
        )}
      </div>

      {groups.length === 0 ? (
        <Panel padded>
          <EmptyState
            title={mode === 'completed' ? 'No dispatch records in this date range' : 'No open dispatches'}
            description={
              mode === 'completed'
                ? 'Widen the completed-date range or switch back to Open.'
                : 'Create a dispatch or wait for routes to publish.'
            }
          />
        </Panel>
      ) : (
        groups.map((group) => {
          const open = !collapsed.has(group.key);
          return (
            <Panel key={group.key}>
              <button
                type="button"
                onClick={() => toggle(group.key)}
                aria-expanded={open}
                className="flex h-10 w-full items-center justify-between bg-brand px-4 text-left text-[13px] font-semibold text-white"
              >
                <span>
                  {group.key} · {group.rows.length}
                </span>
                <Icon
                  name="chevronRight"
                  size={14}
                  className={`transition-transform ${open ? 'rotate-90' : ''}`}
                />
              </button>
              {open && (
                <>
                  <div className="bg-ink-faint/20 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    Current / prior date
                  </div>
                  <Table
                    columns={[
                      'Dispatch Date',
                      'Dispatch ID',
                      'Status',
                      'Truck',
                      'Closed',
                      'Attempted',
                      'Planned',
                      'Total Work Orders',
                    ]}
                  >
                    {group.rows.map((row) => {
                      const stats = statsFor(row, workOrders);
                      return (
                        <tr
                          key={row.id || dispatchKey(row)}
                          className="interactive cursor-pointer hover:bg-elevated/70"
                          onClick={(event) => activateRow(event, () => onOpen(row))}
                        >
                          <td className="px-4 py-3 font-medium text-brand">{row.routeDate || '—'}</td>
                          <td className="mono px-4 py-3 font-medium text-ink">{dispatchKey(row)}</td>
                          <td className="px-4 py-3">
                            <Badge color={row.status === 'Complete' ? 'green' : row.status === 'In Route' ? 'amber' : 'cyan'}>
                              {row.status || '—'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-ink-muted">{row.truck || '—'}</td>
                          <td className="mono px-4 py-3 text-ink">{stats.closed}</td>
                          <td className="mono px-4 py-3 text-ink">{stats.attempted}</td>
                          <td className="mono px-4 py-3 text-ink">{stats.planned}</td>
                          <td className="mono px-4 py-3 text-ink">{stats.total}</td>
                        </tr>
                      );
                    })}
                  </Table>
                </>
              )}
            </Panel>
          );
        })
      )}
    </div>
  );
}
