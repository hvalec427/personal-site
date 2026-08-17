# personal-site

Static personal website (hvalec.com).

## Secrets (Doppler)

The only non-hardcoded config value is `API_BASE_URL` (which `hvalec-api` instance the site talks to). It's stored in Doppler, project **hvalec-site**, not committed to this repo.

1. Install the Doppler CLI:
   ```
   brew install dopplerhq/cli/doppler
   ```
2. Log in (opens a browser to authenticate):
   ```
   doppler login
   ```
3. Link this directory to the Doppler project/config (run once, from the repo root):
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

## Deployment (Coolify)

No Coolify config change needed — the Build Command stays the default `npm run build`/`yarn build`. `npm run build` (`scripts/build.js`) checks for a `DOPPLER_TOKEN` environment variable: if it's set (only true in Coolify, never locally), it fetches secrets from Doppler via `@dopplerhq/node-sdk` and injects them for the build only, then runs the real static build (`build:static`), which bakes the resolved value into `dist/assets/js/api-config.js`. If `DOPPLER_TOKEN` isn't set (local dev), it's a zero-overhead passthrough straight to `build:static`.

For this to work, the Coolify app needs a `DOPPLER_TOKEN` environment variable set to a Doppler **service token** scoped to the `hvalec-site` project and the config you want deployed (e.g. staging/production, not `development_personal`). Generate one in the Doppler dashboard under the project → Access → Service Tokens.
