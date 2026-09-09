/** Service Provider Vision Assistant playbook (daily collections + operational drills). */

export const PLAYBOOK_STARTERS = [
  { key: 'behind', label: 'Which routes are running behind on tips today?' },
  { key: 'unmatched', label: "Which tips today didn't match a registered cart?" },
  { key: 'dispute', label: 'Was 12802 58 Street NW picked up today?' },
];

export const PLAYBOOK_LANDING = {
  title: 'Daily collections — Tuesday, September 8, 2026',
  sub: 'Edmonton AB · every RFID-confirmed lift today, grouped by route and by truck.',
  asof: '2:40 PM',
  filters: [
    ['Tip date', 'Today · 9/8/2026'],
    ['Is tipped', 'True'],
    ['Show', 'All trucks'],
    ['Segment', 'Edmonton AB'],
  ],
  kpis: [
    { v: '4,196', u: 'tips', l: 'Tips so far today', d: '90% of 4,665 expected across 8 routes', tone: 'good', bar: 90 },
    { v: '8', u: 'of 9 trucks', l: 'Trucks reporting tips', d: 'R3022 (TUE-ORG-2) silent since 5:52 AM', tone: 'bad', bar: 89 },
    { v: '120', u: '2.9%', l: 'Tips with no cart match', d: '7-day baseline is 1.1% — 65 are on one truck', tone: 'warn', bar: 29 },
    { v: '388', u: 'tips', l: 'Tips with no route', d: 'All from spare truck D3804 — dispatch still points at R3022', tone: 'warn', bar: 9 },
  ],
  chart: {
    title: 'Route completion vs expected',
    unit: '%',
    data: [
      { l: 'HILL-1', v: 99, c: 'ok' },
      { l: 'MILL-1', v: 98, c: 'ok' },
      { l: 'TUE-2', v: 98, c: 'ok' },
      { l: 'TUE-1', v: 97, c: 'ok' },
      { l: 'ORG-1', v: 97, c: 'ok' },
      { l: 'MILL-2', v: 78, c: 'mid' },
      { l: 'TUE-3', v: 66, c: 'hi' },
      { l: 'ORG-2', v: 0, c: 'hi' },
    ],
    cap: 'Six routes are within a few carts of done. TUE-3 and TUE-ORG-2 need action.',
  },
  flags: [
    { tone: 'bad', title: 'TUE-3 is at 66%', detail: 'About an hour left — C3670 lost the 12:05–1:10 PM window. ~120 carts at risk.', go: 'See which routes are behind', key: 'behind' },
    { tone: 'bad', title: 'TUE-ORG-2 reads 0 tips', detail: 'Spare truck D3804 is running it — 388 tips are landing with no route.', go: 'See which routes are behind', key: 'behind' },
    { tone: 'warn', title: 'B3651 has 65 unmatched tips', detail: '12.7% on TUE-MILL-2, arriving in runs — looks like a reader fault.', go: 'See unmatched tips', key: 'unmatched' },
  ],
  byRoute: {
    cols: ['Route', 'Type', 'Truck', 'Expected', 'Tips', 'Complete', 'Unmatched', 'Status'],
    rows: [
      { c: ['TUE-1', 'Trash', 'C3665', '640', '618', '97%', '12', { p: 'g', t: 'On pace' }] },
      { c: ['TUE-2', 'Recycle', 'C3667', '585', '571', '98%', '8', { p: 'g', t: 'On pace' }] },
      { c: ['TUE-3', 'Trash', 'C3670', '610', '402', '66%', '11', { p: 'r', t: 'Behind' }], flag: true },
      { c: ['TUE-MILL-1', 'Trash', 'B3648', '720', '705', '98%', '7', { p: 'g', t: 'On pace' }] },
      { c: ['TUE-MILL-2', 'Recycle', 'B3651', '660', '512', '78%', '65', { p: 'a', t: 'Watch' }] },
      { c: ['TUE-HILL-1', 'Trash', 'X3221', '540', '534', '99%', '5', { p: 'g', t: 'On pace' }] },
      { c: ['TUE-ORG-1', 'Organic', 'X3224', '480', '466', '97%', '5', { p: 'g', t: 'On pace' }] },
      { c: ['TUE-ORG-2', 'Organic', 'R3022', '430', '0', '0%', '—', { p: 'r', t: 'No tips' }], flag: true },
      { c: ['— (no route)', '—', 'D3804', '—', '388', '—', '7', { p: 'a', t: 'Unattributed' }] },
      { c: ['8 routes', '', '9 trucks', '4,665', '4,196', '90%', '120', ''], tot: true },
    ],
    note: 'Expected = # expected tips on the Collection Route. Complete = tips ÷ expected.',
  },
  byTruck: {
    cols: ['Truck', 'Route', 'Tips', 'Matched', 'Unmatched', 'Last tip', 'Status'],
    rows: [
      { c: ['B3648', 'TUE-MILL-1', '705', '698', '7', '2:39 PM', { p: 'g', t: 'Running' }] },
      { c: ['B3651', 'TUE-MILL-2', '512', '447', '65', '2:37 PM', { p: 'a', t: 'Reader misses' }] },
      { c: ['C3665', 'TUE-1', '618', '606', '12', '2:38 PM', { p: 'g', t: 'Running' }] },
      { c: ['C3667', 'TUE-2', '571', '563', '8', '2:36 PM', { p: 'g', t: 'Running' }] },
      { c: ['C3670', 'TUE-3', '402', '391', '11', '2:31 PM', { p: 'r', t: 'Behind' }], flag: true },
      { c: ['D3804', '— (spare)', '388', '381', '7', '2:38 PM', { p: 'a', t: 'No route' }] },
      { c: ['R3022', 'TUE-ORG-2', '0', '0', '0', '—', { p: 'r', t: 'Silent' }], flag: true },
      { c: ['X3221', 'TUE-HILL-1', '534', '529', '5', '2:35 PM', { p: 'g', t: 'Running' }] },
      { c: ['X3224', 'TUE-ORG-1', '466', '461', '5', '2:34 PM', { p: 'g', t: 'Running' }] },
      { c: ['9 trucks', '', '4,196', '4,076', '120', '', ''], tot: true },
    ],
    note: 'Matched = tip resolved to an Asset by RFID.',
  },
  asks: [
    ['Which routes are running behind on tips today?', 'behind'],
    ['Which tips today didn\'t match a registered cart?', 'unmatched'],
    ['Was 12802 58 Street NW picked up today?', 'dispute'],
  ],
};

