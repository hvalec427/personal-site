# personal-site

Static personal website (hvalec.com). Fully static, no JavaScript, no build-time secrets — the professional counterpart to mstr.hvalec.com.

## Deployment (Coolify)

No config needed beyond the default Build Command (`npm run build`/`yarn build`). `npm run build` runs `scripts/build.js`, which just runs `build:static` (copies `src/` + `public/` into `dist/` and runs `scripts/build-content.js` to render blog/log Markdown into HTML).
