# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Hard rules (must follow)

- **Never create a git branch on your own.** Do not run `git branch`, `git checkout -b`,
  `git switch -c`, `git worktree add`, or any command that creates a branch. If a task would
  benefit from a new branch, **stop and tell the owner to create it manually**, name the exact
  branch you'd want, explain why, and **wait for their next reply** before continuing. This is
  intentional so the owner always knows what is happening — surface the request clearly and do
  not bury it inside a long response.

## What this is

A single **Home** page for Flicker (an AI book-summaries app), built with **Next.js
(App Router, JavaScript/JSX)**. It was ported from a React + GSAP + Lottie design
prototype that compiled its JSX in the browser via Babel; that runtime-Babel setup was
migrated to a real Next.js toolchain (SWC compiles the JSX at build time, Next bundles
React). It stays **self-contained**: every library, font, icon, and asset is served
locally from `public/`, so the page makes **zero external network requests**.

GSAP (core + ScrollTrigger + Flip + ScrollSmoother) and Lottie are deliberately **kept as
the vendored builds loaded as globals** (see `app/layout.jsx`), because ScrollSmoother is a
GSAP Club plugin not on npm and expects a single global `gsap`. Components reference those
libs as bare globals (`gsap`, `ScrollTrigger`, `lottie`, …) which resolve to `window` at runtime.

## Run it

```bash
npm install
npm run dev          # next dev — http://localhost:3000
npm run build && npm run start   # production build
```

There are no tests and no linter configured.

## Architecture

### Next.js shell
- `app/layout.jsx` reproduces the old `index.html` head: it `<link>`s the stylesheets
  statically from `public/` (`/flicker/colors_and_type.css`, the two Phosphor sheets, and
  `/page.css` — the page's component CSS extracted from the old inline `<style>`), renders the
  `#smooth-wrapper > #smooth-content > #root` shell ScrollSmoother needs, renders the
  `#tweak-defaults` JSON island, and loads the vendored GSAP/Lottie libs via `next/script`
  `strategy="beforeInteractive"` in dependency order (gsap → ScrollTrigger → Flip → lottie →
  ScrollSmoother), plus `image-slot.js`. The stylesheets are kept OUT of Next's CSS-import
  pipeline so their relative `@import`/`url()` refs (fonts, SVGs) are never rewritten.
- `app/page.jsx` is a Client Component that mounts the app **client-only**:
  `dynamic(() => import("../components/app-v6"), { ssr: false })`. This matches the original's
  CSR-only behavior and keeps every component's `window`/`document`/global-lib access (and
  `app-v6`'s top-level `gsap.registerPlugin(...)`) off the server.

### Components (ES modules under `components/`)
Each `*-v6.jsx` (and `site-nav.jsx`) is an ES module starting with `"use client"`, importing
React (`import React from "react"; const { useRef, … } = React;`), and `export`ing its
component. `app-v6.jsx` imports them by name.

- **Filename ≠ component name.** The export is the function name, not the file. E.g.
  `hero-v6.jsx` exports `HeroV3`, `showcase-v6.jsx` exports `SubjectShowcase`,
  `footer-v6.jsx` exports `SiteFooter`, `site-nav.jsx` exports `SiteNav`. The import list at
  the top of `app-v6.jsx` is the authoritative roster.
- To add a component: create `components/<name>.jsx` (`"use client"` + `import React`), export
  the function, then import and use it in `components/app-v6.jsx`.
- **SWC is stricter than the old in-browser Babel.** Watch for patterns Babel tolerated that
  SWC rejects — e.g. a stray literal `}` in JSX children (write it as `{'}'}`).

### Page composition (`components/app-v6.jsx`)
`SiteNav → HeroV3 → HowItWorks → SubjectShowcase → Growing → Listen( Testimonials →
MemberCTA → FaqSection → SiteFooter )`. The last four render **inside** `Listen`'s black
`.ln-belly` container on purpose — keeping them in one container avoids a visible seam where
the flip-card morph lands.

### Scroll & motion
- Scrolling is driven by GSAP **ScrollSmoother** (a Club/trial plugin, `public/vendor/ScrollSmoother.min.js`),
  which needs the `#smooth-wrapper` / `#smooth-content` pair rendered by `app/layout.jsx`.
  `app-v6.jsx` creates it once on mount.
- `app-v6.jsx` wires a generic **cross-dissolve** (opacity fade in/out via ScrollTrigger) on
  every `section[data-screen-label]`. **Pinned sections opt out** by carrying
  `data-no-autofade` so they don't fade themselves out mid-pin. Setup waits on
  `document.fonts.ready` before measuring, because pin geometry depends on font metrics.
- Several sections render **Lottie** animations from `uploads/*.json` via `lottie.min.js`.

### Design tokens (strong convention)
`public/flicker/colors_and_type.css` defines the full design system as CSS custom properties
(`--flicker-*` colors, `--font-serif`/`--font-sans`, `--radius-*`, `--shadow-*`, `--ease-*`/`--dur-*`).
**Use these tokens; do not invent new colors or hard-coded values.** The base palette
(brick / salmon / almond / cosmos + ink + canvas neutrals) is preferred; the extended palette
is for sparing accents. `app-v6.jsx`'s `TONES` map and `applyTone()` only ever set page-level
`--bg`/`--ink`/etc. from these tokens.

### Tweaks / edit-mode protocol
`tweaks-panel-v6.jsx` provides `useTweaks(defaults)` and a floating dev panel.
- The visible **Tweaks panel UI is intentionally omitted** from the shipping page, but the
  `useTweaks` state is kept and read by the hero.
- Defaults come from the JSON inside the `<script id="tweak-defaults">` block, now rendered by
  `app/layout.jsx` (`TWEAK_DEFAULTS_JSON`), still delimited by `/*EDITMODE-BEGIN*/ ... /*EDITMODE-END*/`.
  `setTweak` posts `__edit_mode_set_keys` to `window.parent` so the design-tool host can rewrite
  that block on disk — this is the persistence mechanism. Preserve the EDITMODE delimiters when editing.

### Other pieces
- `public/image-slot.js` registers an `<image-slot>` custom element (used for the Member-CTA media
  slot), loaded via `next/script`; `public/.image-slots.state.json` is an empty sidecar so it loads
  without a 404.

## Assets (all under `public/`, served at the site root)
- `flicker/` — design tokens CSS, brand SVGs.
- `vendor/` — GSAP (+ ScrollTrigger, Flip, ScrollSmoother), Lottie, Phosphor icons
  (`regular` + `fill`), Outfit + Fraunces webfonts. (The old `react`/`react-dom`/`babel`
  builds remain here but are unused — Next bundles React and compiles JSX.)
- `uploads/` — Lottie JSON, background SVGs, audio, avatars. `books/` — cover art `01–13.png`.
- `page.css` — the page's component CSS (extracted verbatim from the old inline `<style>`).

## Production caveats (from README)
- **Fonts** are open-source and self-hosted (zero external requests): **Fraunces** (serif, SIL OFL) in `public/vendor/fraunces/`, **Outfit** (sans) in `public/vendor/outfit/`.
- **ScrollSmoother** is a GSAP Club plugin shipped here as the prototype's trial build — swap for a licensed copy.
