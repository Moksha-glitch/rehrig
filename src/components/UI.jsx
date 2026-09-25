import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';

// ---- Page chrome (Editorial Ops · Premium) ----
export function Page({ children, wide = false, className = '' }) {
  return (
    <div
      className={`mx-auto min-w-0 w-full max-w-screen-2xl px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10 ${className}`}
    >
      {children}
    </div>
  );
}

export function WorkspaceSheet({
  open = true,
  title,
  description,
  onClose,
  children,
  extraWide = true,
}) {
  return (
    <Drawer open={open} extraWide={extraWide} title={title} description={description} onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">{children}</div>
    </Drawer>
  );
}

export function PageHeader({ overline, title, description, actions, meta, titleExtra }) {
  return (
    <header className="mb-6 sm:mb-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <h1 className="min-w-0 break-words text-[1.35rem] font-bold leading-tight tracking-tight text-ink">
              {title}
            </h1>
            {titleExtra}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {overline && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                {overline}
              </p>
            )}
            {overline && meta && (
              <span className="text-[11px] text-ink-faint">·</span>
            )}
            {meta && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                {meta}
              </p>
            )}
            {description && (
              <p className="mt-0.5 w-full text-xs leading-relaxed text-ink-muted">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      <div className="hairline-rule mt-4 animate-rule-draw" />
    </header>
  );
}

