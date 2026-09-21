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

## Checks

```bash
yarn verify      # lint, types, unit tests, production build, audit
yarn test:e2e    # Playwright against the dev server
```

## Deployment

`yarn build` writes a static export to `out/`. GitHub Pages is published from
that artifact by `.github/workflows/pages.yml`.
