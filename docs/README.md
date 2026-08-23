# VarTick — Project Documentation

A local-first productivity companion that starts as a Pomodoro timer and grows into a schedule assistant.

**Thesis:** most productivity apps track what you planned. VarTick tracks the _variance_ — the gap between what you planned and what actually happened, and why.

**The name:** _variance_ + _tick-tock_. Variance is the statistical term for deviation from an expected value, which is precisely the metric the product exists to surface. The camelCase is deliberate: it reads as a JavaScript identifier, which is the joke.

|                      |                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------- |
| **Owner / Engineer** | Shan-Yu Chou (solo)                                                                           |
| **Duration**         | 4 weeks                                                                                       |
| **Budget**           | Mon–Fri, ~2–3 hrs/day (~10–15 hrs/week, ~45–60 hrs total). Weekends are reserve, not schedule |
| **Status**           | Scope baseline v1.0 — approved                                                                |
| **Deploy target**    | Vercel, public URL                                                                            |

---

## The documents

| File                                     | Answers                                                               | Read when                                        |
| ---------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------ |
| **[product.md](./product.md)**           | _What are we building, and what are we deliberately not building?_    | Starting out; whenever tempted to add a feature  |
| **[roadmap.md](./roadmap.md)**           | _What ships this week, and what gets cut first when time runs short?_ | Start of each week; whenever behind schedule     |
| **[architecture.md](./architecture.md)** | _What is the schema, and why is it shaped this way?_                  | Before writing anything that touches persistence |
| **[testing.md](./testing.md)**           | _What gets TDD, what gets tested after, what gets E2E?_               | Before writing the first test of a feature       |
| **[design.md](./design.md)**             | _What should this look and feel like?_                                | During each week's design pass                   |
| **[backlog.md](./backlog.md)**           | _Where do good ideas go that aren't in v1?_                           | Constantly — this is the pressure valve          |
| **[workflow.md](./workflow.md)**         | _What branch name / commit message do I use?_                         | Before creating any branch or commit             |

---

## Which file do I update?

Keeping these correct is what makes the set worth having. When something changes:

| Change                                 | Update                                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| Decided a feature is in or out of v1   | `product.md` (Scope)                                                  |
| Fell behind and need to drop something | `roadmap.md` (Cut Lines) — **do not silently descope**                |
| Made a non-obvious technical choice    | `architecture.md` — add the next `ADR-N`                              |
| Changed the schema                     | `architecture.md` (Data Model) — add a numbered Dexie migration       |
| Had an idea you can't build now        | `backlog.md` — takes ten seconds, keeps the sprint clean              |
| Resolved an open question              | `backlog.md` (Open Questions) → move the answer into the relevant doc |

**Rule of thumb:** if a decision took more than five minutes of thought, write down the reasoning, not just the conclusion. The reasoning is what you'll want in an interview six months from now — and what you'll want when you disagree with your past self in week 3.

---

## Stable reference IDs

These IDs are referenced across documents and should not be renumbered. Append new ones; never reuse a retired number.

| Prefix          | Meaning                | Lives in                                                    |
| --------------- | ---------------------- | ----------------------------------------------------------- |
| `S1`–`S6`       | Success criteria       | [product.md](./product.md#success-criteria)                 |
| `C1`–`C7`       | Constraints            | [product.md](./product.md#constraints)                      |
| `ADR-1`–`ADR-5` | Architecture decisions | [architecture.md](./architecture.md#architecture-decisions) |
| `R1`–`R7`       | Risks                  | [roadmap.md](./roadmap.md#risk-register)                    |

---

## Phase overview

Full acceptance criteria in [roadmap.md](./roadmap.md). Each phase ends with a git tag, a Vercel deploy, and a screenshot in the root README.

| Phase                     | Week | Ships                                               | Tag    |
| ------------------------- | ---- | --------------------------------------------------- | ------ |
| 1 — Focus Timer           | 1    | Working, installable Pomodoro timer at a public URL | `v0.1` |
| 2 — Tasks & Daily Report  | 2    | "Here's where my day actually went"                 | `v0.2` |
| 3 — Schedule Assistant ⚠️ | 3    | Plan a day, track drift, record adjustments         | `v0.3` |
| 4 — Weekly Insight        | 4    | BYOK LLM recommendations grounded in real data      | `v1.0` |

⚠️ Phase 3 is the highest-risk phase and has a mid-week cut line.

---

## Ground rules

1. **Deploy on day one.** An empty shell on Vercel in week 1 beats a perfect app that has never been deployed.
2. **The phase gate is not negotiable; the scope inside it is.** A tagged, deployed `v0.2` beats an untagged `v0.4` on a local branch.
3. **Design passes are scheduled inside each week**, never batched at the end — that's how polish gets cut (risk R7).
4. **Strict TDD on pure logic only.** Do not TDD components; see [testing.md](./testing.md).
5. **When an idea arrives mid-build, it goes in `backlog.md`.** Not the sprint.
