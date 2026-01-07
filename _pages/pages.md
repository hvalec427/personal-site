---
layout: default
title: Pages Index
---

# Pages

<ul>
  <li><a href="/robots.txt">/robots.txt</a></li>
  <li><a href="/sitemap.xml">/sitemap.xml</a></li>
  {% for page in site.pages %}
    <li><a href="{{ page.url }}">{{ page.url | remove: ".md" }}</a></li>
  {% endfor %}
  {% for log in site.logs %}
    <li><a href="{{ log.url | relative_url }}">{{ log.url | replace: ".md", "" }}</a></li>
  {% endfor %}
  {% for post in site.posts %}
    <li><a href="{{ post.url | relative_url }}">{{ post.url | replace: ".md", "" }}</a></li>
  {% endfor %}
</ul>