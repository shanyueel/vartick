# Backlog & Open Questions

> The only high-churn document in this folder. **Every idea that is not in v1 scope goes here, not into the sprint.**
> Adding something here is free. Adding it to [product.md](./product.md#scope) requires a scope decision.

← [Docs index](./README.md)

---

## Resolved Decisions

Kept as a short log so the reasoning survives — useful when you disagree with your past self in week 3.

### Product name — **VarTick** _(resolved)_

_variance_ + _tick-tock_. **Variance** is the statistical term for deviation from an expected value, which is exactly the metric the product exists to surface; **tick** carries the timer. The camelCase is deliberate — it reads as a JavaScript identifier, which turns the one real objection to the name (`var` being a deprecated keyword) into an intentional in-joke rather than an accident.

Availability checked at time of decision: no software product or npm package holds the name. Only a Twitch handle, a Pinterest account, and a Ralph Lauren jeans style. No trademark conflict in software, and the term is distinctive enough to rank for immediately.

**Still to do before the root README ships:** register the `.app` / `.com` domain and the npm name if you want them reserved.

### Accent colours — **orange + green** _(resolved)_

Orange for focus, green for rest, drawn from the _Loki_ palette. Two accents rather than one, permitted because each carries a **state** rather than decoration.

Two constraints came with the decision, both recorded in [design.md](./design.md#palette): the green is shifted toward teal, because orange-vs-emerald is the worst possible pairing for red–green colour blindness and the two would be indistinguishable for ~8% of men; and the Marvel _names_ are not used anywhere in the repo, only the colours — colours are not protectable, character names are.

### Typeface — **Geist Sans + Geist Mono** _(resolved)_

Free, loads via `next/font`, coherent with the Vercel deployment, and has character without being Inter. Geist Mono on the countdown guarantees fixed-width digits, which removes the timer-jitter problem outright.

### LLM providers — **four providers, three adapters** _(resolved)_

OpenAI, Anthropic, Google, and xAI behind one adapter interface (ADR-6 in [architecture.md](./architecture.md#architecture-decisions)). xAI is OpenAI-compatible, so one adapter covers two providers.

Honest cost: roughly 5–6 hours in a week that is already the tightest of the four. Acceptance requires **two** providers working; the other two are desirable. The cut line drops providers before it drops the LLM feature itself, because the adapter interface is the part worth building and the part worth talking about.

### Break sessions inside blocks — **no interruption** _(resolved)_

A break does not interrupt or end a Phase 3 block. Breaks live _inside_ the block — a 90-minute block containing three focus sessions and two breaks is one block, not five.

### Unfinished day plans at midnight — **freeze, do not delete** _(resolved)_

The plan is frozen as-is at midnight. Unfinished blocks are marked `skipped` and stay visible in the report rather than being cleaned up. Unfinished plans are not clutter — they are exactly the signal Phase 4 needs to say anything useful about over-planning.

---

## Open Questions

_None currently._ New questions go here as they arise; move each into Resolved Decisions above once answered, with the reasoning.

---

## Post-v1 Backlog

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

## Idea Parking Lot

Anything that occurs to you mid-build and is not in v1 scope. No format required — just capture it and keep moving.

- _(empty)_
