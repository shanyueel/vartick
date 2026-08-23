# Project Plan — "Cadence" (working title)

**A local-first productivity companion that starts as a Pomodoro timer and grows into a schedule assistant.**

| | |
|---|---|
| **Owner / Engineer** | Shan-Yu Chou (solo) |
| **Duration** | 4 weeks |
| **Budget** | ~12–15 hrs/week (~50–60 hrs total) |
| **Status** | Draft v1.0 — approved scope baseline |
| **Deploy target** | Vercel, public URL |

---

## 1. Product Thesis

Most productivity apps track **what you planned**. Almost none track **the gap between what you planned and what actually happened, and why.**

Cadence's differentiator is that every deviation is a first-class data point. When a user shifts a block because a meeting ran long, that adjustment is recorded — not silently overwritten. Four weeks of adjustment data is what makes the Phase 4 AI suggestions substantive instead of generic advice a fortune cookie could produce.

**One-line pitch:** *A Pomodoro timer that learns why your day never goes to plan.*

### Why this matters for the portfolio
Interviewers see dozens of Pomodoro clones. The defensible story here is: local-first architecture with IndexedDB, a real state machine, an offline-capable PWA, a BYOK LLM integration that never touches your wallet, and a test pyramid with genuine E2E coverage. The product thesis gives you something to *talk* about beyond the stack.

---

## 2. Success Criteria

The project is a success if **all** of these are true at the end of Week 4:

| # | Criterion | Measurement |
|---|---|---|
| S1 | Publicly deployed and installable as a PWA | Live Vercel URL, passes Lighthouse PWA audit |
| S2 | The author uses it for his own work for ≥5 consecutive days | Self-reported; real session data in production |
| S3 | Phases 1 and 2 are fully shipped and polished | All acceptance criteria in §6 met |
| S4 | Test suite is real, not decorative | ≥80% line coverage on `/lib`, ≥4 passing Playwright flows |
| S5 | Visually distinctive | A stranger would not guess it was built from a shadcn default template |
| S6 | Every phase produced something demoable | 4 tagged releases, 4 screenshots/GIFs in the README |

**Explicit non-goal:** shipping all four phases at the cost of S3 or S5. If time runs out, Phase 4 ships in a reduced form (see §7 Cut Lines). A polished 3-phase app beats a rough 4-phase one — for both daily use and interviews.

---

## 3. Constraints

Confirmed with the owner. These are binding — changing any of them invalidates parts of the plan downstream, so revisit §8 (Data Model) and §9 (Architecture Decisions) before revising one.

**Delivery**
- **C1 — Solo developer, ~2–3 hrs/day**, running concurrently with an active job search and LeetCode practice. Assume at least 2–3 days in the 4 weeks are lost entirely to interviews.
- **C2 — Zero infrastructure budget.** Vercel free tier, no paid database, no paid LLM inference.
- **C3 — No design resource** beyond the author.

**Product**
- **C4 — Local-only storage for v1.** No accounts, no server-side persistence, no sync. Losing browser storage means losing data; this is an accepted v1 tradeoff, mitigated by JSON export.
- **C5 — Single-user, single-device.** Multi-device sync is post-v1.
- **C6 — Bring-your-own LLM key.** The user supplies their own API key, so the product is free to operate at any user count.
- **C7 — Desktop-primary, mobile-companion.** Full planning and reporting are designed for desktop; mobile is optimized for running a session and glancing at progress. Mobile is not a reduced-feature version, but it is not where a day gets planned. See risk R1 in §13 for the notification limits this implies.

---

## 4. Theory Foundation — how principles become features

The plan requires that each productivity theory maps to a concrete, testable feature. Theory that doesn't produce a feature is cut.

