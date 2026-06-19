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
  .hsq-pin { position: relative; height: 100vh; overflow: hidden; will-change: opacity, filter; }

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
    top: clamp(120px, 18vh, 200px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    display: flex; flex-direction: column; align-items: center; gap: 40px;
    width: 100%; padding: 0 24px; text-align: center;
    will-change: opacity, transform;
  }
  .hsq-head { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .hsq-title {
    margin: 0; display: flex; flex-direction: column; align-items: center;
    font-family: var(--font-serif-display, var(--font-serif));
    font-weight: 600; font-size: clamp(54px, 6.7vw, 96px); line-height: 1.0;
    white-space: nowrap; font-variation-settings: "SOFT" 100, "WONK" 1;
  }
  .hsq-title-a { color: var(--ink, #22191b); letter-spacing: -0.025em; }
  .hsq-title-b { color: var(--flicker-brick, #c13441); letter-spacing: -0.03em; margin-top: -0.385em; }
  .hsq-sub {
    margin: 0; max-width: 669px; font-family: var(--font-sans); font-weight: 400;
    font-size: clamp(17px, 1.4vw, 20px); line-height: 1.35; color: var(--ink-soft, #3d3034); text-wrap: pretty;
  }
  .hsq-ctas { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
  .hsq-ctas .cta { padding: 12px 32px; font-size: 16px; }
  .hsq-ctas .cta-secondary img { display: block; border-radius: 7px; }

  /* ---- Phone — ONE element; JS-driven rect ---- */
  .hsq-phone { position: absolute; z-index: 12; will-change: left, top, width, height; }
  .hsq-frame {
    position: absolute; inset: 0; width: 100%; height: 100%; display: block; z-index: 2;
    filter: drop-shadow(0 40px 80px rgba(34, 25, 27, 0.22));
  }
  .hsq-screen {
    position: absolute; left: 3.8%; top: 1.9%; width: 92.4%; height: 96.3%;
    z-index: 3; overflow: hidden; border-radius: 13.2% / 6.4%;
    background: var(--flicker-brick, #c13441);
  }
  .hsq-splash { position: absolute; inset: 0; z-index: 2; will-change: opacity; }
  .hsq-island {
    position: absolute; top: 3.3%; left: 50%; transform: translateX(-50%);
    width: 29%; aspect-ratio: 3.37 / 1; background: #030303; border-radius: 999px; z-index: 3;
  }
  .hsq-logo {
    position: absolute; top: 25.7%; left: 50%; transform: translateX(-50%);
    width: 18.7%; color: var(--flicker-canvas, #fff9ec);
  }
  .hsq-lotties { position: absolute; inset: 0; z-index: 4; background: #FFF8F6; will-change: opacity; }
  .hsq-lottie { position: absolute; inset: 0; will-change: opacity; }
  .hsq-lottie svg, .hsq-lottie canvas { display: block; width: 100% !important; height: 100% !important; }

  /* ---- How-it-works copy (left) + step rail (right) — fade in on morph ---- */
  .hsq-copy {
    position: absolute; left: clamp(20px, 13vw, 250px); top: 50%;
    width: clamp(170px, 17vw, 300px); transform: translateY(-50%);
    z-index: 14; will-change: opacity;
  }
  .hsq-copy-beat {
    position: absolute; top: 0; left: 0; right: 0;
    margin: 0; font-family: var(--font-sans); font-weight: 500;
    font-size: clamp(16px, 1.25vw, 20px); line-height: 1.5; letter-spacing: -0.005em;
    transform: translateY(-50%); will-change: opacity;
  }
  .hsq-word { color: #BCB4AD; }

  .hsq-rail {
    position: absolute; left: 63.5%; top: 50%;
    width: clamp(170px, 17vw, 300px); transform: translateY(-50%);
    z-index: 14; display: flex; align-items: center; gap: 24px; will-change: opacity;
  }
  .hsq-rail-track { position: relative; flex: 0 0 auto; width: 2px; height: 52px; border-radius: 2px; background: rgba(34,25,27,0.16); overflow: hidden; }
  .hsq-rail-fill { position: absolute; top: 0; left: 0; right: 0; height: 0%; background: var(--flicker-body); border-radius: 2px; will-change: height; }
  .hsq-rail-labels { position: relative; flex: 1 1 auto; min-height: 84px; }
  .hsq-rail-beat { position: absolute; top: 50%; left: 0; right: 0; transform: translateY(-50%); will-change: opacity; }
  .hsq-rail-step { font-family: var(--font-sans); font-size: 13px; font-weight: 500; color: var(--flicker-ink-mute, #7a6b6f); margin: 0 0 6px 0; }
  .hsq-rail-title { font-family: var(--font-serif-display, var(--font-serif)); font-weight: 600; font-size: clamp(22px, 1.9vw, 30px); line-height: 0.9; letter-spacing: -0.03em; color: var(--flicker-body, #22191b); margin: 0; text-wrap: balance; }

  /* ---- Bottom chrome (hero only; fades out during morph) ---- */
  .hsq-chrome {
    position: absolute; bottom: 28px; z-index: 25; display: flex; align-items: center; gap: 10px;
    font-family: var(--font-sans); font-size: 12px; font-weight: 500; text-transform: uppercase;
    color: var(--ink-muted, #7a6b6f); will-change: opacity;
  }
  .hsq-stat { left: clamp(16px, 2vw, 56px); letter-spacing: 0.06em; }
  .hsq-scroll { right: clamp(16px, 2vw, 56px); letter-spacing: 0.08em; }
  .hsq-scroll-line { display: inline-block; width: 22px; height: 1px; background: currentColor; opacity: 0.6; }
  .hsq-scroll-arrow { display: inline-flex; }
  .hsq-scroll-arrow i { display: block; font-size: 13px; line-height: 1; }

  @media (max-width: 900px) { .hsq-copy { display: none; } }
  @media (max-width: 680px) { .hsq-rail { display: none; } }
  @media (max-width: 720px) { .hsq-title { white-space: normal; } }
`;

export function HeroSequenceV7() {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const panelRef = useRef(null);
  const phoneRef = useRef(null);
  const heroTextRef = useRef(null);
  const splashRef = useRef(null);
  const lottieWrapRef = useRef(null);
  const copyColRef = useRef(null);
  const railColRef = useRef(null);
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
    let lastP = 0, killed = false;
    let st = null, loadTrigger = null, exitST = null, arrowTween = null;

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
          rendererSettings: { preserveAspectRatio: "xMidYMid meet", progressiveLoad: false }
        });
        a.addEventListener("DOMLoaded", () => { ready[i] = true; a.goToAndStop(0, true); render(lastP); });
        anims[i] = a;
      });
    };

    const geom = () => {
      const VW = window.innerWidth, VH = window.innerHeight;
      const mH = clampN(16, VW * 0.019, 36);
      const heroPanel = { l: mH, tp: VH * 0.70, w: VW - 2 * mH, h: VH * 0.38 };

      const hpW = clampN(248, VW * 0.276, 540);
      const heroPhone = { l: VW / 2 - hpW / 2, tp: VH * 0.56, w: hpW, h: hpW * PHONE_AR };

      const hiwMH = clampN(40, VW * 0.12, 240);
      const hiwMV = clampN(28, VH * 0.06, 72);
      const hiwPanel = { l: hiwMH, tp: hiwMV, w: VW - 2 * hiwMH, h: VH - 2 * hiwMV };

      const ipH = Math.min(VH * 0.68, hiwPanel.h - VH * 0.10);
      const ipW = ipH / PHONE_AR;
      const hiwPhone = { l: VW / 2 - ipW / 2, tp: VH / 2 - ipH / 2, w: ipW, h: ipH };

      return { heroPanel, heroPhone, hiwPanel, hiwPhone };
    };

    const setRect = (el, r) => {
      el.style.left = r.l + "px"; el.style.top = r.tp + "px";
      el.style.width = r.w + "px"; el.style.height = r.h + "px";
    };

    const render = (p) => {
      lastP = p;
      const panel = panelRef.current, phone = phoneRef.current;
      if (!panel || !phone) return;
      const G = geom();

      // ---- HOLD + MORPH ----
      const me = smooth(clamp01((p - HOLD_END) / (MORPH_END - HOLD_END)));
      setRect(panel, lerpRect(G.heroPanel, G.hiwPanel, me));
      setRect(phone, lerpRect(G.heroPhone, G.hiwPhone, me));

      // Hero content clears IMMEDIATELY when the morph begins — a quick
      // slide-up + fade that completes within the first ~20% of the morph, so
      // it's fully gone before the phone/panel motion plays out (no overlap).
      const heroOut = smooth(clamp01(me / 0.2));
      if (heroTextRef.current) {
        heroTextRef.current.style.opacity = String(1 - heroOut);
        heroTextRef.current.style.transform = `translate(-50%, ${-heroOut * 72}px)`;
      }
      const chromeOp = 1 - heroOut;
      if (statRef.current) statRef.current.style.opacity = String(chromeOp);
      if (scrollRef.current) scrollRef.current.style.opacity = String(chromeOp);

      if (splashRef.current) splashRef.current.style.opacity = String(1 - clamp01(me * 1.5));
      if (lottieWrapRef.current) lottieWrapRef.current.style.opacity = String(clamp01((me - 0.35) / 0.65));

      const colOp = clamp01((me - 0.55) / 0.45);
      if (copyColRef.current) copyColRef.current.style.opacity = String(colOp);
      if (railColRef.current) railColRef.current.style.opacity = String(colOp);

      // ---- BEATS ----
      const sp = clamp01((p - MORPH_END) / (1 - MORPH_END));
      const sf = sp * BEATS.length;
      BEATS.forEach((b, i) => {
        const vis = beatVis(i, sf);
        const holder = holderRefs[i].current;
        if (holder) holder.style.opacity = vis;
        if (ready[i] && anims[i]) anims[i].goToAndStop(clamp01(sf - i) * b.frames, true);

        const cb = copyBeatRefs[i].current;
        if (cb) { cb.style.opacity = vis; cb.style.transform = `translateY(calc(-50% + ${(1 - vis) * 12}px))`; }
        const words = wordRefs.current[i];
        if (words && words.length) {
          const head = clamp01(sf - i) * words.length;
          for (let j = 0; j < words.length; j++) if (words[j]) words[j].style.color = mixColor(GRAY, INK, clamp01(head - j));
        }
        const rb = railBeatRefs[i].current;
        if (rb) { rb.style.opacity = vis; rb.style.transform = `translateY(calc(-50% + ${(1 - vis) * 10}px))`; }
      });
      if (railFillRef.current) railFillRef.current.style.height = sp * 100 + "%";
    };

    const build = () => {
      st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => "+=" + window.innerHeight * 5,
        pin: pinRef.current,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => render(self.progress),
        onRefresh: () => render(lastP)
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

      render(0);
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

    const onResize = () => render(lastP);
    window.addEventListener("resize", onResize);
    const idle = window.setTimeout(loadLotties, 4500);

    return () => {
      killed = true;
      window.clearTimeout(idle);
      window.removeEventListener("resize", onResize);
      if (st) st.kill();
      if (loadTrigger) loadTrigger.kill();
      if (exitST) exitST.kill();
      if (arrowTween) arrowTween.kill();
      anims.forEach((a) => a && a.destroy && a.destroy());
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
          <div className="hsq-rail-track"><div ref={railFillRef} className="hsq-rail-fill" /></div>
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
              <div className="hsq-island" />
              <div className="hsq-logo" dangerouslySetInnerHTML={{ __html: FLICKER_MARK }} />
            </div>
            <div ref={lottieWrapRef} className="hsq-lotties" style={{ opacity: 0 }}>
              {BEATS.map((b, i) =>
              <div key={i} ref={holderRefs[i]} className="hsq-lottie" role="img"
                aria-label="A demonstration of the Flicker app reading experience"
                style={{ opacity: i === 0 ? 1 : 0 }} />
              )}
            </div>
          </div>
          <img className="hsq-frame" src="home-v7/app-container.svg" alt="" />
        </div>

        {/* Hero text */}
        <div ref={heroTextRef} className="hsq-hero-text">
          <div className="hsq-head">
            <h1 className="hsq-title">
              <span className="hsq-title-a">Learn Smarter</span>
              <span className="hsq-title-b">in Minutes</span>
            </h1>
            <p className="hsq-sub">
              Get the core ideas from the world&rsquo;s best books, without the hours.
              Flicker turns big reads into clear insights you can use today.
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
          <span aria-hidden="true" className="stat-stack">
            <img src="books/03.png" alt="" className="stat-stack-cover" style={{ zIndex: 4 }} />
            <img src="books/07.png" alt="" className="stat-stack-cover" style={{ zIndex: 3 }} />
            <img src="books/10.png" alt="" className="stat-stack-cover" style={{ zIndex: 2 }} />
            <img src="books/12.png" alt="" className="stat-stack-cover" style={{ zIndex: 1 }} />
          </span>
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
