# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single static **Home** page for Flicker (an AI book-summaries app), ported from a
React + GSAP + Lottie design prototype. It is **self-contained**: every library, font,
icon, and asset is vendored locally, so the page makes **zero external network requests**.
There is **no build step** — JSX is compiled in the browser by Babel Standalone at runtime.

## Run it

```bash
npm run dev          # node server.js — serves on http://localhost:8000 (falls forward if taken)
```

Any static server also works (`python -m http.server 8000`, `npx serve`, etc.).
**Opening `index.html` via `file://` will not work** — the `<script type="text/babel">`
components are fetched over HTTP, which browsers block on `file://`. There are no tests,
no linter, and no build.

## Architecture

### In-browser components, loaded as globals
Components are **not modules** — there are no `import`/`export` statements. Each `*-v6.jsx`
(and `site-nav.jsx`) file is loaded as `<script type="text/babel">` in `index.html`, compiled
in-browser, and defines a plain global function (e.g. `function HeroV3(...)`). `app-v6.jsx`
references those globals directly. Consequences to keep in mind:

- **Script order in `index.html` is load order and matters.** GSAP + its plugins must be
  loaded before `app-v6.jsx` (which calls `gsap.registerPlugin(...)` at module top level);
  every component script must precede `app-v6.jsx`, which mounts the app last.
- **Filename ≠ component name.** The JSX tag is the function name, not the file. E.g.
  `hero-v6.jsx` exports `HeroV3`, `showcase-v6.jsx` exports `SubjectShowcase`,
  `footer-v6.jsx` exports `SiteFooter`. The `/* global ... */` comment at the top of
  `app-v6.jsx` is the authoritative list of available component globals.
- To add a component: write the file, define a global function, add a `<script type="text/babel">`
  tag for it in `index.html` **before** `app-v6.jsx`, then use it in `app-v6.jsx`.

### Page composition (`app-v6.jsx`)
`SiteNav → HeroV3 → HowItWorks → SubjectShowcase → Growing → Listen( Testimonials →
MemberCTA → FaqSection → SiteFooter )`. The last four render **inside** `Listen`'s black
`.ln-belly` container on purpose — keeping them in one container avoids a visible seam where
the flip-card morph lands.

### Scroll & motion
- Scrolling is driven by GSAP **ScrollSmoother** (a Club/trial plugin, `vendor/ScrollSmoother.min.js`),
  which needs the `#smooth-wrapper` / `#smooth-content` pair in `index.html`. `app-v6.jsx`
  creates it once on mount.
- `app-v6.jsx` wires a generic **cross-dissolve** (opacity fade in/out via ScrollTrigger) on
  every `section[data-screen-label]`. **Pinned sections opt out** by carrying
  `data-no-autofade` so they don't fade themselves out mid-pin. Setup waits on
  `document.fonts.ready` before measuring, because pin geometry depends on font metrics.
- Several sections render **Lottie** animations from `uploads/*.json` via `lottie.min.js`.
- `motion-blur.jsx` exposes `window.fxMotionBlur`, but it is currently a **no-op** (motion
  blur was removed); call sites are left in place and render crisp.

### Design tokens (strong convention)
`flicker/colors_and_type.css` defines the full design system as CSS custom properties
(`--flicker-*` colors, `--font-serif`/`--font-sans`, `--radius-*`, `--shadow-*`, `--ease-*`/`--dur-*`).
**Use these tokens; do not invent new colors or hard-coded values.** The base palette
(brick / salmon / almond / cosmos + ink + canvas neutrals) is preferred; the extended palette
is for sparing accents. `app-v6.jsx`'s `TONES` map and `applyTone()` only ever set page-level
`--bg`/`--ink`/etc. from these tokens.

### Tweaks / edit-mode protocol
`tweaks-panel-v6.jsx` provides `useTweaks(defaults)` and a floating dev panel.
- The visible **Tweaks panel UI is intentionally omitted** from the shipping page, but the
  `useTweaks` state is kept and read by the hero.
- Defaults come from the JSON inside the `<script id="tweak-defaults">` block in `index.html`,
  delimited by `/*EDITMODE-BEGIN*/ ... /*EDITMODE-END*/`. `setTweak` posts
  `__edit_mode_set_keys` to `window.parent` so the design-tool host can rewrite that block on
  disk — this is the persistence mechanism. Preserve the EDITMODE delimiters when editing.

### Other pieces
- `image-slot.js` registers an `<image-slot>` custom element (used for the Member-CTA media slot);
  `.image-slots.state.json` is an empty sidecar so it loads without a 404.
- `server.js` is a tiny zero-dependency static server: it serves dotfiles, sends
  `Cache-Control: no-store` (so edits show on reload), maps `.jsx → text/babel`, and falls
  forward through ports if 8000 is busy.

## Assets
- `flicker/` — design tokens CSS, brand SVGs.
- `vendor/` — React, ReactDOM, Babel, GSAP (+ ScrollTrigger, Flip, ScrollSmoother), Lottie,
  Phosphor icons (`regular` + `fill`), Outfit + Fraunces webfonts.
- `uploads/` — Lottie JSON, background SVGs, audio, avatars. `books/` — cover art `01–13.png`.

## Production caveats (from README)
- **Fonts** are open-source and self-hosted (zero external requests): **Fraunces** (serif, SIL OFL) in `vendor/fraunces/`, **Outfit** (sans) in `vendor/outfit/`.
- **ScrollSmoother** is a GSAP Club plugin shipped here as the prototype's trial build — swap for a licensed copy.
- In-browser Babel recompiles on every load; for a fast production build, precompile (e.g. Vite).
