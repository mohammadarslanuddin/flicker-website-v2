# Flicker — Home page

Implementation of the **Home** page from the *Flicker Site v2* design bundle
(Claude Design handoff), built with **Next.js (App Router)**. The JSX is compiled
by Next/SWC at build time and React is bundled by Next. GSAP (+ ScrollTrigger /
Flip / ScrollSmoother) and Lottie remain the **vendored builds loaded as globals**
(ScrollSmoother is a GSAP Club plugin not on npm), and all libraries, fonts, icons,
and avatars are served locally from `public/`, so the site still makes **zero
external network requests**.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build:

```bash
npm run build && npm run start
```

## Page composition (`components/app-v6.jsx`)

`SiteNav → Hero → HowItWorks → Showcase → Growing → Listen( Testimonials →
MemberCTA → FAQ → Footer )`

Scroll is driven by GSAP **ScrollSmoother**; section seams cross-dissolve via
ScrollTrigger. Several panels render **Lottie** animations (`uploads/*.json`).

## Structure

```
app/layout.jsx             <head> (stylesheets + vendored GSAP/Lottie via next/script),
                           the #smooth-wrapper/#smooth-content/#root shell, and the
                           #tweak-defaults JSON island (EDITMODE delimiters preserved)
app/page.jsx               client entry; mounts components/app-v6 with ssr:false
components/app-v6.jsx       app root + ScrollSmoother init + section composition
components/*-v6.jsx,        section components (ES modules; "use client")
  site-nav.jsx
public/page.css            the page's component CSS (extracted from the old inline <style>)
public/image-slot.js       <image-slot> custom element (Member-CTA media slot)
public/flicker/            colors_and_type.css (design tokens) + brand SVGs
public/uploads/            Lottie JSON, background SVGs, audio webm, avatars/
public/books/              book cover art (01–13)
public/vendor/             gsap(+ScrollTrigger,Flip,ScrollSmoother), lottie,
                           phosphor/ (icon CSS+fonts), outfit/ + fraunces/ (webfonts)
public/.image-slots.state.json   empty sidecar so image-slot.js loads without a 404
```

> The vendored `react`/`react-dom`/`babel` builds from the old setup are no longer
> used (Next bundles React and compiles JSX); they remain under `public/vendor/`
> only as the source the GSAP/Lottie globals sit beside.

## Notes for production

- **Fonts** are open-source and self-hosted (zero external requests): **Fraunces**
  (serif display/headings, SIL OFL) under `public/vendor/fraunces/`, and **Outfit**
  (UI sans, Google Fonts) under `public/vendor/outfit/`.
- **GSAP ScrollSmoother** (`public/vendor/ScrollSmoother.min.js`) is a GSAP Club
  plugin served here as the prototype's trial build — swap for your licensed copy.
- The whole page mounts **client-only** (`ssr: false`); the components are
  animation/DOM-measurement heavy and read `window`/`document` and the vendored
  globals, matching the original's CSR-only behavior.
- The design tool's **Tweaks** dev panel was intentionally omitted from the
  shipping page (the underlying `useTweaks` state, which the hero reads, is kept).
```
