import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  FieldSection,
  FormDrawer,
  Page,
  PageHeader,
  Panel,
  SearchField,
  Select,
  Table,
  TextInput,
  WorkspaceSheet,
  AsyncState,
  ConfirmDialog,
} from '../components/UI.jsx';
import { PICKLISTS } from '../data/picklists.js';
import { useStore } from '../state/AppStore.jsx';
import { useCreateRecord, useRecords, useUpdateRecord } from '../hooks/useRecords.js';
import { getErrorMessage } from '../lib/errors.js';
import CustomerMapPanel from '../components/CustomerMapPanel.jsx';
import BulkImport from './BulkImport.jsx';

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
  const site = String(siteOf(record)).toLowerCase().trim();
  if (!site) return false;
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

function isPastDue(row) {
  const status = row.caseStatus || row.status;
  if (['Closed', 'Complete', 'Cancelled'].includes(status)) return false;
  if (!row.dueDate) return false;
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(row.dueDate) ? `${row.dueDate}T12:00:00` : row.dueDate);
  return Number.isFinite(parsed.getTime()) && parsed < new Date();
}

function Fact({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="type-overline">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-ink">{value || '—'}</p>
    </div>
  );
}

function locationRoutes(location) {
  if (!location) return [];
  return [
    ['Trash', location.trashCollectionRoute],
    ['Recycle', location.recycleCollectionRoute],
    ['Organics', location.organicCollectionRoute],
    ['Yard waste', location.yardWasteRoute],
  ].filter(([, value]) => value);
}

const ASSET_ROW_ACTIONS = [
  { key: 'markLost', label: 'Mark As Lost' },
  { key: 'retrieveReplace', label: 'Retrieve & Replace' },
  { key: 'moveToAccount', label: 'Move To Account' },
  { key: 'moveToYard', label: 'Move To Yard' },
  { key: 'editAsset', label: 'Edit Asset' },
];

