---
layout: default
title: Pages Index
---

# Pages

<ul>
  <li><a href="/robots.txt">/robots.txt</a></li>
  <li><a href="/sitemap.xml">/sitemap.xml</a></li>
  {% for page in site.pages %}
    <li><a href="{{ page.url | remove: "/" | prepend: "/" }}">{{ page.url | remove: ".md" | remove: "/" | prepend: "/" }}</a></li>
  {% endfor %}
</ul>
