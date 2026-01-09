---
layout: default
title: Blog - Hvalec
---

# Blog

My thoughts on games, development, and whatever else catches my attention.

<br/>

{% for post in site.posts reversed %}

  <article>
    <a href="{{ post.url | relative_url }}"><h3 class="post-title">{{ post.title }}</h3>
    <p class="post-date">{{ post.date | date: "%B %d, %Y" }}</p>
    </a>
  </article>
{% endfor %}