| Theory | Product implementation | Phase |
|---|---|---|
| **Pomodoro Technique** | 25/5/15 default cycle, long break after 4 focus sessions, abandoned sessions recorded rather than deleted (interruption tracking is core to the original method) | 1 |
| **Eisenhower Matrix** | Tasks carry `urgent` and `important` booleans → derived quadrant. Daily report surfaces "% of focus time spent in Q2 (important, not urgent)" as the headline productivity metric | 2 |
| **Time-Blocking** | Day plan composed of blocks with planned start/end. Plan-vs-actual is computed and visualized | 3 |

**Deferred: Energy Management.** Energy-based scheduling is deliberately out of v1 (see §5). One exception: the app still *captures* a one-tap energy rating at session end, because this data cannot be backfilled — if capture ships in v1, the eventual peak-window feature launches with months of real history behind it instead of starting from zero. Capture only; no energy reporting, aggregation, or insight in v1.

**Removed: Parkinson's Law.** Estimate-vs-actual drift reporting was cut — it added a reporting surface without a clear user action attached to it.

**Design rule:** the Phase 4 AI must ground every suggestion in one of these named frameworks and cite the specific user data that triggered it. Suggestions without a data citation are considered a bug.

---

## 5. Scope

### In scope (v1)

- Pomodoro timer with configurable durations and cycle
- Session logging with optional retroactive task attribution
- Task management with fixed preset categories and Eisenhower + difficulty labels
- Daily report with category and quadrant breakdowns
- Day planning with time blocks, shift/reschedule actions, and adjustment logging
- In-session nudges and end-of-block notifications
- Weekly report
- BYOK LLM weekly insight generation
- JSON data export and import
- Installable PWA with offline capability
- Public Vercel deployment

### Out of scope (v1) — build backlog

These are deliberately deferred. Do not build them, even if a week runs ahead of schedule; use spare time on polish instead.

- User accounts, authentication, cloud sync
- Custom user-defined categories
- Google Calendar integration
- Team/social features, sharing, leaderboards
- Native mobile apps
- Recurring routine templates *(see risk R3 — this is the most likely scope creep vector)*
- Historical trend analysis beyond a 7-day window
- Energy-based scheduling insights — peak-window detection, energy heatmaps, energy-aware block suggestions *(capture only in v1; see §4)*
- Estimate-vs-actual drift reporting
- Multi-language / i18n
- Dark/light theme toggle *(pick one theme and execute it well)*

---

## 6. Phase Definitions & Acceptance Criteria

Each phase is a **gate**. Do not begin the next phase until the current phase's criteria all pass. Each gate ends with a git tag and a deploy.

---

### Phase 1 — Focus Timer (Week 1)
> *Demoable outcome: a working, installable Pomodoro timer at a public URL.*

**Scope**
- Timer state machine: `idle → running → paused → running → completed`, plus `abandoned`
- Three session types: focus (25m), short break (5m), long break (15m); long break after every 4 focus sessions
- Durations configurable in settings
- Every session persisted to IndexedDB on completion *and* on abandonment
- Timer survives page refresh and tab backgrounding (timestamp-based, not tick-counting — see ADR-3)
- Browser notification + sound on session end
- Settings screen (durations, sound on/off, notifications permission)
- PWA manifest, service worker, installable
- Deployed to Vercel

**Acceptance criteria**
- [ ] Starting a 25-minute focus session, backgrounding the tab for 25 minutes, and returning shows the session correctly completed — not 25 minutes remaining
- [ ] Refreshing mid-session restores the correct remaining time
- [ ] Abandoning a session writes a row with `status: 'abandoned'` and the actual elapsed duration
- [ ] Lighthouse PWA audit passes; app installs to home screen on both desktop and Android
- [ ] Timer state machine has 100% branch coverage in Vitest, written test-first
- [ ] Deployed and reachable at a public URL

---

### Phase 2 — Tasks & Daily Report (Week 2)
> *Demoable outcome: "here's where my day actually went," with real data.*

