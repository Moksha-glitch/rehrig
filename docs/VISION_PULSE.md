# Vision Pulse — Product & UX Guide

This document describes how Vision Pulse works today: the shell, Vision AI, service-provider onboarding, reports, branding, and the rules that keep those surfaces consistent.

It is written for engineers and designers working in this repo. Behavior described here matches the current code, not a future spec.

---

## 1. What Vision Pulse is

Vision Pulse is a React workspace for Rehrig Pacific service operations. Operators, service providers, and residents use it to manage accounts, collections, work orders, fleet, analytics, and onboarding.

The UI is one app with two backends:

| Mode | Data | Command | Port |
| --- | --- | --- | --- |
| **demo** (default) | Local seed + `localStorage` | `npm run dev` | 5173 |
| **api** | JWT + `vision-api` | `npm run dev:api` | 5174 |

Vite maps `@backend` to `src/backends/demo` or `src/backends/api` from `VITE_APP_MODE`. Screens and hooks stay the same; only the data layer swaps.

Demo password for every seed user: `vision`.

| Persona | Email | Role |
| --- | --- | --- |
| Rehrig | `helena@vision.io` | Admin |
| Provider | `yolanda@vision.io` | SP Admin |
| Provider | `marcus@vision.io` | Ops Manager |
| Provider | `jordan@vision.io` | Maintenance Admin |
| Customer | `sam@vision.io` | Portal User |

---

## 2. Product rules

These are non-negotiable while developing:

1. **Home is the default, not Vision AI.** Login lands on Home. The assistant opens only when the user asks (Ask AI, sidebar, or a starter that requires it).
2. **Changing modules closes Vision AI.** Navigating away from the current module retracts the chat so the destination page is fully visible.
3. **Onboarding is full screen.** Service Provider onboarding hides the side nav and the top bar. The wizard keeps its own Back control.
4. **One brand blue.** Sidebar, primary buttons, login chrome, and nav flyouts use `#0C4480`.
5. **Rehrig users do not mutate operational records** (work orders, assets, and similar). They can still manage reports if they have account-create / reports access.
6. **Your Account is the signed-in user**, not a service-provider account record.
7. **No Salesforce chrome** (App Launcher, Help, Trailhead, Setup Menu).

---

## 3. Application shell

```
┌────────────┬──────────────────────────────────────────────┐
│            │ Top bar  (search + Ask AI + user)            │
│  Side nav  ├──────────────────────────────────────────────┤
│  #0C4480   │ Main: Home / module pages                    │
│            │                                              │
└────────────┴──────────────────────────────────────────────┘
```

When Vision AI is open:

```
┌────────────┬──────────────────┬───────────────────────────┐
│            │ Vision AI chat   │ Agent page                │
│  Side nav  │ ~426px           │ Today's collections       │
│            │ thread + ask     │ + answers below           │
└────────────┴──────────────────┴──────────────────────────┘
```

When onboarding is open:

```
┌───────────────────────────────────────────────────────────┐
│ Wizard header (Back · Onboard Service Provider)           │
│ Full-screen steps — no side nav, no top bar               │
└───────────────────────────────────────────────────────────┘
```

### 3.1 Side nav

- File: `src/components/SideNav.jsx`
- Background: `bg-brand` → `#0C4480`
- Collapsed width: `4.25rem`. Expanded: `16.5rem`
- Section flyouts use the same brand fill (not a second navy)
- Hidden on Service Provider onboarding

### 3.2 Top bar

- File: `src/components/TopBar.jsx`
- Search, Ask AI (`VisionAiMark`), user menu
- Hidden on Service Provider onboarding
- Hidden while the Vision AI agent page is open (the chat header and agent header are both 60px to match the old bar)

### 3.3 Login

- File: `src/screens/Login.jsx`
- Full-page brand background `#0C4480`
- Sign-in button uses the same brand token
- Demo-user picker is available on the login screen

---

## 4. Vision AI

Vision AI is an in-app collections assistant: a normal chat on the left and a continuous report page on the right.

### 4.1 How to open it

