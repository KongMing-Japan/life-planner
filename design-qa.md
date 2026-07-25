# Design QA — LifeOS Planner / Portfolio alignment

- Source visual truth: `https://portfolio.kongmingjapan.com/`
- Source capture: `/tmp/portfolio-home-1440.png`
- Implementation: `http://127.0.0.1:4173/`
- Implementation capture: `/tmp/qa-life-1440.png`
- Combined comparison: `/tmp/qa-portfolio-life-1440-compare.png`
- Desktop viewport: 1440 × 1000 CSS px, device scale factor 1
- Source pixels: 1425 × 1287; implementation pixels: 1425 × 1932
- Mobile viewport: 390 × 844 CSS px; implementation capture: `/tmp/qa-life-mobile-390.png`
- State: default Japanese plan, simple mode, default saved values

## Full-view comparison evidence

The Portfolio and Planner captures were placed into one side-by-side comparison at the same desktop viewport. The Planner preserves its two-column planning workflow while now using the Portfolio visual system: white canvas, Inter-first type stack, Google-neutral ink and muted colors, Google blue active states, 8px bordered cards, no decorative card shadows, compact LifeOS navigation, and restrained semantic status colors.

## Focused region comparison evidence

The navigation, page header, overview card, KPI cards, form cards, and chart card were checked directly. Computed styles for the Portfolio and Planner primary cards match on the key fidelity tokens:

- border: `rgb(218, 220, 224)`
- radius: `8px`
- shadow: `none`
- body font: `"Inter Variable", Inter, ui-sans-serif, ...`

The source and implementation contain no comparable hero imagery. Existing Lucide interface icons are retained because the Portfolio source uses the same icon language.

## Findings

- No remaining P0, P1, or P2 visual mismatches.
- P3: Planner is intentionally denser than Portfolio because it exposes editable assumptions and a long projection chart in the primary workspace.
- P3: Japanese copy naturally creates different line wrapping from Portfolio's English default state.

## Comparison history

1. Initial finding — P1: Planner used a separate Plus Jakarta / navy-gradient visual system with heavier shadows, tinted canvases, and filled segmented navigation.
2. Fix: aligned typography, canvas, color tokens, navigation, headers, cards, form controls, tabs, KPI surfaces, charts, tables, next-step cards, and focus states with Portfolio.
3. Post-fix evidence: `/tmp/qa-portfolio-life-1440-compare.png`; computed card and font tokens match the source.
4. Mobile verification: 390px viewport has no horizontal overflow (`scrollWidth = innerWidth = 390`).

## Interaction and runtime checks

- Simple → Detail → Simple mode switching works.
- Default calculation and interactive chart remain visible.
- Desktop and mobile browser console: no warnings or errors.
- Production build: passed.
- Tests: 21 passed.

## Implementation checklist

- [x] Match Portfolio typography and neutral color tokens.
- [x] Match navigation, card borders, radii, and elevation.
- [x] Match blue active and focus states.
- [x] Preserve Planner calculation, editing, and chart behavior.
- [x] Verify desktop and mobile layouts.

final result: passed
