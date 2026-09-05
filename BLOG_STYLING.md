# Blog content & styling reference

What a blog post body can contain, and the CSS classes a frontend needs to
style when rendering posts. Read this before building the public blog view.

## Where posts live

- **Storage:** Postgres `blog_posts` table (`hvalec-api`). Columns: `slug`,
  `title`, `description`, `body` (markdown), `tags`, `status` (`draft` |
  `published`), `date`, `coverAssetId`, timestamps.
- **Body format:** Markdown **+ kramdown attribute lists** (`{: .class}` /
  `{:key="value"}`). Images embedded in the body are R2 URLs
  (`…/images/<uuid>.<ext>`); the files live in the R2 `images/` folder.
- **Authoring:** the admin Blog editor (Writing → Blog) writes this markdown.
  Its toolbar inserts everything below.

## Rendering note (important for FE)

The public site currently renders posts with **Jekyll/kramdown**, which applies
`{: .class}` attribute lists natively. If the new frontend renders `body` itself
(e.g. with `marked`, `markdown-it`, MDX…), that renderer **does not understand
kramdown attribute lists** out of the box — it will emit the `{: …}` as literal
text. You must either:

1. Use a markdown parser with an attribute-list / IAL plugin
   (e.g. `markdown-it-attrs`), **or**
2. Pre-process the body: convert `{: .class}` into real `class="…"` on the
   preceding element (and `{:target="_blank" …}` into link attributes) before/
   after markdown → HTML, **or**
3. Strip the `{: …}` and re-implement sizing your own way.

The admin editor's live preview takes approach (3) — it strips `{: …}` so they
don't show as literal text (the sizing therefore isn't reflected in the admin
preview, only on the rendered site).

## Standard markdown (style these)

`# h1` … `### h3`, **bold**, _italic_, `inline code`, fenced ``` code blocks,
`> blockquote`, `- / 1.` lists, `[text](url)` links, `![alt](url)` images.
Base type/spacing is up to the new design.

## Kramdown constructs used

### Images — size classes

Written as `![alt](url){: .log-image .<size>}`. Defined in
`main/assets/css/log.css`:

| Class (with `.log-image`) | Width | Editor label |
|---|---|---|
| `.log-image` (alone)      | full / block, `margin: .5em 0` | **Full** |
| `.log-image .large`       | 640px (max-width 100%)         | **Large** |
| `.log-image .medium`      | 360px (max-width 100%)         | **Medium** |
| `.log-image .small`       | 220px                          | **Small** |
| `.log-image .very-small`  | 100px                          | **Very small** |
| _(no class)_              | inline default                 | **Plain** |

```css
.log-image            { display: block; margin: 0.5em 0; }
.log-image.large      { width: 640px; max-width: 100%; height: auto; }
.log-image.medium     { width: 360px; max-width: 100%; height: auto; }
.log-image.small      { width: 220px; height: auto; }
.log-image.very-small { width: 100px; height: auto; }
```

Images are often also wrapped in a link (click-to-zoom):
`[![alt](thumb){: .log-image .very-small}](full){:target="_blank" rel="noopener noreferrer"}`.

### Links — open in new tab

`[text](url){:target="_blank" rel="noopener noreferrer"}` → renders an anchor
with `target="_blank" rel="noopener noreferrer"`. No CSS needed; just honor the
attributes.

### Block classes

Applied by putting the attribute list on the line **after** the element. All
defined in `main/assets/css/main.css`:

| Class | Applies to | What it does |
|---|---|---|
| `{: .section-head}` | a heading | section heading — bottom border, uppercase, letter-spacing |
| `{: .photo-gallery}` | a paragraph of images | flex-wrap gallery; `img` forced to 150×150 |
| `{: .profile-photo}` | an image | caps width at 220px |
| `{: .entry-when}` | a line (date/meta) | small, muted (`#555`), indented |

```css
.section-head { margin-top: 1.5rem; padding-bottom: .3rem;
                border-bottom: 2px solid #111; text-transform: uppercase;
                letter-spacing: .08em; }
.photo-gallery      { display: flex; flex-wrap: wrap; gap: .75rem; }
.photo-gallery img  { width: 150px; height: 150px; object-fit: cover; }
.profile-photo      { max-width: 220px; }
.entry-when         { font-size: .82em; color: #555; margin-top: 0; margin-left: 1rem; }
```

## CSS source of truth

- `main/assets/css/log.css` — `.log-image` + size variants.
- `main/assets/css/main.css` — `.section-head`, `.photo-gallery`,
  `.profile-photo`, `.entry-when` (and print-only helpers `.no-print` /
  `.print-only`, not used in blog bodies).

When the blog frontend is built, port these rules (or their design-equivalents)
so posts render as intended. Keep this file in sync if the editor gains new
kramdown helpers.
