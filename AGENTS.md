# Agent guide

## Mission

This repository is a focused derivative of `bbycroft/llm-viz`. It keeps the
inherited WebGL tensor renderer and exposes a single interactive 3D visualizer
for Einstein summation (`einsum`).

Read [FORK.md](./FORK.md) before changing inherited renderer code or comparing
with upstream. [TECH_DEBT.md](./TECH_DEBT.md) records the cleanup that made
this tree einsum-only.

## Before editing

1. Run `git status --short` and preserve unrelated user changes.
2. Use Yarn 4 via Corepack (`packageManager` in `package.json`). `yarn.lock` is
   the only lockfile.
3. Install with `yarn install --immutable`.
4. Treat `out/` as generated static-export output. Do not commit it.

## Commands

- `yarn dev` — Next.js on port 3002.
- Open `http://localhost:3002/einsum3d/`; `/einsum3d` is part of the runtime
  contract.
- `yarn lint` — ESLint.
- `yarn typecheck` — strict `tsc --noEmit`.
- `yarn test` — Vitest unit and component tests.
- `yarn test:e2e` — Playwright smoke tests against the dev server.
- `yarn build` — static export into `out/`.
- `yarn verify` — dedupe, lint, typecheck, unit tests, and production build.
- `yarn audit` — production and development dependency audit.

## Active runtime

`src/app/page.tsx`
→ `src/llm/LayerView.tsx`
→ `src/llm/program/EinsumProgram.ts`
→ `src/llm/EinsumLayout.ts`
→ `src/llm/render/*`

Editor flow:

`src/llm/MeinsumSidebar.tsx`
→ `src/app/meinsum/EinsumDemoApp.tsx`
→ `src/einsum/`

Ownership:

- `src/einsum/` is the typed domain: parsing, validation, output derivation,
  presets, and Python generation.
- `src/app/` is the App Router shell and editor controls.
- `src/llm/program/` owns mutable canvas state. Call `markDirty()` after
  mutating it.
- `src/llm/layout/` and `EinsumLayout.ts` define renderable block geometry.
- `src/llm/render/` and most of `src/utils/` are the retained WebGL substrate.
- `public/fonts/` is the committed font atlas used at runtime.

## Invariants

- Dimensions are single letters. Multi-character labels need a parser change.
- Shape sizes must be finite positive integers before layout.
- WebGL2 is required; keep the unsupported-browser fallback.
- Asset URLs must use `assetUrl()` / `/einsum3d` rather than site-root paths.
- GitHub Pages is deployed from Actions using the `out/` artifact, not `docs/`.

## Verification

For source changes:

1. Run `yarn verify`.
2. If runtime behavior changed, use a WebGL2 browser at `/einsum3d/` and check
   preset switching, equation/shape edits, invalid-equation feedback, scalar,
   vector, matrix, batched, and repeated-index examples, camera movement,
   resize, and narrow-screen layout.
3. If deployment behavior changed, run `yarn build` and inspect `out/`
   separately from source.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
