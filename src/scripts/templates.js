function escapeHtml(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function baseTemplate({
  title,
  bodyHtml,
  assetPrefix = '',
  additionalStyles = [],
}) {
  const pageTitle = title ?? 'Hvalec';
  const normalizedStyles = additionalStyles
    .map(style => `<link rel="stylesheet" href="${assetPrefix}${style}">`)
    .join('\n    ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(pageTitle)}</title>
    <link rel="stylesheet" href="${assetPrefix}css/main.css">
    ${normalizedStyles}
    <script src="${assetPrefix}js/theme-toggle.js"></script>
</head>

<body>
    <header>
      <h1 class="header">
        <a href="/" class="header-link">Hvalec<span class="header-dot">.</span></a>
      </h1>
      <div class="header-buttons">
        <button id="theme-toggle" class="theme-toggle" onclick="toggleTheme()">
          🌙
        </button>
      </div>
    </header>

    ${bodyHtml}

    <footer>
      <span class="footer-copyright">© 2025, All rights reserved.</span>
      <div class="footer-links">
        <a
          href="https://github.com/hvalec427"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
          >GitHub</a
        >
        <a
          href="https://www.linkedin.com/in/hvalec/"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
          >LinkedIn</a
        >
        <a href="${assetPrefix}assets/cv.pdf" download class="cv-button">Download CV</a>
      </div>
    </footer>
</body>
</html>`;
}

export function pageTemplate({ frontmatter, contentHtml }) {
  const bodyHtml = `<main class="markdown">
${contentHtml}
</main>`;

  const additionalStyles = frontmatter.styles?? [];

  return baseTemplate({
    title: frontmatter.title,
    bodyHtml,
    additionalStyles,
    assetPrefix: '../',
  });
}

export function articleTemplate({ title, contentHtml, date, slug, excerpt }) {
  const dateHtml = date
    ? `<div class="article-date">${escapeHtml(date)}</div>`
    : '';
  const bodyHtml = `<main class="markdown"><div class="article-container">
    <nav class="article-nav">
        <a href="../blog.html" class="back-link">← Back to Blog</a>
    </nav>
    <article class="article">
        <header class="article-header">
            <h1 class="article-title">${escapeHtml(title)}</h1>
            ${dateHtml}
        </header>
        <div class="article-content">
            ${contentHtml}
        </div>
    </article>
</div>`;

  const finalizedBodyHtml = bodyHtml.replace(/<\/div>\s*$/, '</div></main>');

  return baseTemplate({
    title: `${title} - Hvalec`,
    bodyHtml: finalizedBodyHtml,
    assetPrefix: '../../',
    additionalStyles: ['css/article.css'],
  });
}
