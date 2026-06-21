# Flicker App — Home page

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

## Design tokens

The full design system lives in **`public/flicker/colors_and_type.css`** as CSS
custom properties — colors, type scale, spacing, radius, shadow, and motion.
**Use these tokens; don't invent new colors or hard-coded values.** They're built
on shadcn/ui conventions (HSL semantic layer, Tailwind-friendly step names).

### Colors

**Base palette** — the core four; prioritise these when the palette must stay limited.

| Token | Hex | Role |
|---|---|---|
| `--flicker-brick` | `#C13441` | Brick Red · brand signature |
| `--flicker-salmon` | `#FFB3B3` | Young Salmon · soft pink accent |
| `--flicker-almond` | `#FFE5D2` | Almond · warm accent surface |
| `--flicker-cosmos` | `#561D20` | Red Cosmos · deep partner red |

**Ink & surfaces**

| Token | Hex | Role |
|---|---|---|
| `--flicker-body` / `--flicker-ink` | `#22191B` | Body text, near-black |
| `--flicker-ink-soft` | `#3D3034` | Secondary text |
| `--flicker-ink-mute` | `#7A6B6F` | Muted text, captions |
| `--flicker-canvas` | `#FFF9EC` | **Primary** tinted page background |
| `--flicker-paper` | `#FFFEFB` | Elevated cards on canvas |
| `--flicker-canvas-soft` | `#FBF3DE` | Subtle section bands |
| `--flicker-canvas-shade` | `#ECDFC4` | Hairline borders |

**Extended palette** — accents for marketing flexibility; reach for these sparingly.

| Token | Hex | Token | Hex |
|---|---|---|---|
| `--flicker-misty-rose` | `#FFDAD4` | `--flicker-prussian-blue` | `#003353` |
| `--flicker-brunswick-light` | `#9FF2E1` | `--flicker-baby-blue` | `#9BCBFB` |
| `--flicker-brunswick-green` | `#005046` | `--flicker-liver` | `#73342A` |

**Functional accents** — `--flicker-success` (brunswick-green), `--flicker-info`
(prussian-blue), `--flicker-warning` (`#C99A2E`), `--flicker-danger` (brick).

**Semantic HSL layer** (shadcn-style, drives components, light + `.dark`):
`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`,
`--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`.

### Typography

**Fonts** (self-hosted, zero external requests):

| Token | Stack | Use |
|---|---|---|
| `--font-serif` / `--font-serif-display` | Fraunces, Georgia, serif | Display + headings |
| `--font-sans` | Outfit, system-ui, sans-serif | UI / body |
| `--font-mono` | ui-monospace, Menlo, Consolas | Code |

**Type scale** — modular, Major Third (×1.250), base `--text-base` = 18px. px shown at 16px root.

| Token | rem | px | Role |
|---|---|---|---|
| `--text-2xs` | 0.72 | 11.5 | Micro labels, legal, badges |
| `--text-xs` | 0.9 | 14.4 | Captions, eyebrows, meta |
| `--text-sm` | 0.984 | 15.75 | Small body (off-ratio, 0.875×) |
| `--text-base` | 1.125 | 18 | **Body default** (anchor) |
| `--text-lg` | 1.406 | 22.5 | Lead, large body, H6 |
| `--text-xl` | 1.758 | 28 | H5 / sub-heading |
| `--text-2xl` | 2.197 | 35 | H4 |
| `--text-3xl` | 2.747 | 44 | H3 / section heading |
| `--text-4xl` | 3.433 | 55 | H2 |
| `--text-5xl` | 4.291 | 69 | H1 |
| `--text-6xl` | 5.364 | 86 | Display |
| `--text-7xl` | 6.706 | 107 | Oversized hero display |

**Fluid clamps:** `--text-fluid-display` (35→86), `--text-fluid-h1` (35→44),
`--text-fluid-h2` (28→35), `--text-fluid-lead` (18→22.5).

**Line-height:** `--leading-none` 1 · `--leading-tight` 1.1 · `--leading-heading`
1.125 · `--leading-snug` 1.25 · `--leading-normal` 1.5 · `--leading-relaxed` 1.65.

**Letter-spacing:** `--tracking-tighter` -0.04em · `--tracking-tight` -0.03em ·
`--tracking-normal` 0 · `--tracking-wide` 0.08em · `--tracking-wider` 0.12em.

**Weights:** `--weight-light` 300 · `--weight-regular` 400 · `--weight-medium`
500 · `--weight-semibold` 600 · `--weight-bold` 700.

**Semantic type classes** — assign these to content instead of hard-coding sizes:
`.t-display`, `.t-h1`–`.t-h6`, `.t-eyebrow`, `.t-lead`, `.t-body-lg`, `.t-body`,
`.t-body-sm`, `.t-caption`, `.t-quote`.

### Spacing · radius · shadow · motion

**Spacing** (`--space-*`, rem): `1` 0.25 · `2` 0.5 · `3` 0.75 · `4` 1 · `5` 1.25 ·
`6` 1.5 · `8` 2 · `10` 2.5 · `12` 3 · `16` 4 · `20` 5 · `24` 6.

**Radius:** `--radius-sm` 0.375rem · `--radius-md` 0.625rem · `--radius-lg`
0.875rem · `--radius-xl` 1.25rem · `--radius-2xl` 1.75rem · `--radius-full` 9999px.

**Shadow** (restrained, warm-tinted): `--shadow-xs` · `--shadow-sm` · `--shadow-md`
· `--shadow-lg` · `--shadow-xl`.

**Motion:** `--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)` · `--ease-in-out`
`cubic-bezier(0.65, 0, 0.35, 1)` · `--dur-fast` 120ms · `--dur-base` 200ms ·
`--dur-slow` 320ms.

> **Brand cut:** `.flicker-root` applies `font-variation-settings: "opsz" 96,
> "SOFT" 69, "WONK" 1` globally — inherited by all text; fonts without those axes
> (Outfit, Phosphor) ignore them.

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
