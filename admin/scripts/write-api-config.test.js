// Tests for write-api-config.js. The script resolves ROOT from its own
// location, so each test copies it into a temp project and runs it there.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "write-api-config.js");

const CSP_HELPER = join(dirname(SCRIPT), "csp.js");

const CSP =
  "default-src 'self'; script-src 'self' https://cloud.umami.is; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cdn.discordapp.com; font-src 'self'; connect-src 'self' https://*.hvalec.com wss://*.hvalec.com https://gateway.umami.is; base-uri 'self'; form-action 'self'; object-src 'none';";

const cspMeta = `<meta
      http-equiv="Content-Security-Policy"
      content="${CSP}"
    />`;

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    ${cspMeta}
    <link rel="icon" type="image/png" sizes="32x32" href="/profile/assets/favicon-32x32.png" />
    <link rel="manifest" href="/profile/assets/site.webmanifest" />
    <link rel="stylesheet" href="/admin/assets/css/admin.css" />
    <script src="/admin/assets/js/api-config.js"></script>
  </head>
  <body>
    <script src="/admin/assets/js/admin.js?v=123"></script>
  </body>
</html>
`;

const SUB_HTML = `<!doctype html>
<html><head>${cspMeta}</head>
<body><script src="/admin/assets/js/admin.js"></script></body></html>
`;

const NOTES_TXT = "connect-src 'self'; /admin/assets/js/admin.js\n";

const tmps = [];
afterEach(() => {
  while (tmps.length) rmSync(tmps.pop(), { recursive: true, force: true });
});

function setup() {
  const tmp = mkdtempSync(join(tmpdir(), "admin-cfg-"));
  tmps.push(tmp);
  mkdirSync(join(tmp, "scripts"));
  mkdirSync(join(tmp, "dist/assets/js"), { recursive: true });
  mkdirSync(join(tmp, "dist/sub"));
  copyFileSync(SCRIPT, join(tmp, "scripts/write-api-config.js"));
  copyFileSync(CSP_HELPER, join(tmp, "scripts/csp.js"));
  writeFileSync(join(tmp, "package.json"), JSON.stringify({ type: "module" }));
  writeFileSync(join(tmp, "dist/index.html"), INDEX_HTML);
  writeFileSync(join(tmp, "dist/sub/page.html"), SUB_HTML);
  writeFileSync(join(tmp, "dist/notes.txt"), NOTES_TXT);
  return tmp;
}

function run(tmp, apiBaseUrl) {
  const env = { ...process.env };
  delete env.API_BASE_URL;
  if (apiBaseUrl !== undefined) env.API_BASE_URL = apiBaseUrl;
  return spawnSync(process.execPath, [join(tmp, "scripts/write-api-config.js")], {
    env,
    encoding: "utf8",
  });
}

const read = (tmp, rel) => readFileSync(join(tmp, rel), "utf8");
const cspOf = (html) => html.match(/content="([^"]*connect-src[^"]*)"/)[1];
const count = (haystack, needle) => haystack.split(needle).length - 1;

const EXPECTED_CSP = CSP.replace(
  "https://gateway.umami.is;",
  "https://gateway.umami.is http://localhost:3001;",
);

test("exits 1 and writes nothing when API_BASE_URL is unset", () => {
  const tmp = setup();
  const res = run(tmp, undefined);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /API_BASE_URL/);
  assert.equal(existsSync(join(tmp, "dist/assets/js/api-config.js")), false);
  assert.equal(read(tmp, "dist/index.html"), INDEX_HTML);
});

test("writes api-config.js and appends only the origin to connect-src", () => {
  const tmp = setup();
  const res = run(tmp, "http://localhost:3001/v1");
  assert.equal(res.status, 0, res.stderr);

  const config = read(tmp, "dist/assets/js/api-config.js");
  assert.ok(config.includes('window.API_BASE_URL = "http://localhost:3001/v1";'));
  assert.match(config, /window\.ADMIN_BUILD_TIME = "\d{4}-\d{2}-\d{2}T[^"]+Z";/);

  const html = read(tmp, "dist/index.html");
  assert.equal(cspOf(html), EXPECTED_CSP);
  assert.ok(!html.includes("localhost:3001/v1"));
});

test("is idempotent: origin appears once after two runs", () => {
  const tmp = setup();
  assert.equal(run(tmp, "http://localhost:3001/v1").status, 0);
  assert.equal(run(tmp, "http://localhost:3001/v1").status, 0);
  const html = read(tmp, "dist/index.html");
  assert.equal(count(html, "http://localhost:3001"), 1);
  assert.equal(cspOf(html), EXPECTED_CSP);
});

test("cache-busts /admin/assets refs once and leaves /profile/assets alone", () => {
  const tmp = setup();
  assert.equal(run(tmp, "http://localhost:3001").status, 0);
  const html = read(tmp, "dist/index.html");

  assert.match(html, /\/admin\/assets\/js\/admin\.js\?v=\d+"/);
  assert.ok(!html.includes("?v=123"));
  assert.doesNotMatch(html, /\?v=\d+\?v=/);

  const refs = [...html.matchAll(/\/admin\/assets\/[^"'?]+\.(?:js|css)([^"']*)/g)];
  assert.equal(refs.length, 3);
  for (const [ref, suffix] of refs) assert.match(suffix, /^\?v=\d+$/, ref);

  assert.ok(html.includes('href="/profile/assets/favicon-32x32.png"'));
  assert.ok(html.includes('href="/profile/assets/site.webmanifest"'));
});

test("processes nested HTML and leaves non-HTML files untouched", () => {
  const tmp = setup();
  const before = readFileSync(join(tmp, "dist/notes.txt"));
  assert.equal(run(tmp, "http://localhost:3001").status, 0);

  const sub = read(tmp, "dist/sub/page.html");
  assert.equal(cspOf(sub), EXPECTED_CSP);
  assert.match(sub, /\/admin\/assets\/js\/admin\.js\?v=\d+"/);

  assert.deepEqual(readFileSync(join(tmp, "dist/notes.txt")), before);
});

test("fails on a scheme-less API_BASE_URL instead of writing null into the CSP", () => {
  const tmp = setup();
  const res = run(tmp, "localhost:3001");
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /API_BASE_URL/);
  assert.equal(existsSync(join(tmp, "dist/assets/js/api-config.js")), false);
  const html = read(tmp, "dist/index.html");
  assert.equal(html, INDEX_HTML);
  assert.ok(!cspOf(html).includes("null"));
});
