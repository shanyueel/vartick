# Roadmap & Delivery Plan

> Phase gates, cut lines, weekly milestones, and risks. **This is the document that says when.**
> Scope authority lives in [product.md](./product.md)

← [Docs index](./README.md)

---

## Phase Definitions & Acceptance Criteria

Each phase is a **gate**. Do not begin the next phase until the current phase's criteria all pass. Each gate ends with a git tag and a deploy.

---

### Phase 1 — Focus Timer (Week 1)

> _Demoable outcome: a working, installable Pomodoro timer at a public URL._

**Scope**

- Timer state machine: `idle → running → paused → running → completed`, plus `abandoned`
- Three session types: focus (25m), short break (5m), long break (15m); long break after every 4 focus sessions
- Durations configurable in settings
- Every session persisted to IndexedDB on completion _and_ on abandonment
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
- [x] Timer state machine has 100% branch coverage in Vitest, written test-first
- [ ] Deployed and reachable at a public URL

---

### Phase 2 — Tasks & Daily Report (Week 2)

> _Demoable outcome: "here's where my day actually went," with real data._

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

### Phase 3 — Schedule Assistant (Week 3) ⚠️ _highest risk phase_

> _Demoable outcome: plan a day, watch reality diverge, and record why._

**Scope**

- Day plan: an ordered list of blocks for a given date
- Block: title, optional linked task, planned start/end
- Build tomorrow's plan from existing tasks
- **Live tracking:** the current block is highlighted against wall-clock time; drift is shown
- **Adjustment actions** when running behind:
  - _Shift_ — push all remaining blocks by N minutes
  - _Reschedule_ — move one block to a later slot
  - _Drop_ — remove a block from today
- Every adjustment writes an `adjustments` row with type, delta, affected block, and optional reason
- Nudges: notification at block start, and at 5 minutes before planned block end
- Plan-vs-actual view appended to the daily report

**Acceptance criteria**

- [ ] The shift algorithm is pure, test-first, and handles: overlapping blocks, shifting past midnight, shifting a block that has already started, and shifting when no blocks remain
- [ ] Every adjustment appears in the day's history with a human-readable description
- [ ] Deleting a task that is linked to a block does not orphan or crash the block
- [ ] Plan-vs-actual correctly handles a block that was never started
- [ ] Nudge notifications fire within ±60s of the target time while the app is open

**Cut line for Phase 3:** if Week 3 is running behind at its midpoint, ship _shift_ only and defer _reschedule_ and _drop_ to the backlog. A working shift action plus adjustment logging satisfies the data requirement for Phase 4; the other two are conveniences.

---

### Phase 4 — Weekly Insight (Week 4)

> _Demoable outcome: paste your API key, get grounded advice about your own week._

**Scope**

- BYOK setup screen: provider selection (OpenAI / Anthropic / Google / xAI), API key input, key stored in IndexedDB only, connection test button, clear warning about what is sent
- Provider adapter layer per ADR-6 — three adapters covering four providers
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
- [ ] **At least two providers work end-to-end**, one of which is OpenAI-compatible — the remaining two are desirable, not required (see Cut Lines)
- [ ] Each adapter is unit-tested against recorded fixture responses; no test makes a live API call
- [ ] Switching provider in settings requires no code change outside the adapter registry
- [ ] The feature is fully skippable: a user with no API key can use every other part of the app with no nagging

---

## Cut Lines

When time runs short, cut in exactly this order. Do not improvise.

1. Phase 3 _reschedule_ and _drop_ actions → keep _shift_ only
2. **LLM providers beyond two.** Ship the OpenAI-compatible adapter (covers GPT and Grok) plus one other; drop the rest. The adapter interface stays, so adding them later is roughly 90 minutes each
3. Phase 4 LLM call → ship the weekly report with **rule-based** insights instead (e.g. "You spent 12% of focus time in Q2 this week, down from 30%"). This is honestly a decent fallback and still demos well.
4. JSON import (keep export — export is a data-safety feature, import is a convenience)
5. The energy rating capture ([product.md](./product.md)) — last resort only, since the capture cannot be backfilled later

**Never cut:** deployment, PWA installability, the test suite, or visual polish. These are the S-criteria.

---

## Week-by-Week Milestones

**Working rhythm:** Monday–Friday, ~2–3 hrs/day. Saturday and Sunday are **reserve, not schedule** — they exist to absorb slippage, not to hold planned work.

Each week ends Friday with: all acceptance criteria passing, a green CI pipeline, a git tag, a Vercel deploy, and a screenshot or GIF added to the root README.

> **Capacity note.** Five working days gives 20 weekday slots across the project, against 28 in the original 7-day plan — roughly 29% less scheduled time. The plan absorbs this by moving the _lowest-priority_ item of each week into weekend reserve rather than by compressing every day. If a weekend goes unused (which is the intent), those items roll into the following Monday. If two consecutive weekends go unused **and** reserve items are still outstanding, that is the signal to apply a cut line — not to work a third weekend.

**Two scheduling rules, both deliberate:**

- **Friday is the gate day.** Tag, deploy, screenshot. Never start new feature work on a Friday.
- **The design pass sits on Friday, inside the week.** Batching polish at the end of the project is exactly how it gets cut (risk R7).

---

### Week 1 — Foundation & Timer

| Day               | Focus                                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mon**           | Scaffold: Next.js + TS + Tailwind + shadcn + Vitest + Playwright + GitHub Actions. Dexie schema v1. **Deploy an empty shell to Vercel today** — never leave deployment to the end. |
| **Tue**           | Timer state machine, TDD, pure logic only. No UI.                                                                                                                                  |
| **Wed**           | Timer UI + persistence + refresh/background recovery (ADR-3).                                                                                                                      |
| **Thu**           | Notifications, sound, settings screen.                                                                                                                                             |
| **Fri**           | Design pass on the timer hero — this is the app's face, give it real time. **Tag `v0.1`, deploy.**                                                                                 |
| _Weekend reserve_ | PWA manifest + service worker + Lighthouse pass; Playwright flow #1.                                                                                                               |