**Scope**
- Task CRUD: title, preset category, `urgent`/`important` flags, difficulty (1–3), estimated Pomodoros (used in Phase 3 to size blocks — not reported on)
- Naked timer remains supported — task attribution is always optional
- Retroactive attribution: after a session ends, prompt to attach a task (skippable, and editable later from history)
- One-tap energy rating at session end (low/med/high, skippable) — **captured and stored only; not surfaced anywhere in v1**
- Daily report: total focus time, sessions completed vs. abandoned, time by category, time by Eisenhower quadrant
- Session history list with inline editing

**Acceptance criteria**
- [ ] A session can be completed with no task attached, and the report handles untagged time as an explicit "Uncategorized" segment
- [ ] Attaching a task to a past session updates the daily report without a page reload (`useLiveQuery`)
- [ ] All report aggregation functions are pure, take a `Session[]` array, and are unit-tested against fixture data including edge cases: empty day, sessions crossing midnight, all-abandoned day
- [ ] Quadrant math is tested for all four urgent/important combinations
- [ ] Daily report renders correctly for a day with zero sessions (empty state, not a crash)

---

### Phase 3 — Schedule Assistant (Week 3) ⚠️ *highest risk phase*
> *Demoable outcome: plan a day, watch reality diverge, and record why.*

**Scope**
- Day plan: an ordered list of blocks for a given date
- Block: title, optional linked task, planned start/end
- Build tomorrow's plan from existing tasks
- **Live tracking:** the current block is highlighted against wall-clock time; drift is shown
- **Adjustment actions** when running behind:
  - *Shift* — push all remaining blocks by N minutes
  - *Reschedule* — move one block to a later slot
  - *Drop* — remove a block from today
- Every adjustment writes an `adjustments` row with type, delta, affected block, and optional reason
- Nudges: notification at block start, and at 5 minutes before planned block end
- Plan-vs-actual view appended to the daily report

**Acceptance criteria**
- [ ] The shift algorithm is pure, test-first, and handles: overlapping blocks, shifting past midnight, shifting a block that has already started, and shifting when no blocks remain
- [ ] Every adjustment appears in the day's history with a human-readable description
- [ ] Deleting a task that is linked to a block does not orphan or crash the block
- [ ] Plan-vs-actual correctly handles a block that was never started
- [ ] Nudge notifications fire within ±60s of the target time while the app is open

**Cut line for Phase 3:** if Week 3 is running behind at its midpoint, ship *shift* only and defer *reschedule* and *drop* to the backlog. A working shift action plus adjustment logging satisfies the data requirement for Phase 4; the other two are conveniences.

---

### Phase 4 — Weekly Insight (Week 4)
> *Demoable outcome: paste your API key, get grounded advice about your own week.*

**Scope**
- BYOK setup screen: provider selection, API key input, key stored in IndexedDB only, connection test button, clear warning about what is sent
- Weekly report: aggregate stats across 7 days, quadrant trend, plan-vs-actual summary, adjustment summary
- "Generate insight" action → builds a structured prompt from the week's aggregates → returns 3–5 recommendations
- Each recommendation must name the framework it draws on and cite the data that triggered it
- Insight persisted so it is readable without re-generating
- Graceful degradation: insufficient data (<5 sessions in the week), invalid key, rate limit, and network failure each have a distinct, useful message

**Acceptance criteria**
- [ ] The prompt builder is a pure function, unit-tested, and asserted to contain zero raw task titles unless the user opts into sharing them (privacy default: send aggregates only)
- [ ] No API key is ever written to a server, a log, or a URL parameter
- [ ] With fewer than 5 sessions in the week, the UI explains why insight is unavailable instead of generating low-quality output
- [ ] Every failure mode above renders a distinct, actionable message — verified by test
- [ ] The feature is fully skippable: a user with no API key can use every other part of the app with no nagging

---

## 7. Cut Lines — what to sacrifice, in order

When time runs short, cut in exactly this order. Do not improvise.

