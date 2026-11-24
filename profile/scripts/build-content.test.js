import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// build-content.js resolves ROOT from its own location and runs on import, so
// each test copies it into a throwaway tree (tmp/scripts, tmp/partials,
// tmp/src, tmp/dist) and runs it as a child process — the real src/ and dist/
// are never touched.
const SCRIPT = fileURLToPath(new URL("./build-content.js", import.meta.url));

const DRAFT_NOTICE = "Draft</strong> — hidden in production";

const DRAFTS = [
  ["logs", "secret-log", "Secret Log"],
  ["recipes", "secret-recipe", "Secret Recipe"],
];
const PUBLISHED = [
  ["logs", "published-log", "Published Log"],
  ["recipes", "published-recipe", "Published Recipe"],
];

function md(meta, body) {
  const lines = Object.entries(meta)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  return `---\n${lines}\n---\n\n${body}\n`;
}

let tmp;

const src = (rel) => join(tmp, "src", rel);
const writeSrc = (rel, content) => writeFileSync(src(rel), content);
const exists = (rel) => existsSync(join(tmp, "dist", rel));
const read = (rel) => readFileSync(join(tmp, "dist", rel), "utf8");

// Mirrors `rm -rf dist && mkdir -p dist && cp -R src/. dist/` in build:static.
function copySrc() {
  rmSync(join(tmp, "dist"), { recursive: true, force: true });
  cpSync(join(tmp, "src"), join(tmp, "dist"), { recursive: true });
}

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "profile-build-content-"));
  writeFileSync(join(tmp, "package.json"), JSON.stringify({ type: "module" }));
  mkdirSync(join(tmp, "scripts"));
  copyFileSync(SCRIPT, join(tmp, "scripts/build-content.js"));
  mkdirSync(join(tmp, "partials"));
  writeFileSync(
    join(tmp, "partials/header.html"),
    "<header>FIXTURE-HEADER</header>\n",
  );
  writeFileSync(
    join(tmp, "partials/footer.html"),
    "<footer>FIXTURE-FOOTER</footer>\n",
  );
  for (const dir of ["logs", "recipes", "shelves"]) {
    mkdirSync(src(dir), { recursive: true });
  }

  writeSrc(
    "logs/published-log.md",
    md(
      { title: "Published Log", created: "2026-01-02" },
      "One line.\n\n```\necho hi\n```",
    ),
  );
  writeSrc(
    "logs/secret-log.md",
    md(
      { title: "Secret Log", created: "2026-01-03", draft: "true" },
      "Secret line.",
    ),
  );
  writeSrc(
    "recipes/published-recipe.md",
    md(
      { title: "Published Recipe", created: "2026-01-02", category: "kosilo" },
      "One line.\n\n| a | b |\n| - | - |\n| 1 | 2 |",
    ),
  );
  writeSrc(
    "recipes/secret-recipe.md",
    md(
      {
        title: "Secret Recipe",
        created: "2026-01-03",
        category: "kosilo",
        draft: "true",
      },
      "Secret line.",
    ),
  );
  writeSrc("shelves/books.md", md({ title: "Books", draft: "true" }, "Books."));
  writeSrc("shelves/music.md", md({ title: "Music" }, "Music."));
  writeSrc("shelves/games.md", md({ title: "Games" }, "Games."));

  copySrc();
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

// Explicit env so the caller's DEPLOY_ENV never leaks in.
function run(env) {
  return spawnSync(process.execPath, [join(tmp, "scripts/build-content.js")], {
    env: { PATH: process.env.PATH, ...env },
    encoding: "utf8",
  });
}

test("production hides drafts: pages, index entries and raw .md", () => {
  const res = run({ DEPLOY_ENV: "production" });
  assert.equal(res.status, 0, res.stderr);

  for (const [section, slug] of DRAFTS) {
    assert.equal(exists(`${section}/${slug}/index.html`), false);
    assert.equal(exists(`${section}/${slug}.md`), false, `${slug}.md`);
    const index = read(`${section}/index.html`);
    assert.ok(!index.includes(slug), `${section} index links ${slug}`);
    assert.ok(!index.includes("[DRAFT]"), `${section} index has [DRAFT]`);
  }
  assert.equal(exists("shelves/books/index.html"), false);
  assert.equal(exists("shelves/books.md"), false);

  // Raw copies of published content are left alone, so the checks above
  // can't pass just because nothing was copied.
  assert.ok(exists("logs/published-log.md"));
  assert.ok(exists("recipes/published-recipe.md"));
  assert.ok(exists("shelves/music.md"));
});

