# Personal Spec Sheet — Implementation Plan

Design source: https://claude.ai/design/p/6852d099-2d72-4399-b625-889be466492b?file=Profile.dc.html&via=share

Target: `/karl` (mstr.hvalec.com), backed by the separate `hvalec-api` service.

## Existing building blocks (already in place)

- `hvalec-api`: Express + flat JSON persistence (`data/persistent/*.json`), no DB. Already has full OAuth integrations for **Spotify, Steam, Xbox, PSN, Discord**, a Google-login-gated `/admin`, and a token-authed push pattern (`requirePcToken` → `POST /pc-status`) for trusted external sources.
- `karl/src/shelves/`: static markdown tables — `books.md`, `games.md`, `music.md`.
- `karl/src/logs/`: dated activity-log entries.
- `_blog/`: existing blog posts (Writing section source).

Everything below reuses these patterns rather than introducing new ones (no new DB, no new auth style) unless noted.

## 1. Music — history + favorites

**What's missing:** current integration only exposes now-playing (`/spotify-status`), no history or top artists/albums.

- [ ] Add `user-top-read` scope to the Spotify OAuth flow, re-consent.
- [ ] New endpoint(s): top artists / top albums (direct call to Spotify's `/me/top/*`, no storage needed).
- [ ] Periodic snapshot job to build real listening history (Spotify's recently-played endpoint only holds the last 50) — append to a `data/persistent/spotify-history.json`.
- [ ] Frontend widget: Top Artists list + ticker/ "Currently" card wiring.

**Estimate:** 0.5–1 day

## 2. Screens — movies/shows ("mini Trakt")

**What's missing:** nothing exists yet.

- [ ] Data model: `{ title, year, type (movie/show), rating, watchedAt, tmdbId, poster }`.
- [ ] TMDB API integration (free key) for search + poster/metadata lookup.
- [ ] New persistent store, e.g. `data/persistent/watched.json`.
- [ ] Admin UI: search TMDB, pick a match, log watched date + rating + optional note.
- [ ] Public endpoint + widget: recently watched, paginated.
- [ ] One-time Trakt export import script (parse the export zip/CSV, map to entries, dedupe by TMDB id) — run once locally, not a standing feature.

**Estimate:** 2–3 days (largest single piece)

## 3. Paper — recently read books

**Decision:** no database — extend the existing static `books.md`.

- [ ] Add frontmatter/columns to `books.md`: date read, rating.
- [ ] Build-time script (in `karl/scripts/build-content.js`) to parse the "read" entries into the Recently Read widget.
- [ ] No backend changes needed.

**Estimate:** 0.5 day

## 4. Play — already integrated

- [ ] Reshape existing Steam/Xbox/PSN status + `playtime.json` data into the "Recently Played" / hours widgets from the design.
- [ ] No new integration work.

**Estimate:** 0.5 day

## 5. Activity Log

- [ ] Merge Music history + Screens + Paper + Play + blog posts into one time-sorted feed.
- [ ] Decide build-time (static merge at deploy) vs. runtime (client fetch + merge) — build-time is simpler and matches the rest of the static site.

**Estimate:** 0.5–1 day

## 6. Writing

- [ ] Point the Writing section widget at existing `_blog/` posts (title, date, link).
- [ ] Already fully sourced — no new data needed.

**Estimate:** trivial

## 7. Vault — everything owned

- [ ] Aggregate `books.md` + `games.md` + `music.md` into one grid at build time (JSON generated from the markdown tables).
- [ ] Client-side filter (by kind) + sort (recent/year/rating), matching the design's vault controls.

**Estimate:** 0.5–1 day

## 8. Habit tracker

**What's missing:** nothing exists yet. Manual-only (no single natural API for habits).

- [ ] New stores: `habits.json` (definitions: name, cadence) + a per-date completion log.
- [ ] Admin UI: create/edit habits, toggle today done/not done, backfill a past date.
- [ ] Public viewer: streak / contribution-grid per habit.

**Estimate:** 1–1.5 days

## 9. Runs / hikes

**Decisions made:**
- GPX file is **stored and downloadable only** for v1 — no map rendering, no track parsing. Time/distance/pace are entered manually.
- Automatic source is **undetermined/custom** for now. Rather than build a specific integration, expose a generic authenticated ingest endpoint mirroring the existing `/pc-status` → `requirePcToken` pattern. Whatever custom source gets built later just needs a token and POSTs JSON matching the schema — no backend changes needed at that point.

- [ ] Data model: `{ type (run/hike), date, duration, distance, pace (derived), gpxFile? }`.
- [ ] New store: `data/persistent/activities.json` + raw GPX files on disk.
- [ ] `POST /activities` guarded by token auth (same pattern as `/pc-status`) — the future automatic path.
- [ ] Admin UI form (manual path): upload GPX, enter time/distance, pace auto-computed. Writes to the same store.
- [ ] Public list widget: date, type, time, pace, download link for the GPX.

**Estimate:** 1.5–2 days

## 10. Building the actual page

- [ ] Port the design's layout, ticker, mood picker, theme toggle, and vault filter/sort into `karl`'s existing vanilla-JS static-site pattern (matching `now-playing.js` style — no framework).
- [ ] Wire each section to its real data source from the items above.

**Estimate:** 1–2 days

---

## Total estimate

**~9–13 focused engineering days** end to end, assuming standard hand-written pace.

**With heavy AI assistance** (pattern-matching against existing OAuth/admin/persistence code, generating the page from the already-extracted design markup): realistically **~3–5 days of elapsed effort**. The floor doesn't drop much below that because parts of the total are inherently human-only regardless of coding speed:
- registering real credentials with external services (TMDB key)
- clicking through real OAuth consent screens to test
- the one-time Trakt export (needs the actual export file)
- real data entry (your actual habits, your actual run/hike history, book covers)
- your review/testing pass on each piece before it ships

Screens remains the largest single piece either way — most moving parts (TMDB, admin UI, import script, real content).
