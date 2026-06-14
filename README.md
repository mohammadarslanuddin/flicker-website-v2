# Flicker — Home page

Implementation of the **Home** page from the *Flicker Site v2* design bundle
(Claude Design handoff). This is a **self-contained static port**: the original
prototype is a React + GSAP + Lottie page that compiles its JSX in the browser
via Babel. All libraries, fonts, icons, and avatars are vendored locally, so the
site makes **zero external network requests**.

## Run it

The JSX components are loaded as `type="text/babel"` and fetched over HTTP at
runtime, so the page must be served — opening `index.html` via `file://` will not
work (the browser blocks the script fetches).

```bash
# from this folder
python -m http.server 8000
#   then open http://localhost:8000
```

Any static server works (`npx serve`, `php -S`, nginx, etc.). No build step.

## Page composition (`app-v6.jsx`)

`SiteNav → Hero → HowItWorks → Showcase → Growing → Listen( Testimonials →
MemberCTA → FAQ → Footer )`

Scroll is driven by GSAP **ScrollSmoother**; section seams cross-dissolve via
ScrollTrigger. Several panels render **Lottie** animations (`uploads/*.json`).

## Structure

```
index.html                 entry (was Home.html); all <script>/<link> point at /vendor
app-v6.jsx                 app root + ScrollSmoother init + section composition
*-v6.jsx, site-nav.jsx     section components (compiled in-browser by Babel)
image-slot.js              <image-slot> custom element (Member-CTA media slot)
flicker/                   colors_and_type.css (design tokens) + GT-Super fonts + brand SVGs
uploads/                   Lottie JSON, background SVGs, audio webm, avatars/
books/                     book cover art (01–13)
vendor/                    react, react-dom, babel, gsap(+ScrollTrigger,Flip,ScrollSmoother),
                           lottie, phosphor/ (icon CSS+fonts), outfit/ (Outfit webfont)
.image-slots.state.json    empty sidecar so image-slot.js loads without a 404
```

## Notes for production

- **Fonts — GT-Super** (`flicker/fonts/*-Trial.otf`) are **trial** files. Replace
  with a licensed copy before shipping. **Outfit** (UI sans) is open-source
  (Google Fonts), self-hosted under `vendor/outfit/`.
- **GSAP ScrollSmoother** (`vendor/ScrollSmoother.min.js`) is a GSAP Club plugin
  served here as the prototype's trial build — swap for your licensed copy.
- **In-browser Babel** compiles the JSX on every load. Fine for a faithful static
  preview; for a fast production build, precompile the components (e.g. Vite).
- The design tool's **Tweaks** dev panel was intentionally omitted from the
  shipping page (the underlying `useTweaks` state, which the hero reads, is kept).
```
