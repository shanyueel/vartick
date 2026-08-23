# Product Definition — VarTick

> Scope, purpose, and success criteria. **This is the document that says no.**
> Schedule lives in [roadmap.md](./roadmap.md) · technical decisions in [architecture.md](./architecture.md)

← [Docs index](./README.md)

---

## Product Thesis

Most productivity apps track **what you planned**. Almost none track **the gap between what you planned and what actually happened, and why.**

VarTick's differentiator is that every deviation is a first-class data point. When a user shifts a block because a meeting ran long, that adjustment is recorded — not silently overwritten. Four weeks of adjustment data is what makes the Phase 4 AI suggestions substantive instead of generic advice a fortune cookie could produce.

**One-line pitch:** *A Pomodoro timer that learns why your day never goes to plan.*

### Why this matters for the portfolio
Interviewers see dozens of Pomodoro clones. The defensible story here is: local-first architecture with IndexedDB, a real state machine, an offline-capable PWA, a BYOK LLM integration that never touches your wallet, and a test pyramid with genuine E2E coverage. The product thesis gives you something to *talk* about beyond the stack.

---

## Success Criteria

The project is a success if **all** of these are true at the end of Week 4:

| # | Criterion | Measurement |
|---|---|---|
| S1 | Publicly deployed and installable as a PWA | Live Vercel URL, passes Lighthouse PWA audit |
| S2 | The author uses it for his own work for ≥5 consecutive days | Self-reported; real session data in production |
| S3 | Phases 1 and 2 are fully shipped and polished | All acceptance criteria in [roadmap.md](./roadmap.md) met |
| S4 | Test suite is real, not decorative | ≥80% line coverage on `/lib`, ≥4 passing Playwright flows |
| S5 | Visually distinctive | A stranger would not guess it was built from a shadcn default template |
| S6 | Every phase produced something demoable | 4 tagged releases, 4 screenshots/GIFs in the README |

**Explicit non-goal:** shipping all four phases at the cost of S3 or S5. If time runs out, Phase 4 ships in a reduced form (see [Cut Lines](./roadmap.md#cut-lines)). A polished 3-phase app beats a rough 4-phase one — for both daily use and interviews.

---

## Constraints

Confirmed with the owner. These are binding — changing any of them invalidates parts of the plan downstream, so revisit [architecture.md](./architecture.md) before revising one.

**Delivery**
- **C1 — Solo developer, ~2–3 hrs/day, Monday–Friday only.** Weekends are reserve capacity for absorbing slippage, not scheduled working time. Runs concurrently with an active job search and LeetCode practice; assume at least 2–3 weekdays across the 4 weeks are lost entirely to interviews.
- **C2 — Zero infrastructure budget.** Vercel free tier, no paid database, no paid LLM inference.
- **C3 — No design resource** beyond the author.

**Product**
- **C4 — Local-only storage for v1.** No accounts, no server-side persistence, no sync. Losing browser storage means losing data; this is an accepted v1 tradeoff, mitigated by JSON export.
- **C5 — Single-user, single-device.** Multi-device sync is post-v1.
- **C6 — Bring-your-own LLM key.** The user supplies their own API key, so the product is free to operate at any user count.
- **C7 — Desktop-primary, mobile-companion.** Full planning and reporting are designed for desktop; mobile is optimized for running a session and glancing at progress. Mobile is not a reduced-feature version, but it is not where a day gets planned. See risk R1 in [roadmap.md](./roadmap.md#risk-register) for the notification limits this implies.

---

## Theory Foundation — how principles become features

The plan requires that each productivity theory maps to a concrete, testable feature. Theory that doesn't produce a feature is cut.

| Theory | Product implementation | Phase |
|---|---|---|
| **Pomodoro Technique** | 25/5/15 default cycle, long break after 4 focus sessions, abandoned sessions recorded rather than deleted (interruption tracking is core to the original method) | 1 |
| **Eisenhower Matrix** | Tasks carry `urgent` and `important` booleans → derived quadrant. Daily report surfaces "% of focus time spent in Q2 (important, not urgent)" as the headline productivity metric | 2 |
| **Time-Blocking** | Day plan composed of blocks with planned start/end. Plan-vs-actual is computed and visualized | 3 |

**Deferred: Energy Management.** Energy-based scheduling is deliberately out of v1 (see [Scope](#scope)). One exception: the app still *captures* a one-tap energy rating at session end, because this data cannot be backfilled — if capture ships in v1, the eventual peak-window feature launches with months of real history behind it instead of starting from zero. Capture only; no energy reporting, aggregation, or insight in v1.

**Removed: Parkinson's Law.** Estimate-vs-actual drift reporting was cut — it added a reporting surface without a clear user action attached to it.

**Design rule:** the Phase 4 AI must ground every suggestion in one of these named frameworks and cite the specific user data that triggered it. Suggestions without a data citation are considered a bug.

---

## Scope

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
- Recurring routine templates *(see risk R3 in [roadmap.md](./roadmap.md#risk-register) — the most likely scope creep vector)*
- Historical trend analysis beyond a 7-day window
- Energy-based scheduling insights — peak-window detection, energy heatmaps, energy-aware block suggestions *(capture only in v1; see [Theory Foundation](#theory-foundation--how-principles-become-features))*
- Estimate-vs-actual drift reporting
- Multi-language / i18n
- Dark/light theme toggle *(pick one theme and execute it well)*

---

## Definition of Done (per feature)

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