| Entry | Result |
| --- | --- |
| **Ask AI** in the top bar | Opens the chat rail |
| Sidebar assistant item (if present) | Opens the chat rail |
| After login | Does **not** open. Home opens instead. |

Closing Vision AI (X in the chat header) or changing modules returns the user to the current page with the top bar.

**Back to page** on the agent header hides the right-hand report (`viewing: idle`) and restores TopBar + the current module. The chat rail can stay.

### 4.2 Layout

- **Chat rail** (~426px): Vision AI header, thread, suggested questions, composer
- **Agent page** (remaining width): one scrolling document
  1. Today’s collections metrics (always first)
  2. Each playbook answer appended below, in the order asked

Headers are text-only (**Vision AI** / **Today’s collections**). The orb logo is only on Ask AI in the top bar.

Suggested questions are the same collections starters for every persona.

### 4.3 What stays in chat vs what opens the report

| Question type | Chat | Agent page |
| --- | --- | --- |
| Simple / unmatched intent | User + assistant bubbles | Metrics stay as they were (or open if idle) |
| “How are today’s collections going?” | Short summary bubble | Scrolls to / stays on the landing metrics |
| Playbook question (behind, unmatched, dispute, …) | Short summary bubble | Rolls down and **loads the answer below the metrics** |

Simple answers never replace the metrics page. Detailed answers never appear only in the chat.

### 4.4 Viewing states

Managed in `src/components/VisionChat.jsx` as `viewing`:

| `type` | Meaning |
| --- | --- |
| `landing` | Agent page shows today’s metrics |
| `playbook` | Metrics + stacked `StructuredAnswer`s; current `turnId` is the active answer |
| `idle` | Agent page hidden; TopBar + current module restored |

`viewing.focus` increments every time we need to scroll again (new ask, reopen a bubble, open a saved thread).

### 4.5 Today’s collections (landing)

- Data: `PLAYBOOK_LANDING` in `src/data/assistantPlaybook.js`
- UI: `LandingReport` in `src/components/AssistantAnswer.jsx`
- Shown by default when the agent page is open
- Includes live header, filter chips, four KPIs, pace chart, flags, route/truck table, and “Ask about this report” chips
- **Create a widget** / **Create report** sit under charts and tables
- First visit animates in (pulling → header → KPIs → chart → table → chips)
- Reopening history or asking a follow-up does not replay that intro

### 4.6 Playbook answers

Playbook keys live in `PLAYBOOK`:

| Key | Example question |
| --- | --- |
| `behind` | Which routes are running behind on tips today? |
| `unmatched` | Which tips today didn’t match a registered cart? |
| `dispute` | Was 12802 58 Street NW picked up today? |
| `rfid` | RFID / cart match drill-down |
| `routes` | Route performance |
| `coverage` | Coverage gaps |
| `segments` | Segment view |
| `openorders` | Open work orders |
| `aged` | Aging tickets |

Starters shown in the composer (`PLAYBOOK_STARTERS`): `behind`, `unmatched`, `dispute`.

Each new playbook answer:

1. Appends **below** today’s metrics (same page, not a second pane)
2. Gets a `min-height` so the page can actually roll to it
3. Plays a read-through: *Reading your question…* → computation steps → summary, table/chart, analysis, follow-ups
4. Older stacked answers stay instant (no replay)

Chat shows *Reading your question…* for ~520ms, then a short summary. The detailed report is on the right.

Clicking a user bubble or **Jump to this report** reopens that answer and rolls to it (instant, no animation replay).

### 4.7 Continuous page + roll-down

The right side is **one** overflow column (`agentScrollRef`):

```
[ Today's collections ]
────────
[ Answer 1 ]
────────
[ Answer 2 ]   ← current ask; page smooth-scrolls here
```

Do not split metrics and answers into two independently scrolling sections. That reads as two products.

Scroll helper: `rollToChild` in `VisionChat.jsx`. It uses the current answer’s `id="vision-answer-{turnId}"` and `scrollTo({ behavior: 'smooth' })`. It must **not** reset `scrollTop` to `0` when the target is missing (that was keeping the viewport on the metrics).

**New chat** clears the thread but **keeps metrics open**.

### 4.8 Persistence

Per user, in `localStorage`:

