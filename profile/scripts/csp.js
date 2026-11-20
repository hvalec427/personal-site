// Adds `origin` to the first CSP connect-src directive in `html`.
// Returns html unchanged if there is no connect-src directive or the origin is
// already a source in it.
//
// The directive ends at `;` or at the closing `"` of the meta tag's content
// attribute (CSP sources use single quotes, so the attribute is double-quoted),
// which covers connect-src being the last directive with no trailing `;`.
// The presence check only looks at the directive's own sources, so a mention of
// the origin elsewhere in the page (a link, a comment) doesn't count.
export function addOriginToConnectSrc(html, origin) {
  return html.replace(/connect-src([^;"]*)/, (match, sources) => {
    if (sources.trim().split(/\s+/).includes(origin)) return match;
    return `connect-src${sources.trimEnd()} ${origin}`;
  });
}