export function playbookCellText(cell) {
  if (cell && typeof cell === 'object' && cell.t) return cell.t;
  return cell == null ? '' : String(cell);
}

function tableToHtml(table, title) {
  if (!table) return '';
  const head = table.cols.map((col) => `<th>${col}</th>`).join('');
  const rows = table.rows
    .map((row) => `<tr>${row.c.map((cell) => `<td>${playbookCellText(cell)}</td>`).join('')}</tr>`)
    .join('');
  return `<h3>${title || table.title || 'Table'}</h3><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>${
    table.note ? `<p><i>${table.note}</i></p>` : ''
  }`;
}

function summaryToText(answer) {
  return String(answer.summary || '').replace(/\{\{(c\d+)\}\}/g, (_, id) => answer.claims?.[id]?.v || '');
}

export function buildLandingExportHtml() {
  const kpis = PLAYBOOK_LANDING.kpis
    .map((kpi) => `<li><b>${kpi.v} ${kpi.u}</b> — ${kpi.l}. ${kpi.d}</li>`)
    .join('');
  const flags = PLAYBOOK_LANDING.flags
    .map((flag) => `<li><b>${flag.title}</b> — ${flag.detail}</li>`)
    .join('');
  return (
    `<h1>${PLAYBOOK_LANDING.title}</h1>` +
    `<p>${PLAYBOOK_LANDING.sub}</p>` +
    `<p>Live · refreshed ${PLAYBOOK_LANDING.asof}</p>` +
    `<h2>KPIs</h2><ul>${kpis}</ul>` +
    `<h2>Needs a look</h2><ul>${flags}</ul>` +
    tableToHtml(PLAYBOOK_LANDING.byRoute, 'By route') +
    tableToHtml(PLAYBOOK_LANDING.byTruck, 'By truck')
  );
}

export function buildAnswerExportHtml(answer) {
  if (!answer) return '';
  const claims = Object.values(answer.claims || [])
    .map(
      (claim) =>
        `<li><b>${claim.v}</b> — ${claim.label}. Source: ${claim.src}. Computed: ${claim.comp}. ${claim.note}</li>`
    )
    .join('');
  const analysis = (answer.analysis || []).map((para) => `<p>${para}</p>`).join('');
  const rec = (answer.rec || []).map((item) => `<li>${item}</li>`).join('');
  return (
    `<h1>${answer.q}</h1>` +
    `<p>${answer.persona?.name || 'Vision AI'} · ${answer.persona?.scope || ''}</p>` +
    `<p>${answer.intent?.read || ''}</p>` +
    `<h2>Summary</h2><p>${summaryToText(answer)}</p>` +
    (claims ? `<h2>Receipts</h2><ul>${claims}</ul>` : '') +
    tableToHtml(answer.table) +
    (answer.chart ? `<p><i>${answer.chart.title}. ${answer.chart.cap || ''}</i></p>` : '') +
    `<h2>Analysis</h2>${analysis}` +
    `<h2>Recommended plays</h2><ul>${rec}</ul>`
  );
}

