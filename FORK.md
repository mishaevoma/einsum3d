# Fork map

Audit snapshot: 2026-09-21, local `main` at
`4b97e6f4076b8ff7ca4ccc33576180508e9b83e5`.

## Summary

`einsum3d` is a focused derivative of
[`bbycroft/llm-viz`](https://github.com/bbycroft/llm-viz). It reuses
llm-viz's Next.js and WebGL tensor-block renderer, removes the exposed CPU,
fluid-simulation, homepage, and standalone LLM applications, and adds an
interactive Einstein-summation editor and layout.

The shipped product is a static Next.js export hosted as a GitHub Pages project
site under `/einsum3d`.

## Lineage

- Canonical upstream: `https://github.com/bbycroft/llm-viz.git`
- Fork baseline:
  `10d659245594bb77f87801f54a1403e338d3df27`
  (`Fix "T columns" mistake; update comments`, Brendan Bycroft,
  2023-12-13)
- First derivative commit:
  `3ef0142afd8cd8a73112eae97da6ceb08c0e4ba8`
  (`[hacking] Create 3 matrix layout`, 2023-12-16)
- Audited derivative tip:
  `4b97e6f4076b8ff7ca4ccc33576180508e9b83e5`
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

At audit time, upstream `main` was at `9da9374`; no post-baseline upstream
commits had been merged here. That tip is informational and will become stale.

## Purpose of the derivative

The local work makes four coordinated changes:

1. It pivots the product from a collection of visualization experiments to one
   einsum-focused page.
2. It adds equation/operand editing, validation, output-shape derivation,
   relation mapping, Python-loop stringification, and recursive 3D tensor
   layout.
3. It drives the inherited WebGL renderer with the new einsum state while
   retaining much of the original GPT renderer and walkthrough code as legacy
   substrate.
4. It exports the app into committed `docs/` artifacts for GitHub Pages, with
   `/einsum3d` as both the base path and asset prefix.

In one sentence: this repository forks llm-viz at `10d6592`, strips unrelated
product surfaces, layers an einsum editor and layout engine over the retained
WebGL renderer, and packages the result for GitHub Pages.

## Size and shape of the delta

The range `10d6592..4b97e6f` contains 31 derivative commits from 2023-12-16
through 2026-09-21.

The complete diff is large because it combines authored source, deleted
upstream applications, dependency lockfiles, and a committed site export:

- 279 files changed
- 36,057 insertions
- 21,393 deletions

Removing generated `docs/` and both lockfiles gives a more useful source/config
view:

- 148 files changed
- 4,434 insertions
- 17,390 deletions

The major categories are:

- Generated site: 129 files and 16,639 inserted lines under `docs/`.
- Removed upstream products: 105 files and 16,931 deleted lines under
  `src/cpu`, `src/homepage`, `src/fluidsim`, and their App Router routes.
- Core einsum additions: the principal 12 new/rewritten files account for
  2,376 inserted lines, with smaller integrations in inherited renderer files.
- Lockfile churn: `package-lock.json` was added and `yarn.lock` changed,
  producing 14,984 insertions and 4,003 deletions.
- Deployment/configuration: `next.config.js`, `README.md`, `package.json`, and
  `tsconfig.json` were adapted for the single static site.

These categories explain why a raw GitHub diff is misleading: roughly half of
the inserted lines are a generated export, while most source deletions remove
whole upstream products rather than rewrite the retained renderer.

## Local product layer

The main files added for the derivative are:

- `src/app/meinsum/EinsumDemoApp.tsx` — coordinates editor state, validation,
  derived output, and displayed Python.
- `src/app/meinsum/EinsumInputManager.tsx` — equation and operand collection
  controls.
- `src/app/meinsum/OperandItem.tsx` — operand name and shape editor.
- `src/app/meinsum/MeinsumStringification.ts` — emits nested Python loops for
  the current equation.
- `src/llm/meinsum.js` — parses and validates equations and builds relation
  maps.
- `src/llm/EinsumLayout.ts` — recursively maps N-dimensional shapes to 3D
  blocks.
- `src/llm/MyProgram.ts` — initializes einsum presets and runs the active render
  loop.
- `src/llm/MeinsumSidebar.tsx` and `src/llm/MeinsumMenu.tsx` — connect the
  editor and examples to mutable program state.

The integration also modifies inherited interaction, annotation, labeling, and
toolbar files under `src/llm/`.

The active data path is:

`page.tsx`
→ `LayerView`
→ `MyProgram.initProgramState`
→ `MeinsumSidebar`
→ `EinsumDemoApp`
→ `buildRelationMap` / `calculateOutput`
→ `runEinsumProgram`
→ `genEinsumLayout`
→ inherited WebGL render passes.

## Retained upstream substrate

Most of the low-level renderer remains conceptually upstream:

- camera, matrix, vector, shader, and tensor utilities;
- WebGL buffers, shaders, font rendering, hit testing, and render phases;
- GPT model and WASM integration;
- walkthrough and commentary components.

Only part of that retained code is active in the einsum page. In particular,
`LayerView` calls `runEinsumProgram` from `MyProgram.ts`; the older `runProgram`
and initializer in `Program.ts` are not the active product path. Their
coexistence explains many current TypeScript errors and makes broad upstream
merges risky.

## Removed upstream surfaces

The derivative deliberately removed:

- the RISC-V/CPU schematic editor and routes (`src/cpu`, `src/app/cpu`);
- the fluid simulation (`src/fluidsim`, `src/app/fluid-sim`);
- the multi-project homepage (`src/homepage`);
- the standalone `/llm` route;
- upstream development gitlinks and scripts for `emsdk`, `minGPT`, and model
  data generation.

Do not restore these as an incidental side effect of an upstream sync.

## Generated and incidental content

`docs/` is `next build` output because `next.config.js` sets
`distDir: 'docs'` and `output: 'export'`. It includes bundled JavaScript,
source maps, HTML, and copies of public assets. Feature work belongs in
`src/`, `styles/`, or `public/`; regenerate `docs/` only for deployment.

`docs/riscv/` and `public/riscv/` are residue from the removed CPU project.
Scratch files such as `GptModelLayout copy.ts`,
`Walkthrough00_Intro copy.tsx`, `old_draw_cubes.ts`, and `non_page.tsx` are
historical experiments rather than intentional architecture.

## Development chronology

- 2023-12-16 to 2023-12-20: initial matrix/tensor geometry, shape editing,
  recursive cube generation, and `meinsum` port.
- 2023-12-21: Python loop generation and display.
- 2023-12-22 to 2023-12-24: hover experiments, preset menu, UI cleanup,
  removal of unrelated upstream surfaces, and first static export.
- 2024-01-14: README corrections.
- 2024-04-06 to 2024-04-07: owner URL and GitHub Pages asset-path fixes.
- 2026-09-21: repository/page links moved to the renamed GitHub account and the
  committed static export was refreshed.

## Reproducing the comparison

Run these commands from the repository root:

```bash
BASE=10d659245594bb77f87801f54a1403e338d3df27

git merge-base --is-ancestor "$BASE" HEAD
git rev-list --count "$BASE"..HEAD
git log --reverse --oneline "$BASE"..HEAD

git diff --shortstat "$BASE"..HEAD
git diff --shortstat "$BASE"..HEAD -- \
  . ':(exclude)docs/**' ':(exclude)yarn.lock' \
  ':(exclude)package-lock.json'

git diff --name-status "$BASE"..HEAD -- \
  src/app/meinsum src/llm src/app/page.tsx \
  next.config.js README.md

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
behavior and generated `docs/` churn.