| Key pattern | Contents |
| --- | --- |
| `vision.ui.chatHistory.{user}` | Last 12 threads |
| `vision.ui.chatFavorites.{user}` | Last 12 favorites |

### 4.9 Create widget / create report from AI

`CompActions` under a chart or table opens:

- `CreateWidgetDrawer` — places a custom widget on the dashboard
- `CreateReportDrawer` — saves a report spec, then navigates to **Reports**

### 4.10 Key files

| File | Role |
| --- | --- |
| `src/components/VisionChat.jsx` | Shell, chat, viewing, scroll, history |
| `src/components/AssistantAnswer.jsx` | `LandingReport`, `StructuredAnswer`, tables/charts |
| `src/data/assistantPlaybook.js` | Landing + playbook copy, starters, export HTML |
| `src/data/assistantIntents.js` | Simple intents, persona chips, actions |
| `src/components/VisionAiMark.jsx` | Orb mark for Ask AI only |
| `src/App.jsx` | Wraps main column in `VisionChat` when open |

---

## 5. Service Provider onboarding

Guided 8-step (plus review) flow for creating a provider account.

### 5.1 Entry

- Service Providers list → **Onboard Service Provider**
- Registry home → **Onboard new Service Provider**
- Vision AI intent: “Help me onboard a new service provider”

Route: `module: 'onboarding'` via `onboardingNavParams` (`src/utils/appNavigation.js`). Optional `draftId` resumes a draft.

### 5.2 Full-screen chrome

While `state.nav.module === 'onboarding'`:

- Side nav is **not** rendered
- Top bar is **not** rendered
- Vision AI is **not** wrapped around the page
- Main is `flex` + `overflow-hidden` so the wizard fills the viewport

Leave via the wizard Back control (confirm dialog). Return route is stored in onboarding params.

### 5.3 Phases

| Phase | What the user sees |
| --- | --- |
| `choose` | Upload a contract **or** fill in details manually |
| `confirm` | Confirm the selected file |
| `extracting` | Contract extraction in progress |
| `steps` | Step rail + form + optional AI assistant |

### 5.4 Steps (`src/screens/wizard/wizardSteps.js`)

1. Account Information *(required)*
2. Service Types & Modules
3. Hardware & Tracking
4. Billing & Shipping Address
5. Service Provider Products *(required)*
6. Collection Routes
7. Contacts & Portal Users
8. Screen Access
9. Review & Activate

Completed required steps show a checkmark (`✓`) in the rail and the mobile step picker.

### 5.5 Key files

| File | Role |
| --- | --- |
| `src/screens/wizard/Wizard.jsx` | Full-screen wizard |
| `src/screens/wizard/WizardAssist.jsx` | Upload / AI assist |
| `src/screens/wizard/wizardSteps.js` | Steps, validation, field catalogs |
| `src/screens/ContractOnboarding.jsx` | Alternate contract-extract path |

---

## 6. Reports

Module: `reports` (`src/screens/ReportsStudio.jsx`).

### 6.1 Folders

My Reports · Shared with me · Public Reports · Recently Viewed · Favorites · Operations · Fleet Health · Customer Insights · SLA & Compliance · Templates

If **My Reports** is empty on first load, the studio opens the first folder that actually has reports (usually Recently Viewed).

### 6.2 Delete

Each report row has:

1. Favorite (star)
2. **Delete (trash icon)** — next to the star

The same trash icon appears on the preview header and on the card grid.

Delete is allowed when the user can create accounts **or** create records, **and** can access `reports` or `analytics`. Rehrig admins qualify via `canCreateAccounts`. The older gate (`canCreateRecords && analytics` only) hid the icon for Rehrig users.

Delete always confirms: “Delete report?”

### 6.3 Create from Vision AI

Creating a report from a chart/table snapshot opens `CreateReportDrawer`, saves a spec, toasts, and navigates to Reports.

---

## 7. Brand & visual system

Tokens live in `src/index.css` (`:root`).

