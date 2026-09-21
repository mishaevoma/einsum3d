# Technical debt

Snapshot of the einsum-only modernization completed 2026-09-21 against
`3a641c4` (agent-guide commit) as the documentation baseline.

| Item | Resolution |
|------|------------|
| GPT/WASM/walkthrough still loaded by the einsum page | Removed from the runtime and source tree. `LayerView` only loads the font atlas and runs `runEinsumProgram`. |
| Duplicate `Program.ts` / `MyProgram.ts` state | Replaced by `src/llm/program/EinsumProgram.ts` and `src/llm/program/types.ts`. |
| Duplicate `GptModelLayout` / `EinsumLayout` block types | Single `src/llm/layout/types.ts` consumed by layout, interaction, and the renderer. |
| Untyped `meinsum.js` parser with import-time tests | Typed domain in `src/einsum/`, covered by Vitest. |
| `EinsumDemoApp` updated React state during render | Parent now always supplies a derived `EinsumState`; the editor only updates from events. |
| `ignoreBuildErrors` and failing `yarn typecheck` | Strict `tsc` is a required gate; Next no longer ignores type errors. |
| Yarn 1 + npm lockfile, `npm`/`yarn` runtime deps | Yarn 4.18.0 via `packageManager`, one lockfile, Corepack. |
| Next 13 / React 18 / ESLint 8 / Tailwind 3 | Next 16, React 19, ESLint 10, Tailwind 4, TypeScript 6. |
| Root-relative `/native.wasm` and `/fonts` fetches | WASM/GPT assets removed; fonts go through `assetUrl()` under `/einsum3d`. |
| Committed `docs/` GitHub Pages export | `docs/` is gitignored. Actions uploads `out/`. |
| RISC-V dumps, scratch `* copy.*`, font-generation scripts | Deleted. The committed atlas in `public/fonts/` is the runtime input. |
| No tests or CI | Vitest, Playwright, `yarn verify`, `.github/workflows/ci.yml`. |
| Dependabot noise from abandoned packages | Direct unused packages removed; weekly Dependabot on npm and Actions. |

Intentional remaining substrate: the WebGL renderer under `src/llm/render/` and
helpers in `src/utils/` still carry llm-viz structure (shader UBOs, instanced
cubes, camera matrices). Further renderer simplification is product work, not
unfinished cleanup.
