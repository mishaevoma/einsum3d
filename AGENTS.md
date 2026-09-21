# Agent guide

## Mission

This repository is a focused derivative of `bbycroft/llm-viz`. It keeps the
inherited WebGL tensor renderer and replaces the exposed multi-project site with
an interactive 3D visualizer for Einstein summation (`einsum`).

Read [FORK.md](./FORK.md) before changing inherited code or syncing upstream.
It records the fork boundary, the local product layer, and reproducible diff
commands.

## Before editing

1. Run `git status --short` and preserve unrelated user changes.
2. Use Yarn 1; `yarn.lock` and the README are the package-manager sources of
   truth. Do not update `package-lock.json` unless package-manager policy is
   being changed deliberately.
3. Install with `yarn install --frozen-lockfile`.
4. Treat `docs/` as generated GitHub Pages output, not source.

## Commands

- `yarn dev` — run Next.js on port 3002.
- Open `http://localhost:3002/einsum3d`; the configured base path is part of
  the runtime contract.
- `yarn lint` — the currently reliable static check.
- `yarn typecheck` — required as a diagnostic, but the inherited/local type
  split currently produces known failures. Report whether a change adds new
  failures; do not hide them with broader exclusions or `any`.
- `yarn build` — create the static export in `docs/`. This rewrites committed
  generated files, so run it only when validating or preparing a deployment.
- `ANALYZE=true yarn build` — inspect the production bundle.

There is no automated test suite. For behavior changes, add focused tests where
practical and perform the browser checks listed below.

## Active runtime

The main control flow is:

`src/app/page.tsx`
→ `src/llm/LayerView.tsx`
→ `src/llm/MyProgram.ts`
→ `src/llm/EinsumLayout.ts`
→ `src/llm/render/*`

The editor flow is:

`src/llm/MeinsumSidebar.tsx`
→ `src/app/meinsum/EinsumDemoApp.tsx`
→ `src/llm/meinsum.js`
→ `src/app/meinsum/MeinsumStringification.ts`

Important ownership boundaries:

- `src/app/` contains the App Router shell and einsum React controls.
- `src/llm/MyProgram.ts` is the active program initializer and render-loop
  coordinator.
- `src/llm/Program.ts` supplies shared state types but also contains a stale
  llm-viz initializer and render path. Do not assume its `initProgramState` or
  `runProgram` is active.
- `src/llm/EinsumLayout.ts` converts operand shapes into renderable block
  geometry.
- `src/llm/meinsum.js` validates equations and builds output relation maps.
- `src/llm/render/`, most of `src/llm/components/`, and `src/utils/` are the
  inherited rendering substrate.
- `public/` contains source assets copied into the static export.
- `docs/` is the committed export served by GitHub Pages.

## State and rendering invariants

- Program state is mutable and shared through `ProgramStateContext`. After
  mutating it, call `progState.markDirty()` so the canvas is redrawn.
- Operand or equation changes must recompute the derived output with
  `calculateOutput`; the renderer reads the resulting shape and relation map.
- The parser models dimensions as single characters. Multi-character einsum
  labels require a parser/data-model change, not only a UI change.
- Shape dimensions must stay finite, positive integers before they reach
  recursive tensor layout. Validate at the editor boundary.
- The active renderer requires WebGL2. Keep the unsupported-browser fallback.
- Preserve `/einsum3d` in `basePath` and `assetPrefix`, and test asset URLs
  under that path rather than only at `/`.
- `public/native.wasm`, model JSON, and font-atlas files are tracked runtime
  inputs. The Odin source is under `src/llm/wasm/`; font generation starts at
  `create-font-atlas.jsm`.

## Generated and legacy areas

- Never hand-edit `_next` files, HTML, source maps, copied fonts, or copied
  model data under `docs/`. Change source/public inputs and rebuild.
- Keep `public/.nojekyll` so a rebuild copies it to `docs/.nojekyll`; GitHub
  Pages otherwise omits `_next`.
- `src/llm/walkthrough/` and the GPT/WASM model path are largely inherited.
  Confirm reachability before changing them for an einsum feature.
- Files named `* copy.*`, `src/llm/old_draw_cubes.ts`,
  `src/llm/CubeGenerator.ts`, and `src/app/meinsum/non_page.tsx` are
  experiments or snapshots, not active sources of truth.
- `public/riscv/` and exported `docs/riscv/` data are residue from the removed
  CPU visualizer. Do not build new behavior on them.

## Verification

For every source change:

1. Run `yarn lint`.
2. Run `yarn typecheck` and distinguish pre-existing failures from regressions.
3. If runtime behavior changed, use a WebGL2 browser at `/einsum3d` and check:
   - switching among presets;
   - editing an equation and operand shape;
   - invalid-equation feedback;
   - scalar, vector, matrix, batched, and repeated-index examples;
   - redraw, camera movement, resizing, and narrow-screen layout.
4. If deployment behavior changed, run `yarn build`, verify
   `docs/.nojekyll`, and inspect the generated diff separately from source.

## Known baseline debt

- `next.config.js` permits production builds despite TypeScript errors.
- `yarn typecheck` currently fails across the stale GPT path, scratch files,
  and the partially typed einsum integration.
- `Program.ts` and `MyProgram.ts` duplicate responsibilities and disagree on
  layout types.
- `EinsumDemoApp` initializes derived output during render.
- Some inherited asset URLs are root-relative, notably `/native.wasm`, which
  is risky under the GitHub Pages base path.
- There are both Yarn and npm lockfiles, but repository instructions use Yarn.

Keep fixes scoped. A feature change should not silently become a wholesale
cleanup or an upstream merge.
