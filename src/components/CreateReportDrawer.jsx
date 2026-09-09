import React, { useState } from 'react';
import { Field, FieldSection, FormDrawer, Select, TextArea, TextInput } from './UI.jsx';
import {
  REPORT_CATEGORIES,
  REPORT_CHART_TYPES,
  REPORT_DATA_SOURCES,
  REPORT_TIMEFRAMES,
  validateAiReport,
} from '../data/reportStudio.js';

export default function CreateReportDrawer({
  draft,
  onChange,
  onClose,
  onSubmit,
  busy = false,
  error = '',
}) {
  const [localError, setLocalError] = useState('');
  const sourceMeta = REPORT_DATA_SOURCES[draft?.source] || REPORT_DATA_SOURCES.workOrders;

  const submit = (event) => {
    event.preventDefault();
    const nextError = validateAiReport(draft);
    setLocalError(nextError);
    if (nextError) return;
    onSubmit?.(event, draft);
  };

  return (
    <FormDrawer
      onClose={onClose}
      onSubmit={submit}
      title="Create a report"
      description="Name the report and set the required fields before saving it to Reports."
      wide
      dirty={!!draft?.name || !!draft?.desc}
      busy={busy}
      error={localError || error}
      submitLabel="Create report"
    >
      <FieldSection title="Report" description="Required fields for a reusable report.">
        <Field label="Report name" required span2>
          <TextInput
            value={draft?.name || ''}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            placeholder="e.g. Routes behind today"
            autoFocus
          />
        </Field>
        <Field label="Description" span2>
          <TextArea
            rows={2}
            value={draft?.desc || ''}
            onChange={(event) => onChange({ ...draft, desc: event.target.value })}
            placeholder="What this report shows"
          />
        </Field>
        <Field label="Category" required>
          <Select
            value={draft?.category || 'Operations'}
            onChange={(event) => onChange({ ...draft, category: event.target.value })}
            options={REPORT_CATEGORIES.map((item) => ({ value: item, label: item }))}
          />
        </Field>
        <Field label="Visibility" required>
          <Select
            value={draft?.visibility || 'private'}
            onChange={(event) => onChange({ ...draft, visibility: event.target.value })}
            options={[
              { value: 'private', label: 'Private' },
              { value: 'public', label: 'Public' },
            ]}
          />
        </Field>
      </FieldSection>
      <FieldSection
        title="Data"
        description="Choose the source, timeframe, and chart."
        className="border-t border-line pt-5"
      >
        <Field label="Data source" required>
          <Select
            value={draft?.source || 'workOrders'}
            onChange={(event) => {
              const nextSource = event.target.value;
              const fields = REPORT_DATA_SOURCES[nextSource]?.fields || [];
              onChange({
                ...draft,
                source: nextSource,
                groupBy: fields[0] || 'status',
                subGroupBy: '',
              });
            }}
            options={Object.entries(REPORT_DATA_SOURCES).map(([value, item]) => ({
              value,
              label: item.label,
            }))}
          />
        </Field>
        <Field label="Group by" required>
          <Select
            value={draft?.groupBy || sourceMeta.fields[0]}
            onChange={(event) => onChange({ ...draft, groupBy: event.target.value })}
            options={sourceMeta.fields.map((field) => ({ value: field, label: field }))}
          />
        </Field>
        <Field label="Timeframe" required>
          <Select
            value={draft?.timeframe || 'today'}
            onChange={(event) => onChange({ ...draft, timeframe: event.target.value })}
            options={REPORT_TIMEFRAMES.map((item) => ({ value: item.k, label: item.l }))}
          />
        </Field>
        <Field label="Chart type" required>
          <Select
            value={draft?.chart || 'bar'}
            onChange={(event) => onChange({ ...draft, chart: event.target.value })}
            options={REPORT_CHART_TYPES.map((item) => ({ value: item.k, label: item.l }))}
          />
        </Field>
      </FieldSection>
    </FormDrawer>
  );
}
