/* global React, gsap, ScrollTrigger */
const { useRef: useTmRef, useEffect: useTmEffect } = React;

/* =====================================================================
   Flicker — "Reader Stories" (section 07).
   Lives INSIDE <Listen>'s black container (.ln-belly), between the
   membership CTA and the FAQ.

   SIZE / STYLING / MOTION mirror the section-03 "Summaries Across Every
   Subject" showcase — same pinned-scrub model, the same line-by-line
   entrance + two-tone word fill, the same heading scale (compact serif),
   and the same exit fade. ONLY the colour stays the section's own: a
   full-viewport dark band on --flicker-body with cream type, white cards.

   On-scroll reveal (the showcase's approach, scrubbed inside the pin):
     0.00 - 0.18  heading words fill muted -> cream
     0.18 - 0.36  body words fill muted -> cream
     0.36 - 0.90  the three cards MOVE IN, slightly rotating, and SETTLE
                  into resting positions around the centered headline —
                  one left, one right, one bottom-left. They do NOT fly
                  past the viewport; each eases to its place and stays.
     0.90 - 1.00  dwell: everything rests.
   Exit: after the pin releases the band fades out as it scrolls away
   (same as the showcase), so the FAQ below arrives on clean black.

   Card surface reuses .gw-card; quote/attribution anatomy reuses the
   established .tm-quote / .tm-person styles. Quote + name/role copy are
   BRACKETED PLACEHOLDERS — replace with real reader reviews before launch.

   prefers-reduced-motion: no pin, no scrub — headline + cards render as a
   static stacked column (CSS fallback; the JS effect bails out entirely).
   ===================================================================== */

