fetch("/karl/assets/latest-posts.json")
  .then((res) => (res.ok ? res.json() : Promise.reject()))
  .then((posts) => {
    const el = document.getElementById("latest-posts");
    if (!el) return;
    for (const { slug, title } of posts) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `/blog/${slug}`;
      a.textContent = title;
      li.appendChild(a);
      el.appendChild(li);
    }
  })
  .catch(() => {});
