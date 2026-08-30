---
permalink: /blog/
title: Blog
---

# Blog

Longer thoughts on development, tooling, and things I find interesting.

<ul class="blog-list">
{% assign posts = site.blog | sort: 'created' | reverse %}
{% for post in posts %}
  <li><a href="{{ post.url }}">{{ post.title }}</a></li>
{% endfor %}
</ul>
