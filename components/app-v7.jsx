"use client";
import React from "react";
import { SiteNav } from "./site-nav";
import { HeroSequenceV7 } from "./hero-sequence-v7";
import { SubjectShowcase } from "./showcase-v6";
import { Growing } from "./growing-v6";
import { Listen } from "./listen-v6";
import { MemberCTAV7 } from "./member-cta-v7";
import { TestimonialsV7 } from "./testimonials-v7";
import { FaqSection } from "./faq-v6";
import { SiteFooter } from "./footer-v6";
import { useTweaks } from "./tweaks-panel-v6";

/* global gsap, ScrollTrigger, ScrollSmoother, Flip */

/* =====================================================================
   Flicker — Home (v7 / "Home A" approach).

   A SEPARATE composition that lives at /home-v7, kept fully apart from the
   shipping home page (app-v6 at /). The only sections that differ from v6
   are the ones the "Home A" Figma frame redesigns:
     · HeroSequenceV7 — ONE pinned section: phone-mockup hero morphs (phone
                        scales down to centre, panel → card) into the
                        "2 — How it works" Lottie sequence; absorbs the old
                        standalone How-it-works, so Summaries follows directly
     · TestimonialsV7 — pastel image cards with real reader quotes
     · MemberCTAV7   — mirrored card with the web-app browser mockup
   Every other section is reused verbatim from v6 because the design matches.
   Scroll/tone/cross-dissolve plumbing is identical to app-v6.
   ===================================================================== */

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, Flip);

/* On phones the browser address bar shows/hides as you scroll, which changes
   window.innerHeight and makes ScrollTrigger refresh + re-measure every pinned
   section mid-scroll — the Summaries showcase (pinned, end based on innerHeight)
   visibly jitters as a result. ignoreMobileResize tells ScrollTrigger to skip
   those toolbar-driven height changes so pins stay stable while scrolling. */
ScrollTrigger.config({ ignoreMobileResize: true });

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

export default function App() {
  const [tweaks, setTweak] = useTweaks(DEFAULTS);

  React.useEffect(() => { applyTone(tweaks.tone); }, [tweaks.tone]);

  React.useEffect(() => {
    let existing = ScrollSmoother.get();
    if (existing) return () => {};
    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.4,
      effects: false,
      // Take over touch scrolling so the mobile address bar never shows/hides
      // mid-scroll — that toolbar resize is what re-pins the Summaries section
      // and causes the jitter. `true` lets ScrollSmoother apply its own defaults
      // (debounce + the #smooth-content element it must normalize); the carousel
      // is a pointer-drag (not a native scroller), so it keeps working.
      normalizeScroll: true,
    });
    return () => {
      if (smoother && smoother.kill) smoother.kill();
    };
  }, []);

  /* ---------- Section-to-section cross-dissolve (GSAP ScrollTrigger) ----------
     Identical to app-v6: every section[data-screen-label] fades in/out at its
     seams, except pinned sections that opt out via data-no-autofade. */
  React.useEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    const setup = () => {
      const sections = Array.from(document.querySelectorAll("section[data-screen-label]"));
      const triggers = [];
      sections.forEach((section, i) => {
        if (section.hasAttribute("data-no-autofade")) return;
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
      ScrollTrigger.refresh();
      return triggers;
    };

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
      <HeroSequenceV7 />
      <SubjectShowcase />
      <Growing />
      <Listen>
        {/* Same black-belly grouping as v6 so the flip morph has no seam:
            testimonials → membership CTA → FAQs → footer. */}
        <TestimonialsV7 />
        <MemberCTAV7 />
        <FaqSection />
        <SiteFooter />
      </Listen>
    </>
  );
}
