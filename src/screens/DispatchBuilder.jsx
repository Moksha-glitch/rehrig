import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Button,
  EmptyState,
  Field,
  Select,
  TextInput,
  WorkspaceSheet,
} from '../components/UI.jsx';
import { useCreateRecord, useRecords, useUpdateRecord } from '../hooks/useRecords.js';
import { getErrorMessage } from '../lib/errors.js';
import { useStore } from '../state/AppStore.jsx';

const STEPS = ['Profile', 'Work orders', 'Trucks', 'Publish'];

function isOpen(row) {
  return !['Closed', 'Complete', 'Cancelled'].includes(row.caseStatus || row.status);
}

export default function DispatchBuilder({ onClose, editing }) {
  const { toast, state, scopedAccounts } = useStore();
  const profilesQuery = useRecords('maintenanceRouteProfiles');
  const workOrdersQuery = useRecords('workOrders');
  const trucksQuery = useRecords('trucks');
  const createDispatch = useCreateRecord('dispatches');
  const updateWorkOrder = useUpdateRecord('workOrders');

  const accountName =
    scopedAccounts?.[0]?.name || state.currentUser?.accountName || editing?.account || '';
  const profiles = (profilesQuery.data?.data || []).filter((row) => !accountName || row.account === accountName);
  const workOrders = (workOrdersQuery.data?.data || []).filter(
    (row) => (!accountName || row.account === accountName) && isOpen(row)
  );
  const trucks = (trucksQuery.data?.data || []).filter((row) => !accountName || row.account === accountName);

  const [step, setStep] = useState(0);
  const [profileId, setProfileId] = useState(editing?.maintenanceRouteProfileId || profiles[0]?.id || '');
  const [routeDate, setRouteDate] = useState(editing?.routeDate || new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState(editing?.status === 'Complete' ? 'Planned' : editing?.status || 'Planned');
  const [routes, setRoutes] = useState(() =>
    editing?.routesData?.length
      ? editing.routesData.map((row) => ({ ...row, ids: [...(row.ids || [])] }))
      : [{ id: 'R1', label: 'Route 1', ids: [], truck: '' }]
  );
  const [activeRoute, setActiveRoute] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const profile = profiles.find((row) => row.id === profileId) || profiles[0];
  const assigned = useMemo(() => new Set(routes.flatMap((row) => row.ids)), [routes]);
  const pool = workOrders.filter((row) => !assigned.has(row.id));
  const current = routes[activeRoute] || routes[0];

  const addRoute = () => {
    setRoutes((prev) => [...prev, { id: `R${prev.length + 1}`, label: `Route ${prev.length + 1}`, ids: [], truck: '' }]);
    setActiveRoute(routes.length);
  };

  const assignToRoute = (id) => {
    setRoutes((prev) =>
      prev.map((row, index) => (index === activeRoute ? { ...row, ids: [...new Set([...row.ids, id])] } : row))
    );
  };

  const removeFromRoute = (id) => {
    setRoutes((prev) =>
      prev.map((row, index) => (index === activeRoute ? { ...row, ids: row.ids.filter((item) => item !== id) } : row))
    );
  };

  const setTruck = (name) => {
    setRoutes((prev) => prev.map((row, index) => (index === activeRoute ? { ...row, truck: name } : row)));
  };

  const publish = async () => {
    if (!profile) {
      setError('Select a route profile.');
      return;
    }
    setBusy(true);
    setError('');
    const number = editing?.dispatchNumber || editing?.number || `DSP-${String(Date.now()).slice(-6)}`;
    try {
      await createDispatch.mutateAsync({
        number,
        dispatchNumber: number,
        account: accountName,
        routeDate,
        status,
        truck: current?.truck || trucks[0]?.name || '',
        driver: profile.driver || '',
        serviceType: profile.serviceType || 'Residential',
        segment: profile.serviceProviderSegment || profile.segment,
        maintenanceRouteProfile: profile.maintenanceRouteProfileName || profile.name,
        startTime: profile.startTime,
        expectedStops: assigned.size,
        published: true,
        routesData: routes,
      });
      await Promise.all(
        [...assigned].map((id) =>
          updateWorkOrder.mutateAsync({
            id,
            changes: { dispatch: number, dispatchNumber: number, routeDate },
          })
        )
      );
      toast?.(`Dispatch ${number} published`);
      onClose?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not publish the dispatch.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <WorkspaceSheet
      title={editing ? 'Edit dispatch' : 'Create New Dispatch'}
      description="Assign open work orders to routes and trucks without leaving Dispatches."
      onClose={onClose}
    >
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap gap-2">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                step === index ? 'bg-brand text-white' : 'bg-elevated text-ink-muted'
              }`}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>

        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Route profile" required>
              <Select
                value={profile?.id || ''}
                options={profiles.map((row) => ({
                  value: row.id,
                  label: row.maintenanceRouteProfileName || row.name,
                }))}
                onChange={(event) => setProfileId(event.target.value)}
              />
            </Field>
            <Field label="Route date" required>
              <TextInput type="date" value={routeDate} onChange={(event) => setRouteDate(event.target.value)} />
            </Field>
            <Field label="Status">
              <Select
                value={status}
                options={['Planned', 'Scheduled', 'In Route', 'Complete']}
                onChange={(event) => setStatus(event.target.value)}
              />
            </Field>
            <div className="rounded-panel border border-line bg-elevated/40 p-4 text-sm text-ink-muted">
              {profile
                ? `${profile.numberOfTrucks || 1} truck · ${profile.serviceType || 'Residential'} · ${profile.startTime || '—'} start`
                : 'Choose a maintenance route profile to size the dispatch.'}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="type-overline">Unassigned ({pool.length})</p>
                <Button variant="secondary" className="!px-2.5 !py-1.5 text-xs" onClick={addRoute}>
                  Add route
                </Button>
              </div>
              <div className="max-h-[22rem] space-y-2 overflow-y-auto scroll-thin">
                {pool.length ? (
                  pool.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => assignToRoute(row.id)}
                      className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left hover:bg-elevated"
                    >
                      <span>
                        <span className="block text-sm font-medium text-ink">
                          {row.workOrderNumber || row.number}
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          {row.requestType} · {row.customerLocation || row.location || row.customer}
                        </span>
                      </span>
                      <Icon name="plus" size={14} />
                    </button>
                  ))
                ) : (
                  <EmptyState title="Pool is empty" description="All open work orders are on a route." />
                )}
              </div>
            </div>
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                {routes.map((row, index) => (
                  <Button
                    key={row.id}
                    variant={index === activeRoute ? 'primary' : 'secondary'}
                    className="!px-2.5 !py-1.5 text-xs"
                    onClick={() => setActiveRoute(index)}
                  >
                    {row.label} ({row.ids.length})
                  </Button>
                ))}
              </div>
              <div className="max-h-[22rem] space-y-2 overflow-y-auto scroll-thin">
                {(current?.ids || []).map((id) => {
                  const row = workOrders.find((item) => item.id === id);
                  if (!row) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => removeFromRoute(id)}
                      className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left hover:bg-elevated"
                    >
                      <span className="text-sm text-ink">{row.workOrderNumber || row.number}</span>
                      <span className="text-[11px] text-ink-muted">Remove</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-ink-muted">Assign a truck to {current?.label || 'the active route'}.</p>
            <div className="flex flex-wrap gap-2">
              {trucks.map((truck) => (
                <Button
                  key={truck.id || truck.name}
                  variant={current?.truck === (truck.truckName || truck.name) ? 'primary' : 'secondary'}
                  onClick={() => setTruck(truck.truckName || truck.name)}
                >
                  {truck.truckName || truck.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-panel border border-line p-4">
                <p className="type-overline">Work orders</p>
                <p className="mt-1 font-display text-title-sm">{assigned.size}</p>
              </div>
              <div className="rounded-panel border border-line p-4">
                <p className="type-overline">Routes</p>
                <p className="mt-1 font-display text-title-sm">{routes.length}</p>
              </div>
              <div className="rounded-panel border border-line p-4">
                <p className="type-overline">Date</p>
                <p className="mt-1 font-display text-title-sm">{routeDate}</p>
              </div>
            </div>
            {routes.map((row) => (
              <div key={row.id} className="flex items-center justify-between rounded-lg border border-line px-4 py-3">
                <span className="text-sm font-medium text-ink">{row.label}</span>
                <span className="text-xs text-ink-muted">
                  {row.ids.length} WO · {row.truck || 'No truck'}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-between gap-2">
          <Button variant="secondary" onClick={() => (step === 0 ? onClose?.() : setStep((value) => value - 1))}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" onClick={() => setStep((value) => value + 1)}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" onClick={publish} disabled={busy}>
              <Icon name="send" size={14} /> {busy ? 'Publishing…' : 'Publish dispatch'}
            </Button>
          )}
        </div>
      </div>
    </WorkspaceSheet>
  );
}