export function Panel({ children, className = '', padded = false, hover = false }) {
  return (
    <div
      className={`surface-panel min-w-0 ${hover ? 'surface-panel-hover' : ''} ${padded ? 'p-5 sm:p-6' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

const STAT_COLORS = [
  ['#0C4480', '#3457D5'],
  ['#0F7A52', '#34B882'],
  ['#B4530A', '#E5831E'],
  ['#7C3AED', '#A78BFA'],
];

/** Compact KPI strip used on home / registry dashboards */
export function StatStrip({ items, compact = false }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((k, i) => {
        const [c1, c2] = STAT_COLORS[i % STAT_COLORS.length];
        return (
          <div
            key={k.label}
            className={`surface-panel surface-panel-hover animate-fade-up relative overflow-hidden ${
              compact ? 'p-4' : 'p-5 pt-6'
            }`}
            style={{ animationDelay: `${i * 55}ms` }}
          >
            {/* Accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ background: c1 }}
            />
            <p className="type-overline">{k.label}</p>
            <p
              className={`font-display font-bold tracking-tight tabular-nums leading-none ${
                compact ? 'mt-2 text-[1.3rem]' : 'mt-3 text-[2rem]'
              }`}
              style={{ color: c1 }}
            >
              {k.value}
            </p>
            {k.hint && (
              <p
                className={`leading-relaxed text-ink-muted ${
                  compact ? 'mt-1 text-[11px]' : 'mt-2 text-xs'
                }`}
              >
                {k.hint}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Toolbar({ children, className = '', sticky = true }) {
  return (
    <div
      className={`toolbar flex flex-wrap items-center gap-3 px-4 py-2.5 sm:flex-nowrap sm:px-5 ${
        sticky ? 'sticky-toolbar' : 'border-b border-line bg-surface/80'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  label,
  'aria-label': ariaLabel,
}) {
  const inputId = useId();
  const accessibleName = ariaLabel || label || placeholder || 'Search';
  return (
    <div className={`relative min-w-[12rem] max-w-sm flex-1 ${className}`}>
      <label htmlFor={inputId} className="sr-only">
        {accessibleName}
      </label>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true">
        <Icon name="search" size={14} />
      </span>
      <input
        id={inputId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-w-0 w-full rounded-control border border-line bg-canvas py-2 pl-8 pr-3 text-sm text-ink placeholder:text-ink-faint transition-colors hover:border-line-strong focus:border-accent focus:bg-surface focus:outline-none focus:ring-0"
      />
    </div>
  );
}

/**
 * TableToolbar — standardized toolbar row matching the reference design:
 * left: optional search slot; right: Columns, Export, Rows-per-page, Pagination.
 */
export function TableToolbar({
  search,
  rowsPerPage = 25,
  onRowsPerPageChange,
  page = 1,
  totalPages = 1,
  onPageChange,
  onColumnsClick,
  onExportClick,
  extra,
  className = '',
}) {
  return (
    <div
      className={`sticky-toolbar flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-5 ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {search}
      </div>
      <div className="flex items-center gap-2">
        {extra}
        {onColumnsClick && (
          <button
            type="button"
            onClick={onColumnsClick}
            className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft interactive hover:bg-elevated hover:text-ink"
          >
            <Icon name="grid" size={13} />
            Columns
          </button>
        )}
        {onExportClick && (
          <button
            type="button"
            onClick={onExportClick}
            className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft interactive hover:bg-elevated hover:text-ink"
          >
            <Icon name="download" size={13} />
            Export
          </button>
        )}
        {onRowsPerPageChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-ink-muted">Rows</span>
            <select
              value={rowsPerPage}
              onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
              className="rounded-control border border-line bg-surface py-1 pl-2 pr-6 text-xs text-ink-soft focus:border-accent focus:outline-none"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-control border border-line bg-surface text-ink-muted interactive hover:bg-elevated hover:text-ink disabled:opacity-40"
              aria-label="Previous page"
            >
              <Icon name="chevronLeft" size={13} />
            </button>
            <span className="min-w-[3.5rem] text-center text-xs text-ink-muted">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-control border border-line bg-surface text-ink-muted interactive hover:bg-elevated hover:text-ink disabled:opacity-40"
              aria-label="Next page"
            >
              <Icon name="chevronRight" size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Badges ----
export function Badge({ children, color = 'slate', className = '' }) {
  const colors = {
    slate: 'bg-elevated text-ink-muted border-line',
    amber: 'bg-warn-soft text-warn border-line',
    cyan: 'bg-brand-soft text-brand-ink border-line',
    rose: 'bg-danger-soft text-danger border-line',
    emerald: 'bg-success-soft text-success border-line',
    sky: 'bg-brand-soft text-brand-ink border-line',
    green: 'bg-success-soft text-success border-line',
    blue: 'bg-brand-soft text-brand-ink border-line',
    // Status-specific solid pill variants (matches reference design)
    active: 'bg-success text-white border-success',
    inactive: 'bg-transparent text-ink-muted border-line-strong',
    violet: 'bg-elevated text-ink-soft border-line',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${colors[color] ?? colors.slate} ${className}`}
    >
      {children}
    </span>
  );
}

/** Convenience component for ACTIVE / INACTIVE status cells in tables. */
export function StatusBadge({ status, className = '' }) {
  const norm = (status || '').toLowerCase();
  if (norm === 'active') {
    return (
      <Badge color="active" className={className}>
        Active
      </Badge>
    );
  }
  if (norm === 'inactive') {
    return (
      <Badge color="inactive" className={className}>
        Inactive
      </Badge>
    );
  }
  return (
    <Badge color="slate" className={className}>
      {status}
    </Badge>
  );
}

export function AccountBadges({ account }) {
  return (
    <>
      {account.paymentRequired && <Badge color="amber">Pay-gated</Badge>}
      {account.apiIntegrated && <Badge color="cyan">API</Badge>}
      {account.onboardingComplete === false && <Badge color="rose">Onboarding incomplete</Badge>}
    </>
  );
}

export function BoolCell({ value }) {
  return value ? (
    <span className="inline-flex items-center gap-1.5 text-success" title="Yes">
      <Icon name="check" size={16} aria-hidden="true" />
      <span className="sr-only">Yes</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-ink-faint" title="No">
      <Icon name="x" size={16} aria-hidden="true" />
      <span className="sr-only">No</span>
    </span>
  );
}

export function Dash() {
  return <span className="text-ink-faint">—</span>;
}

export function StatusDot({ color = 'emerald', label }) {
  const colors = {
    emerald: 'bg-success',
    slate: 'bg-ink-faint',
    amber: 'bg-warn',
    rose: 'bg-danger',
    cyan: 'bg-brand',
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${colors[color]}`} />
      {label && <span className="text-sm text-ink-muted">{label}</span>}
    </span>
  );
}

export function Button({ variant = 'secondary', size, children, className = '', ...rest }) {
  const variants = {
    primary: 'btn-primary',
    accent: 'btn-brand',
    success:
      'inline-flex items-center justify-center gap-1.5 rounded-control bg-success px-3.5 py-2 text-sm font-semibold text-white interactive hover:brightness-95 disabled:opacity-50',
    secondary: 'btn-secondary',
    ghost:
      'inline-flex items-center justify-center gap-1.5 rounded-control px-3.5 py-2 text-sm font-medium text-ink-muted interactive hover:bg-elevated hover:text-ink',
    danger:
      'inline-flex items-center justify-center gap-1.5 rounded-control bg-danger px-3.5 py-2 text-sm font-semibold text-white interactive hover:brightness-90 disabled:opacity-50',
    // Outlined variant — brand border + text, no fill (matches reference "Filter" button)
    outline:
      'inline-flex items-center justify-center gap-1.5 rounded-control border border-brand px-3.5 py-2 text-sm font-semibold text-brand interactive hover:bg-brand-soft disabled:opacity-50',
    filter:
      'inline-flex items-center justify-center gap-1.5 rounded-control border border-brand px-3.5 py-2 text-sm font-semibold text-brand interactive hover:bg-brand-soft disabled:opacity-50',
  };
  const sizes = {
    xs: '!px-2 !py-1 !text-[11px]',
    sm: '!px-2.5 !py-1.5 !text-xs',
    md: '',
    lg: '!px-5 !py-3 !text-base',
  };
  const sizeClass = size ? (sizes[size] ?? '') : '';
  return (
    <button className={`${variants[variant]} ${sizeClass} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Field({
  label,
  required,
  children,
  className = '',
  span2 = false,
  id,
  error,
  hint,
}) {
  const generatedId = useId();
  const controlId = id || `field-${generatedId.replace(/:/g, '')}`;
  const childArray = React.Children.toArray(children);
  const inputChild = childArray.find(React.isValidElement) || null;
  const resolvedId =
    (React.isValidElement(inputChild) && inputChild.props.id) || controlId;
  const errorId = `${resolvedId}-error`;
  const hintId = `${resolvedId}-hint`;
  const control = childArray.map((child) => {
    if (!React.isValidElement(child) || child !== inputChild) return child;
    return React.cloneElement(child, {
      id: resolvedId,
      'aria-invalid': error ? true : child.props['aria-invalid'],
      'aria-describedby':
        [child.props['aria-describedby'], hint ? hintId : '', error ? errorId : '']
          .filter(Boolean)
          .join(' ') || undefined,
      required: required || child.props.required,
    });
  });
  return (
    <div className={`min-w-0 ${span2 ? 'sm:col-span-2' : ''} ${className}`}>
      {label && (
        <label
          htmlFor={resolvedId}
          className="type-overline mb-2 flex min-h-[1rem] items-center gap-1"
        >
          <span>{label}</span>
          {required && (
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {control}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase = 'field-input disabled:cursor-not-allowed';

export function TextInput({ className = '', ...rest }) {
  return <input className={`${inputBase} ${className}`} {...rest} />;
}

export function TextArea({ className = '', rows = 2, ...rest }) {
  return <textarea rows={rows} className={`${inputBase} resize-y ${className}`} {...rest} />;
}

export function Select({ options = [], className = '', placeholder, ...rest }) {
  const emptyLabel = placeholder || 'Select…';
  const showEmpty = Boolean(placeholder) || rest.value === '' || rest.value == null;
  return (
    <select className={`${inputBase} ${className}`} {...rest}>
      {showEmpty && <option value="">{emptyLabel}</option>}
      {options.map((o) => {
        if (o && typeof o === 'object') {
          const value = o.value ?? o.k ?? '';
          const label = o.label ?? o.l ?? value;
          return (
            <option key={String(value)} value={value}>
              {label}
            </option>
          );
        }
        return (
          <option key={o} value={o}>
            {o}
          </option>
        );
      })}
    </select>
  );
}

export function Checkbox({ label, checked, onChange, className = '', disabled = false }) {
  return (
    <label
      className={`inline-flex items-center gap-2 text-sm text-ink-soft ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      } ${className}`}
    >
      <input
        type="checkbox"
        checked={!!checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 rounded border-line-strong text-brand focus:ring-brand/30"
      />
      {label}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
  label = 'Toggle setting',
  className = '',
  state,
  ...rest
}) {
  const resolved = state || (checked ? 'on' : 'off');
  const nextOn = resolved !== 'on';
  const title =
    resolved === 'on'
      ? 'All selected — click to clear'
      : resolved === 'partial'
        ? 'Custom selection — click to select all'
        : 'Nothing selected — click to select all';

  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(nextOn)}
      disabled={disabled}
      role="switch"
      aria-checked={resolved === 'partial' ? 'mixed' : resolved === 'on'}
      aria-label={label}
      title={title}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-snappy ease-out ${
        resolved === 'on' ? 'bg-brand' : resolved === 'partial' ? 'bg-accent' : 'bg-line-strong'
      } ${disabled ? 'opacity-50' : ''} ${className}`}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform duration-snappy ease-out ${
          resolved === 'on'
            ? 'translate-x-4'
            : resolved === 'partial'
              ? 'translate-x-[10px]'
              : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export const Toggle = Switch;

export function Tabs({ items, value, onChange, label = 'Sections', className = '' }) {
  const onKeyDown = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % items.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = items.length - 1;
    onChange(items[next].key);
    event.currentTarget.parentElement?.children[next]?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`flex gap-0.5 overflow-x-auto border-b border-line scroll-thin ${className}`}
    >
      {items.map((item, index) => {
        const selected = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.key)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`whitespace-nowrap border-b-2 px-3.5 py-3 text-sm transition-colors duration-snappy ${
              selected
                ? 'border-brand font-semibold text-ink'
                : 'border-transparent font-medium text-ink-muted hover:border-line-strong hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function isRowControlClick(event) {
  return Boolean(
    event.target.closest(
      'button, a, input, select, textarea, label, [role="menuitem"], [data-stop-row]'
    )
  );
}

export function activateRow(event, onActivate) {
  if (!onActivate || isRowControlClick(event)) return;
  onActivate();
}

export function Table({ columns, children, className = '', caption, label }) {
  return (
    <div className={`min-w-0 overflow-x-auto scroll-thin ${className}`}>
      <table
        className="w-full text-left text-sm [&_td]:overflow-hidden [&_th]:overflow-hidden [&_tbody_tr:last-child_td]:border-b-0"
        aria-label={caption ? undefined : label}
      >
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line bg-[#F8F9FC]">
            {columns.map((c, i) => {
              const text = typeof c === 'object' ? c.label : c;
              const extra = typeof c === 'object' ? c.className || '' : '';
              return (
                <th
                  key={typeof c === 'object' ? c.key || c.label || i : `${c}-${i}`}
                  scope="col"
                  className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint sm:px-5 ${extra}`}
                >
                  {text}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-surface">{children}</tbody>
      </table>
    </div>
  );
}

/**
 * Overlay stack so nested overlays (e.g. a confirm dialog above a form drawer)
 * only let the topmost one react to Escape and Tab.
 */
const overlayStack = [];

/** True while a Dialog/Drawer is mounted, so page chrome can ignore Escape. */
export function hasOpenOverlay() {
  return overlayStack.length > 0;
}

function useOverlayLayer(active) {
  const tokenRef = useRef(null);
  if (!tokenRef.current) tokenRef.current = {};
  useEffect(() => {
    if (!active) return undefined;
    const token = tokenRef.current;
    overlayStack.push(token);
    return () => {
      const index = overlayStack.indexOf(token);
      if (index >= 0) overlayStack.splice(index, 1);
    };
  }, [active]);
  return useCallback(() => overlayStack[overlayStack.length - 1] === tokenRef.current, []);
}

export function Dialog({
  children,
  onClose,
  wide = false,
  title,
  description,
  className = '',
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  const isTopLayer = useOverlayLayer(true);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelector(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    (focusable || dialog)?.focus();

    const onKeyDown = (event) => {
      if (!isTopLayer()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
      }
      if (event.key !== 'Tab' || !dialog) return;
      const items = [...dialog.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isTopLayer]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <button
        type="button"
        className="overlay-scrim absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close dialog"
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        aria-label={title ? undefined : 'Dialog'}
        tabIndex={-1}
        className={`relative z-10 flex max-h-[min(90vh,860px)] w-full flex-col overflow-hidden rounded-sheet border border-line bg-surface shadow-float animate-fade-up ${
          wide ? 'max-w-4xl' : 'max-w-lg'
        } ${className}`}
      >
        {(title || description) && (
          <div className="shrink-0 border-b border-line px-6 py-5">
            {title && (
              <h2 id={titleId} className="font-display text-title-md text-ink">
                {title}
              </h2>
            )}
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-ink-muted">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export const Modal = Dialog;

export function ConfirmDialog({
  open = true,
  title = 'Confirm action',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  severity = 'danger',
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!open) return null;
  return (
    <Dialog title={title} description={description} onClose={onCancel}>
      <div className="flex justify-end gap-2.5 px-6 py-4">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button
          variant={severity === 'danger' ? 'primary' : 'accent'}
          className={severity === 'danger' ? 'bg-danger hover:bg-danger' : ''}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Right-side accessible drawer. Mirrors Dialog a11y: portal, backdrop, focus trap, Escape, scroll lock, focus restore. */
export function Drawer({
  children,
  onClose,
  open = true,
  wide = false,
  extraWide = false,
  title,
  description,
  footer,
  className = '',
}) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  const isTopLayer = useOverlayLayer(open);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    const focusable = panel?.querySelector(FOCUSABLE_SELECTOR);
    (focusable || panel)?.focus();

    const onKeyDown = (event) => {
      if (!isTopLayer()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE_SELECTOR)];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, isTopLayer]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <button
        type="button"
        className="overlay-scrim absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close drawer"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        aria-label={title ? undefined : 'Drawer'}
        tabIndex={-1}
        className={`relative z-10 flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l border-line bg-surface shadow-float animate-fade-up ${
          extraWide
            ? 'sm:max-w-3xl lg:max-w-6xl'
            : wide
              ? 'sm:max-w-2xl lg:max-w-3xl'
              : 'sm:max-w-md md:max-w-lg'
        } ${className}`}
      >
        {(title || description) && (
          <div className="shrink-0 border-b border-line px-6 py-5">
            {title && (
              <h2 id={titleId} className="font-display text-title-md text-ink">
                {title}
              </h2>
            )}
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-ink-muted">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        {footer != null && footer !== false && (
          <div className="shrink-0 border-t border-line bg-surface">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}

/** Sticky action bar for drawer footers (also usable inside FormDrawer custom footers). */
export function DrawerActions({ children, className = '' }) {
  return (
    <div
      className={`flex shrink-0 flex-wrap items-center gap-2.5 px-6 py-4 ${
        className.includes('justify-') ? className : `justify-end ${className}`
      }`}
    >
      {children}
    </div>
  );
}

/** Grouped field block inside drawer/form bodies. */
export function FieldSection({ title, description, children, className = '', cols = 2 }) {
  const colClass = { 1: 'grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' }[cols] ?? 'sm:grid-cols-2';
  return (
    <section className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="border-b border-line pb-2">
          {title && <h3 className="font-display text-title-sm text-ink">{title}</h3>}
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>
      )}
      <div className={`grid grid-cols-1 gap-4 ${colClass}`}>{children}</div>
    </section>
  );
}

/**
 * Form-oriented right drawer with sticky header/footer, scrollable body,
 * optional dirty-close confirmation, and shared cancel/save actions.
 */
export function FormDrawer({
  open = true,
  onClose,
  onSubmit,
  title,
  description,
  wide = false,
  extraWide = false,
  children,
  footer,
  dirty = false,
  busy = false,
  error,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  discardTitle = 'Discard changes?',
  discardDescription = 'You have unsaved changes. Close this form and lose your edits?',
  className = '',
  bodyClassName = '',
}) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const requestClose = () => {
    if (busy || confirmDiscard) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose?.();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (busy) return;
    onSubmit?.(event);
  };

  const defaultFooter = (
    <DrawerActions>
      <Button type="button" variant="secondary" onClick={requestClose} disabled={busy}>
        {cancelLabel}
      </Button>
      <Button type="submit" variant="primary" disabled={busy}>
        {busy ? 'Saving…' : submitLabel}
      </Button>
    </DrawerActions>
  );

  return (
    <>
      <Drawer
        open={open}
        onClose={requestClose}
        title={title}
        description={description}
        wide={wide}
        extraWide={extraWide}
        className={className}
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div
            className={`min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 scroll-thin ${bodyClassName}`}
          >
            {children}
            {error && (
              <p className="text-sm font-medium text-danger" role="alert">
                {typeof error === 'string' ? error : 'Something went wrong.'}
              </p>
            )}
          </div>
          <div className="shrink-0 border-t border-line bg-surface">
            {footer !== undefined ? footer : defaultFooter}
          </div>
        </form>
      </Drawer>
      <ConfirmDialog
        open={confirmDiscard}
        title={discardTitle}
        description={discardDescription}
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        severity="danger"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose?.();
        }}
      />
    </>
  );
}

export function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
  icon = 'search',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center px-6 py-14 text-center ${className}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-elevated text-ink-muted shadow-raise">
        <Icon name={icon} size={20} />
      </span>
      <h3 className="mt-4 font-display text-title-sm text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function AsyncState({
  status,
  loading = false,
  error,
  empty = false,
  onRetry,
  children,
  emptyTitle,
  emptyDescription,
}) {
  const current = status || (loading ? 'loading' : error ? 'error' : empty ? 'empty' : 'success');
  if (current === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-ink-muted" role="status">
        <span className="loading-spinner" aria-hidden="true" /> Loading…
      </div>
    );
  }
  if (current === 'error') {
    return (
      <EmptyState
        icon="alert"
        title="Unable to load data"
        description={typeof error === 'string' ? error : 'Try again in a moment.'}
        action={onRetry ? <Button onClick={onRetry}>Try again</Button> : null}
      />
    );
  }
  if (current === 'empty') {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return children;
}

export function Toast({ message, onDismiss }) {
  const [hidden, setHidden] = useState(false);
  const messageKey =
    typeof message === 'string' ? message : message ? `${message.message}|${message.severity || ''}` : '';

  useEffect(() => {
    setHidden(false);
  }, [messageKey]);

  if (!message || hidden) return null;
  const payload = typeof message === 'string' ? { message, severity: 'success' } : message;
  const severity = payload.severity || 'success';
  const styles = {
    success: { icon: 'checkCircle', iconClass: 'text-success', role: 'status', live: 'polite' },
    info: { icon: 'info', iconClass: 'text-brand-soft', role: 'status', live: 'polite' },
    warning: { icon: 'alert', iconClass: 'text-warn', role: 'alert', live: 'assertive' },
    warn: { icon: 'alert', iconClass: 'text-warn', role: 'alert', live: 'assertive' },
    error: { icon: 'alert', iconClass: 'text-danger-soft', role: 'alert', live: 'assertive' },
    danger: { icon: 'alert', iconClass: 'text-danger-soft', role: 'alert', live: 'assertive' },
  };
  const style = styles[severity] || styles.info;
  const dismiss = () => {
    setHidden(true);
    onDismiss?.();
  };
  return (
    <div
      className="fixed bottom-6 left-1/2 z-[60] w-[min(92vw,28rem)] -translate-x-1/2 animate-fade-up"
      role={style.role}
      aria-live={style.live}
      aria-atomic="true"
    >
      <div className="flex items-center gap-2.5 rounded-control border border-ink/10 bg-ink px-4 py-3 text-sm font-medium text-white shadow-float">
        <Icon name={style.icon} size={16} className={style.iconClass} />
        <span className="min-w-0 flex-1">{payload.message}</span>
        <button type="button" onClick={dismiss} aria-label="Dismiss notification">
          <Icon name="x" size={15} />
        </button>
      </div>
    </div>
  );
}
