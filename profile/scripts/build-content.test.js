import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The script resolves ROOT from its own location and runs on import, so each
// test copies it into a throwaway tree (tmp/scripts, tmp/partials, tmp/src,
// tmp/dist) and runs it as a child process — the real dist/ is never touched.
const SCRIPT = fileURLToPath(new URL("./build-content.js", import.meta.url));
const PROFILE_DIR = join(dirname(SCRIPT), "..");

const SHELVES = { books: "Books", music: "Music", games: "Games" };

let tmp;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "profile-build-content-"));
  writeFileSync(join(tmp, "package.json"), JSON.stringify({ type: "module" }));
  mkdirSync(join(tmp, "scripts"));
  copyFileSync(SCRIPT, join(tmp, "scripts/build-content.js"));
  mkdirSync(join(tmp, "partials"));
  for (const partial of ["header.html", "footer.html"]) {
    copyFileSync(
      join(PROFILE_DIR, "partials", partial),
      join(tmp, "partials", partial),
    );
  }
  // The SECTIONS loop reads these directories; empty is fine.
  mkdirSync(join(tmp, "src/logs"), { recursive: true });
  mkdirSync(join(tmp, "src/recipes"), { recursive: true });
  mkdirSync(join(tmp, "src/shelves"), { recursive: true });
  mkdirSync(join(tmp, "dist"));
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function writeShelves(drafts = []) {
  for (const [name, label] of Object.entries(SHELVES)) {
    const draftLine = drafts.includes(name) ? "draft: true\n" : "";
    writeFileSync(
      join(tmp, "src/shelves", `${name}.md`),
      `---\ntitle: ${label} Collection\ndescription: Fixture ${name}.\n${draftLine}---\n\nSome ${name}.\n`,
    );
  }
}

// Explicit env so the caller's DEPLOY_ENV never leaks in.
function run(env = {}) {
  const res = spawnSync(
    process.execPath,
    [join(tmp, "scripts/build-content.js")],
    { env: { PATH: process.env.PATH, ...env }, encoding: "utf8" },
  );
  assert.equal(res.status, 0, res.stderr);
  return res;
}

const shelvesIndex = () =>
  readFileSync(join(tmp, "dist/shelves/index.html"), "utf8");

test("production: shelves index omits a draft shelf", () => {
  writeShelves(["music"]);
  run({ DEPLOY_ENV: "production" });
  const html = shelvesIndex();
  assert.doesNotMatch(html, /\/profile\/shelves\/music/);
  assert.doesNotMatch(html, /Music/);
  assert.match(html, /<a href="\/profile\/shelves\/books">Books<\/a>/);
  assert.match(html, /<a href="\/profile\/shelves\/games">Games<\/a>/);
  assert.equal(existsSync(join(tmp, "dist/shelves/music/index.html")), false);
});

test("non-production: draft shelf is listed with a [DRAFT] prefix", () => {
  writeShelves(["music"]);
  run();
  const html = shelvesIndex();
  assert.match(
    html,
    /<a href="\/profile\/shelves\/music">\[DRAFT\] Music<\/a>/,
  );
  assert.match(html, /<a href="\/profile\/shelves\/books">Books<\/a>/);
  assert.match(html, /<a href="\/profile\/shelves\/games">Games<\/a>/);
  assert.equal(existsSync(join(tmp, "dist/shelves/music/index.html")), true);
});

test("production without drafts: all shelves listed in order", () => {
  writeShelves();
  run({ DEPLOY_ENV: "production" });
  const html = shelvesIndex();
  const hrefs = [...html.matchAll(/href="(\/profile\/shelves\/[a-z]+)"/g)].map(
    (m) => m[1],
  );
  assert.deepEqual(hrefs, [
    "/profile/shelves/books",
    "/profile/shelves/music",
    "/profile/shelves/games",
  ]);
  assert.doesNotMatch(html, /\[DRAFT\]/);
});
