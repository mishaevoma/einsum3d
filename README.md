# einsum 3D visualization

https://mishaevoma.github.io/einsum3d/

Interactive Einstein-summation visualization, derived from Brendan Bycroft's
[llm-viz](https://github.com/bbycroft/llm-viz).

## Local setup

Requires Node 24 and Yarn 4 (Corepack):

```bash
corepack enable
yarn install --immutable
yarn dev
```

Open http://localhost:3002/einsum3d/

## Exploring

Choose an example, edit its equation or tensor shapes, and click a dimension
under the scene to highlight the tensors that carry it. Purple, green, and
rose identify inputs; gold identifies the result. Invalid edits keep the last
valid scene visible. **Reset example** restores that example's starting values.

- Drag to orbit; Shift-drag or right-drag to pan; scroll to zoom.
- On touchscreens, use one finger to orbit and two fingers to pan or pinch.
- Focus the canvas for arrow-key orbit, Shift-arrow pan, `+`/`-` zoom, and `F` to fit.
- Use **2D** for a front view and **3D** to restore the perspective view.
- Switch between Python loops and NumPy, then use the copy button.

The renderer sleeps when idle. Camera movement does not rerender the editor;
contraction terms are generated only when a result cell is read. Display
resolution is capped at 2× and highlight blur passes run only when needed.
Previews are limited to 2,048 matrix slices to keep large batch shapes responsive.

## Checks

```bash
yarn verify      # lint, types, unit tests, production build, audit
yarn test:e2e    # Playwright against the dev server
```

## Deployment

`yarn build` writes a static export to `out/`. GitHub Pages is published from
that artifact by `.github/workflows/pages.yml`.