for (const [label, env] of [
  ["unset", {}],
  ["staging", { DEPLOY_ENV: "staging" }],
]) {
  test(`DEPLOY_ENV ${label} builds drafts with a notice`, () => {
    const res = run(env);
    assert.equal(res.status, 0, res.stderr);

    for (const [section, slug, title] of DRAFTS) {
      assert.ok(read(`${section}/${slug}/index.html`).includes(DRAFT_NOTICE));
      const index = read(`${section}/index.html`);
      assert.ok(index.includes(`href="/profile/${section}/${slug}"`));
      assert.ok(index.includes(`[DRAFT] ${title}`));
    }
    assert.ok(read("shelves/books/index.html").includes(DRAFT_NOTICE));
  });
}

for (const [label, env] of [
  ["unset", {}],
  ["production", { DEPLOY_ENV: "production" }],
]) {
  test(`DEPLOY_ENV ${label} builds published entries with partials inlined`, () => {
    const res = run(env);
    assert.equal(res.status, 0, res.stderr);

    for (const [section, slug, title] of PUBLISHED) {
      const page = read(`${section}/${slug}/index.html`);
      assert.ok(page.includes(title));
      assert.ok(!page.includes(DRAFT_NOTICE));
      const index = read(`${section}/index.html`);
      assert.ok(
        index.includes(`<a href="/profile/${section}/${slug}">${title}</a>`),
        `${section} index should link ${slug} without [DRAFT]`,
      );
    }
    for (const rel of [
      "shelves/index.html",
      "shelves/music/index.html",
      "shelves/games/index.html",
    ]) {
      assert.ok(exists(rel), rel);
    }

    const files = htmlFiles(join(tmp, "dist"));
    assert.ok(files.length >= 7);
    for (const file of files) {
      const html = readFileSync(file, "utf8");
      assert.ok(!html.includes("<!-- include:header -->"), file);
      assert.ok(!html.includes("<!-- include:footer -->"), file);
      assert.ok(html.includes("FIXTURE-HEADER"), file);
      assert.ok(html.includes("FIXTURE-FOOTER"), file);
    }
  });
}

test("an entry without created/date fails the build with a clear message", () => {
  writeSrc("logs/undated.md", md({ title: "Undated" }, "No date."));
  copySrc();
  const res = run({});
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /logs\/undated\.md has no "created:" or "date:"/);
  assert.doesNotMatch(res.stderr, /TypeError/);
});

// Pins current parseFrontmatter behaviour on purpose: without the closing
// `---` the file has no meta, so `draft: true` inside it is ignored. A shelf is
// used because a section entry with no meta would hit the missing-date guard.
test("unclosed frontmatter is treated as no meta (not a draft)", () => {
  writeSrc("shelves/music.md", "---\ntitle: Music\ndraft: true\n\nBody line\n");
  copySrc();
  const res = run({ DEPLOY_ENV: "production" });
  assert.equal(res.status, 0, res.stderr);
  assert.ok(exists("shelves/music/index.html"));
  assert.ok(!read("shelves/music/index.html").includes("hidden in production"));
  assert.ok(exists("shelves/music.md"));
});

test("production: shelves index has no link to a draft shelf", () => {
  const res = run({ DEPLOY_ENV: "production" });
  assert.equal(res.status, 0, res.stderr);
  const index = read("shelves/index.html");
  assert.ok(!index.includes("/profile/shelves/books"), "links draft shelf");
  assert.ok(!index.includes(">Books<"), "lists draft shelf");
  assert.ok(index.includes('<a href="/profile/shelves/music">Music</a>'));
  assert.ok(index.includes('<a href="/profile/shelves/games">Games</a>'));
});

test("non-production: shelves index lists a draft shelf with [DRAFT]", () => {
  const res = run({});
  assert.equal(res.status, 0, res.stderr);
  const index = read("shelves/index.html");
  assert.ok(
    index.includes('<a href="/profile/shelves/books">[DRAFT] Books</a>'),
  );
  assert.ok(index.includes('<a href="/profile/shelves/music">Music</a>'));
  assert.ok(index.includes('<a href="/profile/shelves/games">Games</a>'));
});

test("production without draft shelves: index lists all in order", () => {
  writeSrc("shelves/books.md", md({ title: "Books" }, "Books."));
  copySrc();
  const res = run({ DEPLOY_ENV: "production" });
  assert.equal(res.status, 0, res.stderr);
  const hrefs = [
    ...read("shelves/index.html").matchAll(/href="(\/profile\/shelves\/\w+)"/g),
  ].map((m) => m[1]);
  assert.deepEqual(hrefs, [
    "/profile/shelves/books",
    "/profile/shelves/music",
    "/profile/shelves/games",
  ]);
});