export function downloadAssistantExport(title, innerHtml) {
  const safeTitle = String(title || 'Vision AI export').replace(/[<>]/g, '');
  const doc =
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${safeTitle}</title>` +
    `<style>body{font-family:system-ui,sans-serif;padding:28px;color:#1a1a2e;line-height:1.5;max-width:880px;margin:0 auto}h1,h2,h3{color:#1E2761}table{border-collapse:collapse;width:100%;margin:12px 0}th,td{border:1px solid #dce2f2;padding:8px 10px;text-align:left}th{background:#f4f6fc}</style></head><body>` +
    innerHtml +
    `<p style="color:#6E7396;font-size:12px">Vision Assistant · exported ${new Date().toLocaleDateString()}</p>` +
    `</body></html>`;
  const blob = new Blob([doc], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeTitle.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'vision-ai'}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const PLAYBOOK = {
  behind: {
    q: 'Which routes are running behind on tips today?',
    persona: { name: 'Dispatcher', scope: 'Today · Edmonton AB · 8 collection routes' },
    intent: {
      read: 'You\'re asking which of today\'s collection routes are behind — so you can send help before the shift ends. I\'m reading “behind” as a route whose tips so far are below where it should be by 2:40 PM, given its expected tips and its configured start time and duration.',
      chips: [['Scope', '8 routes · today'], ['Metric', 'Tips ÷ expected tips'], ['Basis', 'Configured start + duration'], ['As of', '2:40 PM']],
    },
    trace: {
      steps: [
        { t: 'Pulled today\'s tipping events — Tip Date = today, Is Tipped = true — 4,196 events' },
        { t: 'Joined each event to its Collection Route through the truck on today\'s dispatch' },
        { t: 'Compared tips per route to # expected tips and the route\'s configured duration to get pace' },
        { t: 'Set aside 388 events from spare truck D3804 that carry no route', excl: true, why: 'They can\'t be scored against a route until they\'re attributed. They almost certainly belong to TUE-ORG-2.' },
      ],
      sources: 'Individual Tip events · Collection Routes · Today\'s dispatch',
    },
    claims: {
      c1: { v: '2 of 8', conf: 'h', label: 'routes below pace at 2:40 PM', src: 'Tip events joined to Collection Route', comp: 'routes with tips ÷ expected < 85% at 2:40 PM', note: 'Direct comparison; the other six sit at 97–99%.' },
      c2: { v: '402 of 610', conf: 'h', label: 'TUE-3 — 66% complete, 208 carts left', src: 'TUE-3 · truck C3670', comp: '402 tips ÷ 610 expected = 65.9%', note: 'C3670 logged no tips between 12:05 and 1:10 PM, then resumed.' },
      c3: { v: '0 of 430', conf: 'p', label: 'TUE-ORG-2 shows no tips — spare truck is running', src: 'TUE-ORG-2 · R3022 · D3804', comp: 'R3022 silent; D3804 has 388 tips with no route lookup', note: 'Provisional until the dispatch is re-pointed to D3804.' },
    },
    summary: '{{c1}} routes are behind pace. TUE-3 is the real one: {{c2}} carts tipped, 66% with about an hour left. TUE-ORG-2 reads {{c3}}, but that\'s an attribution gap — spare truck D3804 has 388 tips with no route. Everything else is at 97% or better.',
    table: {
      title: 'Today\'s routes — tips vs expected, as of 2:40 PM',
      cols: ['Route', 'Type', 'Truck', 'Expected', 'Tips', 'Pace', 'Status'],
      rows: [
        { c: ['TUE-3', 'Trash', 'C3670', '610', '402', '66%', { p: 'r', t: 'Behind' }], flag: true },
        { c: ['TUE-ORG-2', 'Organic', 'R3022', '430', '0', '0%', { p: 'r', t: 'No tips' }], flag: true },
        { c: ['TUE-MILL-2', 'Recycle', 'B3651', '660', '512', '78%', { p: 'a', t: 'Watch' }] },
        { c: ['TUE-1', 'Trash', 'C3665', '640', '618', '97%', { p: 'g', t: 'On pace' }] },
        { c: ['TUE-ORG-1', 'Organic', 'X3224', '480', '466', '97%', { p: 'g', t: 'On pace' }] },
        { c: ['TUE-2', 'Recycle', 'C3667', '585', '571', '98%', { p: 'g', t: 'On pace' }] },
        { c: ['TUE-MILL-1', 'Trash', 'B3648', '720', '705', '98%', { p: 'g', t: 'On pace' }] },
        { c: ['TUE-HILL-1', 'Trash', 'X3221', '540', '534', '99%', { p: 'g', t: 'On pace' }] },
      ],
      note: 'Pace = tips so far ÷ # expected tips on the Collection Route.',
    },
    chart: {
      title: 'Share of expected tips completed — by route',
      data: [
        { l: 'TUE-HILL-1', v: 99, c: 'ok' }, { l: 'TUE-MILL-1', v: 98, c: 'ok' }, { l: 'TUE-2', v: 98, c: 'ok' },
        { l: 'TUE-1', v: 97, c: 'ok' }, { l: 'TUE-ORG-1', v: 97, c: 'ok' }, { l: 'TUE-MILL-2', v: 78, c: '' },
        { l: 'TUE-3', v: 66, c: 'hi' }, { l: 'TUE-ORG-2', v: 0, c: 'hi' },
      ],
      cap: 'Six routes are within a few carts of done. TUE-3 needs a truck; TUE-ORG-2 needs a dispatch fix.',
    },
    analysis: [
      'TUE-3 lost an hour: C3670 logged nothing between 12:05 and 1:10 PM, then picked back up at about 75 tips an hour. The remaining 208 carts take nearly three hours, and the window closes at 3:30 PM — so roughly 120 carts will be missed without help.',
      'TUE-ORG-2 looks like a failed route but isn\'t. R3022 was swapped at 5:52 AM and D3804 went out, but the dispatch still points at R3022. Those 388 tips land in the blank route group.',
    ],
    rec: [
      'Send X3221 (TUE-HILL-1, 99% done) to pick up the east half of TUE-3 from 2 Street NW onward.',
      'Re-point today\'s TUE-ORG-2 dispatch to D3804 so the 388 tips attribute.',
      'Ask C3670\'s driver what happened 12:05–1:10 PM and log it on the dispatch.',
    ],
    follows: [['Which tips today didn\'t match a registered cart?', 'unmatched'], ['Was 12802 58 Street NW picked up today?', 'dispute']],
  },
  unmatched: {
    q: 'Which tips today didn\'t match a registered cart?',
    persona: { name: 'Operations Manager', scope: 'Today · RFID matching · 9 trucks' },
    intent: {
      read: 'You\'re asking about today\'s tips that couldn\'t be matched to a cart. I\'m grouping them by truck to separate a reader that\'s missing reads versus carts that aren\'t registered yet.',
      chips: [['Scope', '4,196 tips today'], ['Metric', 'Tips with no asset match'], ['Grain', 'Truck → route'], ['Split', 'Reader fault vs unregistered cart']],
    },
    trace: {
      steps: [
        { t: 'Pulled today\'s 4,196 tipping events and flagged the 120 with no Asset Serial #' },
        { t: 'Grouped by truck and compared each truck\'s miss rate to its 7-day baseline (fleet average 1.1%)' },
        { t: 'For the remaining misses, checked whether the tip location matches a cart delivered in the last 10 days' },
        { t: 'Set aside 4 trucks at or below their baseline', excl: true, why: 'Between 5 and 8 misses each, in line with normal noise.' },
      ],
      sources: 'Individual Tip events · Assets (RFID Number) · Truck Device Sync · Work Orders',
    },
    claims: {
      c1: { v: '120 of 4,196', conf: 'h', label: 'tips today with no asset match', src: 'Tip events · Asset Serial # empty', comp: '120 ÷ 4,196 = 2.9% (7-day baseline 1.1%)', note: 'Almost three times the usual rate.' },
      c2: { v: '65 on B3651', conf: 'h', label: 'more than half of today\'s misses from one truck', src: 'Tip events · truck B3651', comp: '65 ÷ 512 tips = 12.7% vs baseline 1.0%', note: 'Misses arrive in runs of 6–14 consecutive lifts — a reader pattern.' },
      c3: { v: '30 of the other 55', conf: 'p', label: 'misses that sit on carts delivered last week', src: 'Tip GPS vs delivery WOs 8/29–9/4', comp: '30 miss locations within 25 m of a closed cart-delivery WO', note: 'Provisional — matched on GPS proximity.' },
    },
    summary: '{{c1}} tips have no cart behind them — 2.9%, nearly triple the usual rate. B3651 on TUE-MILL-2 accounts for {{c2}}, arriving in runs since 10:20 AM — a reader fault. Of the rest, {{c3}} fall on carts delivered last week whose RFID was never written to the asset.',
    table: {
      title: 'Unmatched tips by truck — today',
      cols: ['Truck', 'Route', 'Tips', 'Unmatched', 'Rate', 'Likely cause'],
      rows: [
        { c: ['B3651', 'TUE-MILL-2', '512', '65', '12.7%', { p: 'r', t: 'Reader fault' }], flag: true },
        { c: ['C3665', 'TUE-1', '618', '12', '1.9%', { p: 'a', t: 'Unregistered carts' }] },
        { c: ['C3670', 'TUE-3', '402', '11', '2.7%', { p: 'a', t: 'Unregistered carts' }] },
        { c: ['B3648', 'TUE-MILL-1', '705', '7', '1.0%', { p: 'a', t: 'Unregistered carts' }] },
        { c: ['C3667', 'TUE-2', '571', '8', '1.4%', { p: 'g', t: 'Normal' }] },
        { c: ['D3804', '— (spare)', '388', '7', '1.8%', { p: 'g', t: 'Normal' }] },
        { c: ['X3221', 'TUE-HILL-1', '534', '5', '0.9%', { p: 'g', t: 'Normal' }] },
        { c: ['X3224', 'TUE-ORG-1', '466', '5', '1.1%', { p: 'g', t: 'Normal' }] },
      ],
      note: 'Fleet 7-day baseline is 1.1% unmatched.',
    },
    chart: {
      title: 'Unmatched tip rate by truck',
      data: [
        { l: 'B3651', v: 12.7, c: 'hi' }, { l: 'C3670', v: 2.7, c: '' }, { l: 'C3665', v: 1.9, c: '' },
        { l: 'D3804', v: 1.8, c: 'ok' }, { l: 'C3667', v: 1.4, c: 'ok' }, { l: 'X3224', v: 1.1, c: 'ok' },
        { l: 'B3648', v: 1.0, c: 'ok' }, { l: 'X3221', v: 0.9, c: 'ok' },
      ],
      cap: 'One truck is an order of magnitude off the fleet.',
    },
    analysis: [
      'B3651\'s misses come in runs of 6 to 14 consecutive lifts since 10:20 AM. Carts don\'t fail in runs; readers do. Device vr-2c19e4 is dropping reads — likely the antenna lead on the left arm.',
      'The other 30 are last week\'s delivery batch: carts whose RFID Number never made it onto the Asset record. Trucks are reading a tag; VISION doesn\'t know whose cart it is.',
    ],
    rec: [
      'Open an A3-Repair RFID work order on B3651\'s device (vr-2c19e4) tonight.',
      'Backfill the RFID Number on the 30 delivered carts from the delivery work orders.',
      'Until the reader is fixed, treat TUE-MILL-2 completions as arm-lift confirmed, not RFID confirmed.',
    ],
    follows: [['Which routes are running behind on tips today?', 'behind'], ['Was 12802 58 Street NW picked up today?', 'dispute']],
  },
  dispute: {
    q: 'Was 12802 58 Street NW picked up today?',
    persona: { name: 'Customer Service Rep', scope: 'One location · today\'s collection' },
    intent: {
      read: 'You\'re checking a single address — did their cart get collected today? I\'m reading “picked up” as an RFID-confirmed tip on a cart registered to that location, backed by the truck\'s GPS. Only the trash cart is due today (TUE-1).',
      chips: [['Location', '12802 58 Street NW, Edmonton'], ['Window', 'Today · Tuesday'], ['Evidence', 'RFID tip + truck GPS'], ['Route', 'TUE-1 · Trash · C3665']],
    },
    trace: {
      steps: [
        { t: 'Resolved the address to Customer Location CL-0418277 and pulled its assets' },
        { t: 'Searched today\'s tipping events for the trash cart\'s RFID tag' },
        { t: 'Cross-checked truck C3665\'s GPS at the tip time against the location' },
        { t: 'Set aside the recycle cart', excl: true, why: 'It\'s on THU-2 — recycling at this address is collected Thursdays.' },
      ],
      sources: 'Customer Location · Assets (RFID Number) · Individual Tip events · Collection Routes',
    },
    claims: {
      c1: { v: '9:47 AM', conf: 'h', label: 'trash cart RP-0091382 tipped by C3665', src: 'Tip event · RFID E280…4B1C', comp: 'Is Tipped = true · matched asset RP-0091382', note: 'Direct RFID match.' },
      c2: { v: '18 m', conf: 'h', label: 'distance between the truck and the address', src: 'Tip Lat/Long vs location', comp: 'haversine distance = 18 m', note: 'Within the 30 m confirmation radius.' },
      c3: { v: '7 of 7', conf: 'h', label: 'Tuesdays in a row this cart has been confirmed', src: 'Tip events · last 7 Tuesdays', comp: 'one RFID-matched tip each Tuesday since 7/21', note: 'Consistent service history.' },
    },
    summary: 'Yes. The trash cart at 12802 58 Street NW was tipped at {{c1}} by truck C3665 on TUE-1 — an RFID read, with the truck {{c2}} from the address. It\'s been confirmed {{c3}} Tuesdays. The recycle cart isn\'t due until Thursday.',
    table: {
      title: 'C3665 on 58 Street NW — lifts around the address, 9:45–9:49 AM',
      cols: ['Time', 'Address', 'Asset', 'RFID tag', 'Distance', 'Result'],
      rows: [
        { c: ['9:45:38', '12798 58 St NW', 'RP-0091377', 'E280…4A9F', '12 m', { p: 'g', t: 'Tipped' }] },
        { c: ['9:47:12', '12802 58 St NW', 'RP-0091382', 'E280…4B1C', '18 m', { p: 'g', t: 'Tipped' }], flag: true },
        { c: ['9:47:41', '12806 58 St NW', '—', 'no read', '15 m', { p: 'a', t: 'Arm lift only' }] },
        { c: ['9:48:55', '12810 58 St NW', 'RP-0091390', 'E280…4B77', '21 m', { p: 'g', t: 'Tipped' }] },
      ],
      note: '12806 was lifted but its cart returned no RFID read.',
    },
    analysis: [
      'The evidence chain is complete: the cart\'s own RFID tag was read, at the right address, by the truck assigned to that route, on the day it\'s scheduled.',
      'The neighbour at 12806 was lifted 29 seconds later with no tag read. If the caller is actually next door, the proof is the arm-lift and GPS, not an RFID match.',
    ],
    rec: [
      'Tell the resident the cart was lifted at 9:47 AM; if it\'s still full, open an A3-Confirm Cart work order.',
      'If the caller is at 12806, open an A3-Repair RFID on that cart.',
      'Add this lookup to the CSR dashboard as a saved view.',
    ],
    follows: [['Which tips today didn\'t match a registered cart?', 'unmatched'], ['Which routes are running behind on tips today?', 'behind']],
  },
  rfid: {
    q: 'How many of my trucks still have no RFID reader?',
    persona: { name: 'Account Manager', scope: 'All accounts · fleet grain' },
    intent: {
      read: 'You\'re asking how many trucks have no RFID reader fitted. I\'m reading that as trucks with an empty RFID Reader field, excluding maintenance vehicles.',
      chips: [['Scope', 'Fleet · 1,072 trucks'], ['Metric', 'Trucks missing RFID'], ['Filter', 'Excl. maintenance'], ['Grain', 'Truck → account']],
    },
    trace: {
      steps: [
        { t: 'Pulled your full fleet — 1,072 trucks across 74 accounts' },
        { t: 'Applied the report filter — excluded maintenance vehicles' },
        { t: 'Flagged trucks with an empty RFID Reader field — 173 of 1,072' },
        { t: 'Set aside 89 camera-equipped trucks', excl: true, why: 'Every camera truck already carries a reader.' },
      ],
      sources: 'Fleet roster (Trucks) · RFID Reader field',
    },
    claims: {
      c1: { v: '173 of 1,072', conf: 'h', label: 'trucks with no RFID reader', src: 'Trucks roster', comp: '1,072 − 899 with a reader = 173', note: 'Direct field count.' },
      c2: { v: '16%', conf: 'h', label: 'share of the fleet running blind', src: 'Trucks roster', comp: '173 ÷ 1,072 = 16.1%', note: 'Re-derived from the roster count.' },
      c3: { v: '12 of 12', conf: 'h', label: 'Sarasota FL — entire fleet has no reader', src: 'Trucks · Sarasota FL', comp: '12 no-RFID ÷ 12 total = 100%', note: 'Every Sarasota truck lacks a reader.' },
    },
    summary: '{{c1}} trucks have no RFID reader — {{c2}} of the fleet running blind. The gap isn\'t even: Sarasota FL has {{c3}} trucks with no reader; Lakeland carries the largest absolute gap at 20 trucks.',
    table: {
      title: 'Trucks with no RFID reader — by account',
      cols: ['Account', 'No RFID', 'Fleet', 'Coverage gap', 'Exposure'],
      rows: [
        { c: ['Sarasota FL', '12', '12', '100%', { p: 'r', t: 'Whole fleet' }], flag: true },
        { c: ['RV Account', '17', '23', '74%', { p: 'r', t: 'Severe' }], flag: true },
        { c: ['Scott County', '7', '10', '70%', { p: 'r', t: 'Severe' }] },
        { c: ['Lakeland', '20', '52', '38%', { p: 'a', t: 'High' }], flag: true },
        { c: ['Cincinnati OH', '8', '27', '30%', { p: 'a', t: 'Elevated' }] },
        { c: ['Edmonton AB', '14', '271', '5%', { p: 'g', t: 'Low' }] },
      ],
    },
    chart: {
      title: 'Share of fleet with no RFID reader',
      data: [
        { l: 'Sarasota', v: 100, c: 'hi' }, { l: 'RV Acct', v: 74, c: 'hi' }, { l: 'Scott Cty', v: 70, c: 'hi' },
        { l: 'Lakeland', v: 38, c: 'ok' }, { l: 'Cincinnati', v: 30, c: 'ok' }, { l: 'Edmonton', v: 5, c: 'ok' },
      ],
    },
    analysis: [
      'Blind spots cluster: Sarasota can\'t confirm a single collection electronically. Lakeland is the bigger operational hole by raw count — 20 un-instrumented trucks.',
    ],
    rec: [
      'Install readers on Sarasota FL first — 12 trucks, fully blind.',
      'Tackle Lakeland next for volume — 20 readers closes the largest gap.',
      'Until readers are fitted, fall back to camera or manual confirmation on no-RFID routes.',
    ],
    follows: [['Which routes do they run?', 'routes'], ['Rank every account by coverage gap', 'coverage']],
  },
  routes: {
    q: 'Which routes do they run?',
    persona: { name: 'Account Manager', scope: 'No-RFID trucks · route grain' },
    intent: {
      read: 'You\'re drilling from the fleet count into the routes those un-instrumented trucks run — so you can see which collection routes produce no electronic confirmation.',
      chips: [['Scope', '173 no-RFID trucks'], ['Metric', 'Routes with no read coverage'], ['Grain', 'Account → route']],
    },
    trace: {
      steps: [
        { t: 'Took the 173 trucks with no RFID reader' },
        { t: 'Joined each truck to its current route assignment' },
        { t: 'Flagged routes where every assigned truck lacks a reader' },
        { t: 'Set aside routes with at least one reader-equipped truck', excl: true, why: 'Those routes still capture tipping events on instrumented trucks.' },
      ],
      sources: 'Route assignments · Trucks roster · RFID Reader field',
    },
    claims: {
      c1: { v: '~40 routes', conf: 'p', label: 'routes with no read coverage', src: 'Route assignments (estimated)', comp: 'routes where every assigned truck lacks a reader', note: 'Provisional until assignments are locked.' },
      c2: { v: '~12 routes', conf: 'p', label: 'Sarasota FL — whole route book is blind', src: 'Sarasota FL assignments', comp: '12 no-RFID trucks across its route book', note: 'Underlying fact — no readers — is high-confidence.' },
      c3: { v: '20 trucks', conf: 'h', label: 'Lakeland no-RFID trucks', src: 'Trucks · Lakeland', comp: '20 of 52 trucks with no reader', note: 'Direct roster figure.' },
    },
    summary: 'An estimated {{c1}} have no read coverage at all. Sarasota FL\'s entire route book is exposed ({{c2}}), and Lakeland feeds {{c3}} with no reader into its routes.',
    table: {
      title: 'Routes with no read coverage — by account',
      cols: ['Account', 'Blind routes', 'No-RFID trucks', 'Coverage', 'Confirm by'],
      rows: [
        { c: ['Sarasota FL', '~12', '12', { p: 'r', t: 'None' }, 'Manual'], flag: true },
        { c: ['RV Account', '~9', '17', { p: 'r', t: 'None' }, 'Camera/manual'], flag: true },
        { c: ['Lakeland', '~8', '20', { p: 'a', t: 'Partial' }, 'Reader install'] },
        { c: ['Edmonton AB', '~3', '14', { p: 'g', t: 'Mostly covered' }, 'Reader install'] },
      ],
    },
    analysis: ['On these routes a completed work order is the only record that a stop happened — there\'s no tipping event to corroborate it.'],
    rec: [
      'For Sarasota FL and RV Account, stand up manual or camera confirmation now.',
      'Sequence reader installs against the blind-route count, not just truck count.',
    ],
    follows: [['Rank every account by coverage gap', 'coverage'], ['What are the highest-risk segments?', 'segments']],
  },
  coverage: {
    q: 'Which accounts have the worst RFID coverage gap?',
    persona: { name: 'Account Manager', scope: 'All accounts · install program' },
    intent: {
      read: 'You\'re ranking accounts by how exposed each one is — the share of its fleet with no RFID reader — so you can sequence the install program.',
      chips: [['Scope', '74 accounts'], ['Metric', '% fleet with no reader'], ['Tiebreak', 'Absolute truck count']],
    },
    trace: {
      steps: [
        { t: 'Grouped all 1,072 trucks by account' },
        { t: 'For each account, counted trucks with an empty RFID Reader field' },
        { t: 'Ranked by no-RFID share; kept absolute count as the tiebreaker' },
        { t: 'Set aside the AD Work Orders pseudo-account', excl: true, why: 'It\'s a system placeholder, not a real service account.' },
      ],
      sources: 'Trucks roster · RFID Reader field',
    },
    claims: {
      c1: { v: '49 of 74', conf: 'h', label: 'accounts with at least one un-instrumented truck', src: 'Trucks grouped by account', comp: 'accounts where no-RFID count > 0', note: 'Two-thirds of the book carries some exposure.' },
      c2: { v: '12 of 12', conf: 'h', label: 'Sarasota FL — fully blind', src: 'Trucks · Sarasota FL', comp: '100%', note: 'Every truck lacks a reader.' },
      c3: { v: '20 trucks', conf: 'h', label: 'Lakeland — largest absolute gap', src: 'Trucks · Lakeland', comp: '20 of 52', note: 'Biggest single install job.' },
    },
    summary: '{{c1}} accounts have at least one truck with no reader. By share, Sarasota FL is worst at {{c2}}. By volume Lakeland leads with a {{c3}} gap.',
    table: {
      title: 'RFID coverage gap — ranked by exposure',
      cols: ['Account', 'No RFID', 'Fleet', '% blind', 'Priority'],
      rows: [
        { c: ['Sarasota FL', '12', '12', '100%', { p: 'r', t: '1 — Now' }], flag: true },
        { c: ['RV Account', '17', '23', '74%', { p: 'r', t: '2' }], flag: true },
        { c: ['Lakeland', '20', '52', '38%', { p: 'a', t: 'Volume' }], flag: true },
        { c: ['Edmonton AB', '14', '271', '5%', { p: 'g', t: 'Low' }] },
      ],
    },
    analysis: ['Hit fully-blind small accounts first, then Lakeland for volume.'],
    rec: [
      'Run installs in two tracks: fully-blind small accounts first, then Lakeland.',
      'Defer sub-20% accounts to a later phase.',
    ],
    follows: [['What are the highest-risk segments?', 'segments'], ['How many trucks have no RFID reader?', 'rfid']],
  },
  segments: {
    q: 'What are the highest-risk segments?',
    persona: { name: 'Account Manager', scope: 'All segments · risk view' },
    intent: {
      read: 'You\'re asking me to rank segments by overall risk — RFID blind spots plus aged unrouted work orders.',
      chips: [['Scope', 'All segments'], ['Signal 1', 'RFID blind %'], ['Signal 2', 'Aged unrouted WOs']],
    },
    trace: {
      steps: [
        { t: 'Pulled fleet RFID coverage and open unrouted work orders per segment' },
        { t: 'Scored each segment on both signals' },
        { t: 'Ranked by combined risk and tagged the dominant driver' },
        { t: 'Set aside clean segments', excl: true, why: 'Full RFID coverage and no stalled orders.' },
      ],
      sources: 'Trucks roster · Missing WO report · Route assignments',
    },
    claims: {
      c1: { v: '12 of 12', conf: 'h', label: 'Sarasota FL — fully blind fleet', src: 'Trucks · Sarasota FL', comp: '100% blind', note: 'Highest instrumentation risk.' },
      c2: { v: '8 aged orders', conf: 'h', label: 'Edmonton AB stalled work orders', src: 'Missing WO report', comp: 'open, dispatched-but-unrouted, up to 1,210 days', note: 'Low RFID gap but a real service backlog.' },
      c3: { v: '173 of 1,072', conf: 'h', label: 'fleet-wide trucks blind', src: 'Trucks roster', comp: '173 no-RFID', note: 'Direct roster count.' },
    },
    summary: 'Risk splits across two drivers. Sarasota FL is {{c1}} trucks blind. Edmonton AB has {{c2}}. Across the fleet, {{c3}} trucks feed these scores.',
    table: {
      title: 'Segments ranked by risk',
      cols: ['Segment', 'RFID blind', 'Aged WOs', 'Risk driver', 'Level'],
      rows: [
        { c: ['Sarasota FL', '100%', '0', 'Blind fleet', { p: 'r', t: 'Critical' }], flag: true },
        { c: ['RV Account', '74%', '0', 'Blind fleet', { p: 'r', t: 'High' }], flag: true },
        { c: ['Edmonton AB', '5%', '8', 'Stalled orders', { p: 'r', t: 'High' }], flag: true },
        { c: ['Lakeland', '38%', '0', 'Blind fleet (vol.)', { p: 'a', t: 'Elevated' }] },
      ],
    },
    analysis: ['Sarasota and RV are unverifiable-collection risks. Edmonton is a service-backlog risk despite near-full RFID coverage.'],
    rec: [
      'Treat Sarasota and RV as collection-verification risks — camera/manual confirmation plus reader installs.',
      'Treat Edmonton as a service-recovery risk — re-route its 8 aged orders.',
    ],
    follows: [['Which open orders need attention?', 'openorders'], ['How many trucks have no RFID reader?', 'rfid']],
  },
  openorders: {
    q: 'Which open orders need attention?',
    persona: { name: 'Account Manager', scope: 'Open work orders · unrouted' },
    intent: {
      read: 'You\'re asking which open work orders need attention now. I\'m reading that as open orders that are stuck — a dispatch number but no route number — oldest first.',
      chips: [['Scope', 'Open WOs · not closed'], ['Signal', 'Dispatched, no route'], ['Sort', 'Oldest first']],
    },
    trace: {
      steps: [
        { t: 'Pulled open work orders — status not Closed' },
        { t: 'Isolated orphaned orders — dispatch present, route blank' },
        { t: 'Sorted by case age; joined request type and last-attempt date' },
        { t: 'Set aside 1 malformed record', excl: true, why: 'Corrupt dispatch value and dates — needs a data fix, not a dispatch.' },
      ],
      sources: 'WorkOrders · Dispatch log · Route master',
    },
    claims: {
      c1: { v: '9 open orders', conf: 'h', label: 'dispatched but never routed', src: 'Missing WO report', comp: 'open WOs with dispatch # and no route #', note: '8 actionable after excluding the corrupt row.' },
      c2: { v: '1,210 days', conf: 'h', label: 'oldest actionable order', src: 'WO 03849366', comp: 'days since 4/10/2023', note: 'Date-logged case age.' },
      c3: { v: 'all 8', conf: 'h', label: 'actionable orders more than a year past due', src: 'Missing WO · case age > 365', comp: 'youngest is 677 days', note: 'None of the backlog is recent.' },
    },
    summary: '{{c1}} are dispatched but never routed. The oldest has been open {{c2}}, and {{c3}} are more than a year past due.',
    table: {
      title: 'Open orders — dispatched but unrouted',
      cols: ['Work order', 'Request type', 'Age (days)', 'Dispatch', 'Location'],
      rows: [
        { c: ['03849366', 'A3-Confirm Cart', '1,210', 'D-05029', 'Canton GA'], flag: true },
        { c: ['03889373', 'A3-Repair RFID', '840', 'D-06261', 'Edmonton AB'], flag: true },
        { c: ['03889643', 'A1-Lost/Stolen Cart', '805', 'D-06261', 'Edmonton AB'] },
        { c: ['123454655', 'A3-Deliver New Service', '677', 'D-05977', 'Edmonton AB'] },
      ],
    },
    analysis: ['They were dispatched but a route number was never written back, so they fell out of every crew\'s schedule and aged.'],
    rec: [
      'Re-route the four oldest cart orders first.',
      'Fast-track WO 03889373 (Repair RFID) — it also restores a collection-tracking point.',
    ],
    follows: [['Why did these sit unrouted so long?', 'aged'], ['What are the highest-risk segments?', 'segments']],
  },
  aged: {
    q: 'Why did these orders sit unrouted so long?',
    persona: { name: 'Account Manager', scope: 'Drill · unrouted backlog' },
    intent: {
      read: 'You\'re drilling into the root cause — why did these open orders carry a dispatch number for years without ever being routed?',
      chips: [['Scope', '9 unrouted orders'], ['Metric', 'Root cause of the stall'], ['Window', 'Since 2023']],
    },
    trace: {
      steps: [
        { t: 'Took the 9 dispatched-but-unrouted orders' },
        { t: 'Traced each order\'s dispatch → route hand-off' },
        { t: 'Grouped by created-by source and by dispatch batch' },
        { t: 'Set aside the 1 malformed record', excl: true, why: 'Its stall is a data-entry defect, not a routing-process failure.' },
      ],
      sources: 'WorkOrders · Dispatch log · Created-by audit',
    },
    claims: {
      c1: { v: '7 of 8', conf: 'h', label: 'created by admin or sync, not a dispatcher', src: 'Created By', comp: 'Admin or bdpsync user', note: 'No one owned the route step.' },
      c2: { v: '3 dispatch batches', conf: 'h', label: 'account for most of the backlog', src: 'Dispatch #', comp: 'D-06261, D-05977, D-05960', note: 'Six of eight orders.' },
      c3: { v: '677–1,210 days', conf: 'h', label: 'age band of the stalled orders', src: 'Case age', comp: 'oldest 1,210, youngest 677', note: 'All predate the current dispatch workflow.' },
    },
    summary: 'The stall is a routing hand-off failure. {{c1}} orders were created by admin or sync accounts. {{c2}} account for most of them, all aged {{c3}}.',
    table: {
      title: 'Unrouted orders — by origin & dispatch batch',
      cols: ['Dispatch', 'Orders', 'Created by', 'Request types', 'Fix'],
      rows: [
        { c: ['D-06261', '2', 'Edm Admin', 'Lost Cart, Repair RFID', 'Re-route'], flag: true },
        { c: ['D-05977', '2', 'Edm Admin / sync', 'Deliver, Repair Cart', 'Re-route'], flag: true },
        { c: ['D-05960', '2', 'bdpsync user', 'Brush, Bulk Pickup', 'Re-route'] },
      ],
    },
    analysis: ['Orders that entered through admin consoles or bdpsync never picked up a route number, because those paths don\'t enforce the routing step a dispatcher would.'],
    rec: [
      'Re-route the orders by dispatch batch first.',
      'Add a validation rule: an order can\'t leave dispatch with a blank route number.',
      'Audit the bdpsync integration.',
    ],
    follows: [['Which open orders need attention?', 'openorders'], ['Rank accounts by RFID coverage gap', 'coverage']],
  },
};

const FREE_TYPE_RULES = [
  { key: 'dispute', terms: ['picked', 'pickup', 'collected', 'street', 'address', 'resident', '12802'] },
  { key: 'unmatched', terms: ['unmatched', 'match', 'cart', 'serial', 'tag'] },
  { key: 'behind', terms: ['behind', 'pace', 'expected', 'today', 'tips', 'collection'] },
  { key: 'rfid', terms: ['rfid', 'reader', 'camera'] },
  { key: 'aged', terms: ['why', 'long', 'stuck', 'root', 'aged'] },
  { key: 'openorders', terms: ['open', 'order', 'attention', 'unrouted', 'backlog'] },
  { key: 'segments', terms: ['risk', 'segment', 'highest'] },
  { key: 'coverage', terms: ['coverage', 'gap', 'rank', 'account', 'worst'] },
  { key: 'routes', terms: ['route'] },
  { key: 'rfid', terms: ['truck', 'fleet'] },
];

export function resolvePlaybookKey(prompt) {
  const value = String(prompt || '').toLowerCase().trim();
  if (!value) return null;
  const exact = Object.keys(PLAYBOOK).find((key) => PLAYBOOK[key].q.toLowerCase() === value);
  if (exact) return exact;
  const byLabel = PLAYBOOK_STARTERS.find((item) => item.label.toLowerCase() === value);
  if (byLabel) return byLabel.key;
  const hit = FREE_TYPE_RULES.find((rule) => rule.terms.some((term) => value.includes(term)));
  return hit?.key || null;
}
