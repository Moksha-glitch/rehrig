import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Icon from './Icon.jsx';
import { Badge, Button, Table } from './UI.jsx';
import { PLAYBOOK_LANDING } from '../data/assistantPlaybook.js';

const CHART_FILL = {
  hi: 'var(--color-danger)',
  mid: 'var(--color-warn)',
  ok: 'var(--color-success)',
  brand: 'var(--color-brand)',
};

const TONE = {
  good: {
    text: 'text-success',
    bar: 'bg-success',
    soft: 'bg-success-soft',
    border: 'border-success/30',
    accent: 'bg-success',
  },
  warn: {
    text: 'text-warn',
    bar: 'bg-warn',
    soft: 'bg-warn-soft',
    border: 'border-warn/30',
    accent: 'bg-warn',
  },
  bad: {
    text: 'text-danger',
    bar: 'bg-danger',
    soft: 'bg-danger-soft',
    border: 'border-danger/30',
    accent: 'bg-danger',
  },
};

function toneStyle(tone) {
  return TONE[tone] || {
    text: 'text-ink-muted',
    bar: 'bg-brand',
    soft: 'bg-brand-soft',
    border: 'border-line',
    accent: 'bg-brand',
  };
}

function Reveal({ delay = 0, className = '', children }) {
  const [visible, setVisible] = useState(delay <= 0);

  useEffect(() => {
    if (delay <= 0) {
      setVisible(true);
      return undefined;
    }
    setVisible(false);
    const id = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(id);
  }, [delay]);

  if (!visible) return null;
  return <div className={`animate-fade-up ${className}`}>{children}</div>;
}

function pillColor(p) {
  if (p === 'r') return 'rose';
  if (p === 'a') return 'amber';
  if (p === 'g') return 'green';
  return 'slate';
}

function cellValue(cell) {
  if (cell && typeof cell === 'object' && cell.t) {
    return <Badge color={pillColor(cell.p)}>{cell.t}</Badge>;
  }
  return cell || '—';
}

function isNumericColumn(label) {
  return /expected|tips|complete|unmatched|matched|pace|rate|fleet|age|%|no rfid|blind/i.test(
    String(label || '')
  );
}

function SectionHead({ n, children, badge }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      {n != null && (
        <span className="flex h-[19px] w-[19px] items-center justify-center rounded-md bg-brand text-[10px] font-bold text-white">
          {n}
        </span>
      )}
      <p className="type-overline !mb-0">{children}</p>
      {badge && (
        <span className="rounded border border-success/30 bg-success-soft px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-success">
          {badge}
        </span>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-control border border-line bg-surface px-2.5 py-1.5 text-xs shadow-float">
      <p className="font-semibold text-ink">{label}</p>
      <p className="tabular-nums text-ink-muted">
        {payload[0].value}
        {unit}
      </p>
    </div>
  );
}

export function PlaybookTable({ table }) {
  if (!table) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <Table columns={table.cols}>
        {table.rows.map((row, index) => (
          <tr
            key={`${table.title}-${index}`}
            className={
              row.flag
                ? 'bg-danger-soft/70'
                : row.tot
                  ? 'border-t-2 border-line bg-brand-soft font-semibold text-ink'
                  : ''
            }
          >
            {row.c.map((cell, i) => (
              <td
                key={i}
                className={`px-3 py-2.5 ${
                  i === 0 ? 'whitespace-nowrap font-semibold text-brand' : 'text-ink-soft'
                } ${isNumericColumn(table.cols[i]) ? 'text-right tabular-nums' : ''}`}
              >
                {cellValue(cell)}
              </td>
            ))}
          </tr>
        ))}
      </Table>
      {table.note && <p className="border-t border-line px-3 py-2 text-xs italic text-ink-faint">{table.note}</p>}
    </div>
  );
}

export function PlaybookChart({ chart }) {
  if (!chart?.data?.length) return null;
  const unit = chart.unit === undefined ? '%' : chart.unit;
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-wider">
        <span className="flex items-center gap-1 text-success">
          <span className="h-2 w-2 rounded-sm bg-success" /> On pace
        </span>
        <span className="flex items-center gap-1 text-warn">
          <span className="h-2 w-2 rounded-sm bg-warn" /> Watch
        </span>
        <span className="flex items-center gap-1 text-danger">
          <span className="h-2 w-2 rounded-sm bg-danger" /> Behind
        </span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart.data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey="l" tick={{ fontSize: 9, fill: 'var(--color-ink-faint)' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 9, fill: 'var(--color-ink-faint)' }}
              axisLine={false}
              tickLine={false}
              unit={unit}
            />
            <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: 'var(--color-brand-soft)' }} />
            <Bar dataKey="v" radius={[5, 5, 0, 0]} maxBarSize={36}>
              {chart.data.map((bar) => (
                <Cell key={bar.l} fill={CHART_FILL[bar.c || 'mid'] || CHART_FILL.brand} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {chart.cap && <p className="mt-2 text-center text-xs italic text-ink-muted">{chart.cap}</p>}
    </div>
  );
}

function CompActions({ title, kind, snapshot, onCreateWidget, onCreateReport }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        className="!px-2.5 !py-1.5 text-xs"
        onClick={() => onCreateWidget(kind, title, snapshot)}
      >
        Create a widget
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="!px-2.5 !py-1.5 text-xs"
        onClick={() => onCreateReport(kind, title, snapshot)}
      >
        Create report
      </Button>
    </div>
  );
}