1. Phase 3 *reschedule* and *drop* actions → keep *shift* only
2. Phase 4 LLM call → ship the weekly report with **rule-based** insights instead (e.g. "You spent 12% of focus time in Q2 this week, down from 30%"). This is honestly a decent fallback and still demos well.
3. JSON import (keep export — export is a data-safety feature, import is a convenience)
4. The energy rating prompt (§4) — last resort only, since the capture cannot be backfilled later

**Never cut:** deployment, PWA installability, the test suite, or visual polish. These are the S-criteria.

---

## 8. Data Model

IndexedDB via Dexie. Schema is versioned from v1 — every phase that changes the schema adds a numbered migration, never an in-place edit.

```ts
// db.ts
export interface Session {
  id: string;
  type: 'focus' | 'shortBreak' | 'longBreak';
  startedAt: number;              // epoch ms
  endedAt: number;
  plannedDurationSec: number;
  actualDurationSec: number;
  status: 'completed' | 'abandoned';
  taskId?: string;
  blockId?: string;               // Phase 3
  energy?: 1 | 2 | 3;             // captured in v1, surfaced post-v1 (see §4)
}

export interface Task {
  id: string;
  title: string;
  categoryId: string;
  urgent: boolean;                // Eisenhower axis 1
  important: boolean;             // Eisenhower axis 2
  difficulty: 1 | 2 | 3;
  estimatedPomodoros?: number;    // sizes Phase 3 blocks; not reported on in v1
  completedAt?: number;
  createdAt: number;
  archivedAt?: number;            // soft delete — preserves report history
}

export interface Category {
  id: string;
  name: string;                   // preset-seeded on first run
  color: string;
  isPreset: boolean;
}

export interface DayPlan {
  id: string;
  date: string;                   // 'YYYY-MM-DD', local timezone
  createdAt: number;
}

export interface Block {
  id: string;
  dayPlanId: string;
  title: string;
  taskId?: string;
  plannedStart: number;
  plannedEnd: number;
  actualStart?: number;
  actualEnd?: number;
  status: 'pending' | 'active' | 'done' | 'skipped';
  order: number;
}

export interface Adjustment {
  id: string;
  dayPlanId: string;
  blockId?: string;
  type: 'shift' | 'reschedule' | 'drop';
  deltaMinutes: number;
  reason?: string;
  createdAt: number;
}

export interface Insight {
  id: string;
  weekOf: string;                 // 'YYYY-MM-DD' of Monday
  generatedAt: number;
  model: string;
  promptSnapshot: string;         // for debugging and transparency
  contentMarkdown: string;
}

export interface Settings {
  id: 'singleton';
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  cyclesBeforeLongBreak: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  llmProvider?: 'anthropic' | 'openai';
  llmApiKey?: string;
  shareTaskTitlesWithLLM: boolean;   // default false
}
```

**Preset categories (seeded on first run):** Deep Work, Learning, Admin, Communication, Creative, Personal.

**Design notes**
- `Task.archivedAt` instead of hard delete — deleting a task must never corrupt historical reports.
- `Session.energy` is write-only in v1 — stored, never read. It is optional, so any future aggregation must handle `undefined` across the whole history.
- All dates for grouping use `YYYY-MM-DD` in **local** time. Store instants as epoch ms; convert at the boundary. This is the single most common source of bugs in this kind of app — write the date-key helper first and test it.

---

## 9. Architecture Decisions

**ADR-1 — Next.js App Router over Vite**
Accepted, with eyes open. The app is client-rendered in practice; Next.js is chosen for the Phase 4 API proxy route, the future sync path, and resume relevance. Do not force RSC patterns where they add no value. Most components will be `"use client"`, and that's correct here.

**ADR-2 — Dexie + `useLiveQuery` as the state layer**
No Redux/Zustand for persisted domain data. IndexedDB is the single source of truth; `useLiveQuery` gives reactive reads. Local component state via `useState`/`useReducer` only for ephemeral UI. This avoids a whole class of cache-invalidation bugs.

