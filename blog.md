---
permalink: /blog/
title: Blog
---

# Blog

Longer thoughts on development, tooling, and things I find interesting.

{% assign posts = site.blog | sort: 'created' | reverse %}
{% for post in posts %}
### [{{ post.title }}]({{ post.url }})

*{{ post.created }}*
{: .entry-when}

{{ post.description }}

{% endfor %}
