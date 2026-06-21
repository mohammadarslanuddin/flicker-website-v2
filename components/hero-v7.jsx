"use client";
import React from "react";

/* global gsap, ScrollTrigger */
const { useRef, useEffect } = React;

/* ------------------------------------------------------------------ */
/*  Flicker — Hero (v7 / "Home A" approach).                          */
/*  A static, editorial hero: centered display headline + subtitle +  */
/*  two CTAs, with a large iPhone mockup rising out of a rounded       */
/*  neutral panel near the foot of the screen. Replaces v6's animated  */
/*  floating-book-cover canvas. Geometry + tokens taken verbatim from  */
/*  the Figma "Home A" frame (node 1:76).                              */
/*                                                                     */
/*  The phone is built from the provided frame SVG                     */
/*  (public/home-v7/app-container.svg — bezel + island + black screen) */
/*  with a brick-red splash + white Flicker mark composited over the   */
/*  screen, exactly as the design's "Splash" layer does.              */
/* ------------------------------------------------------------------ */

// White Flicker "F" mark — same path used by site-nav's logo pill; fills with
// currentColor so we can paint it cream on the brick splash.
const FLICKER_MARK =
'<svg viewBox="0 0 77 78" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:100%;height:100%;display:block">' +
'<path fill-rule="evenodd" clip-rule="evenodd" d="M23.9795 77.1383C23.6821 77.6506 23.1698 77.9463 22.5722 77.9463C21.9745 77.9463 21.4652 77.6535 21.1649 77.1383L11.6317 60.7182C11.3343 60.2059 11.3343 59.6175 11.6317 59.1052C17.2373 49.4534 22.8401 39.8016 28.4458 30.1469C28.7431 29.6346 29.2554 29.3389 29.8531 29.3389H69.3903C69.985 29.3389 70.4973 29.6316 70.7976 30.1469C71.0949 30.6592 71.0949 31.2476 70.7976 31.7599L61.2644 48.18C60.967 48.6952 60.4547 48.9879 59.8571 48.9879H41.2617C40.667 48.9879 40.1547 49.2807 39.8544 49.7959C34.5638 58.912 29.2701 68.0251 23.9795 77.1383ZM12.5708 38.1095C12.2735 38.6218 11.7612 38.9175 11.1635 38.9175C10.5688 38.9175 10.0565 38.6248 9.75622 38.1095L0.22302 21.6895C-0.0743402 21.1772 -0.0743402 20.5888 0.22302 20.0764L11.4108 0.807976C11.7082 0.292745 12.2205 0 12.8152 0H75.1697C75.7644 0 76.2767 0.292745 76.577 0.807976C76.8743 1.32028 76.8743 1.9087 76.577 2.421L67.0438 18.8411C66.7464 19.3534 66.2341 19.649 65.6365 19.649H24.2238C23.6291 19.649 23.1168 19.9418 22.8165 20.457C19.4013 26.3412 15.9831 32.2254 12.5679 38.1095H12.5708Z" fill="currentColor"></path>' +
'</svg>';

const HERO_V7_CSS = `
  .hv7 {
    position: relative;
    height: 100vh;
    width: 100%;
    overflow: hidden;
    background: var(--bg);
  }

  /* Centered text column — sits in the upper portion of the hero. */
  .hv7-content {
    position: absolute;
    top: clamp(120px, 18vh, 200px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
    width: 100%;
    padding: 0 24px;
    text-align: center;
  }
  .hv7-head { display: flex; flex-direction: column; align-items: center; gap: 8px; }

  /* Display headline — Fraunces SemiBold, two lines, the second pulled up so the
     lines nest tightly (design uses a -37px overlap at 96px). */
  .hv7-title {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25em; /* visible breathing room between the two lines, per Figma */
    font-family: var(--font-serif-display, var(--font-serif));
    font-weight: 600;
    font-size: clamp(var(--text-3xl), 6.7vw, var(--text-5xl));
    line-height: var(--leading-none);
    white-space: nowrap;
    font-variation-settings: "SOFT" 100, "WONK" 1;
  }
  .hv7-title-a { color: var(--ink, #22191b); letter-spacing: -0.025em; }
  .hv7-title-b {
    color: var(--flicker-brick, #c13441);
    letter-spacing: -0.03em;
  }

  .hv7-sub {
    margin: 0;
    max-width: 669px;
    font-family: var(--font-sans);
    font-weight: 400;
    font-size: var(--text-base);
    line-height: 1.35;
    color: var(--ink-soft, #3d3034);
    text-wrap: pretty;
  }

  .hv7-ctas { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
  /* The design buttons use 16px text + 12/32 padding — nudge the shared .cta. */
  .hv7-ctas .cta { padding: 12px 32px; font-size: var(--text-base); }
  .hv7-ctas .cta-secondary img { display: block; border-radius: 7px; }

  /* ---- Stage: rounded panel + phone, anchored to the foot of the hero ---- */
  .hv7-stage {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    top: 0;
    z-index: 10;
    pointer-events: none;
  }
  .hv7-panel {
    position: absolute;
    left: clamp(16px, 1.9vw, 36px);
    right: clamp(16px, 1.9vw, 36px);
    top: 70%;
    bottom: -8vh;                    /* bleeds past the foot, like the design */
    background: var(--brand-neutrals-100, #f6f4f0);
    border-radius: 40px;
  }

  .hv7-phone {
    position: absolute;
    left: 50%;
    top: 56%;
    transform: translateX(-50%);
    width: clamp(248px, 27.6vw, 540px);
    aspect-ratio: 381 / 773;         /* matches app-container.svg viewBox */
    will-change: transform;
  }
  .hv7-frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    z-index: 2;
    filter: drop-shadow(0 40px 80px rgba(34, 25, 27, 0.22));
  }
  /* Brick splash painted over the frame's black screen (design "Splash" layer). */
  .hv7-screen {
    position: absolute;
    left: 3.8%;
    top: 1.9%;
    width: 92.4%;
    height: 96.3%;
    z-index: 3;
    overflow: hidden;
    border-radius: 13.2% / 6.4%;
    background: var(--flicker-brick, #c13441);
  }
  .hv7-island {
    position: absolute;
    top: 3.3%;
    left: 50%;
    transform: translateX(-50%);
    width: 29%;
    aspect-ratio: 3.37 / 1;
    background: #030303;
    border-radius: 999px;
    z-index: 4;
  }
  .hv7-logo {
    position: absolute;
    top: 25.7%;
    left: 50%;
    transform: translateX(-50%);
    width: 18.7%;
    color: var(--flicker-canvas, #fff9ec);
  }

  /* ---- Bottom-left: avatar stack + titles caption ---- */
  .hv7-stat {
    position: absolute;
    left: clamp(16px, 2vw, 56px);
    bottom: 28px;
    z-index: 25;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-muted, #7a6b6f);
  }

  /* ---- Bottom-right: SCROLL indicator ---- */
  .hv7-scroll {
    position: absolute;
    right: clamp(16px, 2vw, 56px);
    bottom: 28px;
    z-index: 25;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-muted, #7a6b6f);
  }
  .hv7-scroll-line { display: inline-block; width: 22px; height: 1px; background: currentColor; opacity: 0.6; }
  .hv7-scroll-arrow { display: inline-flex; }
  .hv7-scroll-arrow i { display: block; font-size: 13px; line-height: 1; }

  @media (max-width: 720px) {
    .hv7-title { white-space: normal; }
    .hv7-stat, .hv7-scroll { font-size: var(--text-xs); }
  }
`;

