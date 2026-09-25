import React, { useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import { Badge, Button, Panel } from './UI.jsx';

function hashPoint(seed, index, total) {
  let hash = 0;
  const text = String(seed || index);
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 997;
  const angle = ((index / Math.max(total, 1)) * Math.PI * 2 + hash / 997) - Math.PI / 2;
  const radius = 16 + ((hash % 11) / 11) * 18;
  return {
    x: Math.min(88, Math.max(12, 50 + Math.cos(angle) * radius)),
    y: Math.min(82, Math.max(18, 48 + Math.sin(angle) * (radius * 0.85))),
  };
}

function geoPoint(lat, lng, index, total) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return hashPoint(`${lat}-${lng}`, index, total);
  }
  return {
    x: Math.min(88, Math.max(12, ((longitude + 114.2) / 1.2) * 100)),
    y: Math.min(82, Math.max(18, (1 - (latitude - 53.3) / 0.5) * 100)),
  };
}

export default function CustomerMapPanel({ customer, locations = [], assets = [], onClose }) {
  const pins = useMemo(() => {
    const locationPins = locations.map((location, index) => ({
      id: location.id || location.number || `loc-${index}`,
      layer: 'location',
      label: location.name || location.address || 'Location',
      meta: [location.address || [location.street, location.city].filter(Boolean).join(', '), location.type]
        .filter(Boolean)
        .join(' · '),
      ...geoPoint(location.latitude, location.longitude, index, locations.length || 1),
    }));
    if (locationPins.length) {
      return [
        ...locationPins,
        ...assets.slice(0, 8).map((asset, index) => {
          const base = locationPins[index % locationPins.length];
          return {
            id: asset.id || asset.serial || `asset-${index}`,
            layer: 'asset',
            label: asset.name || asset.serial || 'Asset',
            meta: [asset.status, asset.product, asset.serial].filter(Boolean).join(' · '),
            x: Math.min(92, Math.max(8, base.x + (index % 2 === 0 ? 4 : -4))),
            y: Math.min(88, Math.max(12, base.y + (index % 3 === 0 ? -5 : 4))),
          };
        }),
      ];
    }
    if (!customer) return [];
    const origin = hashPoint(customer.id || customer.name, 0, 1);
    return [
      {
        id: customer.id || customer.customerNumber || 'customer',
        layer: 'location',
        label: customer.name,
        meta: [customer.segment, customer.account].filter(Boolean).join(' · ') || 'Customer site',
        ...origin,
      },
      ...assets.slice(0, 8).map((asset, index) => ({
        id: asset.id || asset.serial || `asset-${index}`,
        layer: 'asset',
        label: asset.name || asset.serial || 'Asset',
        meta: [asset.status, asset.product].filter(Boolean).join(' · '),
        ...hashPoint(asset.id || asset.serial, index + 1, assets.length + 1),
      })),
    ];
  }, [customer, locations, assets]);

  const [selectedId, setSelectedId] = useState(pins[0]?.id || null);
  const selected = pins.find((pin) => pin.id === selectedId) || pins[0] || null;
  const primaryAddress =
    locations[0]?.address ||
    [locations[0]?.street, locations[0]?.city, locations[0]?.state].filter(Boolean).join(', ') ||
    customer?.segment ||
    customer?.account ||
    'Service area';

  if (!customer) return null;

  return (
    <Panel className="flex h-full min-h-[28rem] flex-col overflow-hidden" padded>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="type-overline">Customer map</p>
          <p className="mt-1 truncate font-display text-title-sm text-ink">{customer.name}</p>
          <p className="mt-1 truncate text-sm text-ink-muted">{primaryAddress}</p>
        </div>
        {onClose && (
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div
        className="map-grid relative mt-4 h-72 overflow-hidden rounded-panel border border-line"
        style={{ backgroundSize: '24px 24px' }}
        role="list"
        aria-label={`${customer.name} map`}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <path
            d="M8 78 Q 50 36 92 76"
            fill="rgba(12,68,128,0.06)"
            stroke="rgba(12,68,128,0.28)"
            strokeWidth="0.5"
          />
        </svg>
        {pins.map((pin) => {
          const active = selected?.id === pin.id;
          return (
            <button
              type="button"
              key={`${pin.layer}-${pin.id}`}
              role="listitem"
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              title={`${pin.label}${pin.meta ? ` · ${pin.meta}` : ''}`}
              aria-label={`${pin.layer === 'asset' ? 'Asset' : 'Location'}: ${pin.label}`}
              aria-pressed={active}
              onClick={() => setSelectedId(pin.id)}
            >
              <span
                className={`block rounded-full ring-4 transition ${
                  pin.layer === 'asset'
                    ? active
                      ? 'h-3.5 w-3.5 bg-brand ring-brand/25'
                      : 'h-2.5 w-2.5 bg-brand ring-brand/15'
                    : active
                      ? 'h-3.5 w-3.5 bg-danger ring-danger/25'
                      : 'h-3 w-3 bg-danger ring-danger/15'
                }`}
              />
              {active && (
                <span className="absolute -top-5 left-1/2 w-28 -translate-x-1/2 truncate text-center text-[10px] font-medium text-ink">
                  {pin.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge color="red">{locations.length || 1} location{(locations.length || 1) === 1 ? '' : 's'}</Badge>
        <Badge color="blue">{assets.length} asset{assets.length === 1 ? '' : 's'}</Badge>
      </div>

      {selected && (
        <div className="mt-4 rounded-panel border border-line bg-elevated/60 px-3 py-3">
          <div className="flex items-start gap-2">
            <Icon name={selected.layer === 'asset' ? 'box' : 'mapPin'} size={14} className="mt-0.5 text-ink-faint" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{selected.label}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{selected.meta || 'On this customer site'}</p>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
