# Architecture & Data Model

> The schema and the decisions behind it. **Read before writing code that touches persistence.**
> Testing conventions live in [testing.md](./testing.md) · visual direction in [design.md](./design.md)

← [Docs index](./README.md)

---

## Data Model

IndexedDB via Dexie. Schema is versioned from v1 — every phase that changes the schema adds a numbered migration, never an in-place edit.

```ts
// db.ts
export interface Session {
  id: string
  type: "focus" | "shortBreak" | "longBreak"
  startedAt: number // epoch ms
  endedAt: number
  plannedDurationSec: number
  actualDurationSec: number
  status: "completed" | "abandoned"
  taskId?: string
  blockId?: string // Phase 3
  energy?: 1 | 2 | 3 // captured in v1, surfaced post-v1
}

export interface Task {
  id: string
  title: string
  categoryId: string
  urgent: boolean // Eisenhower axis 1
  important: boolean // Eisenhower axis 2
  difficulty: 1 | 2 | 3
  estimatedPomodoros?: number // sizes Phase 3 blocks; not reported on in v1
  completedAt?: number
  createdAt: number
  archivedAt?: number // soft delete — preserves report history
}

export interface Category {
  id: string
  name: string // preset-seeded on first run
  color: string
  isPreset: boolean
}

export interface DayPlan {
  id: string
  date: string // 'YYYY-MM-DD', local timezone
  createdAt: number
}

export interface Block {
  id: string
  dayPlanId: string
  title: string
  taskId?: string
  plannedStart: number
  plannedEnd: number
  actualStart?: number
  actualEnd?: number
  status: "pending" | "active" | "done" | "skipped"
  order: number
}

export interface Adjustment {
  id: string
  dayPlanId: string
  blockId?: string
  type: "shift" | "reschedule" | "drop"
  deltaMinutes: number
  reason?: string
  createdAt: number
}

export interface Insight {
  id: string
  weekOf: string // 'YYYY-MM-DD' of Monday
  generatedAt: number
  model: string
  promptSnapshot: string // for debugging and transparency
  contentMarkdown: string
}

export interface Settings {
  id: "singleton"
  focusMin: number
  shortBreakMin: number
  longBreakMin: number
  cyclesBeforeLongBreak: number
  soundEnabled: boolean
  notificationsEnabled: boolean
  llmProvider?: "openai" | "anthropic" | "google" | "xai"
  llmApiKey?: string
  shareTaskTitlesWithLLM: boolean // default false
}
```

**Preset categories (seeded on first run):** Deep Work, Learning, Admin, Communication, Creative, Personal.

**Design notes**

- `Task.archivedAt` instead of hard delete — deleting a task must never corrupt historical reports.
- `Session.energy` is write-only in v1 — stored, never read. It is optional, so any future aggregation must handle `undefined` across the whole history.
- All dates for grouping use `YYYY-MM-DD` in **local** time. Store instants as epoch ms; convert at the boundary. This is the single most common source of bugs in this kind of app — write the date-key helper first and test it.

---

## Architecture Decisions

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

**ADR-6 — Provider adapter interface, three shapes for four providers**
BYOK supports OpenAI (GPT), Anthropic (Claude), Google (Gemini), and xAI (Grok) behind a single `InsightProvider` interface: `buildRequest(aggregates, key)` → `parseResponse(raw)` → normalized `Insight`. The proxy route (ADR-4) selects an adapter by `Settings.llmProvider` and knows nothing about provider specifics.

**Four providers cost three adapters, not four.** xAI's API is OpenAI-compatible, so one OpenAI-shaped adapter covers both GPT and Grok with only a base-URL swap. Anthropic and Google each need their own request/response shape. _(Verify xAI compatibility at build time — this is current as of writing but is the kind of thing that changes.)_

Build order is by value-per-hour: **OpenAI-compatible first** (two providers for one adapter), then Anthropic, then Google. Each adapter is a pure function pair and is unit-tested against recorded fixture responses — no live API calls in the test suite.

Rationale: the adapter boundary is the architecturally interesting part and the part worth talking about in an interview. It also means dropping a provider under time pressure costs nothing structural — see the cut lines in [roadmap.md](./roadmap.md#cut-lines).
---

## Recommended Stack

| Concern            | Choice                         | Note                                             |
| ------------------ | ------------------------------ | ------------------------------------------------ |
| Framework          | Next.js 15, App Router         | ADR-1                                            |
| Language           | TypeScript, `strict: true`     |                                                  |
| Styling            | Tailwind CSS v4                |                                                  |
| Components         | shadcn/ui                      | Behavior and a11y only; restyle surfaces         |
| Persistence        | Dexie + `dexie-react-hooks`    | ADR-2                                            |
| Charts             | Recharts                       | Lightweight; sufficient for report views         |
| Unit / integration | Vitest + React Testing Library |                                                  |
| IndexedDB in tests | `fake-indexeddb`               |                                                  |
| E2E                | Playwright                     | Use the clock API for time control               |
| PWA                | `@serwist/next`                | Better maintained than `next-pwa`                |
| Dates              | `date-fns`                     | Avoid Moment; consider Temporal only when stable |
| Hosting            | Vercel                         |                                                  |
| CI                 | GitHub Actions                 |                                                  |
