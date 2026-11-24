# admin

The admin panel for hvalec.com, served at `/admin`. A self-contained, bundler-free static build (plain HTML/CSS/JS) living inside the `personal-site` repo, alongside `main/` (Jekyll) and `profile/` as independent sibling projects. See the root `README.md` for how the three builds are combined.

Handles the Spotify/Xbox/Steam/PSN/Discord connection flows and device tokens, in vanilla JS (`src/assets/js/admin.js`, rendering into `#admin-panel` in `src/index.html`; talks to `hvalec-api`). The page has a strict Content-Security-Policy meta tag in `src/index.html` (no `unsafe-eval`, scripts only from `'self'` and Umami), so new scripts must be same-origin files.

## Secrets (Doppler)

The only non-hardcoded config value is `API_BASE_URL` (which `hvalec-api` instance the page talks to). Stored in Doppler, project **hvalec-site**.

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