**ADR-3 — Timestamp-based timer, not interval-counting**
Persist `endsAt` as an absolute epoch timestamp. `setInterval` only drives the visual countdown; it is never the source of truth. On tab focus, visibility change, or mount, recompute from `Date.now()`. Browsers throttle background timers aggressively — an interval-counting timer will silently drift or freeze. This is non-negotiable and is the subject of a required test.

**ADR-4 — BYOK via a Next.js Route Handler proxy**
The key is stored client-side in IndexedDB and sent in the request body to `app/api/insight/route.ts`, which forwards it to the provider and returns the response. The key is never persisted, logged, or cached server-side. Rationale: avoids browser CORS restrictions, keeps the key out of client-side network logs on third-party domains, and allows provider-swapping behind one interface. Document this clearly in the UI and the README — the transparency is part of the portfolio value.

**ADR-5 — One theme, executed well**
iOS-inspired glass/translucency, dark base. No light/dark toggle in v1. Rationale: a single, confidently-executed aesthetic reads as intentional design; a half-tuned toggle reads as an unfinished setting.

---

## 10. Design Direction

Given the industrial design background, visual execution is a deliberate differentiator, not an afterthought. The bar: *a stranger should not be able to identify the component library.*

**Aesthetic:** iOS-style glass — layered translucency, soft depth, restrained color.

**Concrete direction**
- **Surface:** `backdrop-filter: blur(20px)` over a subtly gradient dark background; card backgrounds at ~8–12% white with a 1px ~18% white top-edge highlight to imply a light source. Depth comes from layering and edge light, never from heavy drop shadows.
- **Color:** one saturated accent (choose and commit — e.g. a warm amber for focus, cool teal for break) against a near-monochrome field. Category colors are the only other chroma, kept desaturated so they never compete with the timer.
- **Type:** override shadcn's default stack. A geometric or humanist sans with real character (Inter is the safe default and is *also* the giveaway — consider Geist, Satoshi, or General Sans). Tabular numerals are mandatory for the countdown, or the digits will visibly jitter.
- **The timer is the hero.** Oversized, generous negative space, minimal chrome. Everything else in the app is secondary furniture.
- **Motion:** transitions in the 150–250ms range with eased curves. Animate the state *transitions* (start, pause, complete) — never a continuously animating element during a focus session. The screen must be calm while the user is working; that is a functional requirement, not a stylistic one.
- **Reduced motion:** respect `prefers-reduced-motion` throughout.

**Practical approach:** use shadcn/ui for behavior and accessibility (dialogs, popovers, selects, focus management), then restyle surfaces via CSS variables. Take the a11y for free; discard the default look.

---

## 11. Testing Strategy

The stated learning goal is TDD plus first-time Playwright. The strategy below makes TDD viable where it genuinely pays and pragmatic where it doesn't.

### Test pyramid

| Layer | Tool | Approach | Coverage target |
|---|---|---|---|
| Pure logic (`/lib`) | Vitest | **Strict TDD — test first, always** | ≥80% lines, 100% on the timer state machine |
| Data access (`/lib/db`) | Vitest + `fake-indexeddb` | Tests after implementation | Critical paths only |
| Components | Vitest + React Testing Library | Tests after; behavior not markup | No numeric target |
| End-to-end | Playwright | Written at each phase gate | 4–6 flows |

### What gets strict TDD
These are pure functions with clear inputs and outputs — ideal TDD targets, and they're where the actual bugs live:
- Timer state machine transitions
- Session aggregation (by day, category, quadrant)
- Streak calculation
- Local date-key derivation and timezone boundary handling
- The Phase 3 block-shift algorithm
- The Phase 4 prompt builder

### What does not get TDD
Component rendering and layout. Writing a failing test for a `<div>` you haven't designed yet is theater. Build the component, then write RTL tests for its *behavior* (clicking start begins the countdown; abandoning shows a confirm dialog).

