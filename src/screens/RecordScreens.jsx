import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import {
  Badge,
  Table,
  Field,
  TextInput,
  TextArea,
  Select,
  Checkbox,
  Button,
  Page,
  PageHeader,
  Panel,
  Drawer,
  FormDrawer,
  DrawerActions,
  FieldSection,
  ConfirmDialog,
  AsyncState,
  EmptyState,
  Toolbar,
  SearchField,
  StatusDot,
} from '../components/UI.jsx';
import {
  ASSET_ACTIONS,
  RECORD_SCHEMAS,
  YARD_MOVE_STATUSES,
} from '../data/recordSchemas.js';
import { PICKLISTS } from '../data/picklists.js';
import { useStore } from '../state/AppStore.jsx';
import { useAccounts } from '../hooks/useAccounts.js';
import {
  useCreateRecord,
  useDeleteRecord,
  useRecords,
  useUpdateRecord,
} from '../hooks/useRecords.js';
import { getErrorMessage } from '../lib/errors.js';
import ReportsStudio from './ReportsStudio.jsx';

function recordStatusColor(status) {
  const s = String(status || '').toLowerCase();
  if (['lost', 'decommissioned', 'failed', 'cancelled'].some((k) => s.includes(k))) return 'rose';
  if (['paused', 'inactive', 'draft'].some((k) => s.includes(k))) return 'slate';
  if (['pending', 'delayed', 'warning'].some((k) => s.includes(k))) return 'amber';
  if (['complete', 'enabled', 'in service', 'available', 'active'].some((k) => s.includes(k)))
    return 'green';
  return 'cyan';
}

const ASSET_MENU_ACTIONS = ASSET_ACTIONS.filter(
  (action) => action.key !== 'editAsset' && action.key !== 'assignNew'
);

const parseTime = (value) => {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
};

function assetReferences(record, asset) {
  const keys = [asset?.name, asset?.serial]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  if (!keys.length) return false;
  return Object.values(record).some((value) => {
    if (value == null || typeof value === 'object') return false;
    return keys.includes(String(value).toLowerCase());
  });
}

function getDispatchType(row) {
  if (row.recordType === 'Maintenance' || row.mrp) return 'Maintenance';
  if (row.recordType === 'Collection') return 'Collection';
  return row.mrp ? 'Maintenance' : 'Collection';
}

function isHotTicket(row) {
  return row.hotTicket === true || row.hotTicket === 'Yes' || String(row.priority || '').toLowerCase() === 'critical';
}

function isTipped(row) {
  return row.wasTipped === true || (row.wasTipped == null && row.type === 'Tip');
}

function matchesRecordType(kind, row, recordType) {
  if (!recordType || recordType === 'All') return true;
  if (kind === 'dispatches') return getDispatchType(row) === recordType;
  if (kind === 'routes') return (row.recordType || 'Collection') === recordType;
  if (kind === 'individualTips') {
    if (recordType === 'Tip Events' || recordType === 'Tip') return isTipped(row);
    if (recordType === 'Non-Tip Events' || recordType === 'Non-Tip') return !isTipped(row);
  }
  if (kind === 'assets') {
    const isTruck = row.recordType === 'Truck' || /truck|trk-/i.test(`${row.name || ''} ${row.serial || ''}`);
    return recordType === 'Truck' ? isTruck : !isTruck;
  }
  return (row.recordType || row.type || '') === recordType;
}

