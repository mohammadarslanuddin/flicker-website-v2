/* global React, gsap, ScrollTrigger */
const { useRef: useFaqRef, useEffect: useFaqEffect, useState: useFaqState } = React;

/* =====================================================================
   Flicker — "Questions, Answered" (section 08).
   Standard (non-pinned) section directly after the Reader Stories pin
   releases — light surface, back to the default background token
   (var(--bg)), sitting inside the black .ln-belly above the footer.

   - Header reuses the section-05 social-proof vocabulary: .gw-head /
     .gw-h2 / .gw-body with the fade+blur+rise reveal and the two-tone
     word fill (muted -> ink on the light surface).
   - Accordion (existing pattern, motion per spec): GSAP height auto-tween
     on expand/collapse (0 <-> auto, 0.4s, power2.inOut), chevron rotates
     180deg, only one item open at a time.
   - Items reveal with the same fade-from-blur entrance as the bento
     cards (opacity 0 / blur 14px / y +32 -> visible), staggered via
     ScrollTrigger.batch.
   - FAQPage schema (JSON-LD) uses the same Q&A verbatim.
   - prefers-reduced-motion: items render visible with no blur; the
     accordion toggles instantly.
   ===================================================================== */

// Two-tone fill on the dark surface: muted -> cream (same as the other dark-belly sections).
const FAQ_MUTE = [122, 107, 111]; // --flicker-ink-mute #7A6B6F
const FAQ_CREAM = [255, 249, 236]; // --flicker-canvas #FFF9EC
const faqClamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
const faqMix = (a, b, t) =>
`rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;

const FAQS = [
{
  q: "What is Flicker App?",
  a: "Flicker App is an AI-powered book summary platform. It distills the world's best books into clear, smart summaries you can read or listen to in minutes, so you absorb the ideas that matter without reading every page."
},
{
  q: "How are the summaries created?",
  a: "Each summary is AI-curated and structured around the core ideas of the book, not a word count. The goal is insight you can actually use: key concepts, clear takeaways, and the reasoning behind them."
},
{
  q: "Can I listen to summaries instead of reading them?",
  a: "Yes. Every summary is available in both text and audio. Switch between them anytime, so you can read at your desk and keep listening on your commute."
},
{
  q: "Is Flicker App a replacement for reading books?",
  a: "No, and it is not meant to be. Flicker App helps you decide which books deserve your full attention and gives you the core ideas of the rest. Many readers use it to preview, revisit, or retain what they have read."
},
{
  q: "How often are new summaries added?",
  a: "New titles are added every week across categories like business, psychology, productivity, leadership, and personal growth, so there is always a next idea waiting."
}];


const FAQ_SCHEMA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQS.map((f) => ({
    "@type": "Question",
    "name": f.q,
    "acceptedAnswer": { "@type": "Answer", "text": f.a }
  }))
});

const FAQ_CSS = `
  /* Dark band — same surface as the black .ln-belly container above. */
  .faq-section {
    position: relative;
    background: var(--flicker-body);
    color: #FFF9EC;
    padding: clamp(96px, 14vh, 188px) clamp(20px, 4vw, 64px);
    overflow: hidden;
  }
  .faq-section .gw-h2  { color: #FFF9EC; }
  .faq-section .gw-body { color: rgba(255,249,236,0.72); }
  .faq-section .gw-word { color: #7A6B6F; }  /* JS scrubs muted -> cream */

  /* ---- Accordion list — single centered column, borderless rows ---- */
  .faq-list {
    position: relative;
    z-index: 2;
    max-width: 820px;
    margin: calc(clamp(4px, 1.5vh, 24px) + 7.5vh) auto 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  /* No border / background by default — subtle bg only on hover or open. */
  .faq-item {
    position: relative;
    background: transparent;
    border: none;
    border-radius: var(--radius-xl);
    overflow: hidden;
    transition: background .2s cubic-bezier(.16,1,.3,1);
  }
  .faq-item:hover  { background: rgba(255,249,236,0.05); }
  .faq-item.is-open { background: rgba(255,249,236,0.07); }
  .faq-q {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: clamp(13px, 1.1vw, 17px) clamp(16px, 1.5vw, 22px);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: clamp(15px, 1.15vw, 18px);
    letter-spacing: -0.01em;
    color: #FFF9EC;
  }
  /* Chevron — rotates 180deg on open (0.4s, power2.inOut equivalent). */
  .faq-q-icon {
    flex-shrink: 0;
    width: 30px; height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255,249,236,0.10);
    color: #FFF9EC;
    transition: transform .4s cubic-bezier(.45,0,.55,1),
                background-color .4s cubic-bezier(.45,0,.55,1);
  }
  .faq-q-icon i { font-size: 16px; line-height: 1; }
  .faq-item.is-open .faq-q-icon {
    transform: rotate(180deg);
    background: var(--brick);
    color: #FFF9EC;
  }

  /* Answer wrapper — height is GSAP-driven (0 <-> auto). */
  .faq-a { overflow: hidden; }
  .faq-a-text {
    margin: 0;
    padding: 0 clamp(16px, 1.5vw, 22px) clamp(14px, 1.2vw, 18px);
    font-family: var(--font-sans);
    font-weight: 400;
    font-size: clamp(14px, 1vw, 16px);
    line-height: 1.6;
    color: rgba(255,249,236,0.65);
    text-wrap: pretty;
    opacity: 0;
    transform: translateY(-6px);
    transition: opacity .4s cubic-bezier(.45,0,.55,1),
                transform .4s cubic-bezier(.45,0,.55,1);
  }
  .faq-item.is-open .faq-a-text { opacity: 1; transform: translateY(0); }

  @media (prefers-reduced-motion: reduce) {
    .faq-section .gw-word { color: #FFF9EC; }
    .faq-section .gw-h2, .faq-section .gw-body,
    .faq-section .gw-header-group, .faq-section .faq-item {
      opacity: 1 !important; filter: none !important; transform: none !important;
    }
    .faq-item { transition: none; }
    .faq-q-icon, .faq-a-text { transition: none; }
  }
`;

function FaqSection() {
  const sectionRef = useFaqRef(null);
  const answerRefs = useFaqRef([]);
  const headWordRefs = useFaqRef([]);
  const bodyWordRefs = useFaqRef([]);
  const [open, setOpen] = useFaqState(-1); // all collapsed initially

  answerRefs.current = [];
  headWordRefs.current = [];
  bodyWordRefs.current = [];

  /* ---- Scroll reveals — header + ScrollTrigger.batch on the items ---- */
  useFaqEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    const section = sectionRef.current;
    if (!section) return;
    const reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // items render visible with no blur

    let killed = false;
    const ctx = gsap.context(() => {
      const build = () => {
        const group = section.querySelector(".gw-header-group");
        const h2 = section.querySelector(".gw-h2");
        const body = section.querySelector(".gw-body");
        const lines = [h2, body].filter(Boolean);
        const hw = headWordRefs.current;
        const bw = bodyWordRefs.current;
        let lastP = 0;

        /* Header reveal — same vocabulary as the social-proof section.
           refreshPriority -3: measure AFTER the Listen (-1) and Reader
           Stories (-2) pins have inserted their pin spacing. */
        gsap.set(lines, { opacity: 0, y: 28, filter: "blur(12px)" });
        gsap.to(lines, {
          opacity: 1, y: 0, filter: "blur(0px)",
          ease: "power3.out", duration: 0.6, stagger: 0.12,
          scrollTrigger: {
            trigger: group, start: "top 86%", end: "top 52%",
            scrub: 1, refreshPriority: -3
          }
        });

        const renderFill = (p) => {
          lastP = p;
          const hf = faqClamp(p / 0.5) * hw.length;
          for (let j = 0; j < hw.length; j++)
          if (hw[j]) hw[j].style.color = faqMix(FAQ_MUTE, FAQ_CREAM, faqClamp(hf - j));
          const bf = faqClamp((p - 0.42) / 0.5) * bw.length;
          for (let j = 0; j < bw.length; j++)
          if (bw[j]) bw[j].style.color = faqMix(FAQ_MUTE, FAQ_CREAM, faqClamp(bf - j));
        };
        ScrollTrigger.create({
          trigger: group, start: "top 72%", end: "top 30%",
          scrub: 1, refreshPriority: -3,
          onUpdate: (self) => renderFill(self.progress),
          onRefresh: () => renderFill(lastP)
        });
        renderFill(0);

        /* Items — same fade-from-blur entrance as the bento cards
           (opacity 0 / blur 14px / y +32 -> visible), via ScrollTrigger.batch. */
        const items = gsap.utils.toArray(section.querySelectorAll(".faq-item"));
        gsap.set(items, { opacity: 0, y: 32, filter: "blur(14px)" });
        ScrollTrigger.batch(items, {
          start: "top 90%",
          refreshPriority: -3,
          onEnter: (batch) => gsap.to(batch, {
            opacity: 1, y: 0, filter: "blur(0px)",
            duration: 0.7, ease: "power3.out", stagger: 0.1, overwrite: true
          }),
          onLeaveBack: (batch) => gsap.to(batch, {
            opacity: 0, y: 32, filter: "blur(14px)",
            duration: 0.4, ease: "power3.in", overwrite: true
          })
        });
      };

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {if (!killed) {build();ScrollTrigger.refresh();}});
      } else {
        build();
      }
    }, section);

    return () => {
      killed = true;
      ctx.revert(); // clean teardown — kills all triggers and inline styles
    };
  }, []);

  /* ---- Accordion motion — GSAP height auto-tween (0 <-> auto, 0.4s,
     power2.inOut), one item open at a time. Instant under reduced motion.
     Height changes shift everything below, so ScrollTrigger re-measures
     once the tween settles. ---- */
  useFaqEffect(() => {
    const reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    answerRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, {
        height: i === open ? "auto" : 0,
        duration: reduce ? 0 : 0.4,
        ease: "power2.inOut",
        overwrite: true
      });
    });
    if (typeof ScrollTrigger === "undefined") return;
    const id = setTimeout(() => ScrollTrigger.refresh(), 450);
    return () => clearTimeout(id);
  }, [open]);

  const headWords = (text) => {
    const parts = text.split(" ");
    return parts.map((w, j) =>
    <span key={j} className="gw-word" ref={(el) => {if (el) headWordRefs.current[j] = el;}}>
        {w}{j < parts.length - 1 ? " " : ""}
      </span>
    );
  };
  const bodyWords = (text) => {
    const parts = text.split(" ");
    return parts.map((w, j) =>
    <span key={j} className="gw-word" ref={(el) => {if (el) bodyWordRefs.current[j] = el;}}>
        {w}{j < parts.length - 1 ? " " : ""}
      </span>
    );
  };

  return (
    <section ref={sectionRef} data-screen-label="08 FAQ" data-no-autofade="" className="faq-section">
      <style>{FAQ_CSS}</style>
      {/* FAQPage structured data — same questions and answers verbatim */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: FAQ_SCHEMA }}></script>

      <div className="gw-header-group">
        <div className="gw-head">
          <h2 className="gw-h2">{headWords("Questions, Answered")}</h2>
          <p className="gw-body">
            {bodyWords("Everything you need to know before your first summary.")}
          </p>
        </div>
      </div>

      <div className="faq-list">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className={"faq-item" + (isOpen ? " is-open" : "")}>
              <button
                type="button"
                className="faq-q"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}>
                <span style={{ fontWeight: "400" }}>{f.q}</span>
                <span className="faq-q-icon" aria-hidden="true"><i className="ph ph-caret-down"></i></span>
              </button>
              <div
                className="faq-a"
                style={{ height: 0 }}
                ref={(el) => {if (el) answerRefs.current[i] = el;}}>
                <p className="faq-a-text">{f.a}</p>
              </div>
            </div>);

        })}
      </div>
    </section>);

}

window.FaqSection = FaqSection;