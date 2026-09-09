import React, { useMemo, useState } from 'react';
import { Field, FieldSection, FormDrawer, Select, TextInput } from './UI.jsx';
import {
  ANALYTICS_DASHBOARDS,
  WIDGET_CATEGORIES,
  WIDGET_SPANS,
  validateCustomWidget,
} from '../data/dashboardWidgets.js';

export default function CreateWidgetDrawer({
  draft,
  onChange,
  onClose,
  onSubmit,
  busy = false,
  error = '',
  templates = [],
}) {
  const [localError, setLocalError] = useState('');
  const dashboards = useMemo(
    () => [...ANALYTICS_DASHBOARDS, ...templates],
    [templates]
  );
  const kindOptions = [
    draft?.table ? { value: 'table', label: 'Table' } : null,
    draft?.chart ? { value: 'chart', label: 'Chart' } : null,
  ].filter(Boolean);

  const submit = (event) => {
    event.preventDefault();
    const nextError = validateCustomWidget(draft);
    setLocalError(nextError);
    if (nextError) return;
    onSubmit?.(event, draft);
  };

  return (
    <FormDrawer
      onClose={onClose}
      onSubmit={submit}
      title="Create a widget"
      description="Name the widget, set the required fields, and choose where it should appear."
      wide
      dirty={!!draft?.title || !!draft?.description || draft?.placeOn !== 'home'}
      busy={busy}
      error={localError || error}
      submitLabel="Create widget"
    >
      <FieldSection title="Widget" description="Required fields for a reusable dashboard widget.">
        <Field label="Widget name" required>
          <TextInput
            value={draft?.title || ''}
            onChange={(event) => onChange({ ...draft, title: event.target.value })}
            placeholder="e.g. Routes behind today"
            autoFocus
          />
        </Field>
        <Field label="Category" required>
          <Select
            value={draft?.category || 'Collections'}
            onChange={(event) => onChange({ ...draft, category: event.target.value })}
            options={WIDGET_CATEGORIES.map((item) => ({ value: item, label: item }))}
          />
        </Field>
        <Field label="Visualization" required>
          <Select
            value={draft?.kind || kindOptions[0]?.value || 'table'}
            onChange={(event) => onChange({ ...draft, kind: event.target.value })}
            options={kindOptions}
          />
        </Field>
        <Field label="Size" required>
          <Select
            value={String(draft?.span || 12)}
            onChange={(event) => onChange({ ...draft, span: Number(event.target.value) })}
            options={WIDGET_SPANS.map((item) => ({ value: String(item.value), label: item.label }))}
          />
        </Field>
        <Field label="Description" span2>
          <TextInput
            value={draft?.description || ''}
            onChange={(event) => onChange({ ...draft, description: event.target.value })}
            placeholder="What this widget shows"
          />
        </Field>
      </FieldSection>
      <FieldSection
        title="Placement"
        description="Choose the dashboard this widget should be added to."
        className="border-t border-line pt-5"
      >
        <Field label="Place on" required>
          <Select
            value={draft?.placeOn || 'home'}
            onChange={(event) => onChange({ ...draft, placeOn: event.target.value })}
            options={[
              { value: 'home', label: 'Home' },
              { value: 'new', label: 'New dashboard' },
              ...dashboards.map((item) => ({ value: item.id, label: item.name })),
            ]}
          />
        </Field>
        {draft?.placeOn === 'new' && (
          <Field label="Dashboard name" required>
            <TextInput
              value={draft?.dashboardName || ''}
              onChange={(event) => onChange({ ...draft, dashboardName: event.target.value })}
              placeholder="e.g. Daily collections"
            />
          </Field>
        )}
      </FieldSection>
    </FormDrawer>
  );
}