function exportCsv(filename, columns, rows) {
  const escape = (value) => {
    const text = value == null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [
    columns.map((column) => escape(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => escape(row[column.key])).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
}

const WO_SOURCES = [
  { key: 'manual', label: 'Manual entry', description: 'Create a work order from the form.' },
  { key: 'portal', label: 'Customer request', description: 'Log a request that originated in the customer portal.' },
  { key: 'woit', label: 'WOIT Import', description: 'Upload a CSV through the four-stage import tool.' },
  { key: 'api', label: 'API / External', description: 'Record an order received from an external system.' },
];

function WorkOrderSourcePicker({ onClose, onSelect }) {
  return (
    <Drawer
      title="New Work Order"
      description="Choose how this work order is being created."
      onClose={onClose}
      footer={
        <DrawerActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </DrawerActions>
      }
    >
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-6 py-5">
        {WO_SOURCES.map((source) => (
          <button
            key={source.key}
            type="button"
            className="flex w-full flex-col rounded-panel border border-line bg-surface px-4 py-3 text-left interactive hover:bg-elevated"
            onClick={() => onSelect(source.key)}
          >
            <span className="text-sm font-medium text-ink">{source.label}</span>
            <span className="mt-0.5 text-xs text-ink-muted">{source.description}</span>
          </button>
        ))}
      </div>
    </Drawer>
  );
}

function compareValues(a, b) {
  const av = a == null ? '' : a;
  const bv = b == null ? '' : b;
  const an = Number(av);
  const bn = Number(bv);
  if (av !== '' && bv !== '' && Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
  return String(av).localeCompare(String(bv), undefined, { numeric: true });
}

function FieldInput({ field, value, onChange, error, disabled = false }) {
  const common = { value: value ?? '', onChange: (e) => onChange(e.target.value), disabled };
  if (disabled && field.type !== 'readonly') {
    return (
      <div className="field-input flex items-center bg-elevated text-ink-muted">
        {value === true ? 'Yes' : value === false ? 'No' : String(value ?? '') || '—'}
      </div>
    );
  }
  switch (field.type) {
    case 'readonly':
      return (
        <div className="field-input flex items-center bg-elevated text-ink-faint">
          {value || 'Calculated on save'}
        </div>
      );
    case 'textarea':
      return <TextArea rows={2} {...common} />;
    case 'select':
      return <Select options={field.options || []} placeholder="Select…" {...common} />;
    case 'number':
      return <TextInput type="number" {...common} />;
    case 'date':
      return <TextInput type="date" {...common} />;
    case 'time':
      return <TextInput type="time" {...common} />;
    case 'datetime':
      return <TextInput type="datetime-local" {...common} />;
    case 'checkbox':
      return (
        <Checkbox
          label="Yes"
          checked={value === true || value === 'Yes' || value === 'true'}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case 'lookup':
      return (
        <div className="relative">
          <TextInput placeholder="Search…" {...common} />
          <Icon
            name="search"
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
        </div>
      );
    default:
      return <TextInput {...common} aria-invalid={!!error} />;
  }
}

function RecordForm({ schema, initial, onClose, onSave, onDelete, readOnly = false }) {
  const [values, setValues] = useState(initial || {});
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (readOnly) return;
    const next = {};
    schema.sections.flatMap((s) => s.fields).forEach((field) => {
      const value = values[field.key];
      if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
        next[field.key] = `${field.label} is required`;
      }
      if (field.type === 'number' && value !== '' && value !== undefined && value !== null && !Number.isFinite(Number(value))) {
        next[field.key] = `${field.label} must be a number`;
      }
      if (field.key.toLowerCase().includes('email') && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        next[field.key] = 'Enter a valid email address';
      }
    });
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setSaveError('');
    try {
      await onSave(values);
    } catch (error) {
      setSaveError(getErrorMessage(error, `Could not save ${schema.singular.toLowerCase()}.`));
    } finally {
      setBusy(false);
    }
  };
  return (
    <FormDrawer
      onClose={onClose}
      onSubmit={save}
      wide
      title={
        readOnly
          ? `${schema.singular} details`
          : initial
            ? `Edit ${schema.singular.toLowerCase()}`
            : schema.newLabel
      }
      description={
        readOnly
          ? 'Your role has view-only access to these records.'
          : initial
            ? 'Update the fields below, then save your changes.'
            : 'Complete the fields below, then save to create the record.'
      }
      dirty={!readOnly && JSON.stringify(values) !== JSON.stringify(initial || {})}
      busy={busy}
      error={saveError}
      submitLabel={initial ? 'Save changes' : 'Create record'}
      footer={
        readOnly ? (
          <DrawerActions>
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </DrawerActions>
        ) : undefined
      }
    >
      {schema.sections.map((sec, idx) => (
        <FieldSection
          key={sec.title}
          title={sec.title}
          className={idx === 0 ? '' : 'border-t border-line pt-5'}
        >
          {sec.fields.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              required={field.required}
              error={errors[field.key]}
              span2={!!field.span2 || field.type === 'textarea'}
            >
              <FieldInput
                field={field}
                value={values[field.key]}
                error={errors[field.key]}
                disabled={readOnly}
                onChange={(value) => {
                  setValues((current) => ({ ...current, [field.key]: value }));
                  setErrors((current) => ({ ...current, [field.key]: undefined }));
                }}
              />
            </Field>
          ))}
        </FieldSection>
      ))}
      {initial && !readOnly && (
        <div className="border-t border-line pt-5">
          <p className="mb-3 text-sm text-ink-muted">
            Deleting this {schema.singular.toLowerCase()} cannot be undone.
          </p>
          <Button type="button" variant="secondary" onClick={onDelete} disabled={busy}>
            Delete {schema.singular.toLowerCase()}
          </Button>
        </div>
      )}
    </FormDrawer>
  );
}

function RowActionMenu({ items, disabled, label = 'Actions' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const visible = items.filter(Boolean);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  useEffect(() => {
    if (open) menuRef.current?.querySelector('button')?.focus();
  }, [open]);

  const onMenuKeyDown = (event) => {
    const buttons = [...(menuRef.current?.querySelectorAll('button') || [])];
    if (!buttons.length) return;
    const index = buttons.indexOf(document.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      buttons[(index + 1) % buttons.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      buttons[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      buttons[buttons.length - 1]?.focus();
    }
  };

  if (!visible.length) return null;

  return (
    <div className="relative" ref={rootRef}>
      <Button
        type="button"
        variant="secondary"
        className="!px-2.5 !py-1.5 text-xs"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {label} <Icon name="chevronDown" size={12} />
      </Button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-20 mt-1 min-w-[200px] overflow-hidden rounded-panel border border-line bg-surface shadow-lg"
        >
          {visible.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className={`block w-full px-3 py-2 text-left text-sm interactive hover:bg-elevated ${
                item.danger ? 'text-danger' : 'text-ink'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onSelect();
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

function AssignAssetDrawer({ accounts, defaultAccount, onClose, onAssign }) {
  const [serial, setSerial] = useState('');
  const [account, setAccount] = useState(defaultAccount || accounts[0]?.name || '');
  const [location, setLocation] = useState('');
  const [product, setProduct] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const baseline = useMemo(
    () => ({ serial: '', account: defaultAccount || accounts[0]?.name || '', location: '', product: '' }),
    [accounts, defaultAccount]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!serial.trim()) {
      setError('Asset serial number is required.');
      return;
    }
    if (!account.trim()) {
      setError('Account is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onAssign({
        serial: serial.trim(),
        account: account.trim(),
        location: location.trim(),
        product: product.trim() || '96 Gallon Trash',
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not assign asset.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDrawer
      onClose={onClose}
      onSubmit={submit}
      title="Assign New Asset"
      description="Search by serial number. If not found, a new asset record is created and assigned."
      dirty={
        serial !== baseline.serial ||
        account !== baseline.account ||
        location !== baseline.location ||
        product !== baseline.product
      }
      busy={busy}
      error={error}
      submitLabel="Assign"
    >
      <FieldSection title="Assignment">
        <Field label="Asset Serial Number" required span2>
          <TextInput value={serial} onChange={(e) => setSerial(e.target.value)} autoFocus placeholder="SN-…" />
        </Field>
        <Field label="Account" required>
          <Select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            options={accounts.map((a) => a.name)}
            placeholder="Select account"
          />
        </Field>
        <Field label="Customer Location">
          <TextInput value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location name or #" />
        </Field>
        <Field label="Product" span2>
          <TextInput value={product} onChange={(e) => setProduct(e.target.value)} placeholder="96 Gallon Trash" />
        </Field>
      </FieldSection>
    </FormDrawer>
  );
}

function AssetActionDrawer({ action, asset, accounts, yardLocations, onClose, onSave, onEditFull }) {
  const meta = {
    editAsset: {
      title: `Edit Asset ${asset.serial || asset.name || ''}`,
      description: 'Update asset fields. Tracked changes are reflected on the asset record.',
      submitLabel: 'Save changes',
    },
    moveToYard: {
      title: `Move To Yard · ${asset.serial || asset.name || ''}`,
      description: 'Move this asset to a yard location and optionally update its status.',
      submitLabel: 'Confirm move',
    },
    moveToAccount: {
      title: `Move ${asset.serial || asset.name || ''} to Another Account`,
      description: 'Transfer this asset to a different service provider account.',
      submitLabel: 'Confirm move',
    },
    markLost: {
      title: `Mark Asset ${asset.serial || asset.name || ''} as Lost`,
      description: 'Set the asset status to Lost. Optionally record a yard or scrap status.',
      submitLabel: 'Mark As Lost',
    },
    reactivate: {
      title: `Reactivate ${asset.serial || asset.name || ''}`,
      description: 'Return this asset to active inventory / in-service status.',
      submitLabel: 'Reactivate',
    },
    deactivate: {
      title: `Deactivate ${asset.serial || asset.name || ''}`,
      description: 'Decommission this asset. Related open work may be closed in a full deployment.',
      submitLabel: 'Deactivate',
    },
  }[action];

  const [destination, setDestination] = useState('');
  const [status, setStatus] = useState(
    action === 'markLost'
      ? 'Lost'
      : action === 'reactivate'
        ? 'In Service'
        : action === 'deactivate'
          ? 'Decommissioned Tag'
          : asset.status || ''
  );
  const [name, setName] = useState(asset.name || '');
  const [product, setProduct] = useState(asset.product || '');
  const [serial, setSerial] = useState(asset.serial || '');
  const [location, setLocation] = useState(asset.location || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!meta) return null;

  if (action === 'editAsset' && onEditFull) {
    // Full schema edit is handled by RecordForm; this branch is a short cut confirmation.
  }

  const needsDestination = action === 'moveToYard' || action === 'moveToAccount';
  const needsStatus = action === 'moveToYard' || action === 'markLost' || action === 'reactivate' || action === 'deactivate';
  const isEdit = action === 'editAsset';

  const submit = async (e) => {
    e.preventDefault();
    if (needsDestination && !destination.trim()) {
      setError(action === 'moveToYard' ? 'Select a yard location.' : 'Select a destination account.');
      return;
    }
    if (needsStatus && !status.trim()) {
      setError('Asset status is required.');
      return;
    }
    if (isEdit && !name.trim()) {
      setError('Asset name is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const changes = {};
      if (isEdit) {
        changes.name = name.trim();
        changes.product = product.trim();
        changes.serial = serial.trim();
        changes.location = location.trim();
        changes.status = status || asset.status;
      }
      if (action === 'moveToYard') {
        changes.location = destination;
        changes.warehouse = destination;
        changes.status = status;
      }
      if (action === 'moveToAccount') {
        changes.account = destination;
        const match = accounts.find((a) => a.name === destination);
        if (match) changes.accountId = match.id;
      }
      if (action === 'markLost') {
        changes.status = status || 'Lost';
      }
      if (action === 'reactivate') {
        changes.status = status || 'In Service';
      }
      if (action === 'deactivate') {
        changes.status = status || 'Decommissioned Tag';
        changes.usageEndDate = new Date().toISOString().slice(0, 10);
      }
      await onSave(changes, meta.title);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not complete asset action.'));
    } finally {
      setBusy(false);
    }
  };

  const yardOptions = yardLocations.length
    ? yardLocations
    : ['Kennedale', 'Edmonton AB Other Yard', 'Other Yard_Location Name'];

  return (
    <FormDrawer
      onClose={onClose}
      onSubmit={submit}
      title={meta.title}
      description={meta.description}
      dirty
      busy={busy}
      error={error}
      submitLabel={meta.submitLabel}
      wide={isEdit}
    >
      <FieldSection title="Asset">
        <Field label="Current asset" span2>
          <div className="field-input bg-elevated text-ink-muted">
            {asset.name || '—'} · {asset.serial || 'no serial'} · {asset.status || '—'}
          </div>
        </Field>
        {isEdit && (
          <>
            <Field label="Asset Name" required>
              <TextInput value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Serial Number">
              <TextInput value={serial} onChange={(e) => setSerial(e.target.value)} />
            </Field>
            <Field label="Product">
              <TextInput value={product} onChange={(e) => setProduct(e.target.value)} />
            </Field>
            <Field label="Customer Location">
              <TextInput value={location} onChange={(e) => setLocation(e.target.value)} />
            </Field>
            <Field label="Asset Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} options={PICKLISTS.assetStatus} />
            </Field>
            {onEditFull && (
              <div className="sm:col-span-2">
                <Button type="button" variant="secondary" onClick={onEditFull}>
                  Open full asset form
                </Button>
              </div>
            )}
          </>
        )}
        {action === 'moveToYard' && (
          <Field label="Move To Location" required span2>
            <Select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              options={yardOptions}
              placeholder="Select a Location"
            />
          </Field>
        )}
        {action === 'moveToAccount' && (
          <Field label="Destination Account" required span2>
            <Select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              options={accounts.map((a) => a.name)}
              placeholder="Select account"
            />
          </Field>
        )}
        {needsStatus && !isEdit && (
          <Field label="Asset Status" required span2>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={
                action === 'moveToYard' || action === 'markLost'
                  ? [...new Set([...YARD_MOVE_STATUSES, 'Lost', ...PICKLISTS.assetStatus])]
                  : action === 'reactivate'
                    ? ['Available', 'In Service', 'Inventory', 'New']
                    : ['Decommissioned Tag', 'Scrapped', 'To Be Scrapped', 'Lost', ...PICKLISTS.assetStatus]
              }
              placeholder="Select Asset Status"
            />
          </Field>
        )}
        {action === 'deactivate' && (
          <p className="sm:col-span-2 text-sm text-ink-muted">
            Deactivation sets a usage end date and marks the asset out of service. In production, open work orders at the
            location would be closed and Remove WOs created.
          </p>
        )}
      </FieldSection>
    </FormDrawer>
  );
}

function RetrieveReplaceDrawer({ asset, onClose, onSubmit }) {
  const [retrievedStatus, setRetrievedStatus] = useState('Available');
  const [replacementSerial, setReplacementSerial] = useState('');
  const [replacementProduct, setReplacementProduct] = useState(asset.product || '');
  const [replacementLocation, setReplacementLocation] = useState(asset.location || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!replacementSerial.trim()) {
      setError('Replacement asset serial number is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit({
        retrievedStatus,
        replacementSerial: replacementSerial.trim(),
        replacementProduct: replacementProduct.trim(),
        replacementLocation: replacementLocation.trim(),
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not retrieve and replace asset.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDrawer
      onClose={onClose}
      onSubmit={submit}
      title={`Retrieve & Replace · ${asset.serial || asset.name || ''}`}
      description="Retrieve the current asset and assign a replacement. Both records are updated."
      dirty={!!replacementSerial}
      busy={busy}
      error={error}
      submitLabel="Retrieve & Replace"
    >
      <FieldSection title="Retrieve">
        <Field label="Asset being retrieved" span2>
          <div className="field-input bg-elevated text-ink-muted">
            {asset.name || '—'} · {asset.serial || 'no serial'} · {asset.status || '—'}
          </div>
        </Field>
        <Field label="Retrieved Asset Status" span2>
          <Select
            value={retrievedStatus}
            onChange={(e) => setRetrievedStatus(e.target.value)}
            options={['Available', 'Awaiting Repair', 'Awaiting Wash', 'Inventory', 'To Be Scrapped', ...PICKLISTS.assetStatus]}
          />
        </Field>
      </FieldSection>
      <FieldSection title="Replacement" className="border-t border-line pt-5">
        <Field label="Replacement Serial Number" required>
          <TextInput
            value={replacementSerial}
            onChange={(e) => setReplacementSerial(e.target.value)}
            autoFocus
            placeholder="SN-…"
          />
        </Field>
        <Field label="Replacement Product">
          <TextInput value={replacementProduct} onChange={(e) => setReplacementProduct(e.target.value)} />
        </Field>
        <Field label="Replacement Customer Location" span2>
          <TextInput value={replacementLocation} onChange={(e) => setReplacementLocation(e.target.value)} />
        </Field>
      </FieldSection>
    </FormDrawer>
  );
}

function DetailGrid({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="type-overline mb-1">{label}</dt>
          <dd className="text-sm text-ink">{value === 0 ? '0' : value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

function AssetRelatedDrawer({ mode, asset, workOrders, tips, dispatches, onClose }) {
  const meta = {
    history: {
      title: `History · ${asset.serial || asset.name || ''}`,
      description: 'Change and service timeline assembled from related work orders, tips, and dispatches.',
    },
    lastTip: {
      title: `Last Tip Details · ${asset.serial || asset.name || ''}`,
      description: 'The most recent tip / non-tip event that references this asset.',
    },
    lastService: {
      title: `Last Service Details · ${asset.serial || asset.name || ''}`,
      description: 'The most recent completed work order that references this asset.',
    },
  }[mode];

  const relTips = [...tips].sort((a, b) => parseTime(b.timestamp) - parseTime(a.timestamp));
  const completedWos = workOrders
    .filter((wo) => wo.status === 'Closed' || wo.completionDate)
    .sort((a, b) => parseTime(b.completionDate || b.dueDate) - parseTime(a.completionDate || a.dueDate));

  const kindColor = { Tip: 'cyan', 'Work Order': 'amber', Dispatch: 'slate' };
  const entries = [
    ...tips.map((t) => ({
      time: parseTime(t.timestamp),
      when: t.timestamp,
      kind: 'Tip',
      title: t.type || (t.wasTipped ? 'Tip' : 'Non-Tip'),
      detail: [t.truck, t.location].filter(Boolean).join(' · '),
    })),
    ...workOrders.map((w) => ({
      time: parseTime(w.completionDate || w.dueDate || w.requestDate),
      when: w.completionDate || w.dueDate || w.requestDate,
      kind: 'Work Order',
      title: [w.number, w.requestType].filter(Boolean).join(' · '),
      detail: [w.subject, w.status].filter(Boolean).join(' · '),
    })),
    ...dispatches.map((d) => ({
      time: parseTime(d.routeDate),
      when: d.routeDate,
      kind: 'Dispatch',
      title: d.number,
      detail: [d.truck, d.driver, d.status].filter(Boolean).join(' · '),
    })),
  ].sort((a, b) => b.time - a.time);

  let body;
  if (mode === 'history') {
    body = entries.length ? (
      <ol className="space-y-3">
        {entries.map((entry, index) => (
          <li key={index} className="flex gap-3">
            <div className="pt-0.5">
              <Badge color={kindColor[entry.kind] || 'slate'}>{entry.kind}</Badge>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{entry.title || '—'}</p>
              {entry.detail && <p className="text-xs text-ink-muted">{entry.detail}</p>}
              <p className="mono text-xs text-ink-faint">{entry.when || '—'}</p>
            </div>
          </li>
        ))}
      </ol>
    ) : (
      <EmptyState title="No rows" description="No related records reference this asset yet." />
    );
  } else if (mode === 'lastTip') {
    const tip = relTips[0];
    body = tip ? (
      <DetailGrid
        items={[
          ['Tip #', tip.id],
          ['Type', tip.type],
          ['Tipped', tip.wasTipped ? 'Yes' : 'No'],
          ['Event Date/Time', tip.timestamp],
          ['Truck', tip.truck],
          ['Collection Route', tip.collectionRoute],
          ['Customer Location', tip.location],
          ['Service Provider', tip.account],
        ]}
      />
    ) : (
      <EmptyState title="No rows" description="No tip events reference this asset yet." />
    );
  } else {
    const wo = completedWos[0];
    body = wo ? (
      <DetailGrid
        items={[
          ['Work Order #', wo.number],
          ['Request Type', wo.requestType],
          ['Status', wo.status],
          ['Subject', wo.subject],
          ['Completion Date', wo.completionDate || wo.dueDate],
          ['Resolution Code', wo.resolutionCode],
          ['Account', wo.account],
          ['Customer', wo.customer],
        ]}
      />
    ) : (
      <EmptyState title="No rows" description="No completed work orders reference this asset yet." />
    );
  }

  return (
    <Drawer
      title={meta.title}
      description={meta.description}
      onClose={onClose}
      footer={
        <DrawerActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DrawerActions>
      }
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5 scroll-thin">{body}</div>
    </Drawer>
  );
}

export function GenericList({ kind, view }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [recordType, setRecordType] = useState('All');
  const [accountScope, setAccountScope] = useState('All');
  const [filterCol, setFilterCol] = useState('');
  const [filterVal, setFilterVal] = useState('');
  const [hotOnly, setHotOnly] = useState(false);
  const [sortKey, setSortKey] = useState('default');
  const [sortDir, setSortDir] = useState('asc');
  const [deletePending, setDeletePending] = useState(false);
  const [assetAction, setAssetAction] = useState(null);
  const [assetInfo, setAssetInfo] = useState(null);
  const [retrieveAsset, setRetrieveAsset] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [woSourceOpen, setWoSourceOpen] = useState(false);
  const [woSource, setWoSource] = useState('');
  const { canCreateRecords, isScoped, persona, state, toast, navigate } = useStore();
  const accountsQuery = useAccounts();
  const recordsQuery = useRecords(kind === 'analytics' ? null : kind);
  const locationsQuery = useRecords(kind === 'assets' ? 'locations' : null);
  const workOrdersQuery = useRecords(kind === 'assets' ? 'workOrders' : null);
  const tipsQuery = useRecords(kind === 'assets' ? 'individualTips' : null);
  const dispatchesQuery = useRecords(kind === 'assets' ? 'dispatches' : null);
  const createMutation = useCreateRecord(kind);
  const updateMutation = useUpdateRecord(kind);
  const deleteMutation = useDeleteRecord(kind);
  const createAssetMutation = useCreateRecord('assets');
  const updateAssetMutation = useUpdateRecord('assets');
  const schema = RECORD_SCHEMAS[kind];
  useEffect(() => {
    setFormOpen(false);
    setEditing(null);
    setDeletePending(false);
    setAssetAction(null);
    setAssetInfo(null);
    setRetrieveAsset(null);
    setAssignOpen(false);
    setWoSourceOpen(false);
    setWoSource('');
    setQ('');
    setStatus('All');
    setRecordType('All');
    setAccountScope('All');
    setFilterCol('');
    setFilterVal('');
    setHotOnly(false);
    setSortKey('default');
    setSortDir('asc');
  }, [kind]);

  if (kind === 'analytics') return <Analytics view={view} />;
  if (!schema) {
    return (
      <Page>
        <PageHeader
          overline="Records"
          title="Unavailable"
          description="This record screen is not configured for the current workspace."
        />
        <EmptyState
          icon="alert"
          title="Module unavailable"
          description="The requested records module could not be loaded. Return home or pick another module from navigation."
          action={
            <Button variant="primary" onClick={() => navigate('home')}>
              Back to home
            </Button>
          }
        />
      </Page>
    );
  }

  const rows = recordsQuery.data?.data || [];
  const scopedAccounts = accountsQuery.data || [];
  const accountNames = new Set(scopedAccounts.map((account) => account.name));
  const statuses = [...new Set(rows.map((row) => row.status).filter(Boolean))];
  const yardLocations = (locationsQuery.data?.data || [])
    .filter((loc) => /yard/i.test(String(loc.type || loc.name || '')))
    .map((loc) => loc.name)
    .filter(Boolean);
  const filtered = rows
    .filter((row) => status === 'All' || row.status === status)
    .filter((row) => matchesRecordType(kind, row, recordType))
    .filter((row) => {
      if (accountScope === 'All') return true;
      return row.account === accountScope || row.accountId === accountScope;
    })
    .filter((row) => !hotOnly || isHotTicket(row))
    .filter((row) => {
      if (!filterCol || !filterVal.trim()) return true;
      return String(row[filterCol] ?? '')
        .toLowerCase()
        .includes(filterVal.trim().toLowerCase());
    })
    .filter((row) =>
      Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(q.trim().toLowerCase()))
    )
    .sort((a, b) => {
      if (sortKey === 'default') return 0;
      const result = compareValues(a[sortKey], b[sortKey]);
      return sortDir === 'desc' ? -result : result;
    });

  const filtersActive =
    !!q.trim() ||
    status !== 'All' ||
    recordType !== 'All' ||
    accountScope !== 'All' ||
    hotOnly ||
    !!(filterCol && filterVal.trim());

  const saveRecord = async (values) => {
    if (!canCreateRecords) {
      toast?.('Your role does not allow changes to these records.', 'danger');
      return;
    }
    const generated =
      schema.listColumns[0].key === 'number' && !values.number
        ? { number: `${kind.slice(0, 3).toUpperCase()}-${String(rows.length + 1).padStart(5, '0')}` }
        : {};
    const tipId =
      kind === 'individualTips' && !values.id
        ? { id: `TIP-${String(Date.now()).slice(-5)}` }
        : {};
    const tipName =
      kind === 'individualTips' && !values.name
        ? { name: values.id || tipId.id || `Tip ${rows.length + 1}` }
        : {};
    const aggName =
      kind === 'aggregatedTips' && !values.name
        ? { name: `AGG-${values.date || 'new'}-${values.truck || rows.length + 1}` }
        : {};
    const scopedDefault = isScoped && !values.account ? { account: [...accountNames][0] } : {};
    const accountName = values.account || scopedDefault.account || editing?.account;
    const account = scopedAccounts.find((candidate) => candidate.name === accountName);
    const changes = {
      ...generated,
      ...tipId,
      ...tipName,
      ...aggName,
      ...scopedDefault,
      ...values,
      ...(account ? { accountId: account.id } : {}),
      ...(kind === 'assets' && !values.recordType ? { recordType: 'Asset' } : {}),
      ...(kind === 'individualTips' && !values.recordType
        ? { recordType: 'Individual Telematics Events' }
        : {}),
      ...(kind === 'workOrders' && woSource && !editing ? { source: woSource } : {}),
    };
    try {
      if (editing) await updateMutation.mutateAsync({ id: editing.id, changes });
      else await createMutation.mutateAsync(changes);
      toast?.(`${schema.singular} ${editing ? 'updated' : 'created'}`);
      setFormOpen(false);
      setEditing(null);
      setWoSource('');
    } catch (error) {
      toast?.(getErrorMessage(error, `Could not save ${schema.singular.toLowerCase()}.`), 'danger');
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!editing) return;
    if (!canCreateRecords) {
      toast?.('Your role does not allow deleting records.', 'danger');
      setDeletePending(false);
      return;
    }
    try {
      await deleteMutation.mutateAsync(editing.id);
      toast?.(`${schema.singular} deleted`);
      setDeletePending(false);
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      toast?.(getErrorMessage(error, `Could not delete ${schema.singular.toLowerCase()}.`), 'danger');
    }
  };

  const applyAssetAction = async (changes) => {
    if (!assetAction?.asset?.id || !canCreateRecords) return;
    await updateAssetMutation.mutateAsync({ id: assetAction.asset.id, changes });
    toast?.(`Asset ${assetAction.asset.serial || assetAction.asset.name} updated`);
    setAssetAction(null);
    recordsQuery.refetch?.();
  };

  const assignAsset = async ({ serial, account, location, product }) => {
    if (!canCreateRecords) throw new Error('Your role does not allow assigning assets.');
    const existing = rows.find(
      (row) => String(row.serial || '').toLowerCase() === serial.toLowerCase()
    );
    const accountRec = scopedAccounts.find((candidate) => candidate.name === account);
    if (existing) {
      await updateAssetMutation.mutateAsync({
        id: existing.id,
        changes: {
          account,
          ...(accountRec ? { accountId: accountRec.id } : {}),
          location: location || existing.location,
          status: existing.status === 'Lost' || existing.status === 'Decommissioned Tag' ? 'In Service' : existing.status || 'In Service',
        },
      });
      toast?.(`Asset ${serial} assigned to ${account}`);
    } else {
      await createAssetMutation.mutateAsync({
        name: serial,
        serial,
        account,
        ...(accountRec ? { accountId: accountRec.id } : {}),
        location,
        product,
        status: 'In Service',
        recordType: 'Asset',
      });
      toast?.(`Asset ${serial} created and assigned`);
    }
    setAssignOpen(false);
    recordsQuery.refetch?.();
  };

  const retrieveAndReplace = async ({ retrievedStatus, replacementSerial, replacementProduct, replacementLocation }) => {
    if (!canCreateRecords) throw new Error('Your role does not allow asset changes.');
    const asset = retrieveAsset;
    await updateAssetMutation.mutateAsync({
      id: asset.id,
      changes: {
        status: retrievedStatus || 'Available',
        usageEndDate: new Date().toISOString().slice(0, 10),
      },
    });
    const accountRec = scopedAccounts.find((candidate) => candidate.name === asset.account);
    const serialLower = replacementSerial.toLowerCase();
    const existing = rows.find(
      (row) =>
        String(row.serial || '').toLowerCase() === serialLower ||
        String(row.name || '').toLowerCase() === serialLower
    );
    if (existing) {
      await updateAssetMutation.mutateAsync({
        id: existing.id,
        changes: {
          account: asset.account,
          ...(accountRec ? { accountId: accountRec.id } : {}),
          location: replacementLocation || asset.location,
          product: replacementProduct || existing.product,
          status: 'In Service',
        },
      });
    } else {
      await createAssetMutation.mutateAsync({
        name: replacementSerial,
        serial: replacementSerial,
        account: asset.account,
        ...(accountRec ? { accountId: accountRec.id } : {}),
        location: replacementLocation || asset.location,
        product: replacementProduct || asset.product,
        status: 'In Service',
        recordType: 'Asset',
      });
    }
    toast?.(`Retrieved ${asset.serial || asset.name}; replaced with ${replacementSerial}`);
    setRetrieveAsset(null);
    recordsQuery.refetch?.();
  };

  const relatedWorkOrders = (asset) =>
    (workOrdersQuery.data?.data || []).filter((record) => assetReferences(record, asset));
  const relatedTips = (asset) =>
    (tipsQuery.data?.data || []).filter((record) => assetReferences(record, asset));
  const relatedDispatches = (asset) =>
    (dispatchesQuery.data?.data || []).filter((record) => assetReferences(record, asset));

  const buildRowActions = (row) => {
    const items = [
      {
        key: 'open',
        label: canCreateRecords ? 'Open / Edit' : 'View details',
        onSelect: () => {
          setEditing(row);
          setFormOpen(true);
        },
      },
    ];
    if (kind === 'assets') {
      if (canCreateRecords) {
        items.push({
          key: 'retrieveReplace',
          label: 'Retrieve & Replace',
          onSelect: () => setRetrieveAsset(row),
        });
        ASSET_MENU_ACTIONS.forEach((action) => {
          items.push({
            key: action.key,
            label: action.label,
            onSelect: () => setAssetAction({ kind: action.key, asset: row }),
          });
        });
      }
      items.push(
        {
          key: 'mapAssets',
          label: 'Map Assets',
          onSelect: () =>
            navigate('mapCenter', {
              provider: row.accountId,
              account: row.account,
              assetId: row.id,
            }),
        },
        { key: 'history', label: 'History', onSelect: () => setAssetInfo({ mode: 'history', asset: row }) },
        { key: 'lastTip', label: 'Last Tip Details', onSelect: () => setAssetInfo({ mode: 'lastTip', asset: row }) },
        {
          key: 'lastService',
          label: 'Last Service Details',
          onSelect: () => setAssetInfo({ mode: 'lastService', asset: row }),
        }
      );
    }
    if (kind === 'routes') {
      items.push({
        key: 'mapCenter',
        label: 'Map Center',
        onSelect: () =>
          navigate('mapCenter', {
            provider: row.accountId,
            account: row.account,
            route: row.routeNumber,
          }),
      });
    }
    if (canCreateRecords) {
      items.push({
        key: 'delete',
        label: `Delete ${schema.singular.toLowerCase()}`,
        danger: true,
        onSelect: () => {
          setEditing(row);
          setDeletePending(true);
        },
      });
    }
    return items;
  };

  const columns = [...schema.listColumns.map((c) => c.label), 'Actions'];

  return (
    <Page>
      <PageHeader
        overline="Records"
        title={schema.title}
        description={
          <span>
            <span className="mono tabular-nums">{filtered.length}</span> of {rows.length} records
            {isScoped && state.currentUser?.scopeLabel && (
              <span className="text-ink-faint"> · {state.currentUser.scopeLabel}</span>
            )}
            {!canCreateRecords && <span className="text-ink-faint"> · View only</span>}
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {kind === 'workOrders' && canCreateRecords && (
              <Button variant="secondary" onClick={() => navigate('bulkImport', { object: 'Work Orders' })}>
                <Icon name="download" size={16} /> WOIT Import
              </Button>
            )}
            {kind === 'assets' && canCreateRecords && (
              <>
                <RowActionMenu
                  label="Import"
                  items={[
                    {
                      key: 'standard',
                      label: 'Asset Import (Standard)',
                      onSelect: () => navigate('bulkImport', { object: 'Assets', mode: 'standard' }),
                    },
                    {
                      key: 'legacy',
                      label: 'Legacy Asset Import',
                      onSelect: () => navigate('bulkImport', { object: 'Assets', mode: 'legacy' }),
                    },
                  ]}
                />
                <Button variant="secondary" onClick={() => setAssignOpen(true)}>
                  <Icon name="plus" size={16} /> Assign New Asset
                </Button>
              </>
            )}
            {kind === 'routes' && (
              <Button variant="secondary" onClick={() => navigate('mapCenter')}>
                <Icon name="map" size={16} /> Map Center
              </Button>
            )}
            {canCreateRecords && (
              <Button
                variant="primary"
                onClick={() => {
                  setEditing(null);
                  if (kind === 'workOrders') setWoSourceOpen(true);
                  else setFormOpen(true);
                }}
              >
                <Icon name="plus" size={16} /> {schema.newLabel}
              </Button>
            )}
          </div>
        }
      />

      <AsyncState
        loading={recordsQuery.isLoading}
        error={recordsQuery.isError ? getErrorMessage(recordsQuery.error) : null}
        onRetry={() => recordsQuery.refetch()}
      >
        <Panel>
          {schema.banner && (
            <div className="flex items-start gap-2 border-b border-line px-4 py-3 text-sm text-ink-muted sm:px-5">
              <Icon name="info" size={14} className="mt-0.5 shrink-0 text-ink-faint" />
              <p>{schema.banner}</p>
            </div>
          )}
          {schema.variants?.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-line px-4 py-2.5 sm:px-5">
              {schema.variants.map((variant) => (
                <Button
                  key={variant.key}
                  type="button"
                  variant={variant.kind === kind ? 'primary' : 'secondary'}
                  className="!px-3 !py-1.5 text-xs"
                  onClick={() => {
                    if (variant.kind !== kind) navigate(variant.kind);
                  }}
                >
                  {variant.label}
                </Button>
              ))}
            </div>
          )}
          {schema.recordTypes?.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-line px-4 py-2.5 sm:px-5">
              {schema.recordTypes.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={recordType === type ? 'primary' : 'secondary'}
                  className="!px-3 !py-1.5 text-xs"
                  onClick={() => setRecordType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          )}
          <Toolbar>
            <SearchField
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search this list`}
              label={`Search ${schema.title.toLowerCase()}`}
            />
            {persona === 'rehrig' && scopedAccounts.length > 1 && (
              <Select
                aria-label="Service provider scope"
                className="max-w-[200px]"
                value={accountScope}
                onChange={(e) => setAccountScope(e.target.value)}
                options={[
                  { value: 'All', label: 'All service providers' },
                  ...scopedAccounts.map((account) => ({ value: account.name, label: account.name })),
                ]}
              />
            )}
            <Select
              aria-label="Filter by column"
              className="max-w-[170px]"
              value={filterCol}
              onChange={(e) => {
                setFilterCol(e.target.value);
                if (!e.target.value) setFilterVal('');
              }}
              options={[
                { value: '', label: 'Column filter' },
                ...schema.listColumns.map((c) => ({ value: c.key, label: c.label })),
              ]}
            />
            {filterCol && (
              <SearchField
                value={filterVal}
                onChange={(e) => setFilterVal(e.target.value)}
                placeholder={`Filter ${schema.listColumns.find((c) => c.key === filterCol)?.label || ''}`}
                label="Column filter value"
                className="max-w-[180px]"
              />
            )}
            {statuses.length > 0 && (
              <Select
                aria-label="Filter by status"
                className="max-w-[160px]"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={['All', ...statuses]}
              />
            )}
            {schema.hotTicketFilter && (
              <Button
                type="button"
                variant={hotOnly ? 'primary' : 'secondary'}
                className="!px-3 !py-1.5 text-xs"
                onClick={() => setHotOnly((v) => !v)}
              >
                Hot tickets
              </Button>
            )}
            <Select
              aria-label="Sort by column"
              className="max-w-[180px]"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              options={[
                { value: 'default', label: 'Default order' },
                ...schema.listColumns.map((c) => ({ value: c.key, label: `Sort: ${c.label}` })),
              ]}
            />
            {sortKey !== 'default' && (
              <Select
                aria-label="Sort direction"
                className="max-w-[150px]"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value)}
                options={[
                  { value: 'asc', label: 'Ascending' },
                  { value: 'desc', label: 'Descending' },
                ]}
              />
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                exportCsv(`${kind}.csv`, schema.listColumns, filtered);
                toast?.(`Exported ${filtered.length} ${schema.title.toLowerCase()}`);
              }}
            >
              <Icon name="download" size={14} /> Export
            </Button>
          </Toolbar>
          {filtered.length === 0 ? (
            <EmptyState
              title={q.trim() ? `No records match "${q.trim()}"` : filtersActive ? 'No data for the selected filters' : 'No rows'}
              description={
                q.trim() || filtersActive
                  ? 'Try adjusting or clearing the filters above.'
                  : `No ${schema.title.toLowerCase()} in your scope yet.`
              }
            />
          ) : (
            <Table columns={columns}>
              {filtered.map((row) => (
                <tr key={row.id || row.number || row.name} className="interactive hover:bg-elevated/70">
                  {schema.listColumns.map((c, j) => (
                    <td key={c.key} className="px-4 py-3">
                      {j === 0 ? (
                        <button
                          type="button"
                          className="link-brand mono text-left"
                          onClick={() => {
                            setEditing(row);
                            setFormOpen(true);
                          }}
                        >
                          {kind === 'workOrders' && isHotTicket(row) && (
                            <span className="mr-1 text-danger" aria-label="Hot ticket">
                              HOT
                            </span>
                          )}
                          {String(row[c.key] ?? '—')}
                        </button>
                      ) : c.key === 'status' ? (
                        <Badge color={recordStatusColor(row[c.key])}>{row[c.key]}</Badge>
                      ) : c.key === 'active' ? (
                        <StatusDot
                          color={
                            row[c.key] === true || row[c.key] === 'Yes' ? 'emerald' : 'slate'
                          }
                          label={row[c.key] === true || row[c.key] === 'Yes' ? 'Active' : 'Inactive'}
                        />
                      ) : typeof row[c.key] === 'boolean' ? (
                        <StatusDot
                          color={row[c.key] ? 'emerald' : 'slate'}
                          label={row[c.key] ? 'Yes' : 'No'}
                        />
                      ) : (
                        <span className="text-ink-muted">{row[c.key]}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <RowActionMenu items={buildRowActions(row)} />
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>

        {formOpen && (
          <RecordForm
            schema={schema}
            initial={editing}
            readOnly={!canCreateRecords}
            onSave={saveRecord}
            onDelete={() => setDeletePending(true)}
            onClose={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        )}
        {deletePending && (
          <ConfirmDialog
            title={`Delete ${schema.singular.toLowerCase()}?`}
            description="This action cannot be undone."
            confirmLabel="Delete"
            onConfirm={confirmDelete}
            onCancel={() => setDeletePending(false)}
            busy={deleteMutation.isPending}
          />
        )}
        {assignOpen && (
          <AssignAssetDrawer
            accounts={scopedAccounts}
            defaultAccount={isScoped ? [...accountNames][0] : ''}
            onClose={() => setAssignOpen(false)}
            onAssign={assignAsset}
          />
        )}
        {assetAction && (
          <AssetActionDrawer
            action={assetAction.kind}
            asset={assetAction.asset}
            accounts={scopedAccounts}
            yardLocations={yardLocations}
            onClose={() => setAssetAction(null)}
            onSave={applyAssetAction}
            onEditFull={() => {
              setEditing(assetAction.asset);
              setFormOpen(true);
              setAssetAction(null);
            }}
          />
        )}
        {retrieveAsset && (
          <RetrieveReplaceDrawer
            asset={retrieveAsset}
            onClose={() => setRetrieveAsset(null)}
            onSubmit={retrieveAndReplace}
          />
        )}
        {assetInfo && (
          <AssetRelatedDrawer
            mode={assetInfo.mode}
            asset={assetInfo.asset}
            workOrders={relatedWorkOrders(assetInfo.asset)}
            tips={relatedTips(assetInfo.asset)}
            dispatches={relatedDispatches(assetInfo.asset)}
            onClose={() => setAssetInfo(null)}
          />
        )}
        {woSourceOpen && (
          <WorkOrderSourcePicker
            onClose={() => setWoSourceOpen(false)}
            onSelect={(source) => {
              setWoSourceOpen(false);
              if (source === 'woit') {
                navigate('bulkImport', { object: 'Work Orders' });
                return;
              }
              setWoSource(source);
              setEditing(null);
              setFormOpen(true);
            }}
          />
        )}
      </AsyncState>
    </Page>
  );
}

function Analytics({ view }) {
  return <ReportsStudio />;
}