### Playwright flows (write one per phase gate)
1. Start a focus session → wait → verify completion and history entry *(use clock mocking, not real waiting)*
2. Complete a session → attach a task retroactively → verify it appears in the daily report
3. Create a day plan → shift the schedule → verify the adjustment is logged
4. Open settings → change focus duration → verify the timer reflects it
5. *(if Phase 4 ships)* Open insight with no API key → verify the graceful empty state

Use Playwright's clock API to control time rather than waiting in real time — otherwise the suite becomes unusably slow and flaky.

### CI
GitHub Actions on every push: typecheck → lint → Vitest → build → Playwright. A red pipeline blocks the phase gate. Setting this up in Week 1 costs about an hour and saves several.

---

## 12. Week-by-Week Milestones

Each week ends with: all acceptance criteria passing, a green CI pipeline, a git tag, a Vercel deploy, and a screenshot or GIF added to the README.

### Week 1 — Foundation & Timer
| Day | Focus |
|---|---|
| 1 | Scaffold: Next.js + TS + Tailwind + shadcn + Vitest + Playwright + GitHub Actions. Dexie schema v1. Deploy an empty shell to Vercel **on day one** — never leave deployment to the end. |
| 2 | Timer state machine, TDD, no UI. Pure logic only. |
| 3 | Timer UI + persistence + refresh/background recovery. |
| 4 | Notifications, sound, settings screen. |
| 5 | PWA manifest and service worker; Lighthouse pass. |
| 6 | Design pass on the timer screen — this is the hero, give it real time. |
| 7 | Playwright flow #1, buffer, **tag `v0.1`**. |

### Week 2 — Tasks & Daily Report
| Day | Focus |
|---|---|
| 1 | Schema v2 (tasks, categories); seed presets; task CRUD logic TDD. |
| 2 | Task list and creation UI. |
| 3 | Retroactive attribution flow + energy rating capture. |
| 4 | Aggregation functions, TDD, including all edge cases. |
| 5 | Daily report UI and charts. |
| 6 | Design pass + empty states. |
| 7 | Playwright flow #2, **tag `v0.2`**. |

### Week 3 — Schedule Assistant ⚠️
| Day | Focus |
|---|---|
| 1 | Schema v3 (dayPlans, blocks, adjustments); shift algorithm TDD. |
| 2 | Day plan builder UI. |
| 3 | Live tracking and drift display. |
| 4 | **Mid-week checkpoint — apply the Phase 3 cut line if behind.** Adjustment actions. |
| 5 | Nudge notifications; plan-vs-actual view. |
| 6 | Design pass. |
| 7 | Playwright flow #3, **tag `v0.3`**. |

### Week 4 — Insight & Polish
| Day | Focus |
|---|---|
| 1 | Weekly aggregation TDD; BYOK settings screen. |
| 2 | API proxy route; prompt builder TDD. |
| 3 | Insight UI and all failure states. |
| 4 | Weekly report visuals. |
| 5 | JSON export/import; full accessibility pass (keyboard nav, focus rings, contrast). |
| 6 | **README, screenshots, architecture write-up, demo GIF.** Treat this as a deliverable, not a chore — for a portfolio project, the README is the first thing a hiring manager reads. |
| 7 | Buffer, final Playwright flows, **tag `v1.0`**. |

---

