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
// test copies it into a throwaway tree (tmp/scripts + tmp/dist) and runs it
// as a child process — the real dist/ is never touched.
const SCRIPT = fileURLToPath(new URL("./write-api-config.js", import.meta.url));
const SCRIPTS_DIR = dirname(SCRIPT);
// Local modules write-api-config.js imports. csp.js arrives with ZIGA-4; the
// existence filter keeps this working on either side of that merge.
const HELPERS = ["csp.js"].filter((f) => existsSync(join(SCRIPTS_DIR, f)));

const csp = (connectSrc) =>
  `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src ${connectSrc}; object-src 'none';"></head><body></body></html>\n`;

const FIXTURES = {
  "index.html": csp("'self' https://*.hvalec.com"),
  "nested/page.html": csp("'self' https://*.hvalec.com"),
  "no-csp.html": "<!doctype html><html><head></head><body>hi</body></html>\n",
};

let tmp;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "profile-api-config-"));
  writeFileSync(join(tmp, "package.json"), JSON.stringify({ type: "module" }));
  mkdirSync(join(tmp, "scripts"));
  copyFileSync(SCRIPT, join(tmp, "scripts/write-api-config.js"));
  // Helper modules the script imports (./csp.js) must sit next to the copy.
  for (const helper of HELPERS) {
    copyFileSync(join(SCRIPTS_DIR, helper), join(tmp, "scripts", helper));
  }
  mkdirSync(join(tmp, "dist/assets/js"), { recursive: true });
  mkdirSync(join(tmp, "dist/nested"));
  for (const [name, html] of Object.entries(FIXTURES)) {
    writeFileSync(join(tmp, "dist", name), html);
  }
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

// Explicit env so the caller's API_BASE_URL never leaks in.
function run(env) {
  return spawnSync(
    process.execPath,
    [join(tmp, "scripts/write-api-config.js")],
    { env: { PATH: process.env.PATH, ...env }, encoding: "utf8" },
  );
}

const configPath = () => join(tmp, "dist/assets/js/api-config.js");
const read = (name) => readFileSync(join(tmp, "dist", name), "utf8");

function assertHtmlUntouched() {
  for (const [name, html] of Object.entries(FIXTURES)) {
    assert.equal(read(name), html, `${name} should be unchanged`);
  }
}

for (const [label, env] of [
  ["unset", {}],
  ["empty", { API_BASE_URL: "" }],
]) {
  test(`fails when API_BASE_URL is ${label}`, () => {
    const res = run(env);
    assert.notEqual(res.status, 0);
    assert.match(res.stderr, /API_BASE_URL is not set/);
    assert.equal(existsSync(configPath()), false);
    assertHtmlUntouched();
  });
}

test("writes api-config.js and adds the API origin to connect-src", () => {
  const res = run({ API_BASE_URL: "http://localhost:3001/api" });
  assert.equal(res.status, 0, res.stderr);
  assert.equal(
    readFileSync(configPath(), "utf8"),
    'window.API_BASE_URL = "http://localhost:3001/api";\n',
  );
  for (const name of ["index.html", "nested/page.html"]) {
    assert.ok(
      read(name).includes(
        "connect-src 'self' https://*.hvalec.com http://localhost:3001;",
      ),
      `${name} connect-src should include the origin`,
    );
  }
  assert.equal(read("no-csp.html"), FIXTURES["no-csp.html"]);
});

test("patching connect-src is idempotent", () => {
  const env = { API_BASE_URL: "http://localhost:3001/api" };
  assert.equal(run(env).status, 0);
  const first = Object.keys(FIXTURES).map(read);
  const res = run(env);
  assert.equal(res.status, 0, res.stderr);
  assert.deepEqual(Object.keys(FIXTURES).map(read), first);
  for (const name of ["index.html", "nested/page.html"]) {
    assert.equal(read(name).split("http://localhost:3001").length - 1, 1);
  }
});

test("fails on a scheme-less API_BASE_URL (null origin)", () => {
  const res = run({ API_BASE_URL: "localhost:3001" });
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /"localhost:3001" has no valid origin/);
  assert.match(res.stderr, /include the scheme/);
  assert.equal(existsSync(configPath()), false);
  assertHtmlUntouched();
  for (const name of Object.keys(FIXTURES)) {
    assert.doesNotMatch(read(name), /connect-src[^;]*null/);
  }
});

test("fails on an unparseable API_BASE_URL", () => {
  const res = run({ API_BASE_URL: "api.hvalec.com" });
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /has no valid origin/);
  assert.equal(existsSync(configPath()), false);
  assertHtmlUntouched();
});
