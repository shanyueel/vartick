# Git Workflow — Branches & Commits

> The rule for branch names and commit messages. Applies to every contributor — human or AI.

← [Docs index](./README.md)

---

## Why this exists

A consistent prefix on branches and commits makes history skimmable (`git log --oneline`), lets changelogs be generated automatically, and makes intent explicit before you open the diff. This is binding for this repo — do not invent a different scheme, and do not skip the prefix "just this once."

---

## Branch names

Format: `<type>/<short-description>`

- Use kebab-case for the description
- Keep it short — a few words, not a sentence
- No ticket system yet, so no ticket number prefix is required (add one later if we adopt one)

| Type        | Use for                                                         |
| ----------- | --------------------------------------------------------------- |
| `feat/`     | New functionality                                               |
| `fix/`      | Bug fix                                                         |
| `hotfix/`   | Urgent fix, typically against a deployed/production issue       |
| `refactor/` | Restructuring code with no behavior change                      |
| `chore/`    | Tooling, config, dependencies, CI — no app code behavior change |
| `docs/`     | Documentation only                                              |
| `test/`     | Test-only changes                                               |

**Examples**

```
feat/timer-state-machine
fix/session-abandon-not-persisted
hotfix/notification-permission-crash
refactor/dexie-query-hooks
chore/upgrade-vitest
docs/architecture-adr-6
```

---

## Commit messages

Format: `<type>: <short summary>`

- Type is lowercase, followed by a colon and a space
- Summary is imperative mood ("add", not "added" or "adds"), no trailing period
- Keep the summary line under ~72 characters
- Add a body (blank line, then free text) when the _why_ isn't obvious from the summary — see [CLAUDE.md](../CLAUDE.md) root guidance on comments/PRs: the reasoning belongs in the commit, not as a code comment

| Type        | Use for                               |
| ----------- | ------------------------------------- |
| `feat:`     | New functionality                     |
| `fix:`      | Bug fix                               |
| `hotfix:`   | Urgent production fix                 |
| `refactor:` | Restructuring with no behavior change |
| `chore:`    | Tooling, deps, config, CI             |
| `docs:`     | Documentation only                    |
| `test:`     | Test-only changes                     |

**Examples**

```
feat: add timer state machine with idle/running/paused states
fix: persist session on tab close, not just on completion
hotfix: guard against missing Notification permission on iOS
refactor: extract Dexie queries into useLiveQuery hooks
chore: bump vitest to v2
docs: add ADR-6 for the provider adapter layer
```

One logical change per commit. If you're using "and" to describe a commit, it's probably two commits.

---

## For AI agents (Claude Code and others)

- Every branch you create must use one of the `type/` prefixes above. If the task doesn't obviously fit a type, ask rather than guessing a prefix.
- Every commit you create must start with one of the `type:` prefixes above.
- Match the type to what actually changed, not to how the user phrased the request — e.g. if the user says "clean this up" but the change fixes a real bug, use `fix:`, not `refactor:`.
- Never invent a different prefix scheme (no `feature/`, no `bugfix/`, no `FEAT:`) even if a template elsewhere suggests it — this file is the source of truth for this repo.
- The `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` trailer (added per the root commit instructions) goes at the end of the commit body, after the summary — it does not replace or affect the `type:` prefix rule.
