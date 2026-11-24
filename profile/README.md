# profile

The non-professional section of hvalec.com, served at `/profile`. Formerly its own site (mstr.hvalec.com / mstr-site repo, later renamed from `karl/`) — now a self-contained Node build living inside the `personal-site` repo, alongside `main/` (Jekyll) and `admin/` as independent sibling projects. See the root `README.md` for how the three builds are combined.

The admin panel (Spotify/Xbox/Steam/PSN/Discord connections, device tokens) used to live here as `admin.html` — it's since moved to its own `admin/` project, served at `/admin` rather than `/profile/admin`. Nothing in this project references it anymore.

`/profile` itself is a static redirect (`src/index.html`) to https://commonplace.hvalec.com/ (`http://localhost:5173/` when served from localhost), with a meta-refresh fallback. Everything else (`logs/`, `recipes/`, `shelves/`, `changelog.html`, `uses.html`, `secret.html`, `404.html`) is the bundler-free static build, still built and served at its old URLs.

## Local dev

```
npm run dev
```

Serves `dist/` on `:3002` and rebuilds on changes to `src/`/`partials/`.

## Git hooks

Running `yarn` (or `npm install`) in `profile/` installs a husky pre-commit hook (`prepare` runs `husky` from the git root, pointing at `profile/.husky`). It runs `lint-staged` (eslint + prettier) on staged `profile/` files. Set `HUSKY=0` to skip it.

## Build

`npm run build` copies `src/` into `dist/`, then runs `scripts/build-content.js` (partials and markdown content) and `scripts/write-deploy-time.js` (commit hash from Coolify's `SOURCE_COMMIT`). It needs no secrets and no Doppler.

**`DEPLOY_ENV=production` must be set as a Coolify environment variable on the profile app (available at build time), or draft posts get published.** Locally it's unset, so drafts are shown with a "Draft" notice.

All paths in the built output are rooted at `/profile` (asset links, internal nav, the header logo, etc.) since this build's output gets copied into `dist/profile` by the root orchestrator (see root `package.json`), not served from the domain root.
