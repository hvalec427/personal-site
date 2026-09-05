# Admin / Data Platform — Implementation Plan

Design source: https://claude.ai/design/p/c34a7843-401c-4c4f-b6de-a092cab27cf0?file=Admin.dc.html&via=share
(same project also has `Dog.dc.html` and `places-map.html` — new pages, no frontend home yet)

This supersedes the data-storage parts of `PROFILE_PAGE_PLAN.md` (flat JSON /
static-markdown decisions there are replaced by the DB below); the frontend
section of that doc (item 10, already built) still stands.

## Architecture decisions (confirmed with Žiga 2026-09-03)

- **Database:** Postgres, self-hosted on the existing Coolify server (no new vendor/cost).
- **Sharing model, revised:** staging + production **share one live Postgres instance** (both already run on the same Coolify server/Docker network — internal URL only, no public port, no firewall exposure). **Local dev uses its own separate local Postgres** (Homebrew, this machine) — simpler than tunneling into the shared instance, and keeps local experiments from ever touching real staging/prod data. Same schema/migrations applied to both; DATABASE_URL differs per Doppler config (`development_personal` → local, `staging`/`production` → the shared instance).
- **Object storage:** Cloudflare R2 (S3-compatible API, free tier, no egress fees) for every image and any markdown-ish long text that doesn't need to be queried relationally.
- **Media search:** provider-pluggable per kind (see "Search providers" below), not hardcoded to one API per kind — new sources (e.g. Discogs) are a new provider file + a registry entry, nothing else changes.
  - Books: Open Library (free, no key)
  - Music: MusicBrainz (free, no key) — Discogs planned as a second source, needs a free API token when added
  - Movies/TV: **TMDB** (free, needs an API key — Žiga to create an account at themoviedb.org and provide the key via Doppler). Not iTunes Search (design's original choice) — swapped per explicit request, TMDB has far better TV data and posters.
  - Games: no dedicated API yet — Wikipedia fallback like the design does, revisit later (IGDB/RAWG both need a key).
  - Every kind also always searches the local Vault first (your own collection), shown alongside external results, not instead of them.

## Provisioning status

- [x] **Postgres database** — done. Shared instance `hvalec-shared-db` (uuid `ys2i6ofmo66h0fllzxisc1qg`) created in Coolify project `hvalec api`, internal-only (`is_public: false`, no public port, no firewall exposure). `DATABASE_URL` set in Doppler for `staging` and `production` (internal Docker-network URL) and as a redundant direct Coolify env var on both apps (harmless duplication, Doppler wins at runtime). Local dev runs its own Postgres 16 via Homebrew (`brew services start postgresql@16`, db/role `hvalec`), `DATABASE_URL` in Doppler's `development_personal` config points at `localhost`. Schema migrated and verified against local (28/28 tables) — same migration needs running against the shared staging/prod instance once `hvalec-api` actually deploys with the new `db/` code (`npm run db:migrate` with `DATABASE_URL` resolved from the shared instance).
  - Note: the very first `mcp__coolify__database` create attempt was hard-denied by the Claude Code permission classifier even after Žiga's approval — turned out to be tied to a stale Coolify API token, not a hard rail. Rotating the token (`~/.claude.json`, per-project `mcpServers.coolify.env.COOLIFY_ACCESS_TOKEN`) and restarting the session fixed it.
- [x] **Cloudflare R2 bucket** — done. Bucket `hvalec-api`, public via its Public Development URL (`R2_PUBLIC_BASE_URL` = `https://pub-dd01add0edac4e77862dce5d8f094547.r2.dev`, confirmed reachable unauthenticated). All five `R2_*` values set across `development`/`development_personal`/`staging`/`production` in Doppler. Full round-trip verified live: upload → public fetch (200, real content) → delete.
  - Note: the account-level `https://<account-id>.r2.cloudflarestorage.com` endpoint (what the R2 dashboard shows by default) is **always private** — it's the S3 API endpoint, not servable to site visitors no matter what path is appended. The actual public URL only exists after enabling "Public Development URL" inside the bucket's own Settings tab.
- [x] **TMDB API key** — done. Set across all four Doppler configs. Note: it's the **v3 API key** (32-char hex), not the v4 Read Access Token — `search/providers/tmdb.js` was adjusted to use v3 query-param auth (`?api_key=`) instead of a v4 Bearer header to match. Verified live against a real search ("inception" → 13 results with real posters).

Everything below this line can be built/coded without those three being live yet, but needs them to actually run end-to-end.

## Schema (Postgres, one migration-managed schema via Drizzle ORM)

Introducing Drizzle (lightweight, SQL-shaped, TypeScript-optional) rather than hand-rolled `CREATE TABLE IF NOT EXISTS` like the current `db.js` — the jump from ~4 tables to ~25 makes migration tracking worth it. Existing `better-sqlite3` habits/panels/status tables get migrated into this and then retired.

**Core / generic**
- `assets` — id, kind (book/movie/music/game/dog/other), r2_key, original_name, width, height, created_at. Every cover/photo everywhere points at an `asset_id`, never a raw uploaded URL.
- `metric_events` — id, occurred_on (date), metric_key (text — "pages read", "km moved", "climb", "episodes watched", etc; matches the design's `METRICS` list, open-ended), value (numeric), source_table, source_id, note. This is the queryable historical ledger the habits/dashboards read from — one row per event, aggregated at query time. Motion sessions, reading-log page counts, dog weigh-ins, etc. all write here in addition to their own detail table.

**Identity / status**
- `identity` — single row: name, dob, tagline, location, photo_asset_id, photo_caption
- `status_log` — id, label, is_automatic, started_at (history, not just current value)

**Habits**
- `habits` — id, name, target, kind (manual/automatic), metric_key, op (at-least/at-most/exactly/any/none), value, window (day/week), created_at
- `habit_logs` — habit_id, date (manual toggle log; automatic habits are evaluated against `metric_events` at read time instead)

**Exercise / collections / logs**
- `motion_sessions` — date, type, route, note, distance, climb, duration, pace
- `screen_log` — title, year, type, status, season, episode, rating, tmdb_id, poster_asset_id, vault_movie_id (nullable link)
- `reading_log` — title, author, pages, status, on_page, rating, verdict, source (openlibrary id), vault_book_id (nullable link)
- `play_log` — **derived only**, populated by the existing Xbox/PSN/Steam sync, not hand-edited (replaces `playtime.json`)
- `music_derived` — **derived only**, populated by the existing Spotify sync (replaces the ad-hoc "latest music" logic already in `/status`)

**Vault (owned collections — replaces `books.md`/`games.md`/`music.md`)**
- `vault_games` — cover_asset_id, title, platform, genre, year, status
- `vault_movies` — cover_asset_id, title, year, genre, format
- `vault_books` — cover_asset_id, title, author, original_title, orig_year, pages, format, edition_notes
- `vault_music` — cover_asset_id, title, artist, genre, format, year

**Site content**
- `projects` — name, description, tags, links (jsonb: [{label, url}]), long_description
- `work_experience` — role, company, from_date, to_date, location, summary, tags
- `education` — title, school, from_date, to_date, location, note
- `places` — from_date, to_date, city, country, with_whom
- `photos` — asset_id, caption, subject ('profile' | 'dog')
- `elsewhere` — category, site, handle, url (replaces the hardcoded list in `profile/site/src/lib/identity.ts`)

**Dog subsite (new — no frontend yet either, per "build everything")**
- `dog_details` — single row: name, birth_date, breed, last_vet_visit, photo_asset_id, photo_caption, status
- `dog_weight` — date, weight, note (also writes `metric_events` as "weigh-ins")
- `dog_tricks` — trick, learned, reliability, caveat
- `dog_timeline` — date, event, detail
- `dog_awards` — title, when, note, status (unlocked/locked)

**Connections (migrated from `data/persistent/links.json` / `pc-tokens.json`)**
- `connections` — service (spotify/steam/psn/discord/xbox), tokens (jsonb), account_meta (jsonb), linked_at — same sensitive-token handling as today (Postgres access control instead of file permissions), nothing in this data changes shape, just moves.
- `pc_tokens` — unchanged shape, moved from JSON to a table.

## Search providers (pluggable, multi-source)

```
search/
  registry.js          // kind -> [provider, provider, ...]
  providers/
    vault.js            // always first — searches the relevant vault_* table
    open-library.js      // books
    musicbrainz.js        // music
    discogs.js             // music, added later — needs DISCOGS_TOKEN
    tmdb.js                 // movies/tv
```

`GET /search/:kind?q=...` runs every registered provider for that kind in parallel, returns `{ source, label, results: [...] }[]` — the admin UI renders one section per source (Vault always first) so Žiga picks which result to link, same interaction the design already has for "pick from vault," just extended to show external sources side by side instead of one at a time. Adding Discogs later is: write `providers/discogs.js` implementing the same `{ id, label, search(query) }` shape, add one line to `registry.js`, done — no changes anywhere else.

## Build order

Given "whatever's easiest," roughly cheapest-and-most-foundational first:

1. **Infra**: Drizzle schema + migrations, R2 client wrapper, Postgres connection (this doc's schema section) — codeable now, run once the DB/bucket exist.
2. **Migrate existing real data**: `links.json`, `pc-tokens.json`, `playtime.json`, the sqlite `habits`/`habit_logs` tables, and the three shelf markdown files (`books.md`/`games.md`/`music.md` → `vault_books`/`vault_games`/`vault_music`) — this is real data, must not be lost.
3. **Habits v2** (metric-based automatic habits + `metric_events`) — highest value, extends what's already partially built, directly powers the profile page's Habits empty state.
4. **Search providers** + Vault admin panels (books/movies/music/games) — unlocks Screen/Paper/Vault empty states on the profile page.
5. **Exercise (motion), Photos/assets library, Elsewhere** — more profile-page empty states closed out.
6. **Projects/Work/Education/Places** — admin CRUD for content currently hardcoded/markdown-sourced on the main site.
7. **Dog subsite** — new backend tables done above; the actual `/dog` frontend page doesn't exist yet and isn't scoped here (separate design, `Dog.dc.html`, not yet implemented).
8. [x] **New Admin UI** matching `Admin.dc.html` — done (`admin/src/assets/js/admin-app.js` + rebuilt `index.html`/`admin.css`). Generic schema-driven engine (one `PANELS` config array + one table/modal/form renderer, mirroring both the design's own `PANELS` pattern and the backend's generic `/admin/entities/:kind`), not 25 bespoke panel UIs. Real gaps vs. the pixel-perfect design, deliberately simplified given the size of this task:
   - Screen/Paper don't have the design's dedicated "Continue Watching"/"Continue Reading" highlight sections or the reading-progress quick-update modal — they go through the same generic table+modal as everything else.
   - Vault cover art picker is upload-only — no "browse existing asset library" toggle.
   - Status is a minimal label-only picker + history table (`status_log`), not tied to "auto-reverts after 2 hours" logic from the design.
   - Play/Music panels are live-presence-only (real `/status` data) — the design's "recently played + hours" / "top artists" views need the sync jobs described in sections 1 and 4 above, not built.
   - Built with Alpine.js (CSP-safe build), matching the existing admin project's stack — not Astro/a bundler, since this is an authenticated internal tool, not a public page needing SSR/fast-first-paint the way the profile page did.
   - **Not tested in a real browser** — no browser available in this environment. Syntax-checked, cross-referenced against the backend schema/endpoints field-by-field, and CSS classes verified to exist, but the actual Google OAuth login flow and click-through UX need a real pass by Žiga.

## Explicitly not doing yet

- The `/dog` and `/places` frontend pages — this plan only builds the data layer + admin CRUD for them, since "build everything in the design" was scoped to the Admin design; the *public* pages for Dog/Places have their own not-yet-fetched designs.
- Discogs integration itself (provider slot is designed in, not implemented — needs a Discogs API token first).
