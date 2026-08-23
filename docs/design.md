# Design Direction

> One aesthetic, executed deliberately. **See ADR-5 in [architecture.md](./architecture.md#architecture-decisions) for why there is no theme toggle.**

← [Docs index](./README.md)

---

Given the industrial design background, visual execution is a deliberate differentiator, not an afterthought. The bar: *a stranger should not be able to identify the component library.*

**Aesthetic:** iOS-style glass — layered translucency, soft depth, restrained color.

**Concrete direction**
- **Surface:** `backdrop-filter: blur(20px)` over a subtly gradient dark background; card backgrounds at ~8–12% white with a 1px ~18% white top-edge highlight to imply a light source. Depth comes from layering and edge light, never from heavy drop shadows.
- **Color:** two accents, each carrying a *state* rather than decoration — orange for focus, green for rest. Because each hue means something, this does not violate the one-accent principle; it extends it. Category colors are the only other chroma, kept desaturated so they never compete with the timer. Full tokens below.
- **Type:** **Geist Sans** for UI, **Geist Mono** for the countdown — committed, see Typography below.
- **The timer is the hero.** Oversized, generous negative space, minimal chrome. Everything else in the app is secondary furniture.
- **Motion:** transitions in the 150–250ms range with eased curves. Animate the state *transitions* (start, pause, complete) — never a continuously animating element during a focus session. The screen must be calm while the user is working; that is a functional requirement, not a stylistic one.
- **Reduced motion:** respect `prefers-reduced-motion` throughout.

**Practical approach:** use shadcn/ui for behavior and accessibility (dialogs, popovers, selects, focus management), then restyle surfaces via CSS variables. Take the a11y for free; discard the default look.

---

## Palette

Derived from the green/orange pairing in Marvel's *Loki* — the Time Stone green and Miss Minutes orange. **Take the colors, not the names.** Colors themselves are not protectable, but do not reference Marvel IP anywhere in the repo: no `--miss-minutes-orange` token, no TVA imagery, no character names in the README. This is a public portfolio project, and unlicensed IP references are a liability that costs you nothing to avoid.

### Semantic assignment

| Token | Meaning | Hex | Notes |
|---|---|---|---|
| `--focus` | Focus session active | `#FF8A3D` | Warm orange. The hero color — the timer ring and countdown during work |
| `--rest` | Break active / session complete | `#2DD4A7` | Mint-teal green. Deliberately shifted from pure emerald (see below) |
| `--bg` | App background | `#0A0E0D` | Near-black with a faint green cast so the glass surfaces read as tinted, not grey |
| `--surface` | Glass card fill | `rgba(255,255,255,0.08)` | Per the surface rule above |
| `--edge` | Top-edge highlight | `rgba(255,255,255,0.18)` | 1px, implies the light source |
| `--text` | Primary text | `#F2F5F4` | Never pure white on dark — it vibrates |
| `--text-dim` | Secondary text | `rgba(242,245,244,0.55)` | |

### Why the green is teal-shifted — read this before overriding it

Orange against green is the single worst pairing for red–green colour vision deficiency, which affects roughly 8% of men. Under deuteranopia, a true Time Stone emerald (`#22C55E`) and a Miss Minutes orange (`#F97316`) both collapse toward the same muddy yellow — meaning a user could not tell a focus session from a break at a glance.

Pulling the green toward teal (`#2DD4A7`) introduces a blue component that survives red–green CVD, so the two states stay distinguishable. It also reads as cooler and calmer, which suits a rest state better than a lime green does.

**Additional safeguard, non-negotiable:** never encode focus-vs-rest in hue alone. The two states must also differ by label text and by ring treatment (solid for focus, dashed or hollow for rest). Colour is reinforcement, never the sole signal. Getting this right is cheap here and is a genuinely good answer when an interviewer asks about accessibility.

### Category colours

Six presets, all desaturated to roughly 40–50% chroma so they never compete with `--focus` or `--rest`. Assign them cool hues (blues, violets, slate) to keep the warm/green axis reserved for timer state.

---

## Typography

**Geist Sans** for UI, **Geist Mono** for the countdown.

- Free, open-source, and loads through `next/font` with zero layout shift.
- Made by Vercel — which you are deploying to — so it is a coherent choice, not an arbitrary one.
- It has real character without being Inter, which is the safe default *and* the tell that a project used the default.
- **Geist Mono for the countdown solves the tabular-numeral problem outright**: a monospace face guarantees fixed-width digits, so the timer cannot jitter as numbers change. This is the single most visible polish detail in the whole app — a jittering countdown reads as amateur instantly.

Scale: one oversized display size for the countdown (the hero), then a restrained 4–5 step scale for everything else. Resist adding sizes.