| Token | Value | Used for |
| --- | --- | --- |
| `--color-brand` | `#0C4480` | Sidebar, primary buttons, login, Ask/chat accents |
| `--color-brand-hover` | `#155AA0` | Button hover |
| `--color-brand-soft` | `#E7ECFD` | Soft chips, selected rows |
| `--color-accent` | `#3457D5` | Secondary accent |

Tailwind maps `bg-brand`, `text-brand`, `border-brand` to those tokens. Prefer the token over a hardcoded hex so dark theme and hover stay aligned.

Motion:

- `animate-fade-up` / `animate-fade-in` in `tailwind.config.js`
- `Reveal` in `AssistantAnswer.jsx` waits, then fades a block in
- Landing metrics and new playbook answers must **not** pop in all at once

---

## 8. Personas & access

RBAC: `src/data/rbac.js`.

| Persona | Typical access |
| --- | --- |
| **Rehrig** | Registry, providers, setup, reports, analytics. Cannot create operational records. |
| **Service Provider (sp)** | Own account operations: WO, assets, routes, tips, reports, Vision AI collections. |
| **Customer** | Portal: my locations, my work orders, my notifications, my account. |

`canCreateRecordsForUser` is false for Rehrig, customers, Field Tech, Analyst, and Read-Only. Report delete uses a wider gate (see §6.2).

---

## 9. Architecture map

```
src/
  App.jsx                    Router + shell (nav / Vision AI / onboarding)
  backends/demo|api          Auth, store, hooks
  components/
    SideNav.jsx              Brand sidebar
    TopBar.jsx               Search + Ask AI + user
    VisionChat.jsx           Assistant shell
    AssistantAnswer.jsx      Metrics + structured answers
    CreateWidgetDrawer.jsx
    CreateReportDrawer.jsx
  data/
    assistantPlaybook.js     Collections playbook
    assistantIntents.js      Simple intents
    rbac.js                  Personas / modules
    seed.js                  Demo accounts
    reportStudio.js          Report specs
  screens/
    wizard/                  SP onboarding
    ReportsStudio.jsx
    Dashboard.jsx
    Login.jsx
  state/                     DemoAppStore / ApiAppStore
  config/appMode.js          demo | api
```

`LOGIN` in `DemoAppStore` sets `assistantOpen: false` and `nav.module: 'home'`.

`App.jsx` closes the assistant when `state.nav.module` changes after the first login paint. It does **not** call `openAssistant()` on login.

---

## 10. UX checklist (for reviews)

Use this when changing these surfaces.

### Vision AI

- [ ] Chat stays on the left; metrics stay on the right
- [ ] Answers append **below** today’s metrics, never above, never in a second pane
- [ ] Asking a playbook question rolls the page down to that answer while it loads
- [ ] New answers animate (reading → steps → reveal); history does not
- [ ] Simple questions stay in the chat thread
- [ ] New chat keeps metrics; Back to page restores the app
- [ ] Headers are text-only (no orb in Vision AI / Ask headers)

### Onboarding

- [ ] Side nav and top bar are gone
- [ ] Wizard has its own Back + confirm
- [ ] Step checkmarks render as `✓`

### Reports

- [ ] Trash icon is visible next to the star for Rehrig admin and SP editors
- [ ] Confirm dialog before delete
- [ ] Empty “My Reports” does not trap the user on a blank folder

### Brand

- [ ] Sidebar, buttons, and login share `#0C4480`
- [ ] No leftover `#1E2761` / `#2E3A73` on chrome

### Navigation

- [ ] Login → Home
- [ ] Changing module closes Vision AI
- [ ] Ask AI still opens Vision AI from Home

---

## 11. Local persistence

Keys that start with `vision.`:

| Key | Purpose |
| --- | --- |
| `vision.theme` | Light / Dark / System |
| `vision.ui.sidebarCollapsed` | Sidebar open/closed |
| `vision.ui.chatHistory.{user}` | Vision AI threads |
| `vision.ui.chatFavorites.{user}` | Vision AI favorites |
| Other `vision.*` | Demo store / drafts |

Clearing those keys resets demo data.

---

## 12. Related reading

- Root `README.md` — install, scripts, demo users
- `src/data/rbac.js` — module allow-lists
- `src/data/assistantPlaybook.js` — collections narrative and numbers
