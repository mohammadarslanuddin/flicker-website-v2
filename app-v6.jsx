/* global React, ReactDOM, HeroV3, HowItWorks, SubjectShowcase, Growing, Listen, MemberCTA, Testimonials, FaqSection, SiteFooter,
   TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSlider, TweakSelect, useTweaks,
   gsap, ScrollTrigger, ScrollSmoother, Flip */

// Register plugins once at module load. Babel runs scripts in source order, so
// gsap + ScrollTrigger + ScrollSmoother are already attached to window by now.
gsap.registerPlugin(ScrollTrigger, ScrollSmoother, Flip);

// Flicker-aligned tone presets. Each maps to design-system tokens so we never
// invent new colors — just choose which surface drives the page.
const TONES = {
  canvas: {
    bg: "#FFF9EC", bgRgb: "255, 249, 236",
    ink: "#22191B", inkRgb: "34, 25, 27",
    inkSoft: "#3D3034", muted: "#7A6B6F",
    rule: "#ECDFC4",
  },
  almond: {
    bg: "#FFE5D2", bgRgb: "255, 229, 210",
    ink: "#22191B", inkRgb: "34, 25, 27",
    inkSoft: "#3D3034", muted: "#7A6B6F",
    rule: "rgba(34,25,27,0.16)",
  },
  paper: {
    bg: "#FFFEFB", bgRgb: "255, 254, 251",
    ink: "#22191B", inkRgb: "34, 25, 27",
    inkSoft: "#3D3034", muted: "#7A6B6F",
    rule: "#ECDFC4",
  },
  cosmos: {
    bg: "#561D20", bgRgb: "86, 29, 32",
    ink: "#FFF9EC", inkRgb: "255, 249, 236",
    inkSoft: "#FFE5D2", muted: "#FFB3B3",
    rule: "rgba(255,249,236,0.18)",
  },
};

function applyTone(name) {
  const t = TONES[name] || TONES.canvas;
  const r = document.documentElement;
  r.style.setProperty("--bg", t.bg);
  r.style.setProperty("--bg-rgb", t.bgRgb);
  r.style.setProperty("--ink", t.ink);
  r.style.setProperty("--ink-rgb", t.inkRgb);
  r.style.setProperty("--ink-soft", t.inkSoft);
  r.style.setProperty("--ink-muted", t.muted);
  r.style.setProperty("--rule", t.rule);
}

const DEFAULTS = (() => {
  try {
    const raw = document.getElementById("tweak-defaults").textContent;
    const json = raw.match(/\{[\s\S]*\}/)[0];
    return JSON.parse(json);
  } catch (e) {
    return {
      tone: "canvas",
      speed: 1,
      density: 8,
      spread: 1,
      cardSize: 1,
      showCounter: true,
      showPlateLabels: true,
      perspective: "deep",
    };
  }
})();

function App() {
  const [tweaks, setTweak] = useTweaks(DEFAULTS);

  React.useEffect(() => { applyTone(tweaks.tone); }, [tweaks.tone]);

  // Init ScrollSmoother synchronously on mount — no rAF gate so it runs the
  // moment the wrapper/content are in the DOM (React has already rendered
  // them by the time this effect fires).
  React.useEffect(() => {
    let existing = ScrollSmoother.get();
    if (existing) return () => {};
    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.4,
      // No data-speed / data-lag effects exist anywhere in the markup, so the
      // effects pipeline was doing per-tick bookkeeping for zero payoff.
      effects: false,
      // normalizeScroll hands wheel/touch input to JS instead of letting the
      // browser scroll natively — a common source of "heavy"/laggy desktop
      // scroll feel. Off = native scroll drives the smoother. Set back to true
      // if mobile address-bar resize jank reappears.
      normalizeScroll: false,
    });
    return () => {
      if (smoother && smoother.kill) smoother.kill();
    };
  }, []);

  /* ---------- Section-to-section fade + blur (GSAP ScrollTrigger) ---------
     As one section approaches the 80% threshold (its bottom nearing the top
     of the viewport, or the next section's top crossing 80% of viewport
     from below), we apply opacity + blur tweens. The combined effect is a
     soft cross-dissolve at every section seam.
  */
  React.useEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    // Defer to ensure all section DOM + pin triggers are wired first.
    const setup = () => {
      const sections = Array.from(document.querySelectorAll("section[data-screen-label]"));
      const triggers = [];
      sections.forEach((section, i) => {
        // Pinned sections opt out of the generic cross-dissolve so they
        // don't fade themselves out mid-pin.
        if (section.hasAttribute("data-no-autofade")) return;
        // FADE IN — every section except the first.
        // Section reaches full opacity when 60% of the viewport is filled
        // by section content (its top edge at 40% down the viewport).
        if (i > 0) {
          gsap.set(section, { opacity: 0 });
          const t = gsap.to(section, {
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 100%",
              end: "top 40%",
              scrub: 1,
            },
          });
          triggers.push(t.scrollTrigger);
        }
        // FADE OUT — every section. Starts when 40% of the section has
        // scrolled past the viewport top, completes as the section fully
        // exits at the top.
        const t2 = gsap.to(section, {
          opacity: 0,
          ease: "power2.in",
          scrollTrigger: {
            trigger: section,
            start: "40% top",
            end: "bottom top",
            scrub: 1,
          },
        });
        triggers.push(t2.scrollTrigger);
      });
      // Refresh once everything is wired so positions are accurate.
      ScrollTrigger.refresh();
      return triggers;
    };

    // Wait for fonts (and the pinned genres trigger that depends on font
    // metrics) before measuring section bounds.
    let cleanupTriggers = [];
    const run = () => { cleanupTriggers = setup(); };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => requestAnimationFrame(run));
    } else {
      requestAnimationFrame(run);
    }

    return () => {
      cleanupTriggers.forEach((t) => t && t.kill && t.kill());
    };
  }, []);

  return (
    <>
      <SiteNav />
      <HeroV3 tweaks={tweaks} setTweak={setTweak} />
      <HowItWorks />
      <SubjectShowcase />
      <Growing />
      <Listen>
        {/* All live inside Listen's black container (.ln-belly) — the
            section the flip morphs into — so there's no seam anywhere:
            testimonials → membership CTA → FAQs → footer. */}
        <Testimonials />
        <MemberCTA />
        <FaqSection />
        <SiteFooter />
      </Listen>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
