# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Soulbound Monsters is a browser-based monster-collecting/merging combat game. Despite the
`package.json` name (`react-example`) and the presence of Vite/React/TypeScript scaffolding, **the
actual game is plain HTML/CSS/JavaScript**, not a React app — see Architecture below.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start Vite dev server on http://localhost:3000
npm run build     # vite build && copy src/ into dist/ (see caveat below — not what ships)
npm run preview   # preview the vite build
npm run lint       # tsc --noEmit (only type-checks the unused React/TS scaffold, not the game's src/*.js)
npm run clean     # rm -rf dist
```

There is no automated test suite and no test runner wired into `package.json`. `test.html`,
`test_aspect.html`, `test_width.html`, `test.js`, `test_timeline.js` are manual/ad hoc browser
scratch files, not a real test harness. Verify changes by running `npm run dev` and exercising the
game in a browser (title screen → start run → team selection → combat → merge, etc.).

A few standalone asset-validation scripts exist and can be run directly with `node <file>` /
`python <file>` when touching game content or art:
- `verify_art.js`, `check_art.py`, `check_data_art.py`, `check_js_art.py` — cross-check `data.json`
  and `src/*.js`/`index.html` references against files actually present under `public/Art`.
- `check_404.js` — Puppeteer script that loads the running dev server and logs failed
  network requests.
- `check_case.py` — checks for filename case mismatches (relevant since deployment can be
  case-sensitive even though local Windows dev is not).

The many root-level `fix_*.cjs`, `patch_*.cjs`, `update_*.cjs`, `reorder_*.cjs`, `split*.cjs` files
are one-off scripts from past sessions used to bulk-edit `data.json`/`index.html`/`src/*.js`. They
are not part of any build/CI pipeline (the gh-pages deploy explicitly excludes `fix_*`/`update_*`/
`reorder_*`/`split*`) and most are single-use and already applied — don't assume they're
re-runnable or still relevant; prefer editing the target files directly for new changes.

## Architecture

### The real game vs. the Vite/React scaffold

`index.html` is the actual application shell. It has no React mount point — it loads the game
logic via plain, non-module `<script>` tags in a fixed order:

```
src/data.js → src/state.js → src/core.js → src/collection.js → src/selection.js
→ src/map.js → src/combat.js → src/merge.js → src/pause.js
```

These files are **not ES modules**; they declare `let`/`function` at top level and rely on
execution order to build up shared global state (e.g. `gameState`, `currentRun`, `ELEMENTS`,
`STARTERS`, `MERGES`, `BOSSES`, `selectionSlots`, `mergeSlots`). There is no bundling step for
them — edits take effect on a browser refresh. When adding a new file, add a matching `<script>`
tag in `index.html` in the correct dependency position.

`src/App.tsx`, `src/main.tsx`, `src/index.css`, and the TypeScript/Tailwind config are leftovers
from an AI Studio React starter template and are **not referenced by `index.html`** — they render
into a `#root` div that doesn't exist in the page. Treat them as dead scaffolding, not part of the
shipped game, unless a task specifically asks to build them out.

Vite (`vite.config.ts`) is only used to serve these static files locally with a dev server
(`npm run dev`); it is not what turns into the production artifact (see Deployment).

### Game data

All monster/boss/merge/element definitions live in `data.json` (and its `public/data.json`
mirror), fetched at runtime by `init()` in [core.js](src/core.js:10). Balance and content changes
(stats, moves, effects, art paths) generally belong in `data.json`, not in the JS logic. Move
definitions use short keys (`n` name, `c` cost, `t` type, `p` power, `hits`, `melee`/`ranged`,
`effect: {type, value, turns, chance, target}`) — `getMoveDescription()` in
[core.js](src/core.js:155) is the canonical mapping from effect type to human-readable text; add
new effect types there when adding new move effects.

### Module responsibilities

- [state.js](src/state.js) — global game/run state shape (`gameState`, `currentRun`, slots).
- [core.js](src/core.js) — data loading (`init`), save/load (`saveGame`, localStorage key
  `soulbound_save`, with legacy `labborn_save` read for back-compat), screen switching
  (`showScreen`), scaling, element icon/type helpers.
- [selection.js](src/selection.js) — pre-run team selection UI, generic modal helpers
  (`showGameAlert`, `showGameConfirm`, `closeModal`) used across the app.
- [map.js](src/map.js) — run start (`startRun`) and node map rendering.
- [combat.js](src/combat.js) — by far the largest module (~2300 lines): turn order/timeline,
  status effects (poison, toxin, stun, sleep, buffs/debuffs, guard, counter, brambles, lifesteal,
  regen, overcharge, savage stance...), elemental type multipliers (Beast/Nature/Mech/Neutral
  triangle via `getElementMultiplier`), damage calc, enemy AI, VFX playback, end-of-combat/run
  flow (`endCombat`, `advanceRun`, replacement modal).
- [merge.js](src/merge.js) — drag-and-drop merging of two monsters into a new one.
- [collection.js](src/collection.js) — the collection/bestiary screen.
- [pause.js](src/pause.js) — pause modal and abandon-run flow.

### Art assets — two directories, know which one you're editing for

- `public/Art/` — superset, includes per-monster `_Ally_Portrait`/`_Enemy_Portrait`/`_Boss_Portrait`
  variants. This is what Vite's dev server serves at `/Art/...` (Vite's default `publicDir`).
- `Art/` (repo root) — smaller set, used when the raw repo root is served directly (this is what
  the GitHub Pages deploy publishes — see below).

When adding new art referenced from `data.json`/`src/*.js`, add it to `public/Art/` for local dev,
and be aware it also needs to reach whichever branch/location the production `Art/` actually comes
from (see Deployment) before it will show up on the live site.

### Deployment

`.github/workflows/pages.yml` deploys on push to `main` by publishing the **repo root as-is**
(`publish_dir: .`) to the `gh-pages` branch — it is a static-file publish, not a Vite production
build. Before publishing, it overlays `Art/` from a separate `art-fixed` branch
(`git checkout art-fixed -- Art`), so production art content is maintained on that branch rather
than on `main`. `fix_*`/`update_*`/`reorder_*`/`split*` scripts are excluded from the published
artifact via `exclude_assets`.
