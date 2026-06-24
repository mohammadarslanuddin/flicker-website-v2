"use client";
import React from "react";

/* global gsap, ScrollTrigger, lottie */
const { useRef, useEffect } = React;

/* ==================================================================== *
 *  Flicker — "How it works"  (one continuous pinned section)            *
 *                                                                       *
 *  A single pinned ScrollTrigger drives three phases back-to-back, so   *
 *  there is no seam / gap between them:                                  *
 *                                                                       *
 *   0.00 – 0.24  SCRUB  : the four genre rows slide horizontally while   *
 *                         the heading sits top-left and the first Lottie *
 *                         rides in a small box parked bottom-right       *
 *                         (inset by the page margin, on top of rows).    *
 *   0.24 – 0.40  MORPH  : the box grows into a MARGINED stage panel      *
 *                         (never full-bleed). Heading + rows fade out,   *
 *                         the phone glides to center, copy + rail appear.*
 *   0.40 – 1.00  BEATS  : three scroll-scrubbed beats — phone pinned     *
 *                         center, each Lottie scrubs its own timeline,   *
 *                         left copy reveals word-by-word, right vertical *
 *                         rail advances + step label crossfades.         *
 * ==================================================================== */

// Flicker brand mark (inline so the splash stays self-contained — no asset
// request). Ported verbatim from the archived home-v2 hero-sequence.
const FLICKER_MARK =
'<svg viewBox="0 0 77 78" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:100%;height:100%;display:block">' +
'<path fill-rule="evenodd" clip-rule="evenodd" d="M23.9795 77.1383C23.6821 77.6506 23.1698 77.9463 22.5722 77.9463C21.9745 77.9463 21.4652 77.6535 21.1649 77.1383L11.6317 60.7182C11.3343 60.2059 11.3343 59.6175 11.6317 59.1052C17.2373 49.4534 22.8401 39.8016 28.4458 30.1469C28.7431 29.6346 29.2554 29.3389 29.8531 29.3389H69.3903C69.985 29.3389 70.4973 29.6316 70.7976 30.1469C71.0949 30.6592 71.0949 31.2476 70.7976 31.7599L61.2644 48.18C60.967 48.6952 60.4547 48.9879 59.8571 48.9879H41.2617C40.667 48.9879 40.1547 49.2807 39.8544 49.7959C34.5638 58.912 29.2701 68.0251 23.9795 77.1383ZM12.5708 38.1095C12.2735 38.6218 11.7612 38.9175 11.1635 38.9175C10.5688 38.9175 10.0565 38.6248 9.75622 38.1095L0.22302 21.6895C-0.0743402 21.1772 -0.0743402 20.5888 0.22302 20.0764L11.4108 0.807976C11.7082 0.292745 12.2205 0 12.8152 0H75.1697C75.7644 0 76.2767 0.292745 76.577 0.807976C76.8743 1.32028 76.8743 1.9087 76.577 2.421L67.0438 18.8411C66.7464 19.3534 66.2341 19.649 65.6365 19.649H24.2238C23.6291 19.649 23.1168 19.9418 22.8165 20.457C19.4013 26.3412 15.9831 32.2254 12.5679 38.1095H12.5708Z" fill="currentColor"></path>' +
'</svg>';

const GENRE_ROWS = [
["Self-development", "Productivity", "Habits", "Psychology",
"Mindfulness", "Communication", "Confidence", "Focus"],
["Business", "Leadership", "Strategy", "Marketing",
"Finance", "Investing", "Entrepreneurship", "Negotiation"],
["History", "Biography", "Memoir", "Politics",
"Society", "Culture", "Essays", "Travel"],
["Science", "Technology", "Innovation", "Health",
"Philosophy", "Creativity", "Nature", "Design"]];

const DIRECTIONS = [-1, 1, -1, 1];
const SEP = "\u00a0\u00b7\u00a0";
const TRAVEL_FRACTION = 0.15;