⚠️ Week 1 is the only week whose reserve holds work required by a success criterion (S1, installable PWA). If the weekend goes unused, **PWA setup moves to Week 2 Monday** — do not let it drift past that, since every later week is tighter.

---

### Week 2 — Tasks & Daily Report

| Day               | Focus                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mon**           | Any Week 1 carry-over. Schema v2 (tasks, categories); seed presets. **Date-key helper + DST tests first** (risk R5) — every aggregation depends on it. |
| **Tue**           | Task CRUD logic TDD; task list and creation UI.                                                                                                        |
| **Wed**           | Retroactive attribution flow + energy capture.                                                                                                         |
| **Thu**           | Aggregation functions, TDD, including empty day / midnight-crossing / all-abandoned edge cases.                                                        |
| **Fri**           | Daily report UI and charts; empty states; design pass. **Tag `v0.2`, deploy.**                                                                         |
| _Weekend reserve_ | Playwright flow #2.                                                                                                                                    |

---

### Week 3 — Schedule Assistant ⚠️

| Day               | Focus                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Mon**           | Schema v3 (dayPlans, blocks, adjustments); shift algorithm TDD.                                                    |
| **Tue**           | Day plan builder UI.                                                                                               |
| **Wed**           | Live tracking and drift display. **Midweek checkpoint — apply the Phase 3 cut line now if behind, not on Friday.** |
| **Thu**           | Adjustment actions — _shift_ first and always; _reschedule_ and _drop_ only if Wednesday finished clean.           |
| **Fri**           | Nudge notifications; plan-vs-actual view; design pass. **Tag `v0.3`, deploy.**                                     |
| _Weekend reserve_ | Playwright flow #3.                                                                                                |

This is the highest-risk week (R3). The cut line exists precisely because this phase invites scope creep — use it on Wednesday rather than negotiating with yourself on Friday.

---

### Week 4 — Insight & Polish

| Day               | Focus                                                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mon**           | Weekly aggregation TDD; BYOK settings screen.                                                                                                                                                                       |
| **Tue**           | API proxy route (ADR-4); OpenAI-compatible adapter (covers GPT + Grok); prompt builder TDD.                                                                                                                         |
| **Wed**           | Second adapter; insight UI and all failure states.                                                                                                                                                                  |
| **Thu**           | Weekly report visuals; JSON export; full accessibility pass (keyboard nav, focus rings, contrast, CVD check per [design.md](./design.md#palette)).                                                                  |
| **Fri**           | **Root README, screenshots, architecture write-up, demo GIF** — a deliverable, not a chore; for a portfolio project this is the first thing a hiring manager reads. Final Playwright flows. **Tag `v1.0`, deploy.** |
| _Weekend reserve_ | Third and fourth LLM adapters; JSON import.                                                                                                                                                                         |

Week 4 holds the least slack of the four. If Week 3 overran, apply cut lines 2 and 3 on **Monday** — shipping two providers and a polished README beats four providers and no demo GIF.

---

## Risk Register

| ID  | Risk                                                                                                                                                                                                                                                                         | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Background notifications are unreliable, especially on iOS.** iOS requires the PWA be installed to the home screen (16.4+), and background execution is heavily throttled. A service worker cannot be relied on to fire a timer notification when the app is fully closed. | High       | Medium | Do not promise background notifications. Scope: notifications fire reliably when the app is open or backgrounded-but-alive. On resume, reconcile against `endsAt` and show a "session completed while you were away" state. Document the limitation honestly in the README — _understanding_ this constraint is itself a good interview answer. |
| R2  | **Job search consumes the schedule.** Interviews are unpredictable and take priority.                                                                                                                                                                                        | High       | High   | The cut lines in this document exist for this. Cut scope, never cut the phase gate. A tagged, deployed `v0.2` is infinitely better than an untagged `v0.4` on a local branch.                                                                                                                                                                   |
| R3  | **Phase 3 scope creep.** "Schedule assistant" invites endless features — recurring templates, calendar sync, drag-to-resize blocks.                                                                                                                                          | High       | High   | The out-of-scope list in [product.md](./product.md#scope) is binding. Any new Phase 3 idea goes in the backlog file, not the sprint.                                                                                                                                                                                                            |
| R4  | **TDD slows early velocity.** TDD has a real learning curve and Week 1 will feel slow.                                                                                                                                                                                       | Medium     | Medium | Restrict strict TDD to pure logic, as specified. Do not TDD components. Expect Week 1 to feel slow and Week 3 to feel fast — that's the payoff curve.                                                                                                                                                                                           |
| R5  | **Timezone and DST bugs** in date grouping.                                                                                                                                                                                                                                  | Medium     | High   | Write and test the date-key helper on day one of Week 2, before any aggregation depends on it. Include a DST-transition test fixture.                                                                                                                                                                                                           |
| R6  | **Playwright learning curve** as a first-time user.                                                                                                                                                                                                                          | Medium     | Low    | Write flow #1 in Week 1 while the app is trivially simple. Learning the tool on a two-button UI is far easier than on a full app in Week 4.                                                                                                                                                                                                     |
| R7  | **Design polish deferred to the end** and then cut.                                                                                                                                                                                                                          | Medium     | High   | Design passes are scheduled _within_ each week (Friday, before the tag), not batched at the end. S5 is a success criterion, not a nice-to-have.                                                                                                                                                                                                 |
