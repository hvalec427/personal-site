# personal-site

Static personal website (hvalec.com). Three independent frontend projects, each built on its own, assembled into one shared `dist/` for serving:

- **`main/`** — the Jekyll site (hvalec.com itself). Fully static, no client-side JavaScript.
- **`profile/`** — `/profile` (formerly `karl/`, formerly its own site, mstr.hvalec.com / mstr-site repo), the non-professional counterpart. Separate Node-based static build (own `package.json`, `src/`, `partials/`, `scripts/`). The homepage itself (`profile/site/`) is a prerendered Astro app — see `profile/README.md`. Everything else under it (logs, recipes, shelves, changelog, uses, secret, 404) is still the original bundler-free static build with client-side JS for its own widgets (theme toggle, copy-code, easter egg).
- **`admin/`** — `/admin`, the admin panel (Spotify/Xbox/Steam/PSN/Discord connections, device tokens, and the growing Habits/Collections/etc. tabs). Alpine.js (the CSP-safe build — see `admin/src/index.html`'s CSP meta tag), no bundler. See `admin/README.md`.

Each project builds into its own `dist/` and knows nothing about the other two — `main/` doesn't exclude or embed `profile/`/`admin/` the way it used to, they're just separate sibling folders. The root `package.json` is purely an orchestrator: it runs each project's own build, then copies `profile/dist` → `dist/profile` and `admin/dist` → `dist/admin`, so the final `dist/` at the repo root is what actually gets served, matching the site's real URL structure (`/`, `/profile`, `/admin`).

## Local development

Build everything and check the result:

```
API_BASE_URL=http://localhost:4000 npm run build:dev
npx serve dist -l 3000
```

(`API_BASE_URL` normally comes from Doppler per-project — see `profile/README.md` / `admin/README.md`. The placeholder above is only for previewing pages that don't need the API.)

To iterate on just one project, work inside it directly (e.g. `cd profile && npm run dev`) — no need to rebuild the other two while doing so. Run the root build again when you want to check how it all fits together.

## The CV PDF

`main/assets/ziga-hvalec-cv.pdf` is generated from the built homepage itself — `main/scripts/generate-cv-pdf.rb` serves the root `dist/` locally and prints `index.html` to PDF with headless Chromium (the site's own `@media print` rules in `main/assets/css/main.css` hide the footer and the "Download PDF" link for the print version). There's only one source of content: `main/index.md`.

It runs automatically on every deploy (see Build Command below). To regenerate it locally after editing `main/index.md`:

```
npm run build:main:dev
npm run finalize
```

Requires a Chrome/Chromium binary on the machine (checks `CHROME_PATH`, then `chromium`, `chromium-browser`, `google-chrome` on PATH, then the macOS Chrome app bundle).

The PDF itself isn't committed — it's generated fresh into `dist/assets/` on every build/deploy, so it's git-ignored.

## Site URL per environment

`main/_config.yml` defaults `url` to `http://localhost:3000` for local dev. Staging and production override it by merging an extra config file at build time, so internal links (and the ones printed into the PDF) always point at the right domain instead of the build machine's localhost:

- Staging: `main/_config_staging.yml` → `https://staging.hvalec.com`
- Production: `main/_config_production.yml` → `https://hvalec.com`

## Deployment (Coolify)

**Build Command changed with the three-project split — see the note below before updating Coolify.**

Staging Build Command: `npm run build:staging`
Production Build Command: `npm run build`
Publish Directory: `/dist`

`nixpacks.toml` adds `chromium` (plus `fontconfig`/`dejavu_fonts`) so the PDF script has a browser to drive, `nodejs_22` so `profile`'s and `admin`'s builds can run, and now explicitly adds `ruby_3_3` + `bundler` — previously nixpacks auto-detected Ruby from a root-level `Gemfile`, but that now lives in `main/`, so auto-detection no longer fires and Ruby has to be requested explicitly.

`profile`'s and `admin`'s builds each need their own `DOPPLER_TOKEN` env var on this Coolify app (service tokens scoped to their own Doppler projects) to resolve `API_BASE_URL` and any other secrets at build time — see `profile/README.md` / `admin/README.md`.

**Action needed:** the Coolify Build Command and Publish Directory for both the staging and production `personal-site` apps still have the old pre-split values and need updating to the ones above — I didn't change them myself since that's live deploy config. `ADMIN_REDIRECT_URL` (a Doppler secret used by `hvalec-api` for the post-login redirect) also needs updating from wherever it currently points (`.../karl/admin`, the old pre-split path — unaffected by the later `karl/` → `profile/` rename since that value lives in Doppler, not this repo) to `.../admin`, in both the staging and production Doppler configs, or logging into `/admin` will redirect somewhere that no longer exists.