// Two-tone fill: muted -> cream on the dark band (same colours as the
// other dark-belly headings; identical technique to the showcase fill).
const TM_MUTE = [122, 107, 111]; // --flicker-ink-mute #7A6B6F
const TM_CREAM = [255, 249, 236]; // --flicker-canvas #FFF9EC
const tmClamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
const tmSmooth = (t) => t * t * (3 - 2 * t);
const tmMix = (a, b, t) =>
`rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;

const TM_HEAD_END = 0.18; // heading fill completes
const TM_BODY_END = 0.36; // body fill completes

/* PLACEHOLDER CONTENT — replace each bracketed string with a REAL reader
   review (quote + first name + role) before launch. Rendered as-is so the
   section is visibly unfinished.

   Each card MOVES IN from off-screen (slightly more rotated) and SETTLES
   at a resting place around the centered headline:
     · card 0 -> left,  vertically centered
     · card 1 -> right, vertically centered
     · card 2 -> bottom, slightly left
   Offsets are vw (x) / vh (y) from viewport centre; r is degrees. `t0/t1`
   is each card's settle window along the pin's scrub progress. */
const TM_CARDS = [
{
  quote: "[Real reader quote about saving time]",
  name: "[First name]",
  role: "[role]",
  from: { x: -60, y: 8,  r: -15 },
  rest: { x: -33, y: -6,  r: -5  },
  exit: { x: -33, y: -130, r: -10 }, // all cards fly out ABOVE the viewport
  t0: 0.40, t1: 0.70,
  et0: 0.05, et1: 0.35                 // exit window (same 0.30 duration as incoming)
},
{
  quote: "[Real reader quote about audio summaries]",
  name: "[First name]",
  role: "[role]",
  from: { x: 60,  y: -24, r: 15 },
  rest: { x: 33,  y: -10, r: 5  },
  exit: { x: 33,  y: -130, r: 10 },
  t0: 0.50, t1: 0.80,
  et0: 0.20, et1: 0.50
},
{
  quote: "[Real reader quote about building a habit]",
  name: "[First name]",
  role: "[role]",
  from: { x: -8, y: 86,  r: -13 },
  rest: { x: -8, y: 31,  r: -4  },
  exit: { x: -8, y: -130, r: -8 },
  t0: 0.60, t1: 0.90,
  et0: 0.35, et1: 0.65
}];


const TM_CSS = `
  /* Dark band — the section's own surface token (same surface the
     .ln-belly container paints; never a hardcoded one-off). */
  .tm-section {
    position: relative;
    background: var(--flicker-body);
    color: var(--flicker-canvas);
  }
  .tm-pin {
    position: relative;
    height: 100vh;
    will-change: opacity, filter;
  }

  /* ---- Pinned center content — stays centered while cards settle around it.
     Heading scale matches the showcase .sw-h2 / .sw-sub exactly. ---- */
  .tm-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(92vw, 760px);
    z-index: 1;
    text-align: center;
    padding: 0 clamp(16px, 3vw, 40px);
  }
  .tm-h2 {
    margin: 0;
    font-family: var(--font-serif);   /* GT Super Text Trial — same as .sw-h2 */
    font-weight: 700;
    font-size: clamp(28px, 3vw, 44px);
    line-height: 1.12;
    letter-spacing: -0.02em;
    color: var(--flicker-canvas);
    text-wrap: balance;
  }
  .tm-line { display: block; will-change: opacity, transform, filter; }
  .tm-sub {
    margin: 18px auto 0 auto;
    max-width: 560px;
    font-family: var(--font-sans);
    font-weight: 400;
    font-size: clamp(17px, 1.4vw, 22px);
    line-height: 1.5;
    color: rgba(255, 249, 236, 0.72);
    text-wrap: pretty;
    will-change: opacity, transform, filter;
  }
  .tm-word { color: #7A6B6F; }   /* JS scrubs muted -> cream */

  /* ---- Settling cards layer — around the headline ---- */
  .tm-cards {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
  }
  .tm-card {
    position: absolute;
    left: 50%;
    top: 50%;
    width: clamp(290px, 25vw, 384px);
    opacity: 0;               /* JS reveals + positions; static fallback below */
    pointer-events: auto;
    will-change: transform, opacity;
  }

  /* ---- Card anatomy (existing testimonial vocabulary on .gw-card) ---- */
  .tm-card-body {
    display: flex;
    flex-direction: column;
    gap: clamp(20px, 2.2vw, 28px);
    padding: clamp(22px, 1.9vw, 28px);
  }
  .tm-quote {
    margin: 0;
    font-family: var(--font-serif);   /* GT Super Text Trial */
    font-weight: 500;
    font-size: clamp(18px, 1.4vw, 22px);
    line-height: 1.45;
    letter-spacing: -0.01em;
    color: var(--flicker-body);
    text-wrap: pretty;
  }
  .tm-quote::before { content: "\\201C"; }
  .tm-quote::after  { content: "\\201D"; }
  .tm-person { display: flex; flex-direction: column; gap: 2px; }
  .tm-name {
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: 16px;
    letter-spacing: -0.01em;
    color: var(--flicker-body);
  }
  .tm-role {
    font-family: var(--font-sans);
    font-weight: 400;
    font-size: 14px;
    color: var(--flicker-ink-mute);
  }

  /* ---- Reduced motion: no pin, no scrub — static stacked column ---- */
  @media (prefers-reduced-motion: reduce) {
    .tm-word { color: #FFF9EC; }
    .tm-pin {
      height: auto;
      overflow: visible;
      padding: clamp(96px, 14vh, 180px) clamp(20px, 4vw, 64px);
    }
    .tm-center {
      position: static;
      top: auto; left: auto;
      transform: none;
      width: auto;
      margin: 0 auto;
      padding: 0;
    }
    .tm-line, .tm-sub {
      opacity: 1 !important; filter: none !important; transform: none !important;
    }
    .tm-cards {
      position: static;
      inset: auto;
      margin: clamp(40px, 6vh, 64px) auto 0;
      width: min(92vw, 560px);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .tm-card {
      position: static;
      left: auto; top: auto;
      width: 100%;
      opacity: 1;
      transform: none !important;
    }
  }
`;

function Testimonials() {
  const sectionRef = useTmRef(null);
  const pinRef = useTmRef(null);
  const lineRefs = useTmRef([]); // line1, line2, sub — pre-pin fade-in blocks
  const cardRefs = useTmRef([]);
  const headWordRefs = useTmRef([]);
  const bodyWordRefs = useTmRef([]);

  lineRefs.current = [];
  cardRefs.current = [];
  headWordRefs.current = [];
  bodyWordRefs.current = [];
  let hIdx = 0;

  useTmEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    const section = sectionRef.current;
    if (!section) return;
    const reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // static stacked column via CSS — no pin, no scrub

    let killed = false,st = null,entryTl = null,exitST = null,lastP = 0;

    // Scrubbed reveal — heading fill, body fill, then cards settle into place.
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
      // ENTRY — line-by-line fade + blur + rise (pre-pin), same as the showcase.
      gsap.set(lineRefs.current, { opacity: 0, y: 28, filter: "blur(9px)" });
      entryTl = gsap.to(lineRefs.current, {
        opacity: 1, y: 0, filter: "blur(0px)",
        ease: "power2.out", duration: 0.5, stagger: 0.22,
        scrollTrigger: { trigger: section, start: "top 80%", end: "top 56%", scrub: 1, refreshPriority: -2 }
      }).scrollTrigger;

      // PIN — fill + settle + dwell. refreshPriority -2 so this measures
      // AFTER the Listen flip pin (-1) has inserted its pin spacing.
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

      // EXIT — after the pin releases the cards FLY OUT (same speed as
      // they flew in: 0.30 progress window each, staggered) while the
      // headline fades, so the section dissolves cleanly into the belly.
      const centerEl = section.querySelector('.tm-center');
      exitST = ScrollTrigger.create({
        trigger: section,
        start: "bottom bottom",
        end: "bottom top",
        scrub: 1,
        refreshPriority: -2,
        onUpdate: (self) => {
          const e = self.progress;
          // Headline fades over the first half of the exit.
          if (centerEl) centerEl.style.opacity = String(tmClamp(1 - e * 2));
          // Cards fly out from rest -> exit position.
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

  // Word-split for the two-tone fill. `hIdx` keeps head ref indices
  // sequential across both heading lines.
  const headLine = (text) => {
    const parts = text.split(" ");
    return parts.map((w, k) => {
      const idx = hIdx++;
      return (
        <span key={idx} className="tm-word" ref={(el) => {if (el) headWordRefs.current[idx] = el;}} style={{ fontWeight: "900" }}>
          {w}{k < parts.length - 1 ? " " : ""}
        </span>);

    });
  };
  const bodyText = (text) => {
    const parts = text.split(" ");
    return parts.map((w, k) =>
    <span key={k} className="tm-word" ref={(el) => {if (el) bodyWordRefs.current[k] = el;}}>
        {w}{k < parts.length - 1 ? " " : ""}
      </span>
    );
  };

  return (
    <section ref={sectionRef} data-screen-label="07 Reader Stories" data-no-autofade="" className="tm-section">
      <style>{TM_CSS}</style>

      <div ref={pinRef} className="tm-pin" style={{ fontWeight: "900" }}>
        {/* Pinned center content — stays centered while the cards settle around it */}
        <div className="tm-center">
          <h2 className="tm-h2">
            <span className="tm-line" ref={(el) => {if (el) lineRefs.current[0] = el;}}>{headLine("Stories From")}</span>
            <span className="tm-line" ref={(el) => {if (el) lineRefs.current[1] = el;}}>{headLine("Our Readers.")}</span>
          </h2>
          <p className="tm-sub" ref={(el) => {if (el) lineRefs.current[2] = el;}}>
            {bodyText("Busy professionals and lifelong learners are turning small moments into real progress with Flicker App.")}
          </p>
        </div>

        {/* Testimonial cards — settle into resting places around the headline */}
        <div className="tm-cards">
          {TM_CARDS.map((t, i) =>
          <article
            key={i}
            ref={(el) => {if (el) cardRefs.current[i] = el;}}
            className="gw-card tm-card">
              <div className="gw-card-body tm-card-body">
                <p className="tm-quote">{t.quote}</p>
                <div className="tm-person">
                  <span className="tm-name">{t.name}</span>
                  <span className="tm-role">{t.role}</span>
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>);

}

window.Testimonials = Testimonials;