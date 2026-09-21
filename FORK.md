# Fork map

Audit snapshot: 2026-09-21, after the einsum-only modernization of the
derivative that previously ended at `4b97e6f`.

## Summary

`einsum3d` is a focused derivative of
[`bbycroft/llm-viz`](https://github.com/bbycroft/llm-viz). It reuses
llm-viz's Next.js and WebGL tensor-block renderer, removes the exposed CPU,
fluid-simulation, homepage, GPT/walkthrough, and standalone LLM applications,
and adds an interactive Einstein-summation editor and layout.

The shipped product is a static Next.js export hosted as a GitHub Pages project
site under `/einsum3d`, deployed from Actions using the `out/` artifact.

## Lineage

- Canonical upstream: `https://github.com/bbycroft/llm-viz.git`
- Fork baseline:
  `10d659245594bb77f87801f54a1403e338d3df27`
  (`Fix "T columns" mistake; update comments`, Brendan Bycroft,
  2023-12-13)
- First derivative commit:
  `3ef0142afd8cd8a73112eae97da6ceb08c0e4ba8`
  (`[hacking] Create 3 matrix layout`, 2023-12-16)
- Pre-modernization derivative tip:
  `4b97e6f4076b8ff7ca4ccc33576180508e9b83e5`
- Agent-guide commit immediately before this cleanup:
  `3a641c4`
- Current origin: `https://github.com/mishaevoma/einsum3d.git`
- Historical owner URL: `https://github.com/manifoldhiker/einsum3d`; GitHub
  redirects it to the current repository.

GitHub reports this repository as `fork: false` with no parent. The relationship
is nevertheless unambiguous: `10d6592` is present in the upstream repository,
is an ancestor of local `main`, and is the direct parent of the first local
commit. Use git ancestry, not GitHub fork metadata, for comparisons.

The clone has no `upstream` remote. `origin/research/main` is a disconnected
two-commit experiment (`3868393`, `ddb5c8e`) and is not part of shipped
`main`.

At the 2026-09-21 audit, upstream `main` was at `9da9374`; no post-baseline
upstream commits had been merged here. That tip is informational and will
become stale.

## Purpose of the derivative

The local work makes four coordinated changes:

1. It pivots the product from a collection of visualization experiments to one
   einsum-focused page.
2. It adds equation/operand editing, validation, output-shape derivation,
   relation mapping, Python-loop stringification, and recursive 3D tensor
   layout.
3. It drives the inherited WebGL renderer from typed einsum domain state. GPT,
   WASM, walkthrough, commentary, and RISC-V assets are gone from the runtime
   and source tree.
4. It ships as a static export under `/einsum3d`. GitHub Pages is deployed from
   the `out/` artifact by Actions rather than a committed `docs/` tree.

In one sentence: this repository forks llm-viz at `10d6592`, strips unrelated
product surfaces, layers an einsum editor and layout engine over the retained
WebGL renderer, and publishes the result through GitHub Actions.

## Size and shape of the delta

The range `10d6592..4b97e6f` contained 31 derivative commits from 2023-12-16
through 2026-09-21, including generated `docs/` and a mixed Yarn/npm lockfile.
The modernization after `3a641c4` deleted that generated export, the GPT and
walkthrough runtime, RISC-V public assets, and the unused lockfile. Compare
against `HEAD` rather than treating the 31-commit stats as current.

Useful commands:

```bash
BASE=10d659245594bb77f87801f54a1403e338d3df27

git merge-base --is-ancestor "$BASE" HEAD
git rev-list --count "$BASE"..HEAD
git log --reverse --oneline "$BASE"..HEAD

git diff --shortstat "$BASE"..HEAD -- \
  . ':(exclude)out/**' ':(exclude)yarn.lock' ':(exclude).next/**'
```

## Local product layer

The main files added or rewritten for the einsum product are:

- `src/einsum/` — typed domain: parsing, validation, output derivation,
  presets, evaluation, and Python generation.
- `src/app/meinsum/EinsumDemoApp.tsx` — coordinates editor state and displayed
  Python.
- `src/app/meinsum/EinsumInputManager.tsx` — equation and operand collection
  controls.
- `src/app/meinsum/OperandItem.tsx` — operand name and shape editor.
- `src/llm/EinsumLayout.ts` and `src/llm/layout/types.ts` — recursively map
  N-dimensional shapes to 3D blocks.
- `src/llm/program/EinsumProgram.ts` — initializes presets and runs the active
  render loop.
- `src/llm/MeinsumSidebar.tsx` and `src/llm/MeinsumMenu.tsx` — connect the
  editor and examples to mutable program state.

The active data path is:

`page.tsx`
→ `LayerView`
→ `EinsumProgram.initProgramState`
→ `MeinsumSidebar`
→ `EinsumDemoApp`
→ `buildRelationMap` / `deriveEinsumState`
→ `runEinsumProgram`
→ `generateEinsumLayout`
→ inherited WebGL render passes.

Call `markDirty()` after mutating shared program state.

## Retained upstream substrate

Most of the low-level renderer remains conceptually upstream:

- camera, matrix, vector, and shader utilities;
- WebGL buffers, shaders, font rendering, hit testing, and render phases.

Do not treat later llm-viz GPT, walkthrough, or WASM work as in-tree
dependencies. Broad upstream merges remain risky because the local program
state and layout types are einsum-only.

## Removed upstream surfaces

The derivative deliberately removed:

- the RISC-V/CPU schematic editor and routes (`src/cpu`, `src/app/cpu`);
- the fluid simulation (`src/fluidsim`, `src/app/fluid-sim`);
- the multi-project homepage (`src/homepage`);
- the standalone `/llm` route;
- GPT model loading, WASM bindings, walkthrough, and commentary;
- `public/riscv/`, GPT JSON, and `native.wasm`;
- upstream development gitlinks and scripts for `emsdk`, `minGPT`, and model
  data generation.

Do not restore these as an incidental side effect of an upstream sync.

## Generated and incidental content

`out/` is `next build` output because `next.config.mjs` sets `output: 'export'`.
It is gitignored. Feature work belongs in `src/`, `styles/`, or `public/`;
GitHub Pages publishes the Actions artifact, not a committed export.

The committed atlas in `public/fonts/` is the runtime font input. Font
generation scripts were removed once that atlas was in place.

## Development chronology

- 2023-12-16 to 2023-12-20: initial matrix/tensor geometry, shape editing,
  recursive cube generation, and `meinsum` port.
- 2023-12-21: Python loop generation and display.
- 2023-12-22 to 2023-12-24: hover experiments, preset menu, UI cleanup,
  removal of unrelated upstream surfaces, and first static export.
- 2024-01-14: README corrections.
- 2024-04-06 to 2024-04-07: owner URL and GitHub Pages asset-path fixes.
- 2026-09-21: repository/page links moved to the renamed GitHub account; later
  the same day the tree was made einsum-only, Yarn 4 / Next 16 were adopted,
  tests and Actions Pages were added, and committed `docs/` output was removed.

## Reproducing the comparison

Run these commands from the repository root:

```bash
BASE=10d659245594bb77f87801f54a1403e338d3df27

git merge-base --is-ancestor "$BASE" HEAD
git rev-list --count "$BASE"..HEAD
git log --reverse --oneline "$BASE"..HEAD

git diff --shortstat "$BASE"..HEAD
git diff --name-status "$BASE"..HEAD -- \
  src/app/meinsum src/einsum src/llm src/app/page.tsx \
  next.config.mjs README.md

git diff --name-status "$BASE"..HEAD -- \
  src/cpu src/homepage src/fluidsim \
  src/app/cpu src/app/fluid-sim src/app/llm
```

To inspect later upstream work without changing the worktree:

```bash
git remote add upstream https://github.com/bbycroft/llm-viz.git
git fetch upstream
git merge-base HEAD upstream/main
git log --oneline "$BASE"..upstream/main
```

If `upstream` already exists, skip `git remote add`. Any actual sync should be a
dedicated change that separates upstream renderer updates from local product
behavior.
