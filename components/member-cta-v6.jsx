"use client";
import React from "react";

/* global gsap, ScrollTrigger */
const { useRef: useMctaRef, useEffect: useMctaEffect } = React;

/* =====================================================================
   Flicker — membership CTA (section 07).
   Lives INSIDE <Listen>'s black container (.ln-belly), above the footer —
   the space the flip resolves into. Composition replicates the reference
   screenshot 1:1 (avatar strip → grotesque tonal headline → green pill →
   white split card with edge-bleeding media + mono-style labels), filled
   with Flicker's own palette (mint = --flicker-brunswick-light), fonts
   (Outfit) and content. The media half is an <image-slot> — drop in the
   screenshot you want there.
   ===================================================================== */

// Two-tone heading fill: muted -> cream, same as the other dark-belly headings.
const MCTA_MUTE = [122, 107, 111]; // --flicker-ink-mute #7A6B6F
const MCTA_CREAM = [255, 249, 236]; // --flicker-canvas #FFF9EC
const mctaClamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
const mctaMix = (a, b, t) =>
`rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;

const MEMBER_CTA_CSS = `
  .mcta {
    color: #FFF9EC;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: clamp(120px, 18vh, 220px) clamp(16px, 4vw, 48px) clamp(80px, 10vh, 140px);
  }
  .mcta-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    will-change: opacity, transform;
  }

  /* ---- Headline — big tonal display, set in Fraunces ---- */
  .mcta-heading {
    margin: 0;
    font-family: var(--font-serif);
    font-weight: 600;
    font-size: var(--text-4xl);
    line-height: var(--leading-heading);
    letter-spacing: -0.03em;
    text-align: center;
    text-wrap: balance;
    color: #FFF9EC;
  }
  .mcta-heading .dim { color: rgba(255, 249, 236, 0.45); }
  .mcta-heading strong { font-weight: 600; }

  /* ---- Pill buttons — small uppercase labels, arrow accent ---- */
  .mcta-btn {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 18px 30px;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    line-height: 1;
    white-space: nowrap;
    text-decoration: none;
    border: none;
    border-radius: var(--radius-full, 999px);
    cursor: pointer;
    transition: background-color 100ms cubic-bezier(.16,1,.3,1),
                color 100ms cubic-bezier(.16,1,.3,1),
                border-color 100ms cubic-bezier(.16,1,.3,1);
  }
  .mcta-btn .mcta-arrow { display: inline-flex; align-items: center; }
  .mcta-btn .mcta-arrow i { font-size: 14px; line-height: 1; display: block; }
  /* Join — the site's primary CTA, inverted for the dark belly (cream fill, ink text).
     Sized to match the hero's .cta button exactly (58px tall): 21px vertical
     padding + a 16px arrow, mirroring the hero "Get started" button. */
  .mcta-join {
    margin-top: clamp(34px, 5vh, 52px);
    padding: 21px 28px;
    font-size: var(--text-base);
    letter-spacing: -0.005em;
    text-transform: none;
    background: var(--flicker-canvas);
    color: var(--flicker-body);
  }
  .mcta-join:hover { background: var(--flicker-canvas-soft); }
  .mcta-join .mcta-arrow i { font-size: 16px; }
  .mcta-try {
    margin-top: clamp(28px, 4vh, 44px);
    background: #22191B;
    color: #FFF9EC;
  }
  .mcta-try:hover { background: #3D3034; }
  .mcta-try .mcta-arrow { color: #9FF2E1; }

  /* ---- White split card — media bleeds to the card edge ---- */
  .mcta-card {
    margin-top: clamp(90px, 13vh, 170px);
    width: 100%;
    max-width: 1180px;
    background: #FFFEFB;
    border-radius: clamp(20px, 2.2vw, 30px);
    display: grid;
    grid-template-columns: 44% 1fr;
    overflow: hidden;
    will-change: opacity, transform;
  }
  .mcta-media {
    position: relative;
    min-height: clamp(380px, 34vw, 560px);
  }
  .mcta-media image-slot {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  .mcta-info {
    padding: clamp(40px, 5vw, 80px) clamp(36px, 4.5vw, 72px);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }
  .mcta-eyebrow {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #22191B;
  }
  .mcta-eyebrow::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #9FF2E1;
  }
  .mcta-card-heading {
    margin: clamp(40px, 6vh, 72px) 0 0;
    max-width: 16ch;
    font-family: var(--font-sans);
    font-weight: 500;
    font-size: clamp(var(--text-xl), 2.4vw, var(--text-2xl));
    line-height: 1.18;
    letter-spacing: -0.02em;
    color: #22191B;
    text-wrap: balance;
  }
  .mcta-card-heading .dim { color: #7A6B6F; }
  .mcta-card-heading strong { font-weight: 600; }
  .mcta-note {
    margin: clamp(48px, 8vh, 96px) 0 0;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #7A6B6F;
  }

  @media (max-width: 900px) {
    .mcta-card { grid-template-columns: 1fr; }
    .mcta-media { min-height: clamp(280px, 56vw, 420px); }
    .mcta-info { padding: clamp(28px, 6vw, 48px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .mcta-top, .mcta-card { opacity: 1 !important; transform: none !important; }
  }
`;

export function MemberCTA() {
  const topRef = useMctaRef(null);
  const cardRef = useMctaRef(null);

  // Quiet scrubbed entrances, matching the rest of the page's vocabulary.
  useMctaEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const top = topRef.current,card = cardRef.current;
    if (!top || !card) return;
    let killed = false;
    const sts = [];

    const build = () => {
      [top, card].forEach((el) => {
        gsap.set(el, { opacity: 0, y: 44 });
        sts.push(gsap.to(el, {
          opacity: 1, y: 0, ease: "none",
          scrollTrigger: { trigger: el, start: "top 92%", end: "top 62%", scrub: 1 }
        }).scrollTrigger);
      });
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {if (!killed) {build();ScrollTrigger.refresh();}});
    } else {
      build();
    }
    return () => {killed = true;sts.forEach((s) => s && s.kill());};
  }, []);

  return (
    <div className="mcta">
      <style>{MEMBER_CTA_CSS}</style>

      <div className="mcta-top" ref={topRef}>
        <h2 className="mcta-heading">
          <span className="dim" style={{ fontSize: "var(--text-4xl)" }}>Become a member to </span><strong>unlock</strong><br />
          <strong>the full library</strong><span className="dim"> today.</span>
        </h2>

        <a href="#start" className="mcta-btn mcta-join" style={{ backgroundColor: "rgb(210, 31, 61)", color: "rgb(255, 254, 251)" }}>Join now<span className="mcta-arrow" aria-hidden="true"><i className="ph ph-arrow-right"></i></span></a>
      </div>

      {/* White split card — media half bleeds to the card edges */}
      <div className="mcta-card" ref={cardRef}>
        <div className="mcta-media">
          <image-slot id="mcta-demo" shape="rect" fit="cover" placeholder="Drop your platform screenshot"></image-slot>
        </div>
        <div className="mcta-info">
          <p className="mcta-eyebrow">Discover the platform</p>
          <h3 className="mcta-card-heading">
            <span className="dim">See how the platform works: </span>try your first summary for <strong style={{ fontWeight: 700 }}>free.</strong>
          </h3>
          <a href="#listen" className="mcta-btn mcta-try">Try it now<span className="mcta-arrow" aria-hidden="true"><i className="ph ph-arrow-right"></i></span></a>
          <p className="mcta-note">(No registration or credit card needed)</p>
        </div>
      </div>
    </div>);

}

window.MemberCTA = MemberCTA;