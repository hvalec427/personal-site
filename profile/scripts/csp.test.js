import { test } from "node:test";
import assert from "node:assert/strict";
import { addOriginToConnectSrc } from "./csp.js";

const ORIGIN = "http://localhost:8787";

const page = (csp, body = "") =>
  `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Security-Policy" content="${csp}">
  </head>
  <body>${body}</body>
</html>
`;

const CSP =
  "default-src 'self'; connect-src 'self' https://*.hvalec.com; object-src 'none';";

function connectSrcSources(html) {
  return html
    .match(/connect-src([^;"]*)/)[1]
    .trim()
    .split(/\s+/);
}

test("adds the origin even when the page mentions it outside the CSP", () => {
  const html = page(
    CSP,
    `<!-- API: ${ORIGIN} --><a href="${ORIGIN}/docs">docs</a>`,
  );
  const patched = addOriginToConnectSrc(html, ORIGIN);
  assert.ok(
    patched.includes(`connect-src 'self' https://*.hvalec.com ${ORIGIN};`),
  );
  assert.ok(patched.includes(`<a href="${ORIGIN}/docs">`));
});

test("running twice adds the origin only once", () => {
  const html = page(CSP, `<a href="${ORIGIN}/docs">docs</a>`);
  const once = addOriginToConnectSrc(html, ORIGIN);
  const twice = addOriginToConnectSrc(once, ORIGIN);
  assert.equal(twice, once);
  assert.equal(connectSrcSources(twice).filter((s) => s === ORIGIN).length, 1);
});

test("leaves the page unchanged when the origin is already a connect-src source", () => {
  const html = page(
    `default-src 'self'; connect-src 'self' ${ORIGIN}; object-src 'none';`,
  );
  assert.equal(addOriginToConnectSrc(html, ORIGIN), html);
});

test("patches connect-src when it is the last directive without a trailing semicolon", () => {
  const html = page("default-src 'self'; connect-src 'self'");
  const patched = addOriginToConnectSrc(html, ORIGIN);
  assert.ok(patched.includes(`connect-src 'self' ${ORIGIN}"`));
});

test("a source that only starts with the origin does not count as present", () => {
  const html = page(
    "default-src 'self'; connect-src 'self' http://localhost:87870;",
  );
  const patched = addOriginToConnectSrc(html, ORIGIN);
  assert.ok(
    patched.includes(`connect-src 'self' http://localhost:87870 ${ORIGIN};`),
  );
});

test("leaves pages without a connect-src directive unchanged", () => {
  const html = page("default-src 'self'; object-src 'none';");
  assert.equal(addOriginToConnectSrc(html, ORIGIN), html);
});
