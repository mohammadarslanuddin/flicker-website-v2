"use client";
import React from "react";

/* global gsap, ScrollTrigger */
const { useRef: useTmRef, useEffect: useTmEffect } = React;

/* =====================================================================
   Flicker — "Reader Stories" (v7 / "Home A").
   Same pinned-scrub settle model + two-tone word fill as the v6 section,
   but rebuilt to the "Home A" design: a single centered headline
   ("Stories From Our Reader."), real reader quotes set in italic Fraunces,
   and three pastel-gradient cards (the provided flying-cards images) that
   carry a name, role and circular avatar — tilted and settled around the
   headline. Lives inside <Listen>'s black belly.
   ===================================================================== */

const TM_MUTE = [122, 107, 111]; // --flicker-ink-mute #7A6B6F
const TM_CREAM = [255, 249, 236]; // --flicker-canvas #FFF9EC
const tmClamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
const tmSmooth = (t) => t * t * (3 - 2 * t);
const tmMix = (a, b, t) =>
`rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;

const TM_HEAD_END = 0.20; // heading fill completes
const TM_BODY_END = 0.38; // body fill completes

/* Real reader stories, set verbatim from the Home A design. Each card flies
   in (more rotated, off-centre), SETTLES at a resting place around the
   centered headline, then flies out above the viewport on exit.
   Offsets are vw (x) / vh (y) from viewport centre; r is degrees. */
const TM_CARDS = [
{
  quote: "Flicker App turned my 20-minute daily commute into a masterclass—I'm finally consuming all the business books I never had time to read!",
  name: "Sarah T.",
  role: "Startup Founder",
  bg: "home-v7/flying-cards-1.jpg",
  avatar: "uploads/avatars/women-44.jpg",
  from: { x: -55, y: -10, r: -16 },
  rest: { x: -25, y: -18, r: -7 },
  exit: { x: -25, y: -130, r: -12 },
  t0: 0.42, t1: 0.72,
  et0: 0.05, et1: 0.35
},
{
  quote: "Being able to seamlessly switch between the text and synchronized audio summaries makes Flicker the best pocket librarian I've ever used.",
  name: "Elena R.",
  role: "Student",
  bg: "home-v7/flying-cards-2.jpg",
  avatar: "uploads/avatars/women-68.jpg",
  from: { x: 58, y: -28, r: 12 },
  rest: { x: 25, y: -16, r: 2 },
  exit: { x: 25, y: -130, r: 8 },
  t0: 0.52, t1: 0.82,
  et0: 0.20, et1: 0.50
},
{
  quote: "The AI smart summaries capture the exact essence of the books without the fluff, making it the ultimate cheat code for my self-improvement journey.",
  name: "James L.",
  role: "Entrepreneur",
  bg: "home-v7/flying-cards-3.jpg",
  avatar: "uploads/avatars/men-52.jpg",
  from: { x: 6, y: 80, r: -10 },
  rest: { x: 5, y: 27, r: 4 },
  exit: { x: 5, y: -130, r: -6 },
  t0: 0.62, t1: 0.92,
  et0: 0.35, et1: 0.65
}];


const TM_CSS = `
  .t7-section {
    position: relative;
    background: var(--flicker-body);
    color: var(--flicker-canvas);
  }
  .t7-pin { position: relative; height: 100vh; will-change: opacity, filter; }

  /* ---- Centered headline + subhead ---- */
  .t7-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(92vw, 720px);
    z-index: 1;
    text-align: center;
    padding: 0 clamp(16px, 3vw, 40px);
  }
  .t7-h2 {
    margin: 0;
    font-family: var(--font-serif);
    font-weight: 600;
    font-size: clamp(var(--text-xl), 3.1vw, var(--text-3xl));
    line-height: var(--leading-heading);
    letter-spacing: -0.03em;
    color: var(--flicker-canvas);
    text-wrap: balance;
  }
  .t7-line { display: block; will-change: opacity, transform, filter; }
  .t7-sub {
    margin: 16px auto 0 auto;
    max-width: 520px;
    font-family: var(--font-sans);
    font-weight: 400;
    font-size: var(--text-base);
    line-height: 1.5;
    color: rgba(255, 249, 236, 0.72);
    text-wrap: pretty;
    will-change: opacity, transform, filter;
  }
  .t7-word { color: #7A6B6F; }   /* JS scrubs muted -> cream */

  /* ---- Settling cards layer ---- */
  .t7-cards { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
  .t7-card {
    position: absolute;
    left: 50%;
    top: 50%;
    width: clamp(280px, 21vw, 360px);
    border-radius: 18px;
    padding: 22px 22px 18px;
    background-color: #f3eee9;
    background-size: cover;
    background-position: center;
    box-shadow: 0 30px 64px rgba(0, 0, 0, 0.38);
    opacity: 0;               /* JS reveals + positions; static fallback below */
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
    will-change: transform, opacity;
  }
  .t7-quote {
    margin: 0;
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 500;
    font-size: clamp(var(--text-sm), 0.95vw, var(--text-base));
    line-height: 1.34;
    letter-spacing: -0.005em;
    color: var(--flicker-ink-soft, #3d3034);
    text-wrap: pretty;
  }
  .t7-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .t7-person { display: flex; flex-direction: column; gap: 2px; }
  .t7-name {
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: var(--text-sm);
    letter-spacing: -0.01em;
    color: var(--flicker-body, #22191b);
  }
  .t7-role {
    font-family: var(--font-sans);
    font-weight: 400;
    font-size: var(--text-xs);
    color: var(--flicker-ink-mute, #7a6b6f);
  }
  .t7-avatar {
    width: 34px; height: 34px;
    border-radius: 50%;
    object-fit: cover;
    flex: 0 0 auto;
    box-shadow: 0 1px 3px rgba(34, 25, 27, 0.25);
  }

  /* ---- Reduced motion: static stacked column ---- */
  @media (prefers-reduced-motion: reduce) {
    .t7-word { color: #FFF9EC; }
    .t7-pin {
      height: auto; overflow: visible;
      padding: clamp(96px, 14vh, 180px) clamp(20px, 4vw, 64px);
    }
    .t7-center {
      position: static; top: auto; left: auto;
      transform: none; width: auto; margin: 0 auto; padding: 0;
    }
    .t7-line, .t7-sub { opacity: 1 !important; filter: none !important; transform: none !important; }
    .t7-cards {
      position: static; inset: auto;
      margin: clamp(40px, 6vh, 64px) auto 0;
      width: min(92vw, 420px);
      display: flex; flex-direction: column; gap: 20px;
    }
    .t7-card { position: static; left: auto; top: auto; width: 100%; opacity: 1; transform: none !important; }
  }
`;

export function TestimonialsV7() {
  const sectionRef = useTmRef(null);
  const pinRef = useTmRef(null);
  const lineRefs = useTmRef([]); // headline, sub — pre-pin fade-in blocks
  const cardRefs = useTmRef([]);
  const headWordRefs = useTmRef([]);
  const bodyWordRefs = useTmRef([]);

  lineRefs.current = [];
  cardRefs.current = [];
  headWordRefs.current = [];
  bodyWordRefs.current = [];

  useTmEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    const section = sectionRef.current;
    if (!section) return;
    const reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let killed = false, st = null, entryTl = null, exitST = null, lastP = 0;

    const render = (p) => {
      lastP = p;
      const hw = headWordRefs.current;
      const hf = tmClamp(p / TM_HEAD_END) * hw.length;
      for (let j = 0; j < hw.length; j++)
      if (hw[j]) hw[j].style.color = tmMix(TM_MUTE, TM_CREAM, tmClamp(hf - j));

      const bw = bodyWordRefs.current;
      const bf = tmClamp((p - TM_HEAD_END) / (TM_BODY_END - TM_HEAD_END)) * bw.length;
      for (let j = 0; j < bw.length; j++)
      if (bw[j]) bw[j].style.color = tmMix(TM_MUTE, TM_CREAM, tmClamp(bf - j));

      const cards = cardRefs.current;
      for (let i = 0; i < cards.length; i++) {
        const el = cards[i];
        if (!el) continue;
        const c = TM_CARDS[i];
        const lp = tmSmooth(tmClamp((p - c.t0) / (c.t1 - c.t0)));
        const x = c.from.x + (c.rest.x - c.from.x) * lp;
        const y = c.from.y + (c.rest.y - c.from.y) * lp;
        const r = c.from.r + (c.rest.r - c.from.r) * lp;
        const s = 0.9 + 0.1 * lp;
        el.style.opacity = String(tmClamp(lp * 1.8));
        el.style.transform =
        `translate(-50%, -50%) translate(${x}vw, ${y}vh) rotate(${r}deg) scale(${s})`;
      }
    };

    const build = () => {
      gsap.set(lineRefs.current, { opacity: 0, y: 28, filter: "blur(9px)" });
      entryTl = gsap.to(lineRefs.current, {
        opacity: 1, y: 0, filter: "blur(0px)",
        ease: "power2.out", duration: 0.5, stagger: 0.22,
        scrollTrigger: { trigger: section, start: "top 80%", end: "top 56%", scrub: 1, refreshPriority: -2 }
      }).scrollTrigger;

      st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => "+=" + window.innerHeight * 2,
        pin: pinRef.current,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: -2,
        onUpdate: (self) => render(self.progress),
        onRefresh: () => render(lastP)
      });

      const centerEl = section.querySelector('.t7-center');
      exitST = ScrollTrigger.create({
        trigger: section,
        start: "bottom bottom",
        end: "bottom top",
        scrub: 1,
        refreshPriority: -2,
        onUpdate: (self) => {
          const e = self.progress;
          if (centerEl) centerEl.style.opacity = String(tmClamp(1 - e * 2));
          const cards = cardRefs.current;
          for (let i = 0; i < cards.length; i++) {
            const el = cards[i];
            if (!el) continue;
            const c = TM_CARDS[i];
            const ep = tmSmooth(tmClamp((e - c.et0) / (c.et1 - c.et0)));
            const x = c.rest.x + (c.exit.x - c.rest.x) * ep;
            const y = c.rest.y + (c.exit.y - c.rest.y) * ep;
            const r = c.rest.r + (c.exit.r - c.rest.r) * ep;
            const s = 1 - 0.1 * ep;
            el.style.opacity = String(tmClamp(1 - ep * 1.8));
            el.style.transform =
              `translate(-50%, -50%) translate(${x}vw, ${y}vh) rotate(${r}deg) scale(${s})`;
          }
        }
      });
      render(0);
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {if (!killed) {build();ScrollTrigger.refresh();}});
    } else {
      build();
    }

    const onResize = () => render(lastP);
    window.addEventListener("resize", onResize);

    return () => {
      killed = true;
      window.removeEventListener("resize", onResize);
      if (st) st.kill();
      if (entryTl) entryTl.kill();
      if (exitST) exitST.kill();
    };
  }, []);

  // Word-split for the two-tone fill.
  const headLine = (text) => {
    const parts = text.split(" ");
    return parts.map((w, k) =>
      <span key={k} className="t7-word" ref={(el) => {if (el) headWordRefs.current[k] = el;}} style={{ fontWeight: 600 }}>
        {w}{k < parts.length - 1 ? " " : ""}
      </span>
    );
  };
  const bodyText = (text) => {
    const parts = text.split(" ");
    return parts.map((w, k) =>
    <span key={k} className="t7-word" ref={(el) => {if (el) bodyWordRefs.current[k] = el;}}>
        {w}{k < parts.length - 1 ? " " : ""}
      </span>
    );
  };

  return (
    <section ref={sectionRef} data-screen-label="07 Reader Stories" data-no-autofade="" className="t7-section">
      <style>{TM_CSS}</style>

      <div ref={pinRef} className="t7-pin">
        <div className="t7-center">
          <h2 className="t7-h2">
            <span className="t7-line" ref={(el) => {if (el) lineRefs.current[0] = el;}}>{headLine("Stories From Our Reader.")}</span>
          </h2>
          <p className="t7-sub" ref={(el) => {if (el) lineRefs.current[1] = el;}}>
            {bodyText("Busy professionals and lifelong learners are turning small moments into real progress with Flicker App.")}
          </p>
        </div>

        <div className="t7-cards">
          {TM_CARDS.map((t, i) =>
          <article
            key={i}
            ref={(el) => {if (el) cardRefs.current[i] = el;}}
            className="t7-card"
            style={{ backgroundImage: `url(${t.bg})` }}>
              <p className="t7-quote">&ldquo;{t.quote}&rdquo;</p>
              <div className="t7-foot">
                <div className="t7-person">
                  <span className="t7-name">{t.name}</span>
                  <span className="t7-role">{t.role}</span>
                </div>
                <img className="t7-avatar" src={t.avatar} alt="" aria-hidden="true" loading="lazy" />
              </div>
            </article>
          )}
        </div>
      </div>
    </section>);

}

window.TestimonialsV7 = TestimonialsV7;
