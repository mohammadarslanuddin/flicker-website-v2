"use client";
import React from "react";

/* global gsap, ScrollTrigger, lottie */
const { useRef, useEffect } = React;

/* ==================================================================== *
 *  Flicker — Hero → How-it-works (v7 / "Home A"), one continuous pin.   *
 *                                                                       *
 *  A SINGLE pinned ScrollTrigger fuses what used to be two sections:    *
 *  the standalone "How it works" is gone — its content is now the       *
 *  resolve state of the hero morph, so Summaries follows directly.      *
 *                                                                       *
 *   0.00 – 0.10  HOLD  : the static hero (headline + CTAs, phone large  *
 *                        and low inside the rounded panel).             *
 *   0.10 – 0.42  MORPH : the phone scales DOWN and glides to the centre *
 *                        while the hero panel morphs into the           *
 *                        "2 — How it works" container (wide rounded     *
 *                        card). Hero text fades out; the left copy +    *
 *                        right step-rail fade in; the phone screen       *
 *                        crossfades from the brick splash into the       *
 *                        Lottie app sequence.                           *
 *   0.42 – 1.00  BEATS : three scroll-scrubbed beats — phone pinned     *
 *                        centre, each Lottie scrubs its own timeline,   *
 *                        left copy reveals word-by-word, the right rail *
 *                        advances + the step label crossfades.          *
 *                                                                       *
 *  The phone is ONE element throughout: the provided app-container.svg  *
 *  frame, with a brick splash + Flicker mark over the screen that gives *
 *  way to the Lottie holders. All motion is GSAP-driven.                *
 * ==================================================================== */

const FLICKER_MARK =
'<svg viewBox="0 0 77 78" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:100%;height:100%;display:block">' +
'<path fill-rule="evenodd" clip-rule="evenodd" d="M23.9795 77.1383C23.6821 77.6506 23.1698 77.9463 22.5722 77.9463C21.9745 77.9463 21.4652 77.6535 21.1649 77.1383L11.6317 60.7182C11.3343 60.2059 11.3343 59.6175 11.6317 59.1052C17.2373 49.4534 22.8401 39.8016 28.4458 30.1469C28.7431 29.6346 29.2554 29.3389 29.8531 29.3389H69.3903C69.985 29.3389 70.4973 29.6316 70.7976 30.1469C71.0949 30.6592 71.0949 31.2476 70.7976 31.7599L61.2644 48.18C60.967 48.6952 60.4547 48.9879 59.8571 48.9879H41.2617C40.667 48.9879 40.1547 49.2807 39.8544 49.7959C34.5638 58.912 29.2701 68.0251 23.9795 77.1383ZM12.5708 38.1095C12.2735 38.6218 11.7612 38.9175 11.1635 38.9175C10.5688 38.9175 10.0565 38.6248 9.75622 38.1095L0.22302 21.6895C-0.0743402 21.1772 -0.0743402 20.5888 0.22302 20.0764L11.4108 0.807976C11.7082 0.292745 12.2205 0 12.8152 0H75.1697C75.7644 0 76.2767 0.292745 76.577 0.807976C76.8743 1.32028 76.8743 1.9087 76.577 2.421L67.0438 18.8411C66.7464 19.3534 66.2341 19.649 65.6365 19.649H24.2238C23.6291 19.649 23.1168 19.9418 22.8165 20.457C19.4013 26.3412 15.9831 32.2254 12.5679 38.1095H12.5708Z" fill="currentColor"></path>' +
'</svg>';

const BEATS = [
{
  path: "uploads/Home-Books.json",
  frames: 178,
  step: "Step 1:",
  title: "Pick a Book",
  copy: "Browse hand-picked summaries across business, psychology, and productivity — new titles added weekly."
},
{
  path: "uploads/Book-Detail.json",
  frames: 180,
  step: "Step 2:",
  title: "Get the AI Summary",
  copy: "Open an AI-curated summary built around the core ideas — no fluff. Read, listen, or save for later."
},
{
  path: "uploads/Book-Detail-Reading-v2.json",
  frames: 240,
  step: "Step 3:",
  title: "Read, Listen or Save",
  copy: "Read or listen to the key chapters to take in the whole book, then save it to your shelf for later."
}];

const PHONE_AR = 773 / 381;     // app-container.svg height / width
const LOTTIE_STOP_SECONDS = 1.8; // each beat's Lottie plays from 0 and parks here
const HOLD_END = 0.10;          // static hero
const MORPH_END = 0.42;         // phone shrink + panel morph completes