## 13. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Background notifications are unreliable, especially on iOS.** iOS requires the PWA be installed to the home screen (16.4+), and background execution is heavily throttled. A service worker cannot be relied on to fire a timer notification when the app is fully closed. | High | Medium | Do not promise background notifications. Scope: notifications fire reliably when the app is open or backgrounded-but-alive. On resume, reconcile against `endsAt` and show a "session completed while you were away" state. Document the limitation honestly in the README — *understanding* this constraint is itself a good interview answer. |
| R2 | **Job search consumes the schedule.** Interviews are unpredictable and take priority. | High | High | The cut lines in §7 exist for this. Cut scope, never cut the phase gate. A tagged, deployed `v0.2` is infinitely better than an untagged `v0.4` on a local branch. |
| R3 | **Phase 3 scope creep.** "Schedule assistant" invites endless features — recurring templates, calendar sync, drag-to-resize blocks. | High | High | The §5 out-of-scope list is binding. Any new Phase 3 idea goes in the backlog file, not the sprint. |
| R4 | **TDD slows early velocity.** TDD has a real learning curve and Week 1 will feel slow. | Medium | Medium | Restrict strict TDD to pure logic, as specified. Do not TDD components. Expect Week 1 to feel slow and Week 3 to feel fast — that's the payoff curve. |
| R5 | **Timezone and DST bugs** in date grouping. | Medium | High | Write and test the date-key helper on day one of Week 2, before any aggregation depends on it. Include a DST-transition test fixture. |
| R6 | **Playwright learning curve** as a first-time user. | Medium | Low | Write flow #1 in Week 1 while the app is trivially simple. Learning the tool on a two-button UI is far easier than on a full app in Week 4. |
| R7 | **Design polish deferred to the end** and then cut. | Medium | High | Design passes are scheduled *within* each week (day 6), not batched at the end. S5 is a success criterion, not a nice-to-have. |

---

## 14. Definition of Done (per feature)

A feature is not done until all of the following are true:

- [ ] Types are explicit; no `any`
- [ ] Pure logic has passing unit tests written before the implementation
- [ ] Component behavior has RTL coverage
- [ ] Empty, loading, and error states are all implemented
- [ ] Keyboard accessible; visible focus states
- [ ] `prefers-reduced-motion` respected
- [ ] Works offline
- [ ] Verified on mobile viewport
- [ ] CI green
- [ ] Deployed to Vercel

---

## 15. Post-v1 Backlog

Ordered by expected value, for whenever this continues:

1. **Data export/import hardening** — the mitigation for local-only storage risk
2. **Custom categories**
3. **Accounts + optional cloud sync** — the natural showcase for Next.js server features that v1 deliberately doesn't use. Route Handlers, Server Actions, Postgres. This is the phase that makes the Next.js choice pay off.
4. **Recurring routine templates**
5. **Google Calendar import**
6. **Energy-based scheduling** — peak-window detection from the energy data v1 has been quietly collecting, feeding into block suggestions. Cheap to build once the history exists.
7. **Longer-horizon trend analysis** (monthly, quarterly)
8. **Light theme**
9. **i18n** (English / Traditional Chinese)

---

## Appendix A — Recommended Stack

| Concern | Choice | Note |
|---|---|---|
| Framework | Next.js 15, App Router | ADR-1 |
| Language | TypeScript, `strict: true` | |
| Styling | Tailwind CSS v4 | |
| Components | shadcn/ui | Behavior and a11y only; restyle surfaces |
| Persistence | Dexie + `dexie-react-hooks` | ADR-2 |
| Charts | Recharts | Lightweight; sufficient for report views |
| Unit / integration | Vitest + React Testing Library | |
| IndexedDB in tests | `fake-indexeddb` | |
| E2E | Playwright | Use the clock API for time control |
| PWA | `@serwist/next` | Better maintained than `next-pwa` |
| Dates | `date-fns` | Avoid Moment; consider Temporal only when stable |
| Hosting | Vercel | |
| CI | GitHub Actions | |

---

## Appendix B — Open Questions

Resolve before or during Week 1:

1. **Product name.** "Cadence" is a placeholder. Decide before the README is written.
2. **Accent color and typeface.** Commit in Week 1 — these anchor every subsequent design pass.
3. **LLM provider for BYOK v1.** Recommend supporting one provider well at launch rather than two adequately.
4. **Does a break session interrupt a block in Phase 3?** Suggested answer: no — breaks are inside the block, not separate from it.
5. **What happens to an unfinished day plan at midnight?** Suggested answer: it is frozen as-is; unfinished blocks are marked `skipped` and remain visible in the report, since unfinished plans are exactly the data Phase 4 needs.
