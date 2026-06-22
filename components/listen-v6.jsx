"use client";
import React from "react";

/* global gsap, ScrollTrigger */
const { useRef, useEffect } = React;

/* ==================================================================== *
 *  Flicker — "One click away from your first listen" (section 06)       *
 *                                                                       *
 *  Static visual replica per spec: Almond outer card → headphones icon, *
 *  headline, white inner card holding book info + a static audio player.*
 *  The waveform + top icon are provided SVGs; the player is wired to a   *
 *  real audio stream later. The panel keeps its scroll fade-in entrance. *
 * ==================================================================== */

export function Listen({ children }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const panelRef = useRef(null);
  const frontRef = useRef(null);
  const coverRef = useRef(null);
  const textRef = useRef(null);

  // Keep the book cover the same height as the text column beside it, with its
  // aspect ratio locked to the image's intrinsic 640:940 (so width follows height
  // and it never crops). If the text content gets shorter, the cover shrinks too.
  useEffect(() => {
    const cover = coverRef.current,text = textRef.current;
    if (!cover || !text || typeof ResizeObserver === "undefined") return;
    const RATIO = 640 / 940;
    const sync = () => {
      // On phones the cover uses a fixed width and the text beside it is
      // truncated (see the max-width:680px CSS). Syncing the cover height to
      // the narrow text column would balloon it, so hand sizing back to CSS.
      if (window.matchMedia && window.matchMedia("(max-width: 680px)").matches) {
        cover.style.height = "";
        cover.style.width = "";
        return;
      }
      const h = text.offsetHeight;
      cover.style.height = h + "px";
      cover.style.width = h * RATIO + "px";
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(text);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
    return () => ro.disconnect();
  }, []);

  // Panel fade + blur IN on scroll (scrubbed, not pinned) — existing entrance.
  useEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    const stage = stageRef.current;
    const panel = panelRef.current;
    if (!stage || !panel) return;
    let killed = false,st = null;

    const build = () => {
      gsap.set(panel, { opacity: 0, y: 48, filter: "blur(18px)" });
      st = gsap.to(panel, {
        opacity: 1, y: 0, filter: "blur(0px)", ease: "none",
        scrollTrigger: { trigger: stage, start: "top 85%", end: "top 45%", scrub: 1 }
      }).scrollTrigger;
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {if (!killed) {build();ScrollTrigger.refresh();}});
    } else {
      build();
    }
    return () => {killed = true;if (st) st.kill();};
  }, []);

  // Finale flip-and-morph — pinned + scrubbed (one ScrollTrigger timeline,
  // scrub: true, so it plays forward on scroll-down and reverses on
  // scroll-up). Once the panel sits in the centre it holds briefly, then the
  // whole card flips vertically on its X axis (rotationX 0 → -180°; preserve-3d on the
  // panel, perspective on .ln-section, backface-visibility: hidden on both
  // faces) while it morphs into the NEXT section's state: the inner layout
  // dissolves up with a soft blur, the surface darkens to the black container
  // (--flicker-body), the corners square off and the card grows to a
  // full-bleed viewport rect — so the flip's black back face IS the top of
  // the .ln-belly black container that holds the footer, and the two read as
  // one continuous transformation (no seam: footer lives in the same
  // container, and the section bg itself turns black under the junction).
  // (GSAP's Flip plugin is loaded + registered in app-v6.jsx; the pinned
  // end-state geometry is tweened with invalidateOnRefresh-aware functional
  // values because pinning re-positions the card every tick, which is exactly
  // the case Flip.fit's one-shot rect capture can't represent.)
  useEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    const panel = panelRef.current;
    const front = frontRef.current;
    if (!section || !stage || !panel || !front) return;
    let killed = false,st = null;

    const BLACK = "#22191B";  // --flicker-body — matches the .ln-belly container

    const build = () => {
      const content = Array.from(front.children);

      // Lock each child to its natural pixel size so ONLY the card morphs
      // — the components inside keep their layout and just dissolve
      // (otherwise .ln-inner, being width:100%, would stretch with the panel).
      content.forEach((el) => {
        el.style.width = "";
        el.style.flex = "0 0 auto";
        el.style.width = el.offsetWidth + "px";
      });

      // The card is the 3D element; the section supplies the perspective.
      gsap.set(panel, { transformStyle: "preserve-3d", transformOrigin: "50% 50%" });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          // Pin the STAGE, not the section — the section now also contains
          // the black belly (footer), which must stay in normal flow below.
          trigger: stage,
          start: "center center",
          end: "+=1600",
          scrub: true,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // This is the last pinned section on the page. Refresh it LAST
          // (lowest priority) so all earlier pins (HowItWorks, Growing) have
          // already inserted their pin-spacing before we measure "center
          // center" — otherwise the start resolves thousands of px too early.
          refreshPriority: -1,
          // Once the flip has fully resolved (scrolled past the pin), the
          // card is a full-viewport black rect identical to the section +
          // belly behind it — but it's still a separately COMPOSITED layer
          // (3D transform + will-change), and fractional smooth-scroll
          // offsets resample its edges against the page every frame, which
          // is what drew the faint hairlines over the black while scrolling.
          // So at rest we remove it from the picture entirely: the black is
          // then ONE page-layer paint (section + cap + belly) with no layer
          // edges to seam. Restored the instant the user scrubs back in.
          onLeave: () => gsap.set(panel, { visibility: "hidden" }),
          onEnterBack: () => gsap.set(panel, { visibility: "visible" })
        }
      });
      st = tl.scrollTrigger;

      const HOLD = 0.12;   // brief pinned hold before anything moves
      const MORPH = 0.3;   // geometry morph starts as the card turns edge-on

      // Lead-in hold — nothing moves for the first stretch of the pin.
      tl.to({}, { duration: HOLD }, 0);

      // Inner layout dissolves first — up + soft blur — so the type is gone
      // before the card passes 90° and can never read mirrored.
      tl.to(content, {
        opacity: 0, y: -36, filter: "blur(14px)",
        duration: 0.3
      }, HOLD);

      // The 3D flip — vertical: rotationX 0 → -180° across the rest of the
      // pin (top edge tips away, matching the scroll direction). The front
      // face hides past 90° and the black back face takes over.
      tl.to(panel, { rotationX: -180, duration: 1 - HOLD }, HOLD);

      // Surface darkens to the footer-frame black while the card is edge-on,
      // so the colour change never reads as a flat fade.
      tl.to(panel, { backgroundColor: BLACK, duration: 0.35 }, 0.35);

      // Geometry morph into the next section's state: the stage's padding
      // collapses and the card grows to a full-bleed viewport rect with
      // squared-off corners (the black container's opening geometry).
      tl.to(stage, {
        paddingTop: 0, paddingRight: 0,
        paddingBottom: 0, paddingLeft: 0,
        duration: 1 - MORPH
      }, MORPH);
      tl.to(panel, {
        width: () => window.innerWidth,
        maxWidth: () => window.innerWidth,
        height: () => window.innerHeight,
        duration: 1 - MORPH
      }, MORPH);

      // Corners stay rounded for the whole flip — they only flatten at the
      // very end, as the card is about to become the full-bleed section.
      tl.to(panel, { borderRadius: 0, duration: 0.15 }, 0.85);

      // Black overlay starts only after 95% of the flip is complete, so the
      // container itself visually forms the full section before the bg comes in.
      tl.to(section, { backgroundColor: BLACK, duration: 0.01 }, 0.99);

      // Belly content begins appearing at the same moment the overlay arrives.
      const belly = section.querySelector('.ln-belly');
      if (belly) {
        gsap.set(belly, { opacity: 0 });
        tl.to(belly, { opacity: 1, duration: 0.01, ease: 'none' }, 0.99);
      }
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {if (!killed) {build();ScrollTrigger.refresh();}});
    } else {
      build();
    }
    return () => {killed = true;if (st) st.kill();};
  }, []);

  return (
    <section
      ref={sectionRef}
      data-screen-label="06 Listen"
      data-no-autofade=""
      className="ln-section">

      <div ref={stageRef} className="ln-stage">
      <div ref={panelRef} className="ln-panel" style={{ backgroundColor: "rgb(242, 240, 236)", padding: "64px 20px 20px", gap: "0px", width: "min(630px, 100%)" }}>
        <div ref={frontRef} className="ln-face-front">
        {/* Top icon */}
        <img className="ln-icon-img" src="flicker/audio-icon-container.svg" alt="" aria-hidden="true" width="68" height="68" />

        {/* Headline */}
        <h2 className="ln-headline" style={{ fontWeight: "700", letterSpacing: "-0.03em", fontSize: "clamp(var(--text-2xl), 2.6vw, var(--text-3xl))" }}>One click away from<br />your first listen.</h2>

        {/* Inner card */}
        <div className="ln-inner">
          {/* Book info */}
          <div className="ln-bookinfo">
            <div className="ln-cover" ref={coverRef}>
              <img src="books/10.png" alt="The Courage to Be Disliked" />
            </div>
            <div className="ln-text" ref={textRef}>
              <h3 className="ln-title" style={{ color: "rgb(33, 25, 27)", fontWeight: "600", letterSpacing: "-0.03em", fontSize: "var(--text-lg)" }}>The Courage to Be Disliked</h3>
              <p className="ln-desc" style={{ fontSize: "var(--text-base)" }}>An Adlerian dialogue on letting go of other people&rsquo;s approval, and finding the freedom to live life on your own terms, starting today.</p>
              <div className="ln-meta" data-comment-anchor="4f02e4b7a3-div-66-15">
                <div className="ln-meta-item">
                  <i className="ph ph-star" aria-hidden="true" style={{ height: "18px", width: "19px", fontSize: "18px", textAlign: "center" }}></i>
                  <span className="ln-meta-tb">
                    <span className="ln-meta-label" style={{ fontSize: "var(--text-sm)" }}>Rating</span>
                    <span className="ln-meta-value" style={{ fontSize: "var(--text-base)" }}>4.4 (108)</span>
                  </span>
                </div>
                <div className="ln-meta-divider" aria-hidden="true"></div>
                <div className="ln-meta-item">
                  <i className="ph ph-clock" aria-hidden="true" style={{ fontSize: "18px" }}></i>
                  <span className="ln-meta-tb">
                    <span className="ln-meta-label" style={{ fontSize: "var(--text-sm)" }}>Reading</span>
                    <span className="ln-meta-value" style={{ fontSize: "var(--text-base)" }}>23 mins</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Audio player */}
          <div className="ln-audio">
            <span className="ln-pause" aria-hidden="true" style={{ fontSize: "14px", height: "50px", width: "52px" }}>
              <i className="ph-fill ph-pause" style={{ fontSize: "20px" }}></i>
            </span>
            <img className="ln-spectrum" src="flicker/audio-spectrum.svg" alt="" aria-hidden="true" />
            <span className="ln-time" style={{ fontSize: "var(--text-base)" }}>12:42</span>
          </div>
        </div>
        </div>

        {/* Back face — the black container's surface, revealed as the card
            flips past 90°. */}
        <div className="ln-face-back" aria-hidden="true"></div>
      </div>
      </div>

      {/* The black container the flipped card opens into. The footer lives
          here (passed as children) — same container, so no crease at the
          seam — and future sections can be added above it. */}
      <div className="ln-belly">{children}</div>
    </section>);

}

window.Listen = Listen;