const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
const clampN = (lo, v, hi) => Math.max(lo, Math.min(v, hi));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const lerpRect = (a, b, t) => ({ l: lerp(a.l, b.l, t), tp: lerp(a.tp, b.tp, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });
const mixColor = (a, b, t) =>
`rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
const INK = [34, 25, 27];
const GRAY = [188, 180, 173];

// Crossfade visibility for beat `i` given the step float `sf` (0..3).
function beatVis(i, sf) {
  const band = 0.16;
  let o = 1;
  if (i > 0) o = Math.min(o, clamp01((sf - (i - band)) / band));
  if (i < BEATS.length - 1) o = Math.min(o, clamp01((i + 1 - sf) / band));
  return o;
}

const CSS = `
  .hsq { position: relative; background: var(--bg); }
  /* --hsq-pad is the single source of truth for the How-it-works section's
     horizontal rhythm: it sets both the outer side padding AND the gap
     between the left/right content and the centered phone. --hsq-phone-half
     is updated by JS to match the live phone width so the gap stays
     symmetric regardless of viewport. */
  .hsq-pin {
    position: relative; height: 100vh; overflow: hidden; will-change: opacity, filter;
    --hsq-pad: clamp(44px, 6.5vw, 120px);
    --hsq-phone-half: 150px;
    --hsq-hero-phone-half: 198px;             /* live: half the HERO-state phone width */
    --hsq-chrome-gap: clamp(36px, 4.5vw, 88px); /* gap from the phone to the bottom chrome */
    --hsq-panel-inset: 40px;
    --hsq-header-h: 96px;   /* fixed site-header height — top bound of the hero band */
    --hsq-hero-foot: 44vh;  /* viewport→phone-top distance — bottom bound (live, set by JS) */
  }

  /* Rounded container — JS-driven rect; morphs hero-panel → how-it-works card. */
  .hsq-panel {
    position: absolute;
    background: var(--brand-neutrals-100, #f6f4f0);
    border-radius: 40px;
    z-index: 4;
    will-change: left, top, width, height;
  }

  /* ---- Hero text (fades out during the morph) ---- */
  .hsq-hero-text {
    position: absolute;
    /* Vertically centred in the band between the fixed header and the top of
       the phone mockup, so the gap above and below the content stays equal at
       any screen size. Both bounds are live: --hsq-header-h is the header
       height, --hsq-hero-foot is the viewport→phone-top distance (set by JS). */
    top: var(--hsq-header-h, 96px);
    bottom: var(--hsq-hero-foot, 44vh);
    left: 0; right: 0;
    z-index: 20;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2rem;
    padding: 0 24px; text-align: center;
    will-change: opacity, transform;
  }
  .hsq-head { display: flex; flex-direction: column; align-items: center; gap: 2rem; }
  .hsq-title {
    margin: 0; display: flex; flex-direction: column; align-items: center;
    font-family: var(--font-serif-display, var(--font-serif));
    font-weight: 600; font-size: clamp(var(--text-3xl), 6.7vw, var(--text-5xl)); line-height: var(--leading-none);
    white-space: nowrap; font-variation-settings: "SOFT" 100, "WONK" 1;
  }
  .hsq-title-a { color: var(--ink, #22191b); letter-spacing: -0.025em; }
  .hsq-title-b { color: var(--flicker-brick, #c13441); letter-spacing: -0.03em; }
  .hsq-sub {
    margin: 0; max-width: 669px; font-family: var(--font-sans); font-weight: 400;
    font-size: var(--text-base); line-height: 1.35; color: var(--ink-soft, #3d3034); text-wrap: pretty;
  }
  .hsq-ctas { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
  .hsq-ctas .cta { padding: 16px 40px; font-size: var(--text-base); }
  .hsq-ctas .cta-secondary img { display: block; border-radius: 7px; }

  /* ---- Phone — ONE element; JS-driven rect ---- */
  .hsq-phone { position: absolute; z-index: 12; will-change: transform; }
  .hsq-frame {
    position: absolute; inset: 0; width: 100%; height: 100%; display: block; z-index: 2;
    filter: drop-shadow(0 40px 80px rgba(34, 25, 27, 0.22));
  }
  .hsq-screen {
    position: absolute; left: 3.8%; top: 1.9%; width: 92.4%; height: 96.3%;
    z-index: 3; overflow: hidden; border-radius: 13.2% / 6.4%;
    background: var(--flicker-brick, #c13441);
  }
  .hsq-splash {
    position: absolute; inset: 0; z-index: 2;
    background: var(--flicker-brick, #c13441);
    will-change: opacity, transform;
  }
  /* Dynamic island — sits above splash AND the sliding app surface so it
     always reads as part of the device hardware, never moves, and overlaps
     whatever screen is animating behind it. Sized + positioned so it
     covers the camera/status-bar artwork at the top of the lottie app
     screens once they slide into view. */
  .hsq-island {
    position: absolute; top: 1.6%; left: 50%; transform: translateX(-50%);
    width: 31%; aspect-ratio: 3.05 / 1; background: #030303; border-radius: 999px;
    z-index: 10;
  }
  .hsq-logo {
    position: absolute; top: 25.7%; left: 50%; transform: translateX(-50%);
    width: 18.7%; color: var(--flicker-canvas, #fff9ec);
  }
  .hsq-lotties {
    position: absolute; inset: 0; z-index: 4; background: #FFF8F6;
    transform-origin: 100% 50%;
    will-change: opacity, transform;
    /* The three app-screen Lotties are SVG (canvas can't render their mattes)
       and together create ~8.5k DOM nodes — ~90% of the page. The smoother
       re-composites everything every scroll frame, so while this is on screen
       it dominates the frame budget; profiling showed it as ~83% of mobile
       scroll cost. content-visibility lets the browser SKIP rendering this
       subtree entirely whenever it's scrolled off-screen (which is the whole
       page except the hero), cutting lower-page scroll cost ~4x with zero
       visual change. Size is fixed by inset:0, so containment can't shift
       layout; contain-intrinsic-size is just the skipped-state placeholder. */
    content-visibility: auto;
    contain-intrinsic-size: 360px 800px;
  }
  .hsq-lottie { position: absolute; inset: 0; will-change: opacity; }
  .hsq-lottie svg, .hsq-lottie canvas { display: block; width: 100% !important; height: 100% !important; }

  /* ---- How-it-works copy (left) + step rail (right) — fade in on morph ---- */
  /* Both columns sit INSIDE the rounded panel, with the SAME padding from
     the panel's inner edge AND the SAME gap to the phone. The panel inset
     and phone half-width are live values driven by JS so the layout stays
     symmetric across viewports. */
  .hsq-copy {
    position: absolute; top: 50%; transform: translateY(-50%);
    left: calc(var(--hsq-panel-inset) + var(--hsq-pad));
    right: calc(50% + var(--hsq-phone-half) + var(--hsq-pad));
    z-index: 14; will-change: opacity;
  }
  .hsq-copy-beat {
    position: absolute; top: 0; left: 0; right: 0;
    margin: 0; font-family: var(--font-sans); font-weight: 500;
    font-size: var(--text-base); line-height: 1.5; letter-spacing: -0.005em;
    transform: translateY(-50%); will-change: opacity;
  }
  .hsq-word { color: #BCB4AD; }

  .hsq-rail {
    position: absolute; top: 50%; transform: translateY(-50%);
    left: calc(50% + var(--hsq-phone-half) + var(--hsq-pad));
    right: calc(var(--hsq-panel-inset) + var(--hsq-pad));
    z-index: 14; display: flex; align-items: center; gap: 24px; will-change: opacity;
  }
  .hsq-rail-track { position: relative; flex: 0 0 auto; width: 2px; height: 52px; border-radius: 2px; background: rgba(34,25,27,0.16); overflow: hidden; }
  .hsq-rail-fill { position: absolute; top: 0; left: 0; right: 0; height: 0%; background: var(--flicker-body); border-radius: 2px; will-change: height; }
  .hsq-rail-labels { position: relative; flex: 1 1 auto; min-height: 84px; }
  .hsq-rail-beat { position: absolute; top: 50%; left: 0; right: 0; transform: translateY(-50%); will-change: opacity; }
  .hsq-rail-step { font-family: var(--font-sans); font-size: var(--text-base); font-weight: 500; color: var(--flicker-ink-mute, #7a6b6f); margin: 0 0 8px 0; }
  .hsq-rail-title { font-family: var(--font-serif-display, var(--font-serif)); font-weight: 600; font-size: clamp(var(--text-lg), 1.8vw, var(--text-xl)); line-height: var(--leading-heading); letter-spacing: -0.03em; color: var(--flicker-body, #22191b); margin: 0; text-wrap: balance; }

  /* ---- Bottom chrome (hero only; fades out during morph) ---- */
  .hsq-chrome {
    position: absolute; bottom: 28px; z-index: 25; display: flex; align-items: center; gap: 10px;
    font-family: var(--font-sans); font-size: var(--text-xs); font-weight: 500; text-transform: uppercase;
    color: var(--ink-muted, #7a6b6f); will-change: opacity;
  }
  .hsq-stat { left: clamp(16px, 2vw, 56px); letter-spacing: 0.06em; }
  .hsq-scroll { right: clamp(16px, 2vw, 56px); letter-spacing: 0.08em; }
  .hsq-scroll-line { display: inline-block; width: 22px; height: 1px; background: currentColor; opacity: 0.6; }
  .hsq-scroll-arrow { display: inline-flex; }
  .hsq-scroll-arrow i { display: block; font-size: 13px; line-height: 1; }

  @media (max-width: 720px) { .hsq-title { white-space: normal; } }
  /* Phones: enlarge the hero headline. The base clamp floors near --text-3xl
     (~30px once the type tokens shrink at 600px), which reads small for a
     display headline — raise the floor + vw term (still capped at --text-6xl).
     Scoped to 600px so tablet/desktop sizing is untouched. */
  @media (max-width: 600px) {
    .hsq-title { font-size: clamp(var(--text-4xl), 11vw, var(--text-6xl)); }
    /* Tighten the headline on phones. The token scale bottoms out at
       --tracking-tighter (-0.04em); this goes a touch beyond it. */
    .hsq-title-a, .hsq-title-b { letter-spacing: -0.05em; }

    /* Smaller hero CTAs on phones. Stack them one-per-row and stretch to the
       full content width (out to the .hsq-hero-text 24px gutters). The parent
       columns centre their children at content width, so opt the CTA row — and
       its wrapper — into full width before stretching the buttons. Overrides
       the ≤900px min-height/content-width. */
    .hsq-head { align-self: stretch; }
    .hsq-ctas { align-self: stretch; flex-direction: column; align-items: stretch; }
    .hsq-ctas .cta {
      width: 100%;
      min-height: 0;
      padding: 15px 26px;
      font-size: var(--text-base);
      justify-content: center;
    }
    .hsq-ctas .cta-secondary img { width: 20px; height: 20px; }
  }

  /* ---- ≤900px (the original "no side columns" breakpoint): the columns
     can't flank the centred phone, so the step label + title and the copy
     reflow into a centred block in the band below the (shrunk) phone. The
     hero-state bottom chrome is dropped because it would otherwise sit on top
     of the large hero phone. Above 900px the side columns return (see the
     min-width:901px block below). ---- */
  @media (max-width: 900px) {
    .hsq-stat, .hsq-scroll { display: none; }

    /* Keep the hero CTAs at their exact desktop footprint. When they wrap onto
       separate rows the shorter button no longer stretches to the taller one,
       so pin the height (desktop renders 54px) — width stays content-sized. */
    .hsq-ctas .cta { min-height: 54px; }

    .hsq-rail, .hsq-copy {
      top: var(--hsq-hiw-text-top, 64%);
      bottom: auto;
      left: clamp(20px, 6vw, 48px);
      right: clamp(20px, 6vw, 48px);
      transform: none;
      text-align: center;
    }
    .hsq-rail { justify-content: center; gap: 0; }
    .hsq-rail-track { display: none; }
    .hsq-rail-labels { flex: 1 1 auto; min-height: 0; }
    .hsq-rail-beat { top: 0; transform: none; }
    .hsq-rail-step { margin: 0 0 4px 0; }
    .hsq-rail-title { font-size: var(--text-xl); }

    .hsq-copy { top: calc(var(--hsq-hiw-text-top, 64%) + clamp(56px, 9vw, 76px)); }
    .hsq-copy-beat { top: 0; transform: none; }
  }

  /* On wider screens, pull the bottom chrome in from the viewport edges so it
     hugs the centered phone — same phone-gap rhythm (--hsq-pad) as the copy /
     rail columns. Below 901px (where those columns hide) it stays edge-anchored
     so the text never collides with the phone on narrow screens. */
  @media (min-width: 901px) {
    /* The left stat is a long right-aligned string, so its gap optically reads
       larger than the short "Scroll" on the right — pull it in ~20px to match. */
    .hsq-stat { left: auto; right: calc(50% + var(--hsq-hero-phone-half) + var(--hsq-chrome-gap) - 20px); }
    .hsq-scroll { right: auto; left: calc(50% + var(--hsq-hero-phone-half) + var(--hsq-chrome-gap)); }
  }
`;

export function HeroSequenceV7() {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const panelRef = useRef(null);
  const phoneRef = useRef(null);
  const heroTextRef = useRef(null);
  const titleRef = useRef(null); // first headline line — rotates between phrases
  const splashRef = useRef(null);
  const lottieWrapRef = useRef(null);
  const copyColRef = useRef(null);
  const railColRef = useRef(null);
  const railTrackRef = useRef(null);
  const railFillRef = useRef(null);
  const statRef = useRef(null);
  const scrollRef = useRef(null);
  const arrowRef = useRef(null);
  const holderRefs = [useRef(null), useRef(null), useRef(null)];
  const copyBeatRefs = [useRef(null), useRef(null), useRef(null)];
  const railBeatRefs = [useRef(null), useRef(null), useRef(null)];
  const wordRefs = useRef([[], [], []]);

  useEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    const section = sectionRef.current;
    if (!section) return;

    const anims = [null, null, null];
    const ready = [false, false, false];
    let killed = false;
    let st = null, loadTrigger = null, exitST = null, arrowTween = null;

    // ===== Discrete step machine =====
    // The hero no longer scrubs to the scrollbar. The section is pinned and the
    // scroll INPUT (wheel / touch / keys) is hijacked into discrete steps that
    // fire IMMEDIATELY on the first gesture — there is no distance threshold:
    //   step 0 — hero
    //   step 1 — how-it-works, beat 1   (Lottie 1 plays itself)
    //   step 2 — how-it-works, beat 2   (Lottie 2 plays itself)
    //   step 3 — how-it-works, beat 3   (Lottie 3 plays itself)
    // Each gesture plays the next/previous transition as a fixed, eased tween.
    // At step 3 a further scroll-down releases the pin to the next section;
    // scrolling back up re-arms the machine at step 3.
    const MAX = 3;
    let step = 0;          // current step
    let activeBeat = -1;   // -1 = hero (no beat), else BEATS index
    let locked = false;    // true while a step transition is playing
    let engaged = true;    // true while the machine owns the scroll input
    let unlockCall = null;
    let beatTweens = [];

    // ---- Scroll lock (the step machine's grip on the page) ----
    // With ScrollSmoother's normalizeScroll ON, a little scroll can leak past
    // the hero's preventDefault hijack; that leak creeps the short hero pin to
    // its end and fires onLeave *before* the user has stepped through all three
    // How-it-works beats — so the last step gets skipped. Freezing the smoother
    // while the machine is stepping makes the grip absolute (nothing moves until
    // we explicitly release at the final step), independent of event ordering.
    // No-op when no smoother exists (native-scroll mode) — the hijack alone
    // already holds there. Resume is called on EVERY exit path so the page can
    // never get stuck frozen.
    const getSmoother = () =>
      (typeof ScrollSmoother !== "undefined" && ScrollSmoother.get) ? ScrollSmoother.get() : null;
    const lockScroll = (locked) => { const sm = getSmoother(); if (sm && sm.paused) sm.paused(locked); };

    // ---- Morph proxies (hero 0 ⇄ how-it-works 1) ----
    // `panel` drives the background container; `phone` trails it (see setMorph),
    // so the two never transition on the same curve.
    const morph = { panel: 0, phone: 0 };
    let morphTarget = 0;
    let panelTween = null, phoneTween = null;

    /* ---- Lottie (deferred so it never blocks the hero paint) ---- */
    const loadLotties = () => {
      if (typeof lottie === "undefined") return;
      BEATS.forEach((b, i) => {
        if (anims[i] || !holderRefs[i].current) return;
        const a = lottie.loadAnimation({
          container: holderRefs[i].current,
          renderer: "svg",
          loop: false,
          autoplay: false,
          path: b.path,
          // "none" stretches the 412×917 Lottie to fill the screen aperture on
          // BOTH axes: it keeps the full width (no left/right bands) while
          // compressing the height to sit within the frame (no top/bottom crop).
          // The aperture is only ~5% taller per its ratio, so the vertical squish
          // is imperceptible.
          rendererSettings: { preserveAspectRatio: "none", progressiveLoad: false }
        });
        a.addEventListener("DOMLoaded", () => {
          ready[i] = true;
          // If this beat is the one on screen, play it (stopping at 1.80s);
          // otherwise park it on frame 0.
          if (i === activeBeat) playBeatLottie(i);
          else a.goToAndStop(0, true);
        });
        anims[i] = a;
      });
    };

    const geom = () => {
      const VW = window.innerWidth, VH = window.innerHeight;
      const mH = clampN(16, VW * 0.019, 36);
      const heroPanel = { l: mH, tp: VH * 0.70, w: VW - 2 * mH, h: VH * 0.38 };

      const hpW = clampN(248, VW * 0.276, 540);
      // RESTING hero phone. Desktop keeps the phone high (top at 56% VH) so it
      // reads large under the centred copy. Phones drop it toward the bottom so
      // it only PEEKS up from the lower ~quarter of the screen — but not so far
      // that the brick-splash Flicker mark (positioned 25.7% down the phone)
      // crops under the fold. We anchor the phone by that logo: its bottom edge
      // keeps a 5% VH clearance above the viewport bottom, so it always reads
      // clearly while the phone sits as low as that constraint allows.
      const heroPhoneH = hpW * PHONE_AR;
      let heroPhoneTop = VH * 0.56;
      if (VW <= 600) {
        const logoBottom = 0.257 * heroPhoneH + 0.1894 * hpW; // logo top% · h + logo height
        heroPhoneTop = VH - logoBottom - VH * 0.05;
      }
      const heroPhone = { l: VW / 2 - hpW / 2, tp: heroPhoneTop, w: hpW, h: heroPhoneH };

      const narrow = VW <= 900;
      const hiwMH = clampN(40, VW * 0.12, 240);
      // Second container's vertical gap, ×1.5 vs. the original (28/0.06/72) so
      // the how-it-works card sits with noticeably more room top and bottom.
      const hiwMV = clampN(42, VH * 0.09, 108);
      // Phones: the container expands to a FULL-BLEED section (no margin) and the
      // morph squares its corners (see renderMorph). Desktop keeps the margined card.
      const hiwPanel = narrow
        ? { l: 0, tp: 0, w: VW, h: VH }
        : { l: hiwMH, tp: hiwMV, w: VW - 2 * hiwMH, h: VH - 2 * hiwMV };

      // Phones: shrink the phone and CENTRE the [phone + text] group as a unit
      // (phone above, copy below) within the full-bleed section. Desktop keeps
      // the phone centred with the copy/rail flanking it.
      const phoneTextGap = clampN(16, VH * 0.025, 34);
      let ipH, ipTop, hiwTextTop;
      if (narrow) {
        // Phones: anchor the phone to the TOP — a margin below the fixed header
        // — and the copy band to the BOTTOM of the viewport (an even margin that
        // mirrors the side gutters). The phone then grows to fill the space
        // between the two, capped so it never gets wider than the side gutters.
        const headerH = 96;                          // matches --hsq-header-h
        const topMargin = clampN(16, VH * 0.03, 40); // gap below the header
        // The text band (step + title + ~3-line paragraph) is essentially a
        // fixed height — it's type, not a fraction of the viewport — so keep it
        // near-constant. Scaling it with VH over-estimated on taller phones and
        // left a gap below the copy.
        const textBandH = clampN(132, VH * 0.02, 160);
        const bottomMargin = clampN(20, VH * 0.045, 48);
        const sideMargin = clampN(20, VW * 0.06, 48);
        const textTop = VH - bottomMargin - textBandH;
        ipTop = headerH + topMargin;
        const availH = textTop - phoneTextGap - ipTop;
        ipH = Math.min(availH, (VW - 2 * sideMargin) * PHONE_AR);
        hiwTextTop = textTop;
      } else {
        ipH = Math.min(VH * 0.68, hiwPanel.h - VH * 0.10);
        ipTop = VH / 2 - ipH / 2;
        hiwTextTop = ipTop + ipH + phoneTextGap;
      }
      const ipW = ipH / PHONE_AR;
      const hiwPhone = { l: VW / 2 - ipW / 2, tp: ipTop, w: ipW, h: ipH };

      // The phone keeps a CONSTANT aspect ratio across hero ⇄ how-it-works, so
      // the whole transition is a uniform scale + translate. Give the phone a
      // single fixed layout box (the larger of the two widths, so we only ever
      // scale DOWN — crisp canvas, no upscale blur) and let renderMorph drive it
      // with a GPU transform instead of re-laying-out left/top/width/height
      // every frame (the latter reflows the drop-shadow-filtered SVG per frame).
      const basePhoneW = Math.max(heroPhone.w, hiwPhone.w);
      const basePhone = { l: heroPhone.l, tp: heroPhone.tp, w: basePhoneW, h: basePhoneW * PHONE_AR };

      // Expose the live phone half-width AND the panel's inner edge inset
      // so the left/right columns can stay symmetric, with padding measured
      // from inside the rounded panel (NOT the viewport edge).
      if (pinRef.current) {
        pinRef.current.style.setProperty("--hsq-phone-half", (ipW / 2) + "px");
        // The bottom chrome (stat / scroll) only shows in the HERO state, where
        // the phone is hpW wide — NOT the smaller how-it-works phone. Expose its
        // half-width separately so the chrome gap is measured from the phone the
        // user actually sees, keeping both sides equal.
        pinRef.current.style.setProperty("--hsq-hero-phone-half", (hpW / 2) + "px");
        pinRef.current.style.setProperty("--hsq-panel-inset", hiwMH + "px");
        // Bottom bound of the centred hero band = distance from the viewport
        // top down to the hero-state phone's top edge.
        pinRef.current.style.setProperty("--hsq-hero-foot", (VH - heroPhone.tp) + "px");
        // Top of the mobile step/copy band — bottom-anchored on phones (see
        // hiwTextTop), just below the phone on desktop.
        pinRef.current.style.setProperty("--hsq-hiw-text-top", hiwTextTop + "px");
      }

      return { heroPanel, heroPhone, hiwPanel, hiwPhone, basePhone };
    };

    const setRect = (el, r) => {
      el.style.left = r.l + "px"; el.style.top = r.tp + "px";
      el.style.width = r.w + "px"; el.style.height = r.h + "px";
    };

    // Geometry is constant during a morph tween (only viewport changes move it),
    // so measure ONCE and reuse the cached rects every frame — this keeps geom()
    // (clamps + 6 per-frame style.setProperty writes to pinRef) out of the hot
    // render path. Re-measured on resize and ScrollTrigger refresh. Measuring
    // also pins the phone's fixed layout box so renderMorph can transform it.
    let cachedGeom = null;
    const measure = () => {
      cachedGeom = geom();
      const ph = phoneRef.current;
      if (ph) { setRect(ph, cachedGeom.basePhone); ph.style.transformOrigin = "0 0"; }
    };

    // ---- MORPH renderer ----
    // Reads the two eased proxies directly (the power2.inOut tween already
    // shapes the curve, so no extra smooth() is applied here). `morph.panel`
    // drives the background container + the hero text / chrome / column fades;
    // `morph.phone` drives the phone rect + its splash→Lottie crossfade. The
    // two values are staggered by setMorph(), so the panel and phone never
    // move on the same frame-curve.
    const renderMorph = () => {
      const panel = panelRef.current, phone = phoneRef.current;
      if (!panel || !phone) return;
      if (!cachedGeom) measure();
      const G = cachedGeom;
      const mPanel = morph.panel;
      const mPhone = morph.phone;

      setRect(panel, lerpRect(G.heroPanel, G.hiwPanel, mPanel));
      // Phone: uniform scale + translate off its fixed base box (GPU transform,
      // no per-frame layout/reflow of the filtered SVG). AR is constant so
      // scaleX === scaleY — the rect is reproduced exactly at both endpoints.
      const cp = lerpRect(G.heroPhone, G.hiwPhone, mPhone);
      const s = cp.w / G.basePhone.w;
      phone.style.transform =
        `translate(${cp.l - G.basePhone.l}px, ${cp.tp - G.basePhone.tp}px) scale(${s})`;

      // Phones: the full-bleed container squares its corners as it expands
      // (rounded hero panel → edge-to-edge section). Desktop keeps the CSS 40px.
      if (window.innerWidth <= 900) panel.style.borderRadius = (40 * (1 - mPanel)) + "px";
      else panel.style.borderRadius = "";

      // Hero content clears as the container starts to expand — a quick
      // slide-up + fade that completes within the first ~20% of the panel
      // motion, so it's gone well before the panel/phone settle.
      const heroOut = clamp01(mPanel / 0.2);
      if (heroTextRef.current) {
        heroTextRef.current.style.opacity = String(1 - heroOut);
        heroTextRef.current.style.transform = `translateY(${-heroOut * 72}px)`;
      }
      const chromeOp = 1 - heroOut;
      if (statRef.current) statRef.current.style.opacity = String(chromeOp);
      if (scrollRef.current) scrollRef.current.style.opacity = String(chromeOp);

      // In-app screen transition: a horizontal SWIPE LEFT — the app surface
      // glides in from the right edge while the brick splash slides off to the
      // left, the way a carousel advances. Both are tied to the phone proxy, so
      // scrolling back up reverses the swipe (app exits right, splash returns).
      if (splashRef.current) {
        const sp = clamp01((mPhone - 0.05) / 0.4);
        splashRef.current.style.opacity = String(1 - sp);
        splashRef.current.style.transform = `translateX(${-sp * 100}%)`;
      }
      if (lottieWrapRef.current) {
        const lp = clamp01(mPhone / 0.5);
        const tx = (1 - lp) * 100;
        lottieWrapRef.current.style.opacity = "1";
        lottieWrapRef.current.style.transform = `translateX(${tx}%)`;
      }

      const colOp = clamp01((mPanel - 0.55) / 0.45);
      if (copyColRef.current) copyColRef.current.style.opacity = String(colOp);
      if (railColRef.current) railColRef.current.style.opacity = String(colOp);
    };

    // ---- Direction-triggered snap ----
    // Crossing into / out of the hero commits the whole morph as a fixed, slow
    // tween (it is NOT scrubbed). The phone trails the container by `STAGGER`
    // seconds; on the way back the order flips so the phone leaves first.
    const STAGGER = 0.7;
    const setMorph = (target) => {
      if (target === morphTarget) return;
      morphTarget = target;
      if (panelTween) panelTween.kill();
      if (phoneTween) phoneTween.kill();
      const forward = target === 1;
      const panelDelay = forward ? 0 : STAGGER;
      const phoneDelay = forward ? STAGGER : 0;
      panelTween = gsap.to(morph, {
        panel: target, duration: 2.5, ease: "power3.inOut",
        delay: panelDelay, onUpdate: renderMorph, overwrite: "auto"
      });
      phoneTween = gsap.to(morph, {
        phone: target, duration: 2.5, ease: "power3.inOut",
        delay: phoneDelay, onUpdate: renderMorph, overwrite: "auto"
      });
    };

    // ---- Beat reveal helpers (discrete, GSAP-driven) ----
    const killBeatTweens = () => { beatTweens.forEach((t) => t && t.kill()); beatTweens = []; };

    // Play a beat's Lottie from frame 0 and stop it exactly at
    // LOTTIE_STOP_SECONDS (clamped to the clip length). playSegments with the
    // force flag restarts the clip and, with loop:false, parks it on the stop
    // frame — a deterministic freeze point for the fade-out.
    const playBeatLottie = (i) => {
      const a = anims[i];
      if (!a || !a.playSegments || !ready[i]) return;
      const fps = a.frameRate || 30;
      const total = a.totalFrames || BEATS[i].frames;
      const stop = Math.max(1, Math.min(total, Math.round(LOTTIE_STOP_SECONDS * fps)));
      a.playSegments([0, stop], true);
    };

    // Word-by-word gray → ink fill for beat `i`, played once on reveal.
    const revealWords = (i, dur, delay) => {
      const words = wordRefs.current[i];
      if (!words || !words.length) return;
      words.forEach((w) => { if (w) w.style.color = mixColor(GRAY, INK, 0); });
      const s = { h: 0 };
      beatTweens.push(gsap.to(s, {
        h: words.length, duration: dur, delay, ease: "power1.out",
        onUpdate: () => {
          for (let j = 0; j < words.length; j++)
            if (words[j]) words[j].style.color = mixColor(GRAY, INK, clamp01(s.h - j));
        }
      }));
    };

    // Crossfade copy + rail label + Lottie holder from `prevBeat` to `beat`
    // (-1 = hero / none) and PLAY that beat's Lottie from the top. `inDelay`
    // holds the incoming reveal back until the morph has mostly resolved when
    // arriving from the hero.
    const showBeat = (beat, prevBeat, inDelay) => {
      killBeatTweens();
      activeBeat = beat;

      if (prevBeat >= 0 && prevBeat !== beat) {
        // Safety freeze: each Lottie normally parks itself on the 1.80s frame,
        // but if the user scrolls on before it gets there, pause it where it is
        // so it dissolves as a still image rather than animating mid-fade.
        const pa = anims[prevBeat];
        if (pa && pa.pause) pa.pause();
        [copyBeatRefs[prevBeat], railBeatRefs[prevBeat], holderRefs[prevBeat]].forEach((r) => {
          if (r.current) beatTweens.push(gsap.to(r.current, { opacity: 0, duration: 0.45, ease: "power2.inOut" }));
        });
      }

      if (beat >= 0) {
        [copyBeatRefs[beat], railBeatRefs[beat], holderRefs[beat]].forEach((r) => {
          if (r.current) beatTweens.push(gsap.fromTo(r.current, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: inDelay, ease: "power2.out" }));
        });
        revealWords(beat, 1.0, inDelay);
        // Play from the start and stop dead at the 1.80s frame.
        beatTweens.push(gsap.delayedCall(inDelay, () => playBeatLottie(beat)));
        // The progress bar fades in WITH its adjacent label (same delay), so it
        // never appears alone during the phone morph — only once the content
        // sitting next to it lands.
        if (railTrackRef.current) beatTweens.push(gsap.to(railTrackRef.current, {
          opacity: 1, duration: 0.5, delay: inDelay, ease: "power2.out"
        }));
        if (railFillRef.current) beatTweens.push(gsap.to(railFillRef.current, {
          height: ((beat + 1) / BEATS.length) * 100 + "%", duration: 0.7, delay: inDelay, ease: "power2.inOut"
        }));
      } else {
        // Returning to the hero — fade the bar out alongside the labels.
        if (railTrackRef.current) beatTweens.push(gsap.to(railTrackRef.current, { opacity: 0, duration: 0.45, ease: "power2.inOut" }));
        if (railFillRef.current) beatTweens.push(gsap.to(railFillRef.current, { height: "0%", duration: 0.5, ease: "power2.inOut" }));
      }
    };

    // ---- Step transition: fire the morph and/or beat crossfade for one step.
    const goToStep = (next) => {
      next = Math.max(0, Math.min(MAX, next));
      if (next === step || locked) return;
      const from = step;
      step = next;
      locked = true;

      const wasHero = from === 0, isHero = next === 0;
      let dur = 0.95; // beat-to-beat default

      // Hero ⇄ how-it-works runs the slow staggered morph.
      if (wasHero && !isHero) { setMorph(1); dur = 2.5 + STAGGER; }
      else if (!wasHero && isHero) { setMorph(0); dur = 2.5 + STAGGER; }

      const beat = next >= 1 ? next - 1 : -1;
      const prevBeat = from >= 1 ? from - 1 : -1;
      // Arriving from the hero, hold the beat reveal until the morph is ~55%
      // through so the copy/rail/Lottie land as the phone reaches centre.
      const inDelay = (wasHero && !isHero) ? (2.5 + STAGGER) * 0.55 : 0.08;
      showBeat(beat, prevBeat, inDelay);

      if (unlockCall) unlockCall.kill();
      unlockCall = gsap.delayedCall(dur + 0.12, () => { locked = false; });
    };

    // ---- Input → step. Returns true when the gesture was consumed (caller
    // should preventDefault); false means "let the page scroll" (release).
    const gesture = (dir) => {
      if (dir > 0) {
        if (step === MAX) {
          // At the final step: release the freeze so the page can scroll out to
          // Summaries (unless a transition is still playing — hold until then).
          if (!locked) lockScroll(false);
          return locked;
        }
        lockScroll(true);                  // hold the pin while we advance a step
        goToStep(step + 1);
        return true;
      }
      if (dir < 0) {
        if (step === 0) return true;       // nothing above the hero — swallow
        lockScroll(true);                  // hold while we step back
        goToStep(step - 1);
        return true;
      }
      return true;
    };

    const onWheel = (e) => {
      if (!engaged) return;
      const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
      if (!dir) return;
      if (gesture(dir)) e.preventDefault();
    };

    let touchY = null;
    const onTouchStart = (e) => { if (engaged && e.touches[0]) touchY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      if (!engaged || touchY === null || !e.touches[0]) return;
      const dy = touchY - e.touches[0].clientY; // +ve = swipe up = advance
      if (Math.abs(dy) < 18) return;
      const dir = dy > 0 ? 1 : -1;
      if (gesture(dir)) { e.preventDefault(); touchY = e.touches[0].clientY; }
      else touchY = null; // released — let the page take over
    };
    const onTouchEnd = () => { touchY = null; };

    const onKey = (e) => {
      if (!engaged) return;
      let dir = 0;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " " || e.key === "Spacebar") dir = 1;
      else if (e.key === "ArrowUp" || e.key === "PageUp") dir = -1;
      if (!dir) return;
      if (gesture(dir)) e.preventDefault();
    };

    const build = () => {
      // Pin the hero in place. No scrub: progress isn't what drives the visuals
      // (the step machine does). The short end-distance just gives a smooth
      // release once the machine hands scrolling back at step 3, plus clean
      // enter/leave boundaries to engage/disengage the input hijack.
      st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => "+=" + window.innerHeight * 0.6,
        pin: pinRef.current,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onEnter: () => { engaged = true; lockScroll(true); },
        onEnterBack: () => { engaged = true; step = MAX; lockScroll(true); }, // re-arm at the last beat
        onLeave: () => { engaged = false; lockScroll(false); },
        onLeaveBack: () => { engaged = false; lockScroll(false); },
        onRefresh: () => { measure(); renderMorph(); }
      });

      loadTrigger = ScrollTrigger.create({
        trigger: section, start: "top bottom", once: true, onEnter: loadLotties
      });

      // EXIT — once the pin releases, the container rides up + fades into Summaries.
      exitST = ScrollTrigger.create({
        trigger: section, start: "bottom bottom", end: "bottom top", scrub: 1,
        onUpdate: (self) => {
          const f = clamp01(self.progress / 0.5);
          if (pinRef.current) {
            pinRef.current.style.opacity = String(1 - f);
            const b = f * 18;
            pinRef.current.style.filter = b > 0.3 ? `blur(${b}px)` : "none";
          }
        }
      });

      // Start clean: all beat content hidden (hero shows none of it).
      const hideAtStart = [
        copyBeatRefs[0].current, copyBeatRefs[1].current, copyBeatRefs[2].current,
        railBeatRefs[0].current, railBeatRefs[1].current, railBeatRefs[2].current,
        holderRefs[0].current, holderRefs[1].current, holderRefs[2].current,
        railTrackRef.current
      ].filter(Boolean);
      gsap.set(hideAtStart, { opacity: 0 });

      renderMorph();
      requestAnimationFrame(loadLotties); // make the Lotties available before the first step
    };

    // Bouncing scroll-down arrow (hero state only).
    if (arrowRef.current && typeof gsap !== "undefined") {
      arrowTween = gsap.to(arrowRef.current, { y: 8, duration: 1.0, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (!killed) { build(); ScrollTrigger.refresh(); } });
    } else {
      build();
    }

    const onResize = () => { measure(); renderMorph(); };
    window.addEventListener("resize", onResize);
    // Input hijack — capture phase + non-passive so we can preventDefault and
    // beat ScrollSmoother to the wheel/touch event.
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true, capture: true });
    window.addEventListener("keydown", onKey);
    const idle = window.setTimeout(loadLotties, 4500);

    return () => {
      killed = true;
      lockScroll(false); // never leave the page frozen if we unmount mid-step
      window.clearTimeout(idle);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      window.removeEventListener("touchend", onTouchEnd, { capture: true });
      window.removeEventListener("keydown", onKey);
      if (unlockCall) unlockCall.kill();
      killBeatTweens();
      if (st) st.kill();
      if (loadTrigger) loadTrigger.kill();
      if (exitST) exitST.kill();
      if (arrowTween) arrowTween.kill();
      if (panelTween) panelTween.kill();
      if (phoneTween) phoneTween.kill();
      anims.forEach((a) => a && a.destroy && a.destroy());
    };
  }, []);

  /* ---------- Rotating first headline line ----------
     Same word-by-word blur reveal the v6 hero used (HeroV3): each phrase
     reveals word by word (blur-in + rise on enter, blur-out + lift on exit),
     cycling between the two phrases. Only the first line rotates; "in Minutes"
     stays put, and the v7 styling (ink colour, kerning, variable-font axes)
     is inherited from .hsq-title-a, so nothing about the look changes. */
  React.useEffect(() => {
    const el = titleRef.current;
    if (!el || typeof gsap === "undefined") return;
    const PHRASES = ["Learn Smarter", "Grow Faster"];
    const DISPLAY_MS = 2200; // dwell once a phrase is fully revealed
    let idx = 0, cancelled = false, timeoutId = 0;

    // The line is its own single-line row; keep it shrink-to-fit + centred.
    el.textContent = "";
    el.style.display = "inline-block";
    el.style.whiteSpace = "nowrap";

    const buildWords = (phrase) => {
      el.textContent = "";
      const words = phrase.split(" ");
      return words.map((w, i) => {
        const s = document.createElement("span");
        s.textContent = w;
        s.style.cssText = "display:inline-block;will-change:transform,filter,opacity;";
        el.appendChild(s);
        if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
        return s;
      });
    };

    const cycle = () => {
      if (cancelled) return;
      const spans = buildWords(PHRASES[idx]);
      gsap.set(spans, { opacity: 0, filter: "blur(16px)", yPercent: 35 });
      gsap.to(spans, {
        opacity: 1, filter: "blur(0px)", yPercent: 0,
        duration: 0.62, ease: "power3.out", stagger: 0.14,
        onComplete: () => {
          if (cancelled) return;
          timeoutId = window.setTimeout(() => {
            if (cancelled) return;
            gsap.to(spans, {
              opacity: 0, filter: "blur(16px)", yPercent: -30,
              duration: 0.5, ease: "power3.in", stagger: 0.1,
              onComplete: () => { idx = (idx + 1) % PHRASES.length; cycle(); }
            });
          }, DISPLAY_MS);
        }
      });
    };
    cycle();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      gsap.killTweensOf(el.querySelectorAll("span"));
    };
  }, []);

  const renderWords = (text, beatIdx) => {
    wordRefs.current[beatIdx] = [];
    const parts = text.split(" ");
    return parts.map((w, j) =>
    <span key={j} className="hsq-word" ref={(el) => {if (el) wordRefs.current[beatIdx][j] = el;}}>
        {w}{j < parts.length - 1 ? " " : ""}
      </span>
    );
  };

  return (
    <section ref={sectionRef} className="hsq" data-screen-label="01 Hero" data-no-autofade="">
      <style>{CSS}</style>

      <div ref={pinRef} className="hsq-pin">
        {/* Anchor so the nav "How it works" link still resolves (kept out of the
            cross-dissolve, which only targets section[data-screen-label]). */}
        <span data-screen-label="02 How it works" style={{ position: "absolute", top: 0, left: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none" }} aria-hidden="true" />

        {/* Morphing container */}
        <div ref={panelRef} className="hsq-panel" />

        {/* How-it-works copy (left) */}
        <div ref={copyColRef} className="hsq-copy" style={{ opacity: 0 }}>
          {BEATS.map((b, i) =>
          <p key={i} ref={copyBeatRefs[i]} className="hsq-copy-beat" style={{ opacity: i === 0 ? 1 : 0 }}>
              {renderWords(b.copy, i)}
            </p>
          )}
        </div>

        {/* How-it-works step rail (right) */}
        <div ref={railColRef} className="hsq-rail" style={{ opacity: 0 }}>
          <div ref={railTrackRef} className="hsq-rail-track" style={{ opacity: 0 }}><div ref={railFillRef} className="hsq-rail-fill" /></div>
          <div className="hsq-rail-labels">
            {BEATS.map((b, i) =>
            <div key={i} ref={railBeatRefs[i]} className="hsq-rail-beat" style={{ opacity: i === 0 ? 1 : 0 }}>
                <p className="hsq-rail-step">{b.step}</p>
                <p className="hsq-rail-title">{b.title}</p>
              </div>
            )}
          </div>
        </div>

        {/* The phone — one element across hero + how-it-works */}
        <div ref={phoneRef} className="hsq-phone">
          <div className="hsq-screen">
            <div ref={splashRef} className="hsq-splash">
              <div className="hsq-logo" dangerouslySetInnerHTML={{ __html: FLICKER_MARK }} />
            </div>
            <div ref={lottieWrapRef} className="hsq-lotties" style={{ opacity: 0, transform: "translateX(100%)" }}>
              {BEATS.map((b, i) =>
              <div key={i} ref={holderRefs[i]} className="hsq-lottie" role="img"
                aria-label="A demonstration of the Flicker App reading experience"
                style={{ opacity: i === 0 ? 1 : 0 }} />
              )}
            </div>
            {/* Dynamic island — sibling of splash + app surface so it stays
                fixed at the top while the app screen slides up behind it. */}
            <div className="hsq-island" />
          </div>
          <img className="hsq-frame" src="home-v7/app-container.svg" alt="" />
        </div>

        {/* Hero text */}
        <div ref={heroTextRef} className="hsq-hero-text">
          <div className="hsq-head">
            <h1 className="hsq-title">
              <span className="hsq-title-a" ref={titleRef}>Learn Smarter</span>
              <span className="hsq-title-b">in Minutes</span>
            </h1>
            <p className="hsq-sub">
              Get the core ideas from the world&rsquo;s best books, without the hours.
              Flicker App turns big reads into clear insights you can use today.
            </p>
          </div>
          <div className="hsq-ctas">
            <a href="#get-started" className="cta cta-primary">
              Get Started
              <span aria-hidden="true" className="cta-arrow">
                <i className="ph ph-arrow-right" style={{ display: "block", fontSize: 16, lineHeight: 1 }}></i>
              </span>
            </a>
            <a href="#download" className="cta cta-secondary">
              <img src="flicker/app-icon.svg" alt="" aria-hidden="true" width="20" height="20" />
              Download The App
            </a>
          </div>
        </div>

        {/* Bottom-left stat */}
        <div ref={statRef} className="hsq-chrome hsq-stat">
          2,300+ titles &middot; 15-min reads
        </div>

        {/* Bottom-right scroll indicator */}
        <div ref={scrollRef} className="hsq-chrome hsq-scroll">
          <span>Scroll</span>
          <span className="hsq-scroll-line" />
          <span className="hsq-scroll-arrow" ref={arrowRef} aria-hidden="true"><i className="ph ph-arrow-down"></i></span>
        </div>
      </div>
    </section>);

}

window.HeroSequenceV7 = HeroSequenceV7;