const BEATS = [
{
  path: "uploads/Home-Books.json",
  frames: 178,
  step: "Step 1:",
  title: "Pick a Book",
  copy:
  "Browse hand-picked summaries across business, psychology, and productivity \u2014 new titles added weekly."
},
{
  path: "uploads/Book-Detail.json",
  frames: 180,
  step: "Step 2:",
  title: "Get the AI Summary",
  copy:
  "Open an AI-curated summary built around the core ideas \u2014 no fluff. Read, listen, or save for later."
},
{
  path: "uploads/Book-Detail-Reading-v2.json",
  frames: 240,
  step: "Step 3:",
  title: "Read, Listen or Save",
  copy:
  "Read or listen to the key chapters to take in the whole book, then save it to your shelf for later."
}];


const SCRUB_END = 0.24; // genre horizontal scrub completes
const MORPH_END = 0.40; // box → margined panel completes
const PHONE_AR = 773 / 381; // matches the app-container.svg mockup (h / w)

const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
function lerpRect(a, b, t) {
  return { l: lerp(a.l, b.l, t), tp: lerp(a.tp, b.tp, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) };
}

function mixColor(a, b, t) {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}
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

export function HowItWorks() {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const headingRef = useRef(null);
  const rowsRef = useRef(null);
  const panelRef = useRef(null);
  const gridRef = useRef(null);
  const copyColRef = useRef(null);
  const railColRef = useRef(null);
  const railFillRef = useRef(null);
  const phoneRef = useRef(null);
  const splashRef = useRef(null);
  const lottiesWrapRef = useRef(null);
  const trackRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const holderRefs = [useRef(null), useRef(null), useRef(null)];
  const copyBeatRefs = [useRef(null), useRef(null), useRef(null)];
  const railBeatRefs = [useRef(null), useRef(null), useRef(null)];
  const wordRefs = useRef([[], [], []]);
  const headWordRefs = useRef([]); // Phase-A heading words (scroll-fill)

  useEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    const section = sectionRef.current;
    if (!section) return;

    const anims = [null, null, null];
    const ready = [false, false, false];
    const lastFrame = [-1, -1, -1]; // last integer Lottie frame rendered per beat
    let tracks = [];
    let lastP = 0;
    let killed = false;
    // Desktop (fine pointer) keeps the full blur reveals. On touch we SKIP every
    // scrubbed filter:blur() on this section — re-rasterizing a blurred full-screen
    // layer on each scroll frame across the long 7×vh pin is the heaviest mobile-GPU
    // scroll-time op. The opacity/scale tweens still play, so the reveal still reads.
    const allowBlur = !!(window.matchMedia &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches);

    // Fixed top-nav height (.flk-bar). Used to vertically center the heading in
    // the band between the header bottom and the top of the phone mockup. The
    // bar's height is constant (show/hide is transform/opacity), so measure once
    // and re-measure on resize.
    let headerH = 88;
    const measureHeader = () => {
      const bar = document.querySelector(".flk-bar");
      if (bar) headerH = bar.getBoundingClientRect().height;
    };

    /* ---- Lottie (deferred so it never blocks the hero) ---- */
    const loadLotties = () => {
      if (typeof lottie === "undefined") return;
      BEATS.forEach((b, i) => {
        if (anims[i]) return;
        const a = lottie.loadAnimation({
          container: holderRefs[i].current,
          renderer: "svg",
          loop: false,
          autoplay: false,
          path: b.path,
          // "none" stretches the app screen to FILL the device screen (no
          // letterbox gap) in both width and height.
          rendererSettings: { preserveAspectRatio: "none", progressiveLoad: false }
        });
        a.addEventListener("DOMLoaded", () => {
          ready[i] = true;
          a.goToAndStop(0, true);
          render(lastP);
        });
        anims[i] = a;
      });
    };

    /* ---- measure genre-row travel (content is duplicated 2×) ---- */
    const setupTracks = () => {
      tracks = trackRefs.map((r, i) => {
        const el = r.current;
        if (!el) return null;
        const half = el.scrollWidth / 2;
        const dir = DIRECTIONS[i];
        const travel = half * TRAVEL_FRACTION;
        const fromX = dir === 1 ? -travel : 0;
        const toX = dir === 1 ? 0 : -travel;
        return { el, fromX, toX };
      }).filter(Boolean);
    };

    /* ---- geometry for box / panel / phone in viewport px ---- */
    const geom = () => {
      const VW = window.innerWidth;
      const VH = window.innerHeight;

      // ---- MOBILE (<=760px): vertical stack ----
      // The phone is sized to fit within the side margins and sits at the TOP,
      // tucked just under the nav header; the light content card sits BELOW it
      // and reaches the bottom margin, holding the step + title + copy (laid out
      // by the mobile CSS). The intro splash starts lower + smaller (so the
      // heading reads above it) and the morph rises + grows it up to the top.
      if (VW <= 760) {
        const mb = Math.max(10, Math.min(VW * 0.035, 18));    // side margin (tighter → larger phone)
        const phoneTop = headerH + Math.max(8, headerH * 0.1);
        const botM = Math.max(16, Math.min(VH * 0.03, 30));   // bottom margin
        const gap = Math.max(12, Math.min(VH * 0.02, 20));    // phone ↔ text gap (kept tight)
        // Reserve for the bottom-anchored written block — MUST mirror the mobile
        // CSS (--hiw-copy-h + --hiw-text-gap + --hiw-rail-h) so the phone's lower
        // edge lands right above the heading with no overlap. Trimmed overall so
        // the phone mockup scales up a little more.
        const copyH = Math.max(74, Math.min(VH * 0.14, 128));
        const railH = Math.max(48, Math.min(VW * 0.09, 64));
        const textGap = Math.max(2, Math.min(VW * 0.006, 5));
        const contentH = copyH + textGap + railH;
        const maxPhoneW = VW - 2 * mb;

        // Vertical band available for the phone (between the header and the
        // text block, within the bottom margin).
        const bandH = VH - phoneTop - gap - contentH - botM;
        // Phone height fills the band, capped by width, then scaled DOWN so the
        // mockup never crowds the band.
        const PHONE_SCALE = 0.86;
        let pH = Math.min(bandH, maxPhoneW * PHONE_AR);
        pH = Math.max(pH, 260) * PHONE_SCALE;
        let pW = pH / PHONE_AR;
        if (pW > maxPhoneW) { pW = maxPhoneW; pH = pW * PHONE_AR; }

        // Group the phone + the written block (phone + gap + text) and CENTER the
        // whole group in the region below the header — the header space is kept
        // by starting the region at phoneTop, and the bottom margin balances it.
        const groupH = pH + gap + contentH;
        const regionH = VH - phoneTop - botM;
        const groupTop = phoneTop + Math.max(0, (regionH - groupH) / 2);
        const phoneFull = { l: VW / 2 - pW / 2, tp: groupTop, w: pW, h: pH };

        // The stage panel now fills the WHOLE viewport on mobile (full-bleed),
        // sitting behind BOTH the phone and the written content — not just the
        // bottom text card. `textTop` marks where the written column begins (the
        // old card's top edge); it's exposed as a CSS var so the copy/rail still
        // lay out in the lower region over this full-screen background.
        const textTop = phoneFull.tp + phoneFull.h + gap;
        const panelFull = { l: 0, tp: 0, w: VW, h: VH };

        // Intro splash phone — large and tucked HALF below the viewport, so only
        // its upper half is visible; the morph then rises it up into phoneFull.
        const spW = maxPhoneW;
        const spH = spW * PHONE_AR;
        const phoneSplash = { l: VW / 2 - spW / 2, tp: VH - spH / 2, w: spW, h: spH };

        return { panelFull, phoneFull, phoneSplash, textTop, botM };
      }

      const mH = Math.max(28, Math.min(VW * 0.022, 40));
      const mV = Math.max(30, Math.min(VH * 0.05, 52));
      // Stage WIDTH kept reduced (but a touch wider than the 0.6 minimum so
      // the flanking copy/rail get breathing room from the panel edges).
      // Height stays scaled up (0.9) so the panel reads taller than square.
      const STAGE_W = 0.72;
      const STAGE_H = 0.9;
      const panelW = (VW - 2 * mH) * STAGE_W;
      const panelH = (VH - 2 * mV) * STAGE_H;
      const panelFull = { l: (VW - panelW) / 2, tp: (VH - panelH) / 2, w: panelW, h: panelH };

      // Phone — splash (intro): a CENTERED device mockup showing the red Flicker
      // splash, sitting low so the logo lands ~lower-middle and the device bleeds
      // a little below the fold (Figma intro frame). Sized off VIEWPORT HEIGHT so
      // the whole composition scales UNIFORMLY from the 1920×1080 reference: at
      // 1080p high it is 380px (VH*0.352 = 380), and it scales proportionally as
      // the viewport grows/shrinks — identical relative size on every 16:9 desktop
      // instead of freezing at a width cap. The VW*0.62 guard keeps it from
      // over-widening on portrait / mobile; floor + ceiling bound the extremes.
      const spW = Math.max(220, Math.min(VH * 0.352, VW * 0.62, 660));
      const spH = spW * PHONE_AR;
      // Sit the device LOW so it bleeds well below the fold (only the upper
      // portion with the splash logo shows) — a taller start point also gives
      // the morph more upward travel into the stage.
      const phoneSplash = { l: VW / 2 - spW / 2, tp: VH * 0.56, w: spW, h: spH };

      // Phone — full: sized by HEIGHT so the app Lottie fills the stage's
      // top/bottom margins (still leaving a small even inset). Width follows
      // the locked phone aspect ratio, so the Lottie is never distorted and
      // nothing inside the frame is altered — only the outer rect grows.
      const vInset = Math.max(20, Math.min(panelFull.h * 0.045, 40));
      const pFullH = panelFull.h - 2 * vInset;
      const pFullW = pFullH / PHONE_AR;
      const phoneFull = {
        l: VW / 2 - pFullW / 2,
        tp: panelFull.tp + (panelFull.h - pFullH) / 2,
        w: pFullW, h: pFullH
      };
      return { panelFull, phoneFull, phoneSplash };
    };

    const setRect = (el, r) => {
      el.style.left = r.l + "px";
      el.style.top = r.tp + "px";
      el.style.width = r.w + "px";
      el.style.height = r.h + "px";
    };

    // Progress-INDEPENDENT layout: the heading band, the CSS column vars, the
    // CONSTANT stage-panel rect + radius, and the phone's FIXED base box. These
    // depend only on geometry (viewport + header height), never on scroll
    // progress, so they are set ONCE per geometry change (build / refresh /
    // resize) — never on the scroll hot path. Writing them every frame (as
    // before) forced a full reflow on every scroll tick: the dominant mobile
    // jank in this 7×vh pin. geom() is likewise cached, not recomputed per frame.
    let cachedG = null;
    const applyStatic = (G) => {
      if (!G) return;
      if (headingRef.current) {
        headingRef.current.style.top = headerH + "px";
        headingRef.current.style.height = Math.max(0, G.phoneSplash.tp - headerH) + "px";
      }
      if (pinRef.current) {
        pinRef.current.style.setProperty("--hiw-phone-half", (G.phoneFull.w / 2) + "px");
        if (G.textTop != null) {
          pinRef.current.style.setProperty("--hiw-text-top", G.textTop + "px");
          pinRef.current.style.setProperty("--hiw-bot-m", G.botM + "px");
        }
      }
      const panel = panelRef.current;
      if (panel) {
        // panelFull is constant for a given viewport → set the rect + radius once.
        // Per-frame opacity/scale/blur still run in render() (compositor-only).
        panel.style.left = G.panelFull.l + "px";
        panel.style.top = G.panelFull.tp + "px";
        panel.style.width = G.panelFull.w + "px";
        panel.style.height = G.panelFull.h + "px";
        panel.style.borderRadius = G.textTop != null ? "0px" : "22px";
      }
      const phone = phoneRef.current;
      if (phone) {
        // Fixed base box = the BEATS (full) rect; the splash→full morph is a
        // compositor-only transform in render(). PHONE_AR is locked, so scaleX ==
        // scaleY and the rendered rect is identical to the old l/tp/w/h morph.
        phone.style.left = G.phoneFull.l + "px";
        phone.style.top = G.phoneFull.tp + "px";
        phone.style.width = G.phoneFull.w + "px";
        phone.style.height = G.phoneFull.h + "px";
        phone.style.transformOrigin = "0 0";
      }
    };
    const recompute = () => { cachedG = geom(); applyStatic(cachedG); };

    /* ---- master scrub renderer ---- */
    const render = (p) => {
      lastP = p;
      const panel = panelRef.current;
      const phone = phoneRef.current;
      if (!panel || !phone) return;
      const G = cachedG || (cachedG = geom());

      // ---- Phase A: genre scrub ----
      const scrubP = clamp01(p / SCRUB_END);
      tracks.forEach((t) => gsap.set(t.el, { x: lerp(t.fromX, t.toX, scrubP) }));

      // Genre rows fade out over the TAIL of the scrub phase, so they are fully
      // gone BEFORE the morph (and the Lottie phone) ever begins. Doing it here
      // instead of on the morph guarantees there's no overlap window — even on a
      // rapid/skipped-frame scroll the rows can't show behind the Lottie. Once
      // faded we also flip visibility:hidden so no stale composited GPU layer can
      // flash behind the animation.
      if (rowsRef.current) {
        const rowsOp = 1 - clamp01((scrubP - 0.7) / 0.3);
        gsap.set(rowsRef.current, {
          opacity: rowsOp,
          visibility: rowsOp <= 0.001 ? "hidden" : "visible"
        });
      }

      // Heading text-fill-on-scroll, tied to the horizontal genre scrub: every
      // word fills gray -> ink across the FULL scrub, so the last word reaches
      // ink exactly at scrubP === 1 (== SCRUB_END). The morph (Phase B) cannot
      // progress until p > SCRUB_END, so the splash never morphs until all text
      // has become the ink colour.
      {
        const hwords = headWordRefs.current;
        const hfill = scrubP * hwords.length;
        for (let j = 0; j < hwords.length; j++)
        if (hwords[j]) hwords[j].style.color = mixColor(GRAY, INK, clamp01(hfill - j));
      }

      // ---- Phase B: morph ----
      const m = clamp01((p - SCRUB_END) / (MORPH_END - SCRUB_END));
      const me = smooth(m);
      // Intro chrome: the centered heading fades out on the morph. (The genre
      // rows are already faded + hidden by the end of Phase A above.)
      if (headingRef.current) gsap.set(headingRef.current, { opacity: 1 - clamp01(me * 1.4), y: -me * 12 });

      // Stage panel: rect + radius are set ONCE in applyStatic (constant). Here we
      // only animate the compositor-cheap fade + scale (+ desktop blur) reveal.
      gsap.set(panel, {
        opacity: me,
        scale: lerp(0.96, 1, me),
        // Blur reveal on desktop only; on touch the opacity+scale fade carries it.
        filter: !allowBlur || me > 0.99 ? "none" : `blur(${(1 - me) * 10}px)`,
        transformOrigin: "50% 50%"
      });

      // Phone: travels + shrinks from the centered splash to the centered beats
      // position — driven by a COMPOSITOR-ONLY transform off the fixed base box
      // (applyStatic), so there is NO per-frame reflow. Locked PHONE_AR ⇒ uniform
      // scale, so the rendered rect equals the old left/top/width/height morph.
      // Opacity is owned by the entry tween + exitST; render() only drives transform.
      const pr = lerpRect(G.phoneSplash, G.phoneFull, me);
      const s = G.phoneFull.w ? pr.w / G.phoneFull.w : 1;
      phone.style.transform =
        `translate3d(${pr.l - G.phoneFull.l}px, ${pr.tp - G.phoneFull.tp}px, 0) scale(${s})`;

      // ---- Splash ↔ Lottie crossfade (ported from home-v2) ----
      // The red Flicker splash slides LEFT and fades while the app screens
      // swipe in from the RIGHT; from there the beats run exactly as before.
      if (splashRef.current) {
        const sp = clamp01((me - 0.05) / 0.5);
        splashRef.current.style.opacity = String(1 - sp);
        splashRef.current.style.transform = `translateX(${-sp * 100}%)`;
      }
      if (lottiesWrapRef.current) {
        const lp = clamp01(me / 0.6);
        lottiesWrapRef.current.style.opacity = "1";
        // Once fully in, DROP the transform (and its composited raster layer) so
        // the dense Lottie SVG renders crisply at native resolution instead of
        // from a low-res cached GPU layer (the source of the blur).
        lottiesWrapRef.current.style.transform = lp >= 1 ? "none" : `translateX(${(1 - lp) * 100}%)`;
      }

      const gridOp = clamp01((m - 0.55) / 0.45);
      if (copyColRef.current) gsap.set(copyColRef.current, { opacity: gridOp });
      if (railColRef.current) gsap.set(railColRef.current, { opacity: gridOp });

      // ---- Phase C: beats ----
      const sp = clamp01((p - MORPH_END) / (1 - MORPH_END));
      const sf = sp * BEATS.length;

      BEATS.forEach((b, i) => {
        const vis = beatVis(i, sf);
        const holder = holderRefs[i].current;
        if (holder) holder.style.opacity = vis;
        // Lottie is the heaviest per-frame op here: a dense app-screen SVG that
        // re-renders (and dirties layout) on every goToAndStop. Two wins, both
        // imperceptible: (1) skip beats that are invisible (vis≈0) — at most two
        // ever crossfade at once, so this drops ~⅔ of renders; (2) quantize to the
        // INTEGER frame and skip when unchanged, so a slow scroll doesn't re-render
        // the same frame. A beat repaints to the correct frame the moment it shows.
        if (ready[i] && anims[i] && vis > 0.001) {
          const fr = Math.round(clamp01(sf - i) * b.frames);
          if (fr !== lastFrame[i]) { lastFrame[i] = fr; anims[i].goToAndStop(fr, true); }
        }

        const cb = copyBeatRefs[i].current;
        if (cb) {
          cb.style.opacity = vis;
          cb.style.transform = `translateY(calc(-50% + ${(1 - vis) * 12}px))`;
        }
        const words = wordRefs.current[i];
        if (words && words.length) {
          const head = clamp01(sf - i) * words.length;
          for (let j = 0; j < words.length; j++) words[j].style.color = mixColor(GRAY, INK, clamp01(head - j));
        }
        const rb = railBeatRefs[i].current;
        if (rb) {
          rb.style.opacity = vis;
          rb.style.transform = `translateY(calc(-50% + ${(1 - vis) * 10}px))`;
        }
      });
      // Rail progress fill: drive via scaleY (transform-origin top, CSS) so it
      // grows without a per-frame height reflow. Base height is 100% in CSS.
      if (railFillRef.current) railFillRef.current.style.transform = `scaleY(${sp})`;
    };

    /* ---- build ---- */
    let st = null,loadTrigger = null,entryT = null,rowsEntryT = null,phoneEntryT = null,exitST = null;
    const build = () => {
      measureHeader();
      setupTracks();
      recompute(); // seed cachedG + apply the constant layout once, before render(0)

      // Genre rows: gentle fade + rise as the section arrives.
      gsap.set(rowsRef.current, { opacity: 0, y: 24 });
      rowsEntryT = gsap.to(rowsRef.current, {
        opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 80%", end: "top 40%", scrub: 1 }
      }).scrollTrigger;

      // Heading: fade + blur in as the section arrives. The word-by-word
      // gray -> ink fill is NOT done here — it runs in render() during the
      // pinned horizontal genre scrub (Phase A), so the text fills as the
      // horizontal scroll applies.
      gsap.set(headingRef.current, { opacity: 0, y: 24, filter: allowBlur ? "blur(8px)" : "none" });
      entryT = gsap.to(headingRef.current, {
        opacity: 1, y: 0, filter: allowBlur ? "blur(0px)" : "none", duration: 0.8, ease: "power3.out",
        scrollTrigger: {
          trigger: section, start: "top 82%", end: "top 40%", scrub: 1
        }
      }).scrollTrigger;

      // Phone: fade in as the section sets into the viewport. OPACITY ONLY —
      // render() now owns the phone's transform (the splash→full morph), so the
      // entrance must not also animate transform (a `y` rise) or the two would
      // fight on the same channel. render(0)/applyStatic already park the phone at
      // the splash rect, so a plain fade reads the same (the morph starts the
      // instant the pin engages anyway).
      gsap.set(phoneRef.current, { opacity: 0 });
      phoneEntryT = gsap.to(phoneRef.current, {
        opacity: 1, ease: "power2.out",
        scrollTrigger: { trigger: section, start: "top 45%", end: "top 5%", scrub: 1 }
      }).scrollTrigger;

      st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => "+=" + window.innerHeight * 7,
        pin: pinRef.current,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefreshInit: setupTracks,
        onUpdate: (self) => render(self.progress),
        onRefresh: () => { recompute(); render(lastP); }
      });

      loadTrigger = ScrollTrigger.create({
        trigger: section,
        start: "top bottom+=60%",
        once: true,
        onEnter: loadLotties
      });

      // EXIT — once the pin releases, the section scrolls up in normal flow
      // like the sections ahead (Showcase / Growing) instead of fading in
      // place. Anchoring the trigger to the section BOTTOM (not a pinned-scroll
      // offset) means this only runs AFTER the pin lets go, so the panel rides
      // up with the scroll and fades out over the following viewport — the next
      // section (Showcase) only appears once this one has almost gone. Blur is
      // held off until the fade passes 50% so it dissolves cleanly, then softens.
      exitST = ScrollTrigger.create({
        trigger: section,
        start: "bottom bottom",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          // Fade (+blur) the pinned panel fully out by the HALFWAY point of the
          // exit scroll, so it has cleared before the next section rises into the
          // same space — no two-section overlap during the seam.
          const f = clamp01(self.progress / 0.5);
          if (pinRef.current) {
            pinRef.current.style.opacity = String(1 - f);
            // Desktop adds a blur to the exit; on touch the opacity fade alone clears
            // it — blurring the whole full-viewport pin per frame is too costly.
            const b = f * 18;
            pinRef.current.style.filter = allowBlur && b > 0.3 ? `blur(${b}px)` : "none";
          }
        }
      });

      render(0);
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (killed) return;
        build();
        ScrollTrigger.refresh();
        if (window.lucide) window.lucide.createIcons();
      });
    } else {
      build();
    }

    // Width-gate + debounce. On touch the address bar show/hide fires `resize`
    // continuously DURING scroll with only a HEIGHT delta — re-running measureHeader
    // + setupTracks (reads scrollWidth → forced reflow) + render every tick is pure
    // jank. render() already recomputes geometry from live VH on the next scroll
    // frame, so a height-only change needs no re-measure here. Only genuine WIDTH
    // changes (desktop resize, orientation flip) re-measure, trailing-debounced so a
    // drag-resize can't thrash.
    let lastVW = window.innerWidth;
    let resizeT = 0;
    const onResize = () => {
      if (window.innerWidth === lastVW) return;
      lastVW = window.innerWidth;
      window.clearTimeout(resizeT);
      resizeT = window.setTimeout(() => { measureHeader(); setupTracks(); recompute(); render(lastP); }, 150);
    };
    window.addEventListener("resize", onResize);
    const idle = window.setTimeout(loadLotties, 4500);

    return () => {
      killed = true;
      window.clearTimeout(idle);
      window.clearTimeout(resizeT);
      window.removeEventListener("resize", onResize);
      if (st) st.kill();
      if (loadTrigger) loadTrigger.kill();
      if (entryT) entryT.kill();
      if (rowsEntryT) rowsEntryT.kill();
      if (phoneEntryT) phoneEntryT.kill();
      if (exitST) exitST.kill();
      anims.forEach((a) => a && a.destroy && a.destroy());
    };
  }, []);

  const rowText = (items) => {
    const joined = items.join(SEP);
    return joined + SEP + joined + SEP;
  };
  const renderHeadWords = (text) => {
    headWordRefs.current = [];
    const parts = text.split(" ");
    return parts.map((w, j) =>
    <span
      key={j}
      className="hiw-fill-word"
      ref={(el) => {if (el) headWordRefs.current[j] = el;}}>
        {w}{j < parts.length - 1 ? " " : ""}
      </span>
    );
  };
  const renderWords = (text, beatIdx) => {
    wordRefs.current[beatIdx] = [];
    const parts = text.split(" ");
    return parts.map((w, j) =>
    <span
      key={j}
      className="rword"
      ref={(el) => {if (el) wordRefs.current[beatIdx][j] = el;}}>
        {w}{j < parts.length - 1 ? " " : ""}
      </span>
    );
  };

  return (
    <section
      ref={sectionRef}
      data-screen-label="02 How it works"
      data-no-autofade=""
      className="hiw-section">

      <div ref={pinRef} className="hiw-pin">

        {/* Heading (centered, top) — every word fills gray→ink on the genre
            scrub; the morph is gated on the whole heading reaching ink. */}
        <div ref={headingRef} className="hiw-heading">
          <p className="t-h1">
            {renderHeadWords("Three steps from a great book to a clear insight you can use today.")}
          </p>
        </div>

        {/* Genre rows (full-bleed, behind the box) */}
        <div ref={rowsRef} className="hiw-rows" role="list">
          {GENRE_ROWS.map((items, i) =>
          <div key={i} className="genre-row" role="listitem">
              <div ref={trackRefs[i]} className="genre-track">
                {rowText(items)}
              </div>
            </div>
          )}
        </div>

        {/* Stage panel — margined card that fades in for the beats. Holds the
            copy + rail columns; the phone is a sibling (below) so the panel's
            opacity never hides it. */}
        <div ref={panelRef} className="hiw-panel" style={{ opacity: 0 }}>
          <div ref={gridRef} className="hiw-grid">
            <div ref={copyColRef} className="hiw-copy" style={{ opacity: 0 }}>
              {BEATS.map((b, i) =>
              <div key={i} ref={copyBeatRefs[i]} className="hiw-copy-beat" style={{ opacity: i === 0 ? 1 : 0 }}>
                  <p>{renderWords(b.copy, i)}</p>
                </div>
              )}
            </div>
            <div ref={railColRef} className="hiw-rail" style={{ opacity: 0 }}>
              <div className="rail-track"><div ref={railFillRef} className="rail-fill"></div></div>
              <div className="rail-labels">
                {BEATS.map((b, i) =>
                <div key={i} ref={railBeatRefs[i]} className="rail-beat" style={{ opacity: i === 0 ? 1 : 0 }}>
                    <p className="rail-step">{b.step}</p>
                    <p className="t-h4 rail-title">{b.title}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Phone — sibling of the panel, positioned in viewport px by JS. Opens
            on the red Flicker splash (intro), then the splash crossfades to the
            three Lottie beats that swipe in from the right. */}
        <div ref={phoneRef} className="hiw-phone" aria-hidden="true">
          <div className="hiw-screen">
            <div ref={splashRef} className="hiw-splash">
              <div className="hiw-logo" dangerouslySetInnerHTML={{ __html: FLICKER_MARK }} />
            </div>
            <div ref={lottiesWrapRef} className="hiw-lotties" style={{ opacity: 0, transform: "translateX(100%)" }}>
              {BEATS.map((b, i) =>
              <div
                key={i}
                ref={holderRefs[i]}
                className="lottie-holder"
                role="img"
                aria-label="A demonstration of the Flicker App reading experience"
                style={{ opacity: i === 0 ? 1 : 0 }} />
              )}
            </div>
            {/* Dynamic island — overlays splash + app screens so it always
                reads as device hardware. */}
            <div className="hiw-island" />
          </div>
          {/* Real device mockup frame (SVG) — same asset the archived design
              used, so the splash + beats sit in an actual phone body. */}
          <img className="hiw-frame" src="uploads/app-container.svg" alt="" />
        </div>
      </div>
    </section>);

}

window.HowItWorks = HowItWorks;