export function HeroV7() {
  const sectionRef = useRef(null);
  const phoneRef = useRef(null);
  const arrowRef = useRef(null);

  /* Bouncing scroll-down arrow. */
  useEffect(() => {
    const el = arrowRef.current;
    if (!el || typeof gsap === "undefined") return;
    const t = gsap.to(el, { y: 8, duration: 1.0, repeat: -1, yoyo: true, ease: "sine.inOut" });
    return () => t.kill();
  }, []);

  /* Scroll-driven exit: a gentle phone parallax (drifts up) plus a soft
     fade + blur of the whole hero as it leaves — the page's defocus vocabulary. */
  useEffect(() => {
    if (typeof ScrollTrigger === "undefined" || typeof gsap === "undefined") return;
    const section = sectionRef.current;
    const phone = phoneRef.current;
    if (!section) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const triggers = [];
    if (phone) {
      const pt = gsap.to(phone, {
        yPercent: -12, ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: 1 }
      });
      triggers.push(pt.scrollTrigger);
    }
    const fade = gsap.to(section, {
      opacity: 0, filter: "blur(12px)", ease: "none",
      scrollTrigger: { trigger: section, start: "55% top", end: "bottom top", scrub: 1 }
    });
    triggers.push(fade.scrollTrigger);

    return () => triggers.forEach((t) => t && t.kill());
  }, []);

  return (
    <section ref={sectionRef} className="hv7" data-screen-label="01 Hero" data-no-autofade="">
      <style>{HERO_V7_CSS}</style>

      {/* ---- Stage (panel + phone) sits behind the text ---- */}
      <div className="hv7-stage" aria-hidden="true">
        <div className="hv7-panel" />
        <div className="hv7-phone" ref={phoneRef}>
          <div className="hv7-screen">
            <div className="hv7-island" />
            <div className="hv7-logo" dangerouslySetInnerHTML={{ __html: FLICKER_MARK }} />
          </div>
          <img className="hv7-frame" src="home-v7/app-container.svg" alt="" />
        </div>
      </div>

      {/* ---- Centered content ---- */}
      <div className="hv7-content">
        <div className="hv7-head">
          <h1 className="hv7-title">
            <span className="hv7-title-a">Learn Smarter</span>
            <span className="hv7-title-b">in Minutes</span>
          </h1>
          <p className="hv7-sub">
            Get the core ideas from the world&rsquo;s best books, without the hours.
            Flicker turns big reads into clear insights you can use today.
          </p>
        </div>

        <div className="hv7-ctas">
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

      {/* ---- Bottom-left: avatar stack + caption ---- */}
      <div className="hv7-stat">
        <span aria-hidden="true" className="stat-stack">
          <img src="books/03.png" alt="" className="stat-stack-cover" style={{ zIndex: 4 }} />
          <img src="books/07.png" alt="" className="stat-stack-cover" style={{ zIndex: 3 }} />
          <img src="books/10.png" alt="" className="stat-stack-cover" style={{ zIndex: 2 }} />
          <img src="books/12.png" alt="" className="stat-stack-cover" style={{ zIndex: 1 }} />
        </span>
        2,300+ titles &middot; 15-min reads
      </div>

      {/* ---- Bottom-right: SCROLL indicator ---- */}
      <div className="hv7-scroll">
        <span>Scroll</span>
        <span className="hv7-scroll-line" />
        <span className="hv7-scroll-arrow" ref={arrowRef} aria-hidden="true">
          <i className="ph ph-arrow-down"></i>
        </span>
      </div>
    </section>);

}

window.HeroV7 = HeroV7;
