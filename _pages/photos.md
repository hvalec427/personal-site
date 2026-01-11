---
layout: photos
title: Photos
---

{% assign sorted_photos = site.photos | sort: 'date' | reverse %}
{% for image in sorted_photos %}
  <div class="photos-item">
    <a href="{{ image.permalink }}">
      <img
        src="/assets/images/{{ image.thumbnail }}"
        alt="{{ image.title }}"
        loading="lazy"
        class="photos-thumbnail"
      />
      <div class="photos-overlay">
        <span class="photos-date">
          {% assign date = image.date | date: "%B %d, %Y" %} {{ date }}
        </span>
      </div>
    </a>
  </div>
{% endfor %}
