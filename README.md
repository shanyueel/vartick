# VarTick

A local-first productivity companion that starts as a Pomodoro timer and grows into a schedule assistant.

**Thesis:** most productivity apps track what you planned. VarTick tracks the *variance* — the gap between what you planned and what actually happened, and why.

> 🚧 Work in progress. See [`docs/`](./docs/README.md) for the full product spec, architecture, and roadmap.

---

## Getting started

Requires Node 22+ (see `.nvmrc`).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Documentation

Full docs live in [`docs/`](./docs/README.md):

- [product.md](./docs/product.md) — what's in scope, what isn't
- [roadmap.md](./docs/roadmap.md) — phases, milestones, cut lines
- [architecture.md](./docs/architecture.md) — data model and ADRs
- [testing.md](./docs/testing.md) — testing strategy
- [design.md](./docs/design.md) — visual design
- [workflow.md](./docs/workflow.md) — branch naming and commit message conventions

## Stack

Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Dexie (IndexedDB) · Vitest · Playwright · Vercel

## License

TBD
