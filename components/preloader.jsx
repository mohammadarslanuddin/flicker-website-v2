"use client";
import React from "react";
import { usePathname } from "next/navigation";

const { useRef, useEffect } = React;

/* global lottie, gsap */

/* =====================================================================
   Preloader — site-wide branded loading overlay.

   A fixed full-screen overlay that plays the Flicker logo Lottie on every
   load / refresh of the HOME route only, plays it through once, then slides
   itself out of view (GSAP move-out) to reveal the site.

   Mounted from app/layout.jsx so it sits OUTSIDE #smooth-wrapper — critical,
   because ScrollSmoother puts a `transform` on #smooth-content, and a
   transform becomes the containing block for position:fixed descendants
   (so a fixed overlay nested inside it would no longer be viewport-fixed).
   It self-gates to the home route via usePathname(); content routes render
   nothing.

   The inline <style> (same technique as content-chrome.jsx) ships in the
   initial SSR HTML so the overlay is fully styled on first paint — no
   flash of the page underneath while JS boots. Scroll is locked via CSS
   until the overlay marks itself done (html[data-preloaded]).
   ===================================================================== */

const PRELOADER_CSS = `
  /* Lock scroll while the overlay is up; auto-unlocks once data-preloaded
     is set on dismiss. */
  html:not([data-preloaded]) body { overflow: hidden; }

  .flk-preloader {
    position: fixed;
    inset: 0;
    z-index: 2147483000;
    display: grid;
    place-items: center;
    background: #ffffff;
    will-change: transform;
  }
  /* Done: overlay has slid away — remove it from the box model entirely. */
  html[data-preloaded] .flk-preloader { display: none; }

  .flk-preloader__logo {
    width: min(38vw, 380px);
    max-width: 78vw;
    aspect-ratio: 1280 / 720;
  }
  .flk-preloader__logo svg,
  .flk-preloader__logo canvas { display: block; width: 100%; height: 100%; }

  /* On phones 38vw is tiny — scale the logo up so it reads clearly. */
  @media (max-width: 640px) {
    .flk-preloader__logo { width: 72vw; max-width: 360px; }
  }
`;

export function Preloader() {
  const overlayRef = useRef(null);
  const holderRef = useRef(null);
  const isHome = usePathname() === "/";

  useEffect(() => {
    if (!isHome) return;
    const overlay = overlayRef.current;
    const holder = holderRef.current;
    if (!overlay || !holder) return;

    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let anim = null;
    let pollTimer = null;
    let hardCap = null;
    let dismissed = false;

    // --- sequencing ---------------------------------------------------------
    // The home app's GSAP/ScrollSmoother boot is ~1.3s of main-thread long
    // tasks (incl. a single ~500ms block). Running it WHILE the logo plays is
    // what makes the lottie stutter — no renderer can stay smooth through a
    // 500ms thread block. So we strictly serialize:
    //   1. logo plays on an otherwise-idle main thread  → smooth.
    //   2. logo finishes (`animDone`)  → fire `flicker:start-boot`; app/page.jsx
    //      mounts <App/> only now, so the heavy boot runs HIDDEN behind the
    //      overlay (logo already done — nothing to stutter).
    //   3. app finishes setup  → fires `flicker:ready` → we slide the overlay
    //      away to reveal a fully-booted page.
    let animDone = false;
    let flickerReady = false;
    let bootStarted = false;

    const startBoot = () => {
      if (bootStarted) return;
      bootStarted = true;
      window.dispatchEvent(new Event("flicker:start-boot"));
    };

    const onAnimDone = () => {
      animDone = true;
      startBoot();      // let the app boot now that the logo is done
      maybeDismiss();
    };

    let scheduling = false;
    const maybeDismiss = () => {
      if (dismissed || scheduling) return;
      // Reveal only once the logo has fully played AND the app has booted.
      if (animDone && flickerReady) scheduleReveal();
    };

    // Don't start the slide the instant boot finishes: app-v6's setup tail
    // (ScrollSmoother first paint + ScrollTrigger refresh + the revealed page's
    // initial paint) is a ~450ms long task right after `flicker:ready`, and
    // running the move-out through it is what made the transition stutter.
    // Hold until the main thread is actually rendering smoothly — two
    // consecutive ~60fps frames — then slide. Capped so we never wait long.
    const scheduleReveal = () => {
      scheduling = true;
      let good = 0;
      let prev = performance.now();
      const t0 = prev;
      const probe = (now) => {
        if (dismissed) return;
        const dt = now - prev;
        prev = now;
        good = dt < 26 ? good + 1 : 0;
        if (good >= 2 || now - t0 > 800) dismiss();
        else requestAnimationFrame(probe);
      };
      requestAnimationFrame(probe);
    };

    const finalize = () => {
      // Removes the overlay (display:none) + unlocks scroll via CSS.
      document.documentElement.setAttribute("data-preloaded", "1");
      if (anim && anim.destroy) anim.destroy();
      anim = null;
    };

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      clearTimeout(hardCap);
      clearInterval(pollTimer);

      // GSAP move-out: slide the whole overlay up and off-screen, then drop it.
      if (typeof gsap !== "undefined") {
        // Snap the logo to invisible the instant the transition begins, so only
        // the blank panel slides away — the lottie never lingers mid-move.
        gsap.set(holder, { autoAlpha: 0 });
        gsap.to(overlay, {
          yPercent: -100,
          duration: reduceMotion ? 0.35 : 0.85,
          ease: "power3.inOut",
          force3D: true, // keep the slide on its own GPU layer
          onComplete: finalize,
        });
      } else {
        // GSAP somehow unavailable — just reveal the site.
        finalize();
      }
    };

    // --- boot the Lottie (poll for the vendored global like growing-v6) -----
    const startAnim = () => {
      if (typeof lottie === "undefined" || anim) return false;
      anim = lottie.loadAnimation({
        container: holder,
        // Canvas renderer (not SVG): the SVG renderer rebuilds/repaints the
        // whole 1280x720 vector tree in the DOM every frame on the main thread,
        // which stutters on mobile and while the home app's GSAP/ScrollSmoother
        // boot is competing for the same thread. This logo has no masks or
        // track-mattes (the one thing the canvas renderer can't paint — see
        // growing-v6), so canvas renders it correctly and far more cheaply: a
        // single GPU-compositable bitmap. The backing canvas is the comp's
        // native 1280x720, downscaled by CSS to the display size, so it stays
        // crisp on retina.
        renderer: "canvas",
        loop: false, // play through exactly once, then transition
        autoplay: !reduceMotion,
        path: "/uploads/flicker-logo.json",
        rendererSettings: {
          clearCanvas: true,
          progressiveLoad: false,
          preserveAspectRatio: "xMidYMid meet",
        },
      });
      // Render on whole frames only — drops the per-tick subframe interpolation
      // work, which the eye can't see at 60fps but the CPU pays for.
      if (anim.setSubframe) anim.setSubframe(false);
      // The full play has finished — start the app boot, then allow the reveal.
      anim.addEventListener("complete", onAnimDone);
      if (reduceMotion) {
        // Reduced motion: don't animate — show the finished logo, then proceed.
        anim.addEventListener("DOMLoaded", () => {
          if (anim && anim.goToAndStop) anim.goToAndStop(anim.totalFrames - 1, true);
          onAnimDone();
        });
      }
      return true;
    };

    if (!startAnim()) {
      // lottie.min.js can resolve after this effect runs — poll briefly.
      pollTimer = setInterval(() => {
        if (startAnim()) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }, 60);
    }

    // --- wire ready signal --------------------------------------------------
    // The app fires this from app-v6 once its ScrollSmoother + section setup is
    // done (which only runs after our `flicker:start-boot`).
    const onFlickerReady = () => { flickerReady = true; maybeDismiss(); };
    window.addEventListener("flicker:ready", onFlickerReady);

    // Failure-only safety net: if the logo never plays (lottie global missing)
    // or the app never reports ready, don't trap the user behind the overlay.
    // Also kicks the boot so <App/> still mounts. Generous so it never cuts off
    // the normal sequence (~2.6s logo + ~1.5s boot).
    hardCap = setTimeout(() => { startBoot(); dismiss(); }, 12000);

    return () => {
      clearInterval(pollTimer);
      clearTimeout(hardCap);
      window.removeEventListener("flicker:ready", onFlickerReady);
      if (overlay) gsap && gsap.killTweensOf && gsap.killTweensOf(overlay);
      if (anim && anim.destroy) anim.destroy();
    };
  }, [isHome]);

  // Only the home route gets the preloader; content routes render nothing.
  if (!isHome) return null;

  return (
    <React.Fragment>
      <style>{PRELOADER_CSS}</style>
      <div className="flk-preloader" ref={overlayRef} aria-hidden="true">
        <div className="flk-preloader__logo" ref={holderRef} />
      </div>
    </React.Fragment>
  );
}
