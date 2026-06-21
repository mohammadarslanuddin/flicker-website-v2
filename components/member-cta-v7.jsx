"use client";
import React from "react";

/* global gsap, ScrollTrigger */
const { useRef: useMctaRef, useEffect: useMctaEffect } = React;

/* =====================================================================
   Flicker — membership CTA (v7 / "Home A").
   Same dark-belly composition as v6 (tonal headline → brick "Join now"
   pill → white split card), but rebuilt to the Home A design:
     · the split card is MIRRORED — info on the LEFT, media on the RIGHT
     · the media half shows the Flicker web-app browser mockup floating on
       the provided sky backdrop (cta-bg.jpg + browser-mockup.png)
     · microcopy updated: "Try your first summary for Free." +
       "Free registration · Affordable plans"
   Lives inside <Listen>'s black belly, above the footer.
   ===================================================================== */

const MEMBER_CTA_V7_CSS = `
  .m7 {
    color: #FFF9EC;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: clamp(120px, 18vh, 220px) clamp(16px, 4vw, 48px) clamp(80px, 10vh, 140px);
  }
  .m7-top { display: flex; flex-direction: column; align-items: center; will-change: opacity, transform; }

  .m7-heading {
    margin: 0;
    font-family: var(--font-serif);
    font-weight: 600;
    font-size: clamp(var(--text-2xl), 4.4vw, var(--text-4xl));
    line-height: var(--leading-heading);
    letter-spacing: -0.03em;
    text-align: center;
    text-wrap: balance;
    color: #FFF9EC;
  }
  .m7-heading .dim { color: rgba(255, 249, 236, 0.45); }
  .m7-heading strong { font-weight: 600; }

  .m7-btn {
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
    transition: background-color .2s cubic-bezier(.16,1,.3,1),
                transform .2s cubic-bezier(.16,1,.3,1);
  }
  .m7-btn:hover { transform: translateY(-2px) scale(1.04); }
  .m7-btn:active { transform: scale(0.98); }
  .m7-btn .m7-arrow { display: inline-flex; align-items: center; transition: transform .2s cubic-bezier(.16,1,.3,1); }
  .m7-btn .m7-arrow i { font-size: 14px; line-height: 1; display: block; }
  .m7-btn:hover .m7-arrow { transform: translateX(4px); }

  /* Join — brick, the signature primary; matches the hero CTA height. */
  .m7-join {
    margin-top: clamp(34px, 5vh, 52px);
    padding: 21px 28px;
    font-size: var(--text-base);
    letter-spacing: -0.005em;
    text-transform: none;
    background: var(--flicker-brick, #c13441);
    color: #FFFEFB;
  }
  .m7-join:hover { background: #a82b37; }
  .m7-join .m7-arrow i { font-size: 16px; }

  .m7-try {
    margin-top: clamp(28px, 4vh, 44px);
    background: #22191B;
    color: #FFF9EC;
  }
  .m7-try:hover { background: #3D3034; }
  .m7-try .m7-arrow { color: #FFF9EC; }

  /* ---- Split card — info LEFT, media (browser mockup) RIGHT ---- */
  .m7-card {
    margin-top: clamp(90px, 13vh, 170px);
    width: 100%;
    max-width: 1180px;
    background: #FFFEFB;
    border-radius: clamp(20px, 2.2vw, 30px);
    display: grid;
    grid-template-columns: 40% 1fr;
    overflow: hidden;
    will-change: opacity, transform;
  }
  .m7-info {
    padding: clamp(40px, 5vw, 80px) clamp(36px, 4.5vw, 72px);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }
  .m7-eyebrow {
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
  .m7-eyebrow::before {
    content: "";
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--flicker-brick, #c13441);
  }
  .m7-card-heading {
    margin: clamp(28px, 4.5vh, 56px) 0 0;
    max-width: 14ch;
    font-family: var(--font-serif);
    font-weight: 600;
    font-size: clamp(var(--text-xl), 2.6vw, var(--text-2xl));
    line-height: var(--leading-heading);
    letter-spacing: -0.02em;
    color: #22191B;
    text-wrap: balance;
  }
  .m7-card-heading .dim { color: #7A6B6F; }
  .m7-card-heading .brick { color: var(--flicker-brick, #c13441); }
  .m7-note {
    margin: clamp(36px, 6vh, 72px) 0 0;
    font-family: var(--font-sans);
    font-size: var(--text-xs);
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #7A6B6F;
  }

  /* Media half — sky backdrop + floating web-app browser mockup. */
  .m7-media {
    position: relative;
    min-height: clamp(380px, 34vw, 560px);
    background-image: url(home-v7/cta-bg.jpg);
    background-size: cover;
    background-position: center;
    overflow: hidden;
  }
  .m7-browser {
    position: absolute;
    left: 11%;
    top: 13%;
    width: 100%;
    border-radius: 14px 0 0 0;
    box-shadow: 0 30px 70px rgba(20, 14, 16, 0.32);
    display: block;
  }

  @media (max-width: 900px) {
    .m7-card { grid-template-columns: 1fr; }
    .m7-info { order: 1; }
    .m7-media { order: 2; min-height: clamp(280px, 56vw, 440px); }
    .m7-browser { left: 8%; top: 12%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .m7-top, .m7-card { opacity: 1 !important; transform: none !important; }
  }
`;

export function MemberCTAV7() {
  const topRef = useMctaRef(null);
  const cardRef = useMctaRef(null);

  useMctaEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const top = topRef.current, card = cardRef.current;
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
    <div className="m7">
      <style>{MEMBER_CTA_V7_CSS}</style>

      <div className="m7-top" ref={topRef}>
        <h2 className="m7-heading">
          <span className="dim">Become a member to </span><strong>unlock</strong><br />
          <strong>the full library</strong><span className="dim"> today.</span>
        </h2>

        <a href="#start" className="m7-btn m7-join">
          Join now<span className="m7-arrow" aria-hidden="true"><i className="ph ph-arrow-right"></i></span>
        </a>
      </div>

      {/* Split card — info LEFT, browser mockup RIGHT */}
      <div className="m7-card" ref={cardRef}>
        <div className="m7-info">
          <p className="m7-eyebrow">Discover the platform</p>
          <h3 className="m7-card-heading">
            <span className="dim">See how the platform works: </span>
            <strong>Try your first summary for </strong>
            <span className="brick">Free.</span>
          </h3>
          <a href="#listen" className="m7-btn m7-try">
            Try it now<span className="m7-arrow" aria-hidden="true"><i className="ph ph-arrow-right"></i></span>
          </a>
          <p className="m7-note">Free registration &middot; Affordable plans</p>
        </div>
        <div className="m7-media">
          <img className="m7-browser" src="home-v7/browser-mockup.png" alt="Flicker web app showing a book summary" />
        </div>
      </div>
    </div>);

}

window.MemberCTAV7 = MemberCTAV7;
