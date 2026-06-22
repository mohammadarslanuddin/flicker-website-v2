"use client";
import React from "react";

/* global gsap */
const { useRef, useEffect, useState } = React;

/* ------------------------------------------------------------------ */
/*  Book covers                                                       */
/* ------------------------------------------------------------------ */
const BOOKS = [
"books/01.png", "books/02.png", "books/03.png", "books/04.png",
"books/05.png", "books/06.png", "books/07.png", "books/08.png",
"books/09.png", "books/10.png", "books/11.png", "books/12.png",
"books/13.png"];


function loadImages(srcs) {
  return Promise.all(
    srcs.map(
      (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      })
    )
  ).then((arr) => arr.filter(Boolean));
}

/* ------------------------------------------------------------------ */
/*  Hero background layer — toggleable via the "heroBg" tweak.        */
/*  Sits at z-index 0, BEHIND the floating-cover canvas (z 10) and    */
/*  the radial fog veil (z 12). Every variant is built from Flicker   */
/*  design-system tokens — no invented colors.                        */
/* ------------------------------------------------------------------ */
function HeroBackground({ variant }) {
  if (!variant || variant === "none") return null;

  const base = {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none"
  };

  // ---- Halo family --------------------------------------------------------
  // Soft radial light pools, built from Flicker palette tones (warm almond,
  // brand brick, baby-blue). Each is a full-bleed background; the centre is
  // partly covered by the fog veil, so the glow reads strongest at the frame.
  const HALOS = {
    // Warm, top-right (the original pick).
    halo:
    "radial-gradient(ellipse 78% 66% at 84% 8%, " +
    "#FBE3C4 0%, rgba(251,227,196,0.35) 34%, rgba(251,227,196,0) 64%)",
    // Warm, overhead spotlight from the top edge.
    "halo-top":
    "radial-gradient(ellipse 96% 56% at 50% -8%, " +
    "#FBE3C4 0%, rgba(251,227,196,0.32) 40%, rgba(251,227,196,0) 72%)",
    // Warm, rising from the bottom-centre.
    "halo-bottom":
    "radial-gradient(ellipse 100% 60% at 50% 110%, " +
    "#FBE3C4 0%, rgba(251,227,196,0.30) 42%, rgba(251,227,196,0) 74%)",
    // Duo — warm top-right + cool baby-blue bottom-left (brand pairing).
    "halo-duo":
    "radial-gradient(ellipse 62% 58% at 90% 4%, #FBE3C4 0%, rgba(251,227,196,0) 56%)," +
    "radial-gradient(ellipse 64% 58% at 8% 98%, rgba(155,203,251,0.55) 0%, rgba(155,203,251,0) 60%)",
    // Brand brick tint, top-right.
    "halo-brick":
    "radial-gradient(ellipse 76% 64% at 86% 6%, " +
    "rgba(193,52,65,0.18) 0%, rgba(193,52,65,0.06) 36%, rgba(193,52,65,0) 64%)",
    // Cool baby-blue, top-right.
    "halo-cool":
    "radial-gradient(ellipse 78% 66% at 84% 8%, " +
    "rgba(155,203,251,0.60) 0%, rgba(155,203,251,0.22) 36%, rgba(155,203,251,0) 64%)",
    // Aurora — three soft palette blooms hugging the corners (warm + cool +
    // salmon). Atmospheric, but the centre stays clear so it never mixes with
    // the headline.
    "halo-aurora":
    "radial-gradient(ellipse 55% 50% at 94% -2%, rgba(251,227,196,0.55) 0%, rgba(251,227,196,0) 55%)," +
    "radial-gradient(ellipse 50% 48% at 2% 26%, rgba(155,203,251,0.40) 0%, rgba(155,203,251,0) 55%)," +
    "radial-gradient(ellipse 60% 50% at 64% 110%, rgba(255,179,179,0.34) 0%, rgba(255,179,179,0) 58%)",
    // Focus — a quiet edge vignette. Centre is fully transparent (clean for
    // content); the corners fall off into a soft warm-ink shadow to draw the
    // eye inward. Pairs with the existing centre fog veil.
    "halo-focus":
    "radial-gradient(ellipse 82% 82% at 50% 46%, rgba(34,25,27,0) 56%, " +
    "rgba(34,25,27,0.05) 82%, rgba(34,25,27,0.10) 100%)",
    // Horizon — warm light at the top edge, clean through the middle, a faint
    // cool band at the foot. Reads like a soft sky behind the covers.
    "halo-horizon":
    "linear-gradient(180deg, rgba(251,227,196,0.55) 0%, rgba(251,227,196,0) 32%, " +
    "rgba(155,203,251,0) 70%, rgba(155,203,251,0.30) 100%)"
  };

  if (HALOS[variant]) {
    return <div aria-hidden="true" style={{ ...base, background: HALOS[variant] }} />;
  }

  return null;
}

