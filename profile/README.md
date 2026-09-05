# profile

The non-professional section of hvalec.com, served at `/profile`. Formerly its own site (mstr.hvalec.com / mstr-site repo, later renamed from `karl/`) — now a self-contained Node build living inside the `personal-site` repo, alongside `main/` (Jekyll) and `admin/` as independent sibling projects. See the root `README.md` for how the three builds are combined.

The admin panel (Spotify/Xbox/Steam/PSN/Discord connections, device tokens) used to live here as `admin.html` — it's since moved to its own `admin/` project, served at `/admin` rather than `/profile/admin`. Nothing in this project references it anymore.

The homepage (`/profile`) is an Astro app (`site/`), prerendered to static HTML for a fast, read-only first paint — see `site/README` notes in this file's "Homepage (Astro)" section below. Everything else (`logs/`, `recipes/`, `shelves/`, `changelog.html`, `uses.html`, `secret.html`, `404.html`) is still the original bundler-free static build.

## Secrets (Doppler)

The only non-hardcoded config value is `API_BASE_URL` (which `hvalec-api` instance the site talks to). It's stored in Doppler, project **hvalec-site**, not committed here.

1. Install the Doppler CLI:
   ```
   brew install dopplerhq/cli/doppler
   ```
2. Log in (opens a browser to authenticate):
   ```
   doppler login
   ```
3. Link this directory to the Doppler project/config (run once, from `profile/`):
   ```
   doppler setup
   ```
   Pick project `hvalec-site` and whichever config you're working against (e.g. `development_personal`).
4. Pull the value into a local `.env`:
   ```
   npm run secrets
   ```

`.env` is gitignored. Note the build (`npm run build`) reads `API_BASE_URL` from the shell environment, not from `.env` directly — either `source .env` first, or run the build through Doppler instead:

```
doppler run -- npm run build
```

## Local dev

```
npm run dev
```

Serves `dist/` on `:3002` and rebuilds on changes to `src/`/`partials/`. This does **not** include the homepage — see "Homepage (Astro)" below to work on that in isolation.

## Build

`npm run build` (`scripts/build.js`) checks for a `DOPPLER_TOKEN` environment variable: if it's set (only true in Coolify, never locally), it fetches secrets from Doppler via `@dopplerhq/node-sdk` and injects them for the build only, then runs the real static build (`build:static`), which bakes the resolved value into `dist/assets/js/api-config.js`. If `DOPPLER_TOKEN` isn't set (local dev), it's a zero-overhead passthrough straight to `build:static`. `build:static` also runs the Astro build for the homepage (see below) and overlays its output on top.

All paths in the built output are rooted at `/profile` (asset links, internal nav, the header logo, etc.) since this build's output gets copied into `dist/profile` by the root orchestrator (see root `package.json`), not served from the domain root.

## Homepage (Astro)

`site/` is a separate Astro project that owns only the homepage (`/profile` itself) — the "Personal Spec Sheet" page. It's prerendered (`output: 'static'`) rather than server-rendered per request: everything with a real static source (vault, writing, projects) is baked in at build time, and anything genuinely live (presence, weather, clock, visitor count) hydrates client-side after paint, the same pattern the rest of this project's pages already use for their own widgets.

Sections with no real backend yet (habits, motion, screens, recently-played, music history) render an explicit empty state and attempt a real fetch to the endpoint they'll eventually use — see comments in `site/src/scripts/future-data.js` and `PROFILE_PAGE_PLAN.md` at the repo root for what's still missing on the `hvalec-api` side.

```
cd site
npm install
npm run dev   # :3004, no live API data locally unless API_BASE_URL is set
npm run build # outputs to site/dist/, which scripts/build.js copies over dist/index.html
```