function SummaryWithClaims({ text, claims, openClaim, onToggle }) {
  const parts = String(text || '').split(/(\{\{c\d+\}\})/g);
  return (
    <div>
      <p className="text-sm leading-relaxed text-ink">
        {parts.map((part, index) => {
          const match = part.match(/\{\{(c\d+)\}\}/);
          if (!match) return <span key={index}>{part}</span>;
          const claim = claims[match[1]];
          if (!claim) return <span key={index}>{part}</span>;
          const provisional = claim.conf === 'p';
          return (
            <button
              key={index}
              type="button"
              className={`mx-0.5 inline rounded-sm px-1 font-semibold ${
                provisional
                  ? 'bg-warn-soft text-warn underline decoration-warn/40'
                  : 'bg-success-soft text-success underline decoration-success/40'
              }`}
              onClick={() => onToggle(match[1])}
            >
              {claim.v}
              <sup className="ml-0.5 text-[9px] font-bold uppercase">
                {provisional ? 'prov' : 'high'}
              </sup>
            </button>
          );
        })}
      </p>
      {openClaim && claims[openClaim] && (
        <div className="mt-2 rounded-xl border border-line bg-elevated px-3 py-2 text-xs text-ink-muted">
          <p className="type-overline mb-1 text-brand">Receipt · {claims[openClaim].label}</p>
          <p>
            Source: <code className="rounded bg-surface px-1 font-mono text-ink">{claims[openClaim].src}</code>
          </p>
          <p className="mt-1">
            Computed: <code className="rounded bg-surface px-1 font-mono text-ink">{claims[openClaim].comp}</code>
          </p>
          <p className="mt-1">
            Confidence:{' '}
            <span className={claims[openClaim].conf === 'p' ? 'font-semibold text-warn' : 'font-semibold text-success'}>
              {claims[openClaim].conf === 'p' ? 'provisional' : 'high'}
            </span>{' '}
            — {claims[openClaim].note}
          </p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ kpi }) {
  const tone = toneStyle(kpi.tone);
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-surface px-4 py-3.5 ${tone.border}`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${tone.accent}`} />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{kpi.l}</p>
      <p className="mt-1.5 font-display text-[1.7rem] font-semibold leading-none tabular-nums tracking-tight text-ink">
        {kpi.v}
        <span className="ml-1.5 align-middle text-xs font-semibold text-ink-faint">{kpi.u}</span>
      </p>
      <p className={`mt-2 text-[11.5px] leading-snug ${tone.text}`}>{kpi.d}</p>
      {kpi.bar != null && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-elevated">
          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.max(4, Math.min(100, kpi.bar))}%` }} />
        </div>
      )}
    </div>
  );
}

export function LandingReport({ instant, onAsk, onExport, onCreateWidget, onCreateReport }) {
  const [tab, setTab] = useState('byRoute');
  const [phase, setPhase] = useState(instant ? 5 : 0);
  const table = tab === 'byRoute' ? PLAYBOOK_LANDING.byRoute : PLAYBOOK_LANDING.byTruck;

  useEffect(() => {
    if (instant) return undefined;
    setPhase(0);
    const timers = [280, 520, 820, 1240, 1680].map((ms, index) =>
      window.setTimeout(() => setPhase(index + 1), ms)
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  return (
    <div className="w-full space-y-5">
      {phase < 1 && (
        <div className="flex items-center gap-2 text-sm text-ink-muted animate-fade-in" role="status">
          <span className="loading-spinner" />
          Pulling today&apos;s collections…
        </div>
      )}
      {phase >= 1 && (
      <Reveal className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Live · {PLAYBOOK_LANDING.asof}
            </span>
          </div>
          <h2 className="font-display text-title-lg text-ink">{PLAYBOOK_LANDING.title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">{PLAYBOOK_LANDING.sub}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onExport}>
          <Icon name="download" size={14} />
          Export
        </Button>
      </Reveal>
      )}
      {phase >= 1 && (
      <Reveal className="flex flex-wrap gap-1.5">
        {PLAYBOOK_LANDING.filters.map(([label, value]) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-elevated px-2 py-1 text-[11px] text-ink"
          >
            <span className="font-semibold uppercase tracking-wide text-ink-faint">{label}</span>
            {value}
          </span>
        ))}
      </Reveal>
      )}
      {phase >= 2 && (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PLAYBOOK_LANDING.kpis.map((kpi, index) => (
          <Reveal key={kpi.l} delay={index * 90}>
            <MetricCard kpi={kpi} />
          </Reveal>
        ))}
      </div>
      )}
      {phase >= 3 && (
      <Reveal className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {PLAYBOOK_LANDING.chart && (
          <div className="xl:col-span-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <SectionHead n={null}>Pace by route</SectionHead>
            </div>
            <PlaybookChart chart={PLAYBOOK_LANDING.chart} />
            <CompActions
              title={PLAYBOOK_LANDING.chart.title}
              kind="chart"
              snapshot={{ chart: PLAYBOOK_LANDING.chart }}
              onCreateWidget={onCreateWidget}
              onCreateReport={onCreateReport}
            />
          </div>
        )}
        <div className="xl:col-span-2">
          <SectionHead badge={`${PLAYBOOK_LANDING.flags.length} today`}>Needs a look</SectionHead>
          <div className="space-y-2">
            {PLAYBOOK_LANDING.flags.map((flag) => {
              const tone = toneStyle(flag.tone);
              return (
                <button
                  key={flag.title}
                  type="button"
                  className={`flex w-full items-start gap-3 rounded-xl border bg-surface px-3 py-3 text-left transition-colors hover:border-brand ${tone.border}`}
                  onClick={() => onAsk(flag.key)}
                >
                  <span className={`mt-0.5 h-8 w-1 shrink-0 rounded-full ${tone.accent}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{flag.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{flag.detail}</span>
                    <span className="mt-1.5 block text-[11px] font-semibold text-brand">{flag.go} →</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>
      )}
      {phase >= 4 && (
      <Reveal>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <SectionHead>Collections today</SectionHead>
          <div className="inline-flex gap-1 rounded-lg border border-line bg-elevated p-0.5">
            {[
              ['byRoute', 'By route'],
              ['byTruck', 'By truck'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  tab === id ? 'bg-surface text-ink shadow-raise' : 'text-ink-muted hover:text-ink'
                }`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <PlaybookTable table={table} />
        <CompActions
          title="Daily collections — by route and by truck"
          kind="table"
          snapshot={{ table }}
          onCreateWidget={onCreateWidget}
          onCreateReport={onCreateReport}
        />
      </Reveal>
      )}
      {phase >= 5 && (
      <Reveal className="border-t border-line pt-4">
        <SectionHead>Ask about this report</SectionHead>
        <div className="flex flex-wrap gap-2">
          {PLAYBOOK_LANDING.asks.map(([label, key]) => (
            <button
              key={key + label}
              type="button"
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-brand hover:border-brand hover:bg-brand-soft"
              onClick={() => onAsk(key)}
            >
              {label} →
            </button>
          ))}
        </div>
      </Reveal>
      )}
    </div>
  );
}

export function IntentAnswer({ text, action, onAction }) {
  return (
    <div className="mx-auto max-w-[42rem] space-y-4 animate-fade-up">
      <div className="rounded-panel border border-line-strong bg-brand-soft p-4">
        <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_0_3px_var(--color-success-soft)]" />
          How I read your question
        </p>
        <p className="text-sm leading-relaxed text-ink">{text}</p>
        {action && (
          <div className="mt-3">
            <Button type="button" variant="primary" onClick={() => onAction(action)}>
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function StructuredAnswer({ answer, instant, onAsk, onExport, onCreateWidget, onCreateReport }) {
  const [stage, setStage] = useState(instant ? 'done' : 'reading');
  const [stepCount, setStepCount] = useState(instant ? answer.trace?.steps.length || 0 : 0);
  const [traceOpen, setTraceOpen] = useState(!instant);
  const [openClaim, setOpenClaim] = useState(null);
  const [whyOpen, setWhyOpen] = useState(null);

  useEffect(() => {
    setOpenClaim(null);
    setWhyOpen(null);
    if (instant) {
      setStage('done');
      setStepCount(answer.trace?.steps.length || 0);
      setTraceOpen(false);
      return undefined;
    }
    setStage('reading');
    setStepCount(0);
    setTraceOpen(true);
    const steps = answer.trace?.steps || [];
    const timers = [
      window.setTimeout(() => setStage('trace'), 700),
      ...steps.map((_, index) => window.setTimeout(() => setStepCount(index + 1), 700 + (index + 1) * 620)),
      window.setTimeout(() => setStage('done'), 700 + (steps.length + 1) * 620),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [answer, instant]);

  const steps = answer.trace?.steps || [];

  return (
    <div className="w-full space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {answer.persona?.name || 'Vision AI'}
            </span>
            {answer.persona?.scope && (
              <span className="text-[11px] text-ink-faint">{answer.persona.scope}</span>
            )}
          </div>
          <h2 className="font-display text-title-lg text-ink">{answer.q}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-muted">{answer.intent.read}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onExport}>
          <Icon name="download" size={14} />
          Export
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {answer.intent.chips.map(([label, value]) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-elevated px-2 py-1 text-[11px] text-ink"
          >
            <span className="font-semibold uppercase tracking-wide text-ink-faint">{label}</span>
            {value}
          </span>
        ))}
      </div>

      {stage === 'reading' && (
        <div className="flex items-center gap-2 text-sm text-ink-muted animate-fade-in" role="status">
          <span className="loading-spinner" />
          Reading your question…
        </div>
      )}

      {stage !== 'reading' && answer.trace && (
        <div className="rounded-xl border border-line bg-surface">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-faint"
            onClick={() => setTraceOpen((open) => !open)}
          >
            <Icon name="chevronRight" size={12} className={traceOpen ? 'rotate-90' : ''} />
            How this was computed · {stepCount} of {steps.length} steps · {answer.trace.sources.split('·').length}{' '}
            sources
          </button>
          {traceOpen && (
            <div className="space-y-2 border-t border-line px-3 py-3">
              {steps.slice(0, stepCount).map((step, index) => (
                <div key={index} className="text-xs leading-relaxed text-ink-soft animate-fade-up">
                  <span className={step.excl ? 'font-bold text-warn' : 'font-bold text-success'}>
                    {step.excl ? '⊘' : '✓'}
                  </span>{' '}
                  {step.t}
                  {step.why && (
                    <button
                      type="button"
                      className="ml-1 font-semibold text-brand underline-offset-2 hover:underline"
                      onClick={() => setWhyOpen((current) => (current === index ? null : index))}
                    >
                      why?
                    </button>
                  )}
                  {whyOpen === index && step.why && (
                    <p className="mt-1 text-ink-faint">{step.why}</p>
                  )}
                </div>
              ))}
              {stage === 'done' && (
                <p className="pt-1 text-[11px] text-ink-faint">Sources: {answer.trace.sources}</p>
              )}
            </div>
          )}
        </div>
      )}

      {stage === 'done' && (
        <div className="space-y-5">
          <Reveal>
            <SectionHead>Summary</SectionHead>
            <SummaryWithClaims
              text={answer.summary}
              claims={answer.claims}
              openClaim={openClaim}
              onToggle={(id) => setOpenClaim((current) => (current === id ? null : id))}
            />
          </Reveal>
          {(answer.table || answer.chart) && (
            <Reveal delay={140} className={`grid grid-cols-1 gap-4 ${answer.table && answer.chart ? 'xl:grid-cols-5' : ''}`}>
              {answer.table && (
                <section className={answer.chart ? 'xl:col-span-3' : ''}>
                  <SectionHead>{answer.table.title}</SectionHead>
                  <PlaybookTable table={answer.table} />
                  <CompActions
                    title={answer.table.title}
                    kind="table"
                    snapshot={{ table: answer.table }}
                    onCreateWidget={onCreateWidget}
                    onCreateReport={onCreateReport}
                  />
                </section>
              )}
              {answer.chart && (
                <section className={answer.table ? 'xl:col-span-2' : ''}>
                  <SectionHead>{answer.chart.title}</SectionHead>
                  <PlaybookChart chart={answer.chart} />
                  <CompActions
                    title={answer.chart.title}
                    kind="chart"
                    snapshot={{ chart: answer.chart }}
                    onCreateWidget={onCreateWidget}
                    onCreateReport={onCreateReport}
                  />
                </section>
              )}
            </Reveal>
          )}
          <Reveal delay={260}>
            <SectionHead>Analysis & recommendation</SectionHead>
            <div className="rounded-xl border border-line bg-surface p-4">
              {answer.analysis.map((para) => (
                <p key={para} className="mb-2 text-sm leading-relaxed text-ink-muted last:mb-0">
                  {para}
                </p>
              ))}
              <div className="mt-3 border-t border-line pt-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  Recommended plays
                </p>
                <ul className="space-y-2">
                  {answer.rec.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-ink">
                      <span className="shrink-0 font-semibold text-brand">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
          {answer.follows?.length > 0 && (
            <Reveal delay={380} className="border-t border-line pt-4">
              <SectionHead>Ask about this report</SectionHead>
              <div className="flex flex-wrap gap-2">
                {answer.follows.map(([label, key]) => (
                  <button
                    key={key + label}
                    type="button"
                    className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-brand hover:border-brand hover:bg-brand-soft"
                    onClick={() => onAsk(key)}
                  >
                    {label} →
                  </button>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      )}
    </div>
  );
}
