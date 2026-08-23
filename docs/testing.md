# Testing Strategy

> How and what to test. **The Definition of Done in [product.md](./product.md#definition-of-done-per-feature) is the gate; this document is the method.**

← [Docs index](./README.md)

---

The stated learning goal is TDD plus first-time Playwright. The strategy below makes TDD viable where it genuinely pays and pragmatic where it doesn't.

### Test pyramid

| Layer                   | Tool                           | Approach                            | Coverage target                             |
| ----------------------- | ------------------------------ | ----------------------------------- | ------------------------------------------- |
| Pure logic (`/lib`)     | Vitest                         | **Strict TDD — test first, always** | ≥80% lines, 100% on the timer state machine |
| Data access (`/lib/db`) | Vitest + `fake-indexeddb`      | Tests after implementation          | Critical paths only                         |
| Components              | Vitest + React Testing Library | Tests after; behavior not markup    | No numeric target                           |
| End-to-end              | Playwright                     | Written at each phase gate          | 4–6 flows                                   |

### What gets strict TDD

These are pure functions with clear inputs and outputs — ideal TDD targets, and they're where the actual bugs live:

- Timer state machine transitions
- Session aggregation (by day, category, quadrant)
- Streak calculation
- Local date-key derivation and timezone boundary handling
- The Phase 3 block-shift algorithm
- The Phase 4 prompt builder

### What does not get TDD

Component rendering and layout. Writing a failing test for a `<div>` you haven't designed yet is theater. Build the component, then write RTL tests for its _behavior_ (clicking start begins the countdown; abandoning shows a confirm dialog).

### Playwright flows (write one per phase gate)

1. Start a focus session → wait → verify completion and history entry _(use clock mocking, not real waiting)_
2. Complete a session → attach a task retroactively → verify it appears in the daily report
3. Create a day plan → shift the schedule → verify the adjustment is logged
4. Open settings → change focus duration → verify the timer reflects it
5. _(if Phase 4 ships)_ Open insight with no API key → verify the graceful empty state

Use Playwright's clock API to control time rather than waiting in real time — otherwise the suite becomes unusably slow and flaky.

### CI

GitHub Actions on every push: typecheck → lint → Vitest → build → Playwright. A red pipeline blocks the phase gate. Setting this up in Week 1 costs about an hour and saves several.
