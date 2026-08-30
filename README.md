# personal-site

Static personal website (hvalec.com), built with Jekyll. Fully static, no client-side JavaScript — the professional counterpart to mstr.hvalec.com.

## Local development

```
bundle install
bundle exec jekyll serve
```

## The CV PDF

`assets/ziga-hvalec-cv.pdf` is generated from the built homepage itself — `scripts/generate-cv-pdf.rb` serves `_site/` locally and prints `index.html` to PDF with headless Chromium (the site's own `@media print` rules in `assets/css/main.css` hide the footer and the "Download PDF" link for the print version). There's only one source of content: `index.md`.

It runs automatically on every deploy (see Build Command below). To regenerate it locally after editing `index.md`:

```
bundle exec jekyll build
ruby scripts/generate-cv-pdf.rb
```

Requires a Chrome/Chromium binary on the machine (checks `CHROME_PATH`, then `chromium`, `chromium-browser`, `google-chrome` on PATH, then the macOS Chrome app bundle).

The PDF itself isn't committed — it's generated fresh into `_site/assets/` on every build/deploy, so `assets/ziga-hvalec-cv.pdf` is git-ignored.

## Site URL per environment

`_config.yml` defaults `url` to `http://localhost:3000` for local dev. Staging and production override it by merging an extra config file at build time, so internal links (and the ones printed into the PDF) always point at the right domain instead of the build machine's localhost:

- Staging: `_config_staging.yml` → `https://staging.hvalec.com`
- Production: `_config_production.yml` → `https://hvalec.com`

## Deployment (Coolify)

Staging Build Command: `bundle exec jekyll build --config _config.yml,_config_staging.yml && ruby scripts/generate-cv-pdf.rb`
Production Build Command (once `master` is migrated to Jekyll): `bundle exec jekyll build --config _config.yml,_config_production.yml && ruby scripts/generate-cv-pdf.rb`
Publish Directory: `/_site`

`nixpacks.toml` adds `chromium` (plus `fontconfig`/`dejavu_fonts`) to the build environment so the PDF script has a browser to drive.
