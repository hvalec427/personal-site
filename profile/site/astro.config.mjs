import { defineConfig } from "astro/config";

// Prerendered (output: 'static') on purpose: this page is read-only and
// needs to open instantly. The shell + everything with a real static source
// (vault, writing, projects) is baked in at build time; anything genuinely
// live (presence, weather, clock, visitor count) hydrates client-side after
// paint, same pattern the rest of profile already uses (now-playing.js etc).
export default defineConfig({
  base: "/profile",
  trailingSlash: "ignore",
  compressHTML: true,
});