function ActionMenu({ label = 'Action', items }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const visible = items.filter(Boolean);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!visible.length) return null;

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="secondary"
        className="!px-2.5 !py-1.5 text-xs"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        {label} <Icon name="chevronDown" size={12} />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[11rem] overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg"
        >
          {visible.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className="flex w-full px-3 py-2 text-left text-sm text-ink hover:bg-elevated"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                item.onSelect?.();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function isOpenWorkOrder(row) {
  return !['Closed', 'Complete', 'Cancelled'].includes(row.caseStatus || row.status);
}

function activeLocation(customer, junctions, locations) {
  const link = junctions.find((row) => row.customer === customer?.id && row.isActive !== false);
  return link ? locations.find((item) => item.id === link.location) || null : null;
}

const BLANK_CUSTOMER = {
  name: '',
  email: '',
  phone: '',
  houseNumber: '',
  street: '',
  city: '',
  zip: '',
};

const SEARCH_TABS = [
  { value: 'accounts', label: 'Accounts' },
  { value: 'workOrders', label: 'Work Orders' },
  { value: 'assets', label: 'Assets' },
];

const SEARCH_PLACEHOLDERS = {
  accounts: 'Search by address, unit, postal code…',
  workOrders: 'Search by work order, address, postal code…',
  assets: 'Search by serial, RFID, address…',
};

export default function ManageCustomers() {
  const { navigate, isScoped, scopedAccounts, toast, state, canCreateRecords } = useStore();
  const customersQuery = useRecords('customers');
  const locationsQuery = useRecords('locations');
  const junctionsQuery = useRecords('customerLocations');
  const assetsQuery = useRecords('assets');
  const tipsQuery = useRecords('individualTips');
  const workOrdersQuery = useRecords('workOrders');
  const createCustomer = useCreateRecord('customers');
  const createLocation = useCreateRecord('locations');
  const createJunction = useCreateRecord('customerLocations');
  const updateCustomer = useUpdateRecord('customers');
  const updateLocation = useUpdateRecord('locations');
  const updateJunction = useUpdateRecord('customerLocations');
  const createWorkOrder = useCreateRecord('workOrders');
  const updateWorkOrder = useUpdateRecord('workOrders');
  const createAsset = useCreateRecord('assets');
  const updateAsset = useUpdateRecord('assets');

  const [draft, setDraft] = useState('');
  const [searchIn, setSearchIn] = useState('accounts');
  const [status, setStatus] = useState('active');
  const [pastDue, setPastDue] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(BLANK_CUSTOMER);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [routeOpen, setRouteOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [woFormOpen, setWoFormOpen] = useState(false);
  const [editingWo, setEditingWo] = useState(null);
  const [historyWo, setHistoryWo] = useState(null);
  const [attemptWoId, setAttemptWoId] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSerial, setAssignSerial] = useState('');
  const [woForm, setWoForm] = useState({ requestType: 'Deliver', subject: '', dueDate: '' });
  const [woosOpen, setWoosOpen] = useState(true);
  const [assetsOpen, setAssetsOpen] = useState(true);
  const [assetHistory, setAssetHistory] = useState(null);
  const [assetTips, setAssetTips] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({ serial: '', status: 'In Service', product: '' });

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

  const term = draft.trim();
  const searched = Boolean(term);

  const workOrderHits = useMemo(() => {
    const needle = term.toLowerCase();
    return scopedWorkOrders.filter((row) => {
      if (pastDue && !isPastDue(row)) return false;
      if (!needle) return true;
      if (String(row.workOrderNumber || row.number || '').toLowerCase().includes(needle)) return true;
      const location = scopedLocations.find((item) => matchesSite(row, item));
      if (!location) return String(siteOf(row)).toLowerCase().includes(needle);
      return [location.houseNumber, location.street, location.city, locZip(location), locName(location)].some((value) =>
        String(value || '').toLowerCase().includes(needle)
      );
    });
  }, [scopedWorkOrders, scopedLocations, term, pastDue]);

  const assetHits = useMemo(() => {
    const needle = term.toLowerCase();
    return scopedAssets.filter((row) => {
      if (!needle) return true;
      return [row.serial, row.serialNumber, row.rfid, row.rfidNumber, row.name, siteOf(row)].some((value) =>
        String(value || '').toLowerCase().includes(needle)
      );
    });
  }, [scopedAssets, term]);

  const customerHits = useMemo(() => {
    const customerFromSite = (row) => {
      const location = scopedLocations.find((item) => matchesSite(row, item));
      const link = location
        ? scopedJunctions.find((item) => item.location === location.id && item.isActive !== false)
        : null;
      return link ? scopedCustomers.find((customer) => customer.id === link.customer) : null;
    };
    const byStatus = (customer) =>
      status === 'active'
        ? activeCustomerIds.has(customer.id)
        : status === 'inactive'
          ? !activeCustomerIds.has(customer.id)
          : true;

    if (searchIn === 'workOrders') {
      const seen = new Set();
      return workOrderHits
        .map((row) => customerFromSite(row))
        .filter((customer) => customer && byStatus(customer) && !seen.has(customer.id) && seen.add(customer.id))
        .map((customer) => ({
          customer,
          location: activeLocation(customer, scopedJunctions, scopedLocations),
          tag: 'Work order',
        }));
    }

    if (searchIn === 'assets') {
      const seen = new Set();
      return assetHits
        .map((row) => customerFromSite(row))
        .filter((customer) => customer && byStatus(customer) && !seen.has(customer.id) && seen.add(customer.id))
        .map((customer) => ({
          customer,
          location: activeLocation(customer, scopedJunctions, scopedLocations),
          tag: 'Asset',
        }));
    }

    return scopedCustomers
      .filter(byStatus)
      .map((customer) => {
        const hit = matchCustomer(customer, term, scopedJunctions, scopedLocations);
        if (!hit.matched) return null;
        return {
          customer,
          location: activeLocation(customer, scopedJunctions, scopedLocations),
          tag: hit.tag,
        };
      })
      .filter(Boolean);
  }, [
    searchIn,
    status,
    term,
    scopedCustomers,
    scopedJunctions,
    scopedLocations,
    activeCustomerIds,
    workOrderHits,
    assetHits,
  ]);

  useEffect(() => {
    if (selectedId && customerHits.some((item) => item.customer.id === selectedId)) return;
    setSelectedId(customerHits[0]?.customer.id || null);
    setMapOpen(false);
    setTipsOpen(false);
  }, [customerHits, selectedId]);

  const selected =
    customerHits.find((item) => item.customer.id === selectedId)?.customer ||
    customerHits[0]?.customer ||
    null;
  const selectedJunction =
    scopedJunctions.find((row) => row.customer === selected?.id && row.isActive !== false) ||
    scopedJunctions.find((row) => row.customer === selected?.id) ||
    null;
  const selectedLocation = selectedJunction
    ? scopedLocations.find((item) => item.id === selectedJunction.location) || null
    : activeLocation(selected, scopedJunctions, scopedLocations);
  const accountActive = Boolean(selectedJunction) && selectedJunction.isActive !== false;
  const selectedAssets = selectedLocation
    ? scopedAssets.filter((row) => matchesSite(row, selectedLocation))
    : [];
  const selectedWorkOrders = selectedLocation
    ? scopedWorkOrders.filter((row) => matchesSite(row, selectedLocation))
    : [];
  const openWorkOrders = selectedWorkOrders.filter(isOpenWorkOrder);
  const selectedTips = selectedLocation
    ? tips.filter((row) => matchesSite(row, selectedLocation))
    : [];
  const selectedLocations = selectedLocation ? [selectedLocation] : [];

  const loading = customersQuery.isLoading || locationsQuery.isLoading || junctionsQuery.isLoading;
  const error = [customersQuery, locationsQuery, junctionsQuery]
    .filter((item) => item.isError)
    .map((item) => getErrorMessage(item.error))
    .join(' ');

  const clearSearch = () => {
    setDraft('');
    setMapOpen(false);
    setTipsOpen(false);
  };

  const openCreate = () => {
    setForm(BLANK_CUSTOMER);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      name: selected.name || '',
      email: selected.email || '',
      phone: selected.phone || selected.mobile || '',
      houseNumber: selectedLocation?.houseNumber || '',
      street: selectedLocation?.street || '',
      city: selectedLocation?.city || '',
      zip: locZip(selectedLocation),
    });
    setFormError('');
    setFormOpen(true);
  };

  const siteName = locName(selectedLocation) || selected?.location || '';

  const requestDeactivate = async () => {
    if (!selectedJunction?.id) return;
    try {
      await Promise.all(
        openWorkOrders
          .filter((row) => row.id)
          .map((row) =>
            updateWorkOrder.mutateAsync({
              id: row.id,
              changes: { caseStatus: 'Closed', status: 'Closed', resolutionComments: 'Closed for account deactivation' },
            })
          )
      );
      await updateJunction.mutateAsync({ id: selectedJunction.id, changes: { isActive: false } });
      if (selectedAssets.length) {
        await createWorkOrder.mutateAsync({
          requestType: 'Remove',
          subject: 'Remove — account deactivation',
          caseStatus: 'Open',
          status: 'Open',
          account: selected.account,
          customer: selected.name,
          customerLocation: siteName,
          location: siteName,
        });
      }
      toast?.('Deactivation requested · open work orders closed');
    } catch (error) {
      toast?.(getErrorMessage(error, 'Could not deactivate this account.'), 'danger');
    } finally {
      setDeactivateOpen(false);
    }
  };

  const reactivate = async () => {
    const junction =
      selectedJunction ||
      scopedJunctions.find((row) => row.customer === selected?.id);
    if (!junction?.id) return;
    try {
      await updateJunction.mutateAsync({ id: junction.id, changes: { isActive: true } });
      toast?.('Account re-activated');
    } catch (error) {
      toast?.(getErrorMessage(error, 'Could not re-activate this account.'), 'danger');
    }
  };

  const saveWorkOrder = async () => {
    if (!selected) return;
    try {
      if (editingWo?.id) {
        await updateWorkOrder.mutateAsync({
          id: editingWo.id,
          changes: {
            requestType: woForm.requestType,
            subject: woForm.subject || woForm.requestType,
            dueDate: woForm.dueDate,
          },
        });
        toast?.('Work order updated');
      } else {
        await createWorkOrder.mutateAsync({
          requestType: woForm.requestType,
          subject: woForm.subject || woForm.requestType,
          dueDate: woForm.dueDate,
          caseStatus: 'Open',
          status: 'Open',
          account: selected.account,
          customer: selected.name,
          customerLocation: siteName,
          location: siteName,
        });
        toast?.('Work order created');
      }
      setWoFormOpen(false);
      setEditingWo(null);
    } catch (error) {
      toast?.(getErrorMessage(error, 'Could not save the work order.'), 'danger');
    }
  };

  const assignAssetToSite = async () => {
    const serial = assignSerial.trim();
    if (!serial || !selected) return;
    const existing = scopedAssets.find(
      (row) => String(row.serial || row.serialNumber || '').toLowerCase() === serial.toLowerCase()
    );
    try {
      if (existing?.id) {
        await updateAsset.mutateAsync({
          id: existing.id,
          changes: {
            location: siteName,
            customerLocation: siteName,
            status: 'In Service',
            assetStatus: 'In Service',
            account: selected.account,
          },
        });
      } else {
        await createAsset.mutateAsync({
          name: serial,
          serial,
          serialNumber: serial,
          account: selected.account,
          location: siteName,
          customerLocation: siteName,
          status: 'In Service',
          assetStatus: 'In Service',
          recordType: 'Asset',
        });
      }
      toast?.(`Asset ${serial} assigned`);
      setAssignOpen(false);
      setAssignSerial('');
    } catch (error) {
      toast?.(getErrorMessage(error, 'Could not assign the asset.'), 'danger');
    }
  };

  const applyAssetAction = async (asset, kind) => {
    if (!asset?.id) return;
    const changes =
      kind === 'markLost'
        ? { status: 'Lost', assetStatus: 'Lost' }
        : kind === 'moveToYard'
          ? { status: 'Available', assetStatus: 'Available', location: 'Yard', customerLocation: 'Yard' }
          : kind === 'moveToAccount'
            ? { status: 'In Service', assetStatus: 'In Service', location: siteName, customerLocation: siteName }
            : kind === 'retrieveReplace'
              ? { status: 'Awaiting Repair', assetStatus: 'Awaiting Repair' }
              : null;
    if (!changes) return;
    try {
      await updateAsset.mutateAsync({ id: asset.id, changes });
      toast?.(`Asset ${asset.serial || asset.serialNumber || asset.name} updated`);
    } catch (error) {
      toast?.(getErrorMessage(error, 'Could not update the asset.'), 'danger');
    }
  };

  const openAssetEdit = (asset) => {
    setEditingAsset(asset);
    setAssetForm({
      serial: asset.serial || asset.serialNumber || asset.name || '',
      status: asset.status || asset.assetStatus || 'In Service',
      product: asset.product || '',
    });
  };

  const saveAsset = async () => {
    if (!editingAsset?.id) return;
    try {
      await updateAsset.mutateAsync({
        id: editingAsset.id,
        changes: {
          serial: assetForm.serial.trim(),
          serialNumber: assetForm.serial.trim(),
          name: assetForm.serial.trim() || editingAsset.name,
          status: assetForm.status,
          assetStatus: assetForm.status,
          product: assetForm.product.trim(),
        },
      });
      toast?.('Asset updated');
      setEditingAsset(null);
    } catch (error) {
      toast?.(getErrorMessage(error, 'Could not update the asset.'), 'danger');
    }
  };

  const tipsForAsset = (asset) =>
    selectedTips.filter((tip) => {
      const token = String(tip.asset || tip.serial || tip.serialNumber || '').toLowerCase();
      const serials = [asset.serial, asset.serialNumber, asset.name, asset.id]
        .map((value) => String(value || '').toLowerCase())
        .filter(Boolean);
      return serials.some((serial) => token === serial || token.includes(serial) || serial.includes(token));
    });

  const saveCustomer = async () => {
    if (!form.name.trim()) {
      setFormError('Customer name is required.');
      return;
    }
    setFormBusy(true);
    setFormError('');
    const accountName = selected?.account || scopedAccounts?.[0]?.name || state.currentUser?.accountName || '';
    try {
      if (selected && formOpen) {
        await updateCustomer.mutateAsync({
          id: selected.id,
          changes: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
          },
        });
        if (selectedLocation?.id) {
          await updateLocation.mutateAsync({
            id: selectedLocation.id,
            changes: {
              houseNumber: form.houseNumber.trim(),
              street: form.street.trim(),
              city: form.city.trim(),
              zip: form.zip.trim(),
              zipCode: form.zip.trim(),
              locationName: `${form.houseNumber} ${form.street}`.trim() || locName(selectedLocation),
            },
          });
        }
        toast?.('Account updated');
      } else {
        const customerNumber = `C-${String(Date.now()).slice(-6)}`;
        const customer = await createCustomer.mutateAsync({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          customerNumber,
          customerId: customerNumber,
          account: accountName,
          address: [form.houseNumber, form.street, form.city, form.zip].filter(Boolean).join(', '),
        });
        const location = await createLocation.mutateAsync({
          name: `${form.houseNumber} ${form.street}`.trim() || form.name.trim(),
          locationName: `${form.houseNumber} ${form.street}`.trim() || form.name.trim(),
          houseNumber: form.houseNumber.trim(),
          street: form.street.trim(),
          city: form.city.trim(),
          zip: form.zip.trim(),
          zipCode: form.zip.trim(),
          account: accountName,
          type: 'Residential',
        });
        await createJunction.mutateAsync({
          customer: customer.id,
          location: location.id,
          account: accountName,
          isActive: true,
        });
        toast?.('Customer created');
        setSelectedId(customer.id);
      }
      setFormOpen(false);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not save the customer.'));
    } finally {
      setFormBusy(false);
    }
  };

  return (
    <Page>
      <PageHeader
        overline="Activities"
        title="Manage Customers"
        description="Search a customer, then review assets, tips, history, and map for the location."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('customers')}>
              Open customers list
            </Button>
            {canCreateRecords && (
              <>
                <Button variant="secondary" onClick={() => setImportOpen(true)}>
                  Mass Upload
                </Button>
                <Button variant="primary" onClick={selected ? openEdit : openCreate}>
                  {selected ? 'Edit account' : 'Create customer'}
                </Button>
              </>
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
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
          <aside className="xl:sticky xl:top-4 xl:col-span-4">
            <Panel className="overflow-hidden">
              <div className="space-y-3 border-b border-line px-4 py-4">
                <div className="flex rounded-full bg-elevated p-1" role="tablist" aria-label="Search in">
                  {SEARCH_TABS.map((tab) => {
                    const selectedTab = searchIn === tab.value;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={selectedTab}
                        onClick={() => {
                          setSearchIn(tab.value);
                          if (tab.value !== 'workOrders') setPastDue(false);
                        }}
                        className={`flex-1 rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                          selectedTab ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <SearchField
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={SEARCH_PLACEHOLDERS[searchIn]}
                  label={SEARCH_PLACEHOLDERS[searchIn]}
                  className="!max-w-none w-full"
                />
                {searched && (
                  <div className="animate-fade-up space-y-2">
                    <Select
                      value={status}
                      onChange={(event) => setStatus(event.target.value)}
                      options={
                        searchIn === 'workOrders'
                          ? [
                              { value: 'active', label: 'Open sites' },
                              { value: 'inactive', label: 'Inactive sites' },
                              { value: 'all', label: 'All work orders' },
                            ]
                          : searchIn === 'assets'
                            ? [
                                { value: 'active', label: 'On active sites' },
                                { value: 'inactive', label: 'On inactive sites' },
                                { value: 'all', label: 'All assets' },
                              ]
                            : [
                                { value: 'active', label: 'Active sites' },
                                { value: 'inactive', label: 'Inactive sites' },
                                { value: 'all', label: 'All customers' },
                              ]
                      }
                      aria-label="Site status"
                    />
                    <div className="flex flex-wrap gap-2">
                      {searchIn === 'workOrders' && (
                        <Button
                          type="button"
                          variant={pastDue ? 'primary' : 'secondary'}
                          onClick={() => setPastDue((value) => !value)}
                        >
                          Past due
                        </Button>
                      )}
                      <Button type="button" variant="secondary" onClick={clearSearch}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {customerHits.length ? (
                <ul className="max-h-[70vh] overflow-y-auto scroll-thin">
                  {customerHits.map(({ customer, tag }) => {
                    const active = customer.id === selectedId;
                    const siteActive = activeCustomerIds.has(customer.id);
                    return (
                      <li key={customer.id} className="border-b border-line last:border-b-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(customer.id);
                            setMapOpen(false);
                            setTipsOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                            active ? 'bg-brand-soft' : 'hover:bg-elevated/70'
                          }`}
                        >
                          <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{customer.name}</span>
                          {searched && (
                            <span className="flex shrink-0 items-center gap-3">
                              <span
                                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                                  siteActive ? 'text-success' : 'text-ink-muted'
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${siteActive ? 'bg-success' : 'bg-ink-faint'}`}
                                />
                                {siteActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="mono text-[11px] text-ink-muted">
                                {customer.customerNumber || customer.customerId || '—'}
                              </span>
                              {tag && <Badge color="blue">{tag}</Badge>}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  title={searched ? 'No customers matched' : 'No customers'}
                  description={
                    searched
                      ? 'Try a name, account #, house number, street, or postal code.'
                      : 'No customers are in this scope yet.'
                  }
                />
              )}
            </Panel>
          </aside>

          <section className="space-y-4 xl:col-span-8">
            {!selected ? (
              <Panel padded>
                <EmptyState
                  icon="users"
                  title="Select a customer"
                  description="Choose a name from the list to review assets, work orders, tips, and history."
                />
              </Panel>
            ) : (
              <>
                <Panel padded>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="type-overline">
                        Account{selectedLocation?.locationType ? ` (${selectedLocation.locationType})` : ''}
                      </p>
                      <p className="mt-1 font-display text-title-sm text-ink">
                        {[selected.customerNumber || selected.customerId, selected.name].filter(Boolean).join(' / ')}
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">
                        {[
                          selectedLocation?.houseNumber,
                          selectedLocation?.street,
                          selectedLocation?.city,
                          selectedLocation?.state,
                          locZip(selectedLocation),
                        ]
                          .filter(Boolean)
                          .join(', ') || selected.address || 'No location'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge color={accountActive ? 'green' : 'slate'}>
                          {accountActive ? 'Active site' : 'Inactive'}
                        </Badge>
                        {selected.segment && <Badge color="blue">{selected.segment}</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant={routeOpen ? 'primary' : 'secondary'} onClick={() => setRouteOpen(true)}>
                        <Icon name="route" size={14} /> Route
                      </Button>
                      <Button variant="secondary" onClick={() => navigate('mindmap')}>
                        <Icon name="layers" size={14} /> Mindmap
                      </Button>
                      <Button
                        variant={tipsOpen ? 'primary' : 'secondary'}
                        onClick={() => {
                          setTipsOpen(true);
                          setAssetTips(null);
                        }}
                      >
                        <Icon name="layers" size={14} /> Tip History
                      </Button>
                      {canCreateRecords && (
                        <Button variant="secondary" onClick={openEdit}>
                          <Icon name="edit" size={14} /> Edit
                        </Button>
                      )}
                      {canCreateRecords &&
                        (accountActive ? (
                          <Button variant="secondary" onClick={() => setDeactivateOpen(true)}>
                            Deactivate
                          </Button>
                        ) : (
                          <Button variant="secondary" onClick={reactivate}>
                            Re-activate
                          </Button>
                        ))}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                    <Fact label="Account #" value={selected.customerNumber || selected.customerId} />
                    <Fact label="Customer name" value={selected.name} />
                    <Fact label="Phone" value={selected.phone || selected.mobile} />
                    <Fact
                      label="Address"
                      value={[selectedLocation?.houseNumber, selectedLocation?.street].filter(Boolean).join(' ')}
                    />
                    <Fact label="City" value={selectedLocation?.city} />
                    <Fact label="State / Province" value={selectedLocation?.state} />
                    <Fact label="Postal code" value={locZip(selectedLocation)} />
                    <Fact label="County" value={selectedLocation?.county} />
                    <Fact
                      label="Routes"
                      value={locationRoutes(selectedLocation)
                        .map(([label, value]) => `${label} ${value}`)
                        .join(' · ')}
                    />
                    <Fact label="Zone" value={selectedLocation?.zone} />
                    <Fact label="Parcel ID" value={selectedLocation?.parcelId} />
                    <Fact label="Site ID" value={selectedLocation?.siteId} />
                    <Fact label="Latitude" value={selectedLocation?.lat || selectedLocation?.latitude} />
                    <Fact label="Longitude" value={selectedLocation?.lng || selectedLocation?.longitude} />
                    <Fact label="Division" value={selectedLocation?.division} />
                    <Fact label="Notes" value={selectedLocation?.notes || selected.notes} />
                    <Fact label="Service type" value={selectedLocation?.serviceType || selectedLocation?.type} />
                    <Fact label="Location type" value={selectedLocation?.locationType} />
                    <Fact label="Last modified" value={selected.lastModified || selectedLocation?.lastModified} />
                  </div>
                </Panel>

                <Panel>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between border-b border-line px-5 py-3 text-left"
                    onClick={() => setWoosOpen((open) => !open)}
                  >
                    <p className="type-overline">Work order(s)</p>
                    <Icon name="chevronDown" size={14} className={woosOpen ? 'rotate-180' : ''} />
                  </button>
                  {woosOpen && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
                        <p className="text-sm font-medium text-ink">
                          Open work order{openWorkOrders.length === 1 ? '' : 's'} ({openWorkOrders.length})
                        </p>
                        {canCreateRecords && (
                          <Button
                            variant="primary"
                            className="!px-2.5 !py-1.5 text-xs"
                            onClick={() => {
                              setEditingWo(null);
                              setWoForm({
                                requestType: 'Deliver',
                                subject: '',
                                dueDate: '',
                              });
                              setWoFormOpen(true);
                            }}
                          >
                            <Icon name="plus" size={14} /> Add New WO
                          </Button>
                        )}
                      </div>
                      {openWorkOrders.length ? (
                        openWorkOrders.map((row) => (
                          <div key={row.id || row.number} className="border-b border-line last:border-b-0">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-4">
                              <Fact label="Work order #" value={row.workOrderNumber || row.number} />
                              <Fact label="Status" value={row.caseStatus || row.status} />
                              <Fact label="Request type" value={row.requestType} />
                              <Fact label="Request date" value={row.requestDate || row.opened} />
                              <Fact label="Due date" value={row.dueDate} />
                              <Fact label="Action" value={row.requestType} />
                              <Fact label="Dispatch" value={row.dispatch} />
                              <Fact label="Created date" value={row.opened || row.requestDate} />
                              <Fact label="Hot ticket" value={row.hotTicket ? 'Yes' : 'No'} />
                              <Fact label="Service type" value={row.serviceType} />
                              <Fact label="Web phone" value={row.contactPhone} />
                              <Fact label="Email" value={row.contactEmail} />
                              <Fact label="WO notes" value={row.woNotes} />
                              <Fact label="Asset" value={row.asset} />
                            </div>
                            <div className="flex flex-wrap gap-2 px-5 pb-4">
                              <Button
                                variant={attemptWoId === row.id ? 'primary' : 'secondary'}
                                className="!px-2.5 !py-1.5 text-xs"
                                onClick={() => setAttemptWoId((id) => (id === row.id ? null : row.id))}
                              >
                                Attempt History ({row.numberOfAttempts ?? row.attempts ?? 0})
                              </Button>
                              {canCreateRecords && (
                                <Button
                                  variant="secondary"
                                  className="!px-2.5 !py-1.5 text-xs"
                                  onClick={() => {
                                    setEditingWo(row);
                                    setWoForm({
                                      requestType: row.requestType || 'Deliver',
                                      subject: row.subject || '',
                                      dueDate: row.dueDate || '',
                                    });
                                    setWoFormOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
                              )}
                              <Button
                                variant="secondary"
                                className="!px-2.5 !py-1.5 text-xs"
                                onClick={() => setHistoryWo(row)}
                              >
                                History
                              </Button>
                            </div>
                            {attemptWoId === row.id && (
                              <div className="border-t border-line bg-elevated/40 px-5 py-3 text-sm text-ink-muted">
                                {row.numberOfAttempts || row.attempts
                                  ? `${row.numberOfAttempts ?? row.attempts} attempt${
                                      (row.numberOfAttempts ?? row.attempts) === 1 ? '' : 's'
                                    } recorded${row.opened ? ` · opened ${row.opened}` : ''}.`
                                  : 'No attempts have been recorded for this work order.'}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <EmptyState
                          title="No open work orders"
                          description="Add a work order for this location without leaving the page."
                        />
                      )}
                    </div>
                  )}
                </Panel>

                <Panel>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between border-b border-line px-5 py-3 text-left"
                    onClick={() => setAssetsOpen((open) => !open)}
                  >
                    <p className="type-overline">Asset(s)</p>
                    <Icon name="chevronDown" size={14} className={assetsOpen ? 'rotate-180' : ''} />
                  </button>
                  {assetsOpen && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
                        <p className="text-sm font-medium text-ink">
                          {selectedAssets.length} asset{selectedAssets.length === 1 ? '' : 's'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={mapOpen ? 'primary' : 'secondary'}
                            className="!px-2.5 !py-1.5 text-xs"
                            onClick={() => setMapOpen((open) => !open)}
                          >
                            <Icon name="map" size={14} /> Map Assets
                          </Button>
                          {canCreateRecords && (
                            <Button
                              variant="secondary"
                              className="!px-2.5 !py-1.5 text-xs"
                              onClick={() => {
                                setAssignSerial('');
                                setAssignOpen(true);
                              }}
                            >
                              Assign an Asset
                            </Button>
                          )}
                        </div>
                      </div>
                      {mapOpen && (
                        <div className="border-b border-line p-4">
                          <CustomerMapPanel
                            customer={selected}
                            locations={selectedLocations}
                            assets={selectedAssets}
                            onClose={() => setMapOpen(false)}
                          />
                        </div>
                      )}
                      {selectedAssets.length ? (
                        selectedAssets.map((asset) => (
                          <div key={asset.id || asset.serial} className="border-b border-line last:border-b-0">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-4">
                              <Fact label="Serial number" value={asset.serial || asset.serialNumber} />
                              <Fact label="Container number" value={asset.container || asset.containerNumber} />
                              <Fact label="Size / type" value={asset.product} />
                              <Fact label="Item status" value={asset.status || asset.assetStatus} />
                              <Fact label="RFID" value={asset.rfid || asset.rfidNumber} />
                              <Fact
                                label="Last tip"
                                value={[asset.lastTipDate, asset.lastTipTime].filter(Boolean).join(' ')}
                              />
                              <Fact label="Last service" value={asset.lastServicedDate} />
                              <Fact
                                label="Home"
                                value={[asset.homeLatitude, asset.homeLongitude].filter(Boolean).join(' / ')}
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
                              {canCreateRecords && (
                                <ActionMenu
                                  items={ASSET_ROW_ACTIONS.map((item) => ({
                                    ...item,
                                    onSelect: () =>
                                      item.key === 'editAsset'
                                        ? openAssetEdit(asset)
                                        : applyAssetAction(asset, item.key),
                                  }))}
                                />
                              )}
                              <Button
                                variant="secondary"
                                className="!px-2.5 !py-1.5 text-xs"
                                onClick={() => {
                                  setAssetTips(asset);
                                  setTipsOpen(true);
                                }}
                              >
                                Tip History
                              </Button>
                              <Button
                                variant="secondary"
                                className="!px-2.5 !py-1.5 text-xs"
                                onClick={() => setAssetHistory(asset)}
                              >
                                Asset History
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <EmptyState title="No assets" description="Assign an asset to this location without leaving the page." />
                      )}
                    </div>
                  )}
                </Panel>
              </>
            )}
          </section>
        </div>
      </AsyncState>
      {formOpen && (
        <FormDrawer
          title={selected ? 'Edit account' : 'Create customer'}
          description="Customer, location, and the customer-location junction stay on this page."
          onClose={() => setFormOpen(false)}
          onSubmit={saveCustomer}
          busy={formBusy}
          error={formError}
          submitLabel={selected ? 'Save' : 'Create'}
        >
          <FieldSection title="Customer">
            <Field label="Name" required>
              <TextInput
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                autoFocus
              />
            </Field>
            <Field label="Phone">
              <TextInput
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </Field>
            <Field label="Email" span2>
              <TextInput
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </Field>
          </FieldSection>
          <FieldSection title="Location" className="border-t border-line pt-5">
            <Field label="House number">
              <TextInput
                value={form.houseNumber}
                onChange={(event) => setForm((current) => ({ ...current, houseNumber: event.target.value }))}
              />
            </Field>
            <Field label="Street">
              <TextInput
                value={form.street}
                onChange={(event) => setForm((current) => ({ ...current, street: event.target.value }))}
              />
            </Field>
            <Field label="City">
              <TextInput
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              />
            </Field>
            <Field label="Postal code">
              <TextInput
                value={form.zip}
                onChange={(event) => setForm((current) => ({ ...current, zip: event.target.value }))}
              />
            </Field>
          </FieldSection>
        </FormDrawer>
      )}
      {routeOpen && (
        <WorkspaceSheet
          title="Route"
          description="Collection routes assigned to this location."
          onClose={() => setRouteOpen(false)}
        >
          {locationRoutes(selectedLocation).length ? (
            <Table columns={['Stream', 'Route']}>
              {locationRoutes(selectedLocation).map(([label, value]) => (
                <tr key={label}>
                  <td className="px-4 py-3 font-medium text-ink">{label}</td>
                  <td className="mono px-4 py-3 text-ink-muted">{value}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="No routes" description="This location does not have collection routes assigned." />
          )}
        </WorkspaceSheet>
      )}
      {tipsOpen && (
        <WorkspaceSheet
          title={assetTips ? `Tip History · ${assetTips.serial || assetTips.name}` : 'Tip History'}
          description="Tip events for this customer location."
          onClose={() => {
            setTipsOpen(false);
            setAssetTips(null);
          }}
        >
          {(assetTips ? tipsForAsset(assetTips) : selectedTips).length ? (
            <Table columns={['When', 'Type', 'Detail']}>
              {(assetTips ? tipsForAsset(assetTips) : selectedTips).map((tip) => (
                <tr key={tip.id}>
                  <td className="mono px-4 py-3 text-ink-muted">{tip.timestamp || tip.eventStartDateTime || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge color="slate">{tip.type || (tip.wasTipped ? 'Tip' : 'Non-Tip')}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {[tip.truck, tip.location, tip.asset].filter(Boolean).join(' · ') || '—'}
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="No tips" description="No tip events are linked to this site." />
          )}
        </WorkspaceSheet>
      )}
      {woFormOpen && (
        <FormDrawer
          title={editingWo ? 'Edit work order' : 'Add New WO'}
          description="The work order stays attached to this customer location."
          onClose={() => {
            setWoFormOpen(false);
            setEditingWo(null);
          }}
          onSubmit={saveWorkOrder}
          busy={createWorkOrder.isPending || updateWorkOrder.isPending}
          submitLabel={editingWo ? 'Save' : 'Create'}
        >
          <Field label="Request type" required>
            <Select
              value={woForm.requestType}
              options={PICKLISTS.requestType}
              onChange={(event) => setWoForm((current) => ({ ...current, requestType: event.target.value }))}
            />
          </Field>
          <Field label="Subject">
            <TextInput
              value={woForm.subject}
              onChange={(event) => setWoForm((current) => ({ ...current, subject: event.target.value }))}
            />
          </Field>
          <Field label="Due date">
            <TextInput
              type="date"
              value={woForm.dueDate}
              onChange={(event) => setWoForm((current) => ({ ...current, dueDate: event.target.value }))}
            />
          </Field>
        </FormDrawer>
      )}
      {historyWo && (
        <WorkspaceSheet
          title={`History · ${historyWo.workOrderNumber || historyWo.number}`}
          description="Work order timeline for this location."
          onClose={() => setHistoryWo(null)}
        >
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
            <Fact label="Status" value={historyWo.caseStatus || historyWo.status} />
            <Fact label="Request type" value={historyWo.requestType} />
            <Fact label="Opened" value={historyWo.opened || historyWo.requestDate} />
            <Fact label="Due" value={historyWo.dueDate} />
            <Fact label="Completed" value={historyWo.completionDate} />
            <Fact label="Attempts" value={historyWo.numberOfAttempts ?? historyWo.attempts ?? 0} />
            <Fact label="Dispatch" value={historyWo.dispatch} />
            <Fact label="Route" value={historyWo.routeNumber || historyWo.collectionRoute} />
            <Fact label="Notes" value={historyWo.woNotes || historyWo.resolutionComments} />
          </div>
        </WorkspaceSheet>
      )}
      {assignOpen && (
        <FormDrawer
          title="Assign an Asset"
          description="Enter a serial to attach an existing or new asset to this location."
          onClose={() => setAssignOpen(false)}
          onSubmit={assignAssetToSite}
          busy={createAsset.isPending || updateAsset.isPending}
          submitLabel="Assign"
        >
          <Field label="Serial number" required>
            <TextInput
              value={assignSerial}
              onChange={(event) => setAssignSerial(event.target.value)}
              autoFocus
            />
          </Field>
        </FormDrawer>
      )}
      {editingAsset && (
        <FormDrawer
          title="Edit Asset"
          description="Update the asset without leaving this customer."
          onClose={() => setEditingAsset(null)}
          onSubmit={saveAsset}
          busy={updateAsset.isPending}
          submitLabel="Save"
        >
          <Field label="Serial number">
            <TextInput
              value={assetForm.serial}
              onChange={(event) => setAssetForm((current) => ({ ...current, serial: event.target.value }))}
            />
          </Field>
          <Field label="Status">
            <Select
              value={assetForm.status}
              options={['In Service', 'Available', 'Lost', 'Awaiting Repair']}
              onChange={(event) => setAssetForm((current) => ({ ...current, status: event.target.value }))}
            />
          </Field>
          <Field label="Product">
            <TextInput
              value={assetForm.product}
              onChange={(event) => setAssetForm((current) => ({ ...current, product: event.target.value }))}
            />
          </Field>
        </FormDrawer>
      )}
      {assetHistory && (
        <WorkspaceSheet
          title={`Asset History · ${assetHistory.serial || assetHistory.name}`}
          description="Service and tip history for this asset."
          onClose={() => setAssetHistory(null)}
        >
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
            <Fact label="Status" value={assetHistory.status || assetHistory.assetStatus} />
            <Fact label="Location" value={siteOf(assetHistory)} />
            <Fact label="Last service" value={assetHistory.lastServicedDate} />
            <Fact
              label="Last tip"
              value={[assetHistory.lastTipDate, assetHistory.lastTipTime].filter(Boolean).join(' ')}
            />
            <Fact label="Install date" value={assetHistory.installDate} />
            <Fact label="Purchase date" value={assetHistory.purchaseDate} />
            <Fact label="RFID" value={assetHistory.rfid || assetHistory.rfidNumber} />
            <Fact label="Vendor" value={assetHistory.vendor} />
          </div>
        </WorkspaceSheet>
      )}
      <ConfirmDialog
        open={deactivateOpen}
        title="Deactivate this account?"
        description="All Active Work Orders would be closed and new ones would be created for Asset removal from the Location."
        confirmLabel="Deactivate"
        onConfirm={requestDeactivate}
        onCancel={() => setDeactivateOpen(false)}
        busy={updateJunction.isPending || updateWorkOrder.isPending}
      />
      {importOpen && (
        <WorkspaceSheet
          title="Mass Upload Customers"
          description="Upload a CSV without leaving Manage Customers."
          onClose={() => setImportOpen(false)}
        >
          <BulkImport embedded initialObject="Customers" onClose={() => setImportOpen(false)} />
        </WorkspaceSheet>
      )}
    </Page>
  );
}
