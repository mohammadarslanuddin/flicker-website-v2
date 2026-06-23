# Archived: `home-v2` (the "Home A" / v7 composition)

This directory preserves the **`/home-v2` route** and everything that was used
**exclusively** by it. It was archived (not deleted) on 2026-06-23 so the design
is kept in the repository but fully removed from the active application.

`home-v2` was an alternate home-page composition (`app-v7`) that reused most of
the shipping v6 sections but redesigned three of them. The live home page (`/`,
`components/app-v6`) is unaffected.

## What's here (original paths preserved)

| Archived path | Original path | Role |
| --- | --- | --- |
| `app/home-v2/page.jsx` | `app/home-v2/page.jsx` | The route. Mounted `app-v7` client-only. |
| `components/app-v7.jsx` | `components/app-v7.jsx` | The v7 page composition. |
| `components/hero-sequence-v7.jsx` | `components/hero-sequence-v7.jsx` | `HeroSequenceV7` — pinned hero→how-it-works morph. |
| `components/member-cta-v7.jsx` | `components/member-cta-v7.jsx` | `MemberCTAV7` — mirrored CTA card with browser mockup. |
| `components/testimonials-v7.jsx` | `components/testimonials-v7.jsx` | `TestimonialsV7` — pastel flying-card reader stories. |
| `components/hero-v7.jsx` | `components/hero-v7.jsx` | `HeroV7` — an earlier static v7 hero. **Orphan**: was not imported by `app-v7` (superseded by `hero-sequence-v7`); archived because it belongs to the same effort. |
| `public/home-v7/*` | `public/home-v7/*` | Images/SVG used only by the v7 components (app-container.svg, browser-mockup.png, cta-bg.jpg, flying-cards-1..3.jpg). |

## Shared assets intentionally LEFT in the active app

These are referenced by `home-v2` **and** the live home page, so they stayed put:

- `uploads/Home-Books.json`, `uploads/Book-Detail.json`,
  `uploads/Book-Detail-Reading-v2.json` — Lottie clips also used by
  `components/how-it-works-v6.jsx`.
- `uploads/avatars/*` — also used by `components/growing-v6.jsx`.
- `flicker/app-icon.svg`, `books/*.png` — shared brand/cover assets.
- `components/site-nav.jsx`, `showcase-v6.jsx`, `growing-v6.jsx`,
  `listen-v6.jsx`, `faq-v6.jsx`, `footer-v6.jsx`, `tweaks-panel-v6.jsx` —
  shared sections used by `app-v6`.

## To restore

Move each file back to its original path (the table above), and move
`public/home-v7` back to `public/`. The relative import in
`app/home-v2/page.jsx` (`../../components/app-v7`) and the components'
`home-v7/...` asset paths already match the original layout, so a straight
move back is sufficient — no code edits required.
