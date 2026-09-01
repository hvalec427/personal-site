# admin

The admin panel for hvalec.com, served at `/admin`. A self-contained, bundler-free static build (plain HTML/CSS/JS) living inside the `personal-site` repo, alongside `main/` (Jekyll) and `karl/` as independent sibling projects. See the root `README.md` for how the three builds are combined.

Handles the Spotify/Xbox/Steam/PSN/Discord connection flows and device tokens (imperative vanilla JS, `src/assets/js/admin.js` — talks to `hvalec-api`), plus a growing set of tabs (Habits, and eventually Collections/Watching/Reading/Exercise/Manage) built with [Alpine.js](https://alpinejs.dev). Specifically the **CSP-safe build** (`@alpinejs/csp`, loaded in `src/index.html`) — this page's Content-Security-Policy has no `unsafe-eval`, which the default Alpine build requires. That means `x-data` must reference a component registered ahead of time via `Alpine.data(...)` (see `src/assets/js/admin-tabs.js`) rather than an inline object literal or function call — inline `x-data="{ ... }"` will throw a CSP violation at runtime, not at build time, so it's easy to miss until you actually open the page.

## Secrets (Doppler)

The only non-hardcoded config value is `API_BASE_URL` (which `hvalec-api` instance the page talks to) — the same value `karl` uses, since both are just frontends for the same backend. Stored in Doppler, project **hvalec-site**.

1. Install the Doppler CLI:
   ```
   brew install dopplerhq/cli/doppler
   ```
2. Log in:
   ```
   doppler login
   ```
3. Link this directory (run once, from `admin/`):
   ```
   doppler setup
   ```
   Pick project `hvalec-site` and whichever config you're working against.
4. Pull the value into a local `.env`:
   ```
   npm run secrets
   ```

`.env` is gitignored. The build (`npm run build`) reads `API_BASE_URL` from the shell environment, not from `.env` directly — either `source .env` first, or run the build through Doppler:

```
doppler run -- npm run build
```

## Local dev

```
npm run dev
```

Serves `dist/` on `:3003` and rebuilds on changes to `src/`.

## Build

`npm run build` (`scripts/build.js`) checks for a `DOPPLER_TOKEN` environment variable: if set (only true in Coolify, never locally), it fetches secrets from Doppler and injects them for the build only, then runs the real static build (`build:static`), which bakes the resolved value into `dist/assets/js/api-config.js`. If `DOPPLER_TOKEN` isn't set (local dev), it's a zero-overhead passthrough straight to `build:static`.

All paths in the built output are rooted at `/admin` since this build's output gets copied into `dist/admin` by the root orchestrator (see root `package.json`), not served from the domain root.