/* In-hero background switcher options — short labels for the compact pill. */
const HERO_BG_OPTS = [
{ value: "none", label: "None" },
{ value: "halo", label: "Top R" },
{ value: "halo-top", label: "Overhead" },
{ value: "halo-bottom", label: "Bottom" },
{ value: "halo-duo", label: "Duo" },
{ value: "halo-brick", label: "Brick" },
{ value: "halo-cool", label: "Cool" },
{ value: "halo-aurora", label: "Aurora" },
{ value: "halo-focus", label: "Focus" },
{ value: "halo-horizon", label: "Horizon" }];


/* ------------------------------------------------------------------ */
/*  Hero — auto-animated canvas flythrough of book covers.            */
/* ------------------------------------------------------------------ */
export function HeroV3({ tweaks, setTweak }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const heroFrameRef = useRef(null); // morphing card frame — wraps all hero content
  const rotatorRef = useRef(null);
  const scrollIndRef = useRef(null); // wrapper that fades / re-enters on scroll
  const scrollTextRef = useRef(null); // "Scroll" word — split into chars on init
  const scrollLineRef = useRef(null); // hairline divider — scaleX reveal
  const scrollIconRef = useRef(null); // arrow icon wrapper — scale-in reveal
  const scrollArrowRef = useRef(null); // bouncing arrow target
  const bookCardOuterRef = useRef(null); // scroll-driven fade target
  const bookCardRef = useRef(null); // entrance + dismiss animation target
  const [bookCardDismissed, setBookCardDismissed] = useState(false);

  /* ---------- Headline word-by-word reveal ----------
     The two phrases cross-fade by revealing each word in turn with a blur
     (blur-in on enter, blur-out on exit), driven by GSAP. Words are real
     inline-block text spans so kerning stays native; the line never reflows
     because both phrases occupy the same centered, single-line row. */
  useEffect(() => {
    const el = rotatorRef.current;
    if (!el) return;
    const PHRASES = ["Grow Smarter,", "Grow Faster."];
    const DISPLAY_MS = 2000; // dwell once a phrase is fully revealed
    let idx = 0;
    let cancelled = false;
    let timeoutId = 0;

    // The rotator span itself is the single-line row. Keep the weight that
    // React set inline (900); just enforce block + no-wrap here.
    el.textContent = "";
    el.style.display = "block";
    el.style.whiteSpace = "nowrap";

    const buildWords = (phrase) => {
      el.textContent = "";
      const words = phrase.split(" ");
      const spans = words.map((w, i) => {
        const s = document.createElement("span");
        s.textContent = w;
        s.style.cssText =
        "display:inline-block;will-change:transform,filter,opacity;";
        el.appendChild(s);
        if (i < words.length - 1) el.appendChild(document.createTextNode("\u00a0"));
        return s;
      });
      return spans;
    };

    const cycle = () => {
      if (cancelled) return;
      const spans = buildWords(PHRASES[idx]);

      // Reveal IN — word by word, un-blurring and rising into place.
      gsap.set(spans, { opacity: 0, filter: "blur(16px)", yPercent: 35 });
      gsap.to(spans, {
        opacity: 1, filter: "blur(0px)", yPercent: 0,
        duration: 0.62, ease: "power3.out", stagger: 0.14,
        onComplete: () => {
          if (cancelled) return;
          timeoutId = window.setTimeout(() => {
            if (cancelled) return;
            // Reveal OUT — word by word, blurring and lifting away.
            gsap.to(spans, {
              opacity: 0, filter: "blur(16px)", yPercent: -30,
              duration: 0.5, ease: "power3.in", stagger: 0.1,
              onComplete: () => {
                idx = (idx + 1) % PHRASES.length;
                cycle();
              }
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

  /* ---------- Bouncing scroll-down arrow ---------- */
  useEffect(() => {
    const el = scrollArrowRef.current;
    if (!el) return;
    const tween = gsap.to(el, {
      y: 8,
      duration: 1.0,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
    return () => tween.kill();
  }, []);

  /* ---------- Lucide icon hydration ----------
     Lucide's createIcons() walks the document and replaces every
     <i data-lucide="name"> with the matching SVG. The only thing that
     (re)introduces <i> elements here is the book card mounting/unmounting, so
     gate on that instead of re-scanning the whole document after every render
     (each bare-render pass otherwise scheduled + cancelled a rAF for nothing). */
  useEffect(() => {
    if (typeof window === "undefined" || !window.lucide) return;
    const id = requestAnimationFrame(() => window.lucide.createIcons());
    return () => cancelAnimationFrame(id);
  }, [bookCardDismissed]);

  /* ---------- GSAP hover layer ----------
     Buttons no longer use transform-based hover. Every button on the page
     shares ONE uniform ~100ms colour fade defined in CSS (.cta in page.css,
     plus footer/member buttons). This layer now only wires the book-card
     dismiss affordance. */
  useEffect(() => {
    const cleanups = [];

    // Book-card dismiss (\u00d7) \u2014 gentle scale on hover, distinct from card lift
    document.querySelectorAll(".book-card-dismiss").forEach((el) => {
      const enter = () =>
      gsap.to(el, { scale: 1.18, duration: 0.22, ease: "power3.out", overwrite: "auto" });
      const leave = () =>
      gsap.to(el, { scale: 1, duration: 0.28, ease: "power3.out", overwrite: "auto" });
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [bookCardDismissed]); // re-wire after dismiss button mounts/unmounts

  /* ---------- Book of the week: entrance + scroll-driven fade -----------
     Two refs:
       • inner ref — handles entrance + dismiss animations
       • outer ref — receives the scroll-driven opacity/y/blur
     so the two effects never fight for the same transform. */
  useEffect(() => {
    if (bookCardDismissed) return;
    const inner = bookCardRef.current;
    const outer = bookCardOuterRef.current;
    if (!inner || !outer) return;

    // Entrance — slides up + scales in after a 3-second delay so it doesn't
    // compete with the headline / canvas reveal on first load.
    gsap.set(inner, { opacity: 0, y: 28, scale: 0.96 });
    gsap.to(inner, {
      opacity: 1, y: 0, scale: 1,
      duration: 0.85, delay: 3, ease: "power3.out"
    });

    // Scroll-driven defocus: as the hero scrolls past its first half, the
    // card fades, drifts down, and softly blurs out — a depth-of-field exit
    // rather than a hard opacity cut.
    let st = null;
    if (typeof ScrollTrigger !== "undefined" && wrapRef.current) {
      st = ScrollTrigger.create({
        trigger: wrapRef.current,
        start: "top top",
        end: "50% top",
        onUpdate: (self) => {
          const p = self.progress; // 0 → 1 across the first half of hero
          // Smooth easing on the scroll mapping for a more organic feel
          const eased = p * p * (3 - 2 * p); // smoothstep
          gsap.set(outer, {
            opacity: 1 - eased,
            y: eased * 24,
            filter: `blur(${eased * 5}px)`
          });
        }
      });
    }

    return () => {
      if (st) st.kill();
      gsap.killTweensOf([inner, outer]);
    };
  }, [bookCardDismissed]);

  /* ---------- Scroll indicator: char-split entry + ScrollTrigger reveal ----
     On mount we split "Scroll" into per-character spans and run a coordinated
     entry: chars unfold from below, hairline scales in, arrow pops with a
     gentle overshoot. When the user scrolls below the hero we fade the whole
     indicator out + push it down 16px. On scroll back up to the hero we
     replay the entry animation. */
  useEffect(() => {
    const indEl = scrollIndRef.current;
    const textEl = scrollTextRef.current;
    const lineEl = scrollLineRef.current;
    const iconEl = scrollIconRef.current;
    if (!indEl || !textEl || !lineEl || !iconEl) return;

    // Split "Scroll" into characters once
    textEl.textContent = "";
    const chars = [];
    for (const ch of "Scroll") {
      const s = document.createElement("span");
      s.style.cssText = "display:inline-block;will-change:transform;line-height:1;";
      s.textContent = ch;
      textEl.appendChild(s);
      chars.push(s);
    }

    // Coordinated reveal — chars rise + tilt back to upright, line draws in
    // from the left, arrow eases in with a slight overshoot.
    const reveal = () => {
      gsap.set(indEl, { opacity: 1, y: 0 });
      gsap.set(chars, { opacity: 0, yPercent: 110, rotateX: -90 });
      gsap.set(lineEl, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(iconEl, { opacity: 0, scale: 0.3 });

      const tl = gsap.timeline();
      tl.to(chars, {
        opacity: 1, yPercent: 0, rotateX: 0,
        duration: 0.6, stagger: 0.04, ease: "power3.out"
      });
      tl.to(lineEl, {
        scaleX: 1, duration: 0.45, ease: "power3.out"
      }, "-=0.45");
      tl.to(iconEl, {
        opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)"
      }, "-=0.35");
      return tl;
    };

    const hide = () => {
      gsap.to(indEl, {
        opacity: 0, y: 16, duration: 0.35, ease: "power2.in"
      });
    };

    // Initial entry
    reveal();

    // Hide once user scrolls below the hero, replay when they come back
    let st = null;
    if (typeof ScrollTrigger !== "undefined" && wrapRef.current) {
      st = ScrollTrigger.create({
        trigger: wrapRef.current,
        start: "top top",
        end: "bottom 60%",
        onLeave: hide,
        onEnterBack: reveal
      });
    }

    return () => {
      if (st) st.kill();
      gsap.killTweensOf([indEl, chars, lineEl, iconEl]);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Size the canvas to the SECTION, not the morphing card frame. The frame's
    // left/right/top/bottom are animated every scroll-morph tick; observing it
    // would refire the ResizeObserver ~60×/s, reallocating the whole canvas
    // backing buffer each time — the main cause of the "heavy" hero scroll.
    // The section is a stable 100vh/100vw box, so it only changes on a real
    // viewport resize. The canvas tracks the morphing frame purely in CSS
    // (width/height:100% in the JSX), so the buffer never needs reallocating
    // mid-morph — the browser just downscales it into the shrinking card.
    const section = wrapRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d");

    // Cap DPR at 1.5: this is a soft, fading, in-motion decorative layer, so
    // 2× device pixels quadruple fill-rate for no visible gain. 1.5 keeps it
    // crisp while cutting per-frame clear+draw cost on retina.
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0,H = 0;
    let raf = 0;
    let cancelled = false;
    let io = null;       // pauses the loop + tweens when the hero is off-screen
    let visible = true;
    const tweens = [];
    const cards = [];

    const resize = () => {
      const r = section.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      const bw = Math.round(W * dpr);
      const bh = Math.round(H * dpr);
      // Only reallocate the backing store when the section truly changed size
      // (a viewport resize) — never during the scroll-morph.
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(section);

    // -------------------- perspective config --------------------
    const FOCAL = tweaks.perspective === "deep" ? 700 :
    tweaks.perspective === "flat" ? 1400 :
    950;
    const Z_FAR = 1400;
    const Z_NEAR = -260;
    const FADE_FAR_START = 1300;
    const FADE_FAR_END = 950;
    const FADE_NEAR_START = 60;
    const FADE_NEAR_END = -200;
    const SPREAD = 520 * tweaks.spread;
    const N = Math.max(2, Math.min(16, Math.round(tweaks.density)));
    const TRAVERSE = 7 / Math.max(0.2, tweaks.speed);
    const CARD_SIZE = tweaks.cardSize || 1;

    let lastImgIdx = -1;

    loadImages(BOOKS).then((images) => {
      if (cancelled || images.length === 0) return;

      for (let i = 0; i < N; i++) {
        cards.push({
          worldX: 0, worldY: 0, z: Z_FAR, rot: 0,
          imgIdx: i % images.length,
          scaleJitter: 1,
          angle: null
        });
      }

      function spawn(card, delay = 0, firstZ = Z_FAR) {
        // Circular orbit layout — angles picked via best-candidate
        // sampling so the ring stays evenly populated. Covers stay upright.
        const RADIUS = SPREAD;
        const RADIUS_JITTER = SPREAD * 0.08;
        const TRIES = 16;
        let bestAngle = 0,bestMinAngDist = -1;
        for (let t = 0; t < TRIES; t++) {
          const ang = Math.random() * Math.PI * 2;
          let minAng = Infinity;
          for (const other of cards) {
            if (other === card) continue;
            if (other.z > Z_FAR || other.z < Z_NEAR) continue;
            if (other.angle == null) continue;
            let d = Math.abs(ang - other.angle) % (Math.PI * 2);
            if (d > Math.PI) d = Math.PI * 2 - d;
            if (d < minAng) minAng = d;
          }
          if (minAng > bestMinAngDist) {
            bestMinAngDist = minAng;
            bestAngle = ang;
          }
        }
        card.angle = bestAngle;
        const r = RADIUS + (Math.random() - 0.5) * 2 * RADIUS_JITTER;
        card.worldX = Math.cos(bestAngle) * r;
        card.worldY = Math.sin(bestAngle) * r * 0.7;
        card.rot = 0;
        // Cover picker — avoid repeating back-to-back
        let next;
        do {next = Math.floor(Math.random() * images.length);} while (
        images.length > 1 && next === lastImgIdx);
        card.imgIdx = next;
        lastImgIdx = next;
        card.scaleJitter = 0.92 + Math.random() * 0.28;
        card.z = firstZ;

        const tween = gsap.to(card, {
          z: Z_NEAR,
          duration: TRAVERSE * (firstZ === Z_FAR ? 1 : (firstZ - Z_NEAR) / (Z_FAR - Z_NEAR)),
          delay,
          ease: "none",
          onComplete: () => {if (!cancelled) spawn(card, 0, Z_FAR);}
        });
        tweens.push(tween);
      }

      cards.forEach((card, i) => {
        const t0 = i / N;
        const startZ = Z_FAR - t0 * (Z_FAR - Z_NEAR);
        spawn(card, 0, startZ);
      });

      const ASPECT = 2 / 3;

      // Reused across frames — sorting this persistent array in place avoids
      // allocating a fresh array (and the GC churn) on every one of the 60
      // render ticks per second. The card object references never change.
      const sorted = cards.slice();

      const render = () => {
        ctx.clearRect(0, 0, W, H);
        const cx = W / 2;
        const cy = H / 2;
        sorted.sort((a, b) => b.z - a.z);

        for (const c of sorted) {
          const factor = FOCAL / (FOCAL + c.z);
          if (!isFinite(factor) || factor <= 0) continue;

          let a = 1;
          if (c.z > FADE_FAR_END)
          a *= 1 - Math.min(1, Math.max(0, (c.z - FADE_FAR_END) / (FADE_FAR_START - FADE_FAR_END)));
          if (c.z < FADE_NEAR_START)
          a *= Math.min(1, Math.max(0, (c.z - FADE_NEAR_END) / (FADE_NEAR_START - FADE_NEAR_END)));
          if (a <= 0.005) continue;

          const px = cx + c.worldX * factor;
          const py = cy + c.worldY * factor;

          const base = Math.min(W, H) * 0.34 * c.scaleJitter * CARD_SIZE;
          const h = base * factor;
          const w = h * ASPECT;

          const img = images[c.imgIdx];
          if (!img) continue;

          ctx.save();
          ctx.globalAlpha = a;
          ctx.translate(px, py);
          ctx.rotate(c.rot);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
        }

        raf = visible ? requestAnimationFrame(render) : 0;
      };

      // Pause the canvas redraw AND the orbiting tweens whenever the hero is
      // fully off-screen. Without this, an 8-tween infinite animation plus a
      // 60fps full-canvas redraw keep burning CPU the entire time the user is
      // reading the rest of the page. rootMargin wakes it just before re-entry.
      io = new IntersectionObserver((entries) => {
        const nowVisible = entries.some((e) => e.isIntersecting);
        if (nowVisible === visible) return;
        visible = nowVisible;
        tweens.forEach((t) => t && t.paused(!visible));
        if (visible && !raf) raf = requestAnimationFrame(render);
      }, { rootMargin: "200px" });
      io.observe(section);

      raf = requestAnimationFrame(render);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (io) io.disconnect();
      tweens.forEach((t) => t.kill());
      cards.forEach((c) => gsap.killTweensOf(c));
    };
  }, [tweaks.density, tweaks.speed, tweaks.spread, tweaks.perspective, tweaks.cardSize]);

  /* ---------- Scroll-morph: hero → margined card (GSAP) ----------
     Normal vertical scrolling. GSAP scrubs the morph between 15% and 75% of
     the hero's scroll, so the whole hero frame insets to the SAME margins as
     section 3's stage panel and rounds to a 22px radius — then holds. Geometry
     mirrors how-it-works.jsx's panelFull exactly. Nothing else is animated. */
  useEffect(() => {
    if (typeof ScrollTrigger === "undefined" || typeof gsap === "undefined") return;
    const section = wrapRef.current;
    const frame = heroFrameRef.current;
    if (!section || !frame) return;
    if (window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // GSAP tweens this 0 → 1 proxy across the scroll range; onUpdate applies
    // the eased value with live viewport margins so it stays responsive.
    const state = { e: 0 };
    const applyRect = () => {
      const e = state.e;
      const VW = window.innerWidth;
      const VH = window.innerHeight;
      // Identical margins to how-it-works.jsx's panelFull.
      const mH = Math.max(28, Math.min(VW * 0.022, 40));
      const mV = Math.max(30, Math.min(VH * 0.05, 52));
      frame.style.left = e * mH + "px";
      frame.style.right = e * mH + "px";
      frame.style.top = e * mV + "px";
      frame.style.bottom = e * mV + "px";
      frame.style.borderRadius = e * 22 + "px";
    };

    const tween = gsap.to(state, {
      e: 1,
      ease: "power2.inOut",
      onUpdate: applyRect,
      scrollTrigger: {
        trigger: section,
        start: "15% top", // morph begins once the hero is 15% scrolled
        end: "75% top", // fully set by 75%
        scrub: 1, // 1s smoothing lag → extra-smooth catch-up
        invalidateOnRefresh: true
      }
    });
    applyRect();

    // Dissolve: from 60% scroll the whole hero fades + blurs out as it
    // continues morphing/leaving — a soft defocus exit.
    const fade = gsap.to(section, {
      opacity: 0,
      filter: "blur(14px)",
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "60% top",
        end: "bottom top",
        scrub: 1,
        invalidateOnRefresh: true
      }
    });

    return () => {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
      if (fade.scrollTrigger) fade.scrollTrigger.kill();
      fade.kill();
    };
  }, []);

  return (
    <section
      ref={wrapRef}
      data-screen-label="01 Hero"
      data-no-autofade=""
      style={{
        position: "relative",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        background: "var(--bg)"
      }}>
      
      {/* ---------- Morphing card frame ----------
                 All hero content lives inside this frame. As the hero scrolls past
                 50%, it insets to section-3's panel margins and rounds to 22px, so
                 the whole hero shrinks into that card. No shadow / colour added. */}
      <div
        ref={heroFrameRef}
        style={{
          position: "absolute",
          left: 0, right: 0, top: 0, bottom: 0,
          overflow: "hidden",
          borderRadius: 0,
          willChange: "left, right, top, bottom, border-radius"
        }}>

      {/* ---------- Toggleable background layer (z 0, behind canvas) ---------- */}
      <HeroBackground variant={tweaks.heroBg} />

      {/* ---------- Canvas (floating book covers) ---------- */}
      <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", zIndex: 10 }} />
      

      {/* ---------- Backdrop fog: radial canvas-color halo behind content ----
                                                                            A single canvas-color veil fading to transparent. Pure gradient,
                                                                            no blur — per the latest direction. */}
      <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 12,
            pointerEvents: "none",
            background:
            "radial-gradient(ellipse 92% 78% at 50% 52%, " +
            "rgba(var(--bg-rgb), 0.97) 0%, " +
            "rgba(var(--bg-rgb), 0.92) 14%, " +
            "rgba(var(--bg-rgb), 0.78) 30%, " +
            "rgba(var(--bg-rgb), 0.50) 50%, " +
            "rgba(var(--bg-rgb), 0.22) 72%, " +
            "rgba(var(--bg-rgb), 0.00) 92%)"
          }} />
      

      {/* ---------- Top chrome ----------
                               The site-wide fixed top bar (logo + Sign in + Menu) now lives in
                               SiteNav (site-nav.jsx), portaled to <body>, so the hero's own inline
                               header was removed to avoid a duplicate bar. */}

      {/* ---------- Centered content ---------- */}
      <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            padding: "0 24px",
            textAlign: "center"
          }}>
        
        {/* Eyebrow removed per direction — content sits cleanly centered. */}

        {/* Display headline — Fraunces (display optical size).
                                                                              Top line: rolling-text rotator. Black weight (900).
                                                                              Bottom line: static "in Minutes." in italic light brick. */}
        <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-serif-display)",
              fontWeight: 600,
              fontSize: "clamp(var(--text-3xl), 8vw, var(--text-6xl))",
              lineHeight: "var(--leading-none)",
              letterSpacing: "-0.03em",
              color: "var(--ink)",
              maxWidth: 1200,
              textWrap: "balance"
            }}>
          
          <span
              ref={rotatorRef}
              className="headline-roll"
              style={{
                display: "block",
                fontWeight: 600, fontFamily: "var(--font-serif-display)"
              }}>
            
            Grow Smarter,
          </span>
          <em
              style={{
                display: "block",
                fontStyle: "italic",

                color: "var(--brick)", lineHeight: "var(--leading-none)", fontWeight: "600", fontSize: "clamp(var(--text-3xl), 8vw, var(--text-6xl))", fontFamily: "var(--font-serif-display)"
              }}>in minutes.


          </em>
        </h1>

        {/* Subtitle — Outfit lead */}
        <p
            style={{
              margin: "26px 0 0 0",
              fontFamily: "var(--font-sans)",

              fontSize: "var(--text-base)",
              lineHeight: 1.5,
              color: "var(--ink-soft)",
              maxWidth: 620,
              textWrap: "pretty", fontWeight: "400"
            }}>
          
          Get the core ideas from the world&rsquo;s best books, without the
          hours. Flicker App turns big reads into clear insights you can use today.
        </p>

        {/* CTAs */}
        <div
            className="hero-ctas"
            style={{
              marginTop: 36,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center"
            }}>
          
          <a href="#get-started" className="cta cta-primary">
            Get started
            <span aria-hidden="true" className="cta-arrow">
              <i className="ph ph-arrow-right" style={{ display: "block", fontSize: "16px", lineHeight: 1 }}></i>
            </span>
          </a>
          <a href="#download" className="cta cta-secondary">
            <img
                src="flicker/app-icon.svg"
                alt=""
                aria-hidden="true"
                width="28"
                height="28"
                style={{ display: "block", borderRadius: 7, marginRight: 2 }} />
            
            Download The App
          </a>
        </div>
      </div>

      {/* ---------- Bottom-left tagline ---------- */}
      <div
          style={{
            position: "absolute",
            left: 24, bottom: 28,
            zIndex: 25,
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-xs)",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-muted)",
            display: "flex",
            alignItems: "center",
            gap: 10
          }}>
        
        <span
            aria-hidden="true"
            className="stat-stack">
          
          <img src="books/03.png" alt="" className="stat-stack-cover" style={{ zIndex: 4 }} />
          <img src="books/07.png" alt="" className="stat-stack-cover" style={{ zIndex: 3 }} />
          <img src="books/10.png" alt="" className="stat-stack-cover" style={{ zIndex: 2 }} />
          <img src="books/12.png" alt="" className="stat-stack-cover" style={{ zIndex: 1 }} />
        </span>
        2,300+ titles &middot; 15-min reads
      </div>

      {/* ---------- Book of the week card ---------- */}
      {!bookCardDismissed &&
        <div ref={bookCardOuterRef} className="book-card-wrap">
        <div ref={bookCardRef} className="book-card-lift">
          <a
              href="#book-of-the-week"
              className="book-card"
              aria-label="Book of the week: Atomic Habits by James Clear"
              style={{ border: "1px solid #E7E4DE", backgroundColor: "#FFFFFF" }}
              onMouseEnter={() => {
                const lift = bookCardRef.current;
                if (!lift) return;
                lift.classList.add("is-lifted");
                gsap.to(lift, { y: -4, duration: 0.32, ease: "power3.out", overwrite: "auto" });
              }}
              onMouseLeave={() => {
                const lift = bookCardRef.current;
                if (!lift) return;
                lift.classList.remove("is-lifted");
                gsap.to(lift, { y: 0, duration: 0.4, ease: "power3.out", overwrite: "auto" });
              }}>

            <img
                src="books/01.png"
                alt=""
                className="book-card-cover"
                loading="lazy" />

            <div className="book-card-text">
              <span className="book-card-badge" style={{ fontWeight: "400", fontSize: "var(--text-2xs)" }}>Book of the week</span>
              <span className="book-card-title" style={{ letterSpacing: "-0.04em", fontSize: "var(--text-base)" }}>Atomic Habits</span>
              <span className="book-card-meta">
                <span>James Clear</span>
                <span aria-hidden="true" className="book-card-meta-dot" />
                <span className="book-card-genre">Self-development</span>
              </span>
            </div>
          </a>
          <button
              type="button"
              className="book-card-dismiss"
              aria-label="Dismiss book of the week"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const lift = bookCardRef.current;
                if (!lift) {setBookCardDismissed(true);return;}
                gsap.to(lift, {
                  opacity: 0, scale: 0.94, y: 14, filter: "blur(4px)",
                  duration: 0.4, ease: "power2.in",
                  onComplete: () => setBookCardDismissed(true)
                });
              }}>

            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ display: "none" }}>
              <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <i className="ph ph-x" style={{ display: "block", fontSize: "13px", lineHeight: 1 }}></i>
          </button>
        </div>
      </div>
      }

      {/* ---------- Bottom-right scroll indicator (replaces pause button) -- */}
      <div
          ref={scrollIndRef}
          style={{
            position: "absolute",
            right: 24, bottom: 28,
            zIndex: 25,
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-xs)",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-muted)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            perspective: 400
          }}>

        <span
            ref={scrollTextRef}
            style={{
              display: "inline-flex",
              lineHeight: 1,
              overflow: "hidden",
              paddingBottom: 2
            }}>
          Scroll
        </span>
        <span
            ref={scrollLineRef}
            style={{ display: "inline-block", width: 22, height: 1, background: "currentColor", opacity: 0.6 }} />
        
        <span
            ref={scrollIconRef}
            aria-hidden="true"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>

          <span
              ref={scrollArrowRef}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ph ph-arrow-down" style={{ display: "block", fontSize: "13px", lineHeight: 1 }}></i>
          </span>
        </span>
      </div>

      </div>{/* /hero card frame */}
    </section>);

}

/* ------------------------------------------------------------------ */
/*  Section AFTER the hero                                            */
/* ------------------------------------------------------------------ */
function AfterHeroV3() {
  return (
    <section
      data-screen-label="02 After hero"
      style={{
        background: "var(--bg)",
        padding: "10vh 8vw",
        borderTop: "1px solid var(--rule)"
      }}>
      
      <div
        className="t-eyebrow"
        style={{ marginBottom: 28 }}>
        
        How it works
      </div>
      <p
        className="t-h1"
        style={{
          margin: 0,
          maxWidth: 920,
          color: "var(--ink)",
          textWrap: "pretty",
          fontWeight: 600
        }}>
        
        Every Flicker App is a 15-minute distillation written by editors, not
        algorithms. Listen on the commute, read in bed, save what
        matters &mdash; and keep the books you love in your pocket.
      </p>
    </section>);

}

window.HeroV3 = HeroV3;
window.AfterHeroV3 = AfterHeroV3;