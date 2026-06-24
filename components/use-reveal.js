"use client";
import React from "react";

/* =====================================================================
   useReveal — scroll-reveal + parallax for the content pages (Blog,
   Blog Post, legal/Template). Ported from the imported design's
   support.js: elements marked [data-reveal] start hidden (via the
   `.reveal` CSS class) and fade-up when they enter the viewport,
   honoring an optional [data-delay] (ms). With { parallax: true },
   any [data-parallax="<amount>"] element is translated on scroll
   relative to its parent's center.

   SSR-safe: all window/IntersectionObserver access is inside the
   effect. A safety timer reveals everything if the observer never
   fires, so content can never get stuck invisible.
   ===================================================================== */
const { useEffect } = React;

export function useReveal(rootRef, { parallax = false, revealKey = 0 } = {}) {
  useEffect(() => {
    const root = rootRef && rootRef.current;
    if (!root) return undefined;

    const revealEl = (el) => {
      if (el._shown) return;
      el._shown = true;
      const d = parseInt(el.getAttribute("data-delay"), 10) || 0;
      setTimeout(() => {
        el.style.setProperty("opacity", "1", "important");
        el.style.setProperty("transform", "none", "important");
      }, d);
    };

    const checkReveal = () => {
      const h = window.innerHeight || document.documentElement.clientHeight;
      root.querySelectorAll("[data-reveal]").forEach((el) => {
        if (el._shown) return;
        if (el.getBoundingClientRect().top < h * 0.92) revealEl(el);
      });
    };

    const updateParallax = () => {
      if (!parallax) return;
      const h = window.innerHeight || document.documentElement.clientHeight;
      root.querySelectorAll("[data-parallax]").forEach((el) => {
        const amt = parseFloat(el.getAttribute("data-parallax")) || 0;
        const parent = el.parentElement;
        if (!parent) return;
        const r = parent.getBoundingClientRect();
        const progress = (r.top + r.height / 2 - h / 2) / h; // -1..1 around center
        const shift = -progress * amt * 100;
        el.style.transform = "translateY(" + shift.toFixed(2) + "px)";
      });
    };

    const els = Array.from(root.querySelectorAll("[data-reveal]"));
    // Only (re)arm elements we have not already revealed. On re-runs (filter /
    // load-more change revealKey), nodes React reuses keep their _shown flag so
    // they don't re-animate, while freshly mounted nodes fade in.
    els.forEach((el) => { if (typeof el._shown !== "boolean") el._shown = false; });

    let io;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { revealEl(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -7% 0px" });
      els.forEach((el) => { if (!el._shown) io.observe(el); });
    } else {
      els.forEach(revealEl); // no IO support → just show everything
    }

    const onScroll = () => { checkReveal(); updateParallax(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    checkReveal();
    updateParallax();
    const raf = requestAnimationFrame(() => { checkReveal(); updateParallax(); });
    const t1 = setTimeout(checkReveal, 350);
    // Safety net: never leave content hidden if the observer misses.
    const t2 = setTimeout(() => els.forEach(revealEl), 1600);

    return () => {
      if (io) io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [rootRef, parallax, revealKey]);
}
