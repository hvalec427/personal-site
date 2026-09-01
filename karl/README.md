# karl

The non-professional section of hvalec.com, served at `/karl`. Formerly its own site (mstr.hvalec.com / mstr-site repo) — now a self-contained Node build living inside the `personal-site` repo. Jekyll excludes this directory entirely; see the root `README.md` for how the two builds are combined.

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
3. Link this directory to the Doppler project/config (run once, from `karl/`):
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

Serves `dist/` on `:3002` and rebuilds on changes to `src/`/`partials/`.

## Build

`npm run build` (`scripts/build.js`) checks for a `DOPPLER_TOKEN` environment variable: if it's set (only true in Coolify, never locally), it fetches secrets from Doppler via `@dopplerhq/node-sdk` and injects them for the build only, then runs the real static build (`build:static`), which bakes the resolved value into `dist/assets/js/api-config.js`. If `DOPPLER_TOKEN` isn't set (local dev), it's a zero-overhead passthrough straight to `build:static`.

All paths in the built output are rooted at `/karl` (asset links, internal nav, the header logo, etc.) since this build's output gets copied into `_site/karl` by the root Jekyll build, not served from the domain root.
