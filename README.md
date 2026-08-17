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

This is a static site build with no server process at runtime, so secrets have to be resolved at build time. Coolify's **Build Command** should be:

```
npm run deploy
```

instead of the plain `npm run build`. That script (`scripts/deploy.js`) uses `@dopplerhq/node-sdk` to fetch secrets straight from Doppler's API — no CLI, no `.env` on disk — and runs the build with them injected for that process only. The built `dist/` output just has the resolved value baked into `assets/js/api-config.js`.

For this to work, the Coolify app needs a `DOPPLER_TOKEN` environment variable set to a Doppler **service token** scoped to the `hvalec-site` project and the config you want deployed (e.g. staging/production, not `development_personal`). Generate one in the Doppler dashboard under the project → Access → Service Tokens.
