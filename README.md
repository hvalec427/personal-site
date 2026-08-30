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

## Deployment (Coolify)

Build Command: `bundle exec jekyll build && ruby scripts/generate-cv-pdf.rb`
Publish Directory: `/_site`

`nixpacks.toml` adds `chromium` to the build environment so the PDF script has a browser to drive.
