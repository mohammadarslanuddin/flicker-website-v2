"use client";
import React from "react";
import dynamic from "next/dynamic";
import { SiteFooter } from "./footer-v6";

const { useRef, useEffect } = React;

// SiteNav is portal-based and renders a server/client branch (host div created
// only in the browser), so SSR-ing it produces a hydration mismatch. The home
// page already loads the whole app client-only for the same reason — mirror
// that here by loading the nav ssr:false. The footer is deterministic and
// stays server-rendered (good for SEO).
const SiteNav = dynamic(() => import("./site-nav").then((m) => m.SiteNav), { ssr: false });

/* =====================================================================
   ContentChrome — shared shell for every non-home page (Blog, Blog Post,
   legal/Template docs, 404). Mounts the route-aware Flicker SiteNav at
   the top and the SiteFooter inside a dark band at the bottom, matching
   the home page's footer treatment.

   Critical: public/page.css statically pins #smooth-wrapper
   (position:fixed; overflow:hidden) for the home page's ScrollSmoother.
   Content routes never create the smoother, so without this override
   they'd be clipped to one viewport and unscrollable. The <style> below
   ships in the initial SSR HTML (no flash) and is removed automatically
   when the user navigates back to the home tree.
   ===================================================================== */

const CHROME_CSS = `
  #smooth-wrapper{ position:static !important; inset:auto !important; overflow:visible !important; height:auto !important; }
  #smooth-content{ transform:none !important; }
  html{ scroll-behavior:smooth; }
  body.flicker-root{ background:var(--bg); }
  /* Band around the footer panel. On home the footer's surround matches the
     section directly above it (the black .ln-belly). Here it must do the same
     dynamically: the effect below copies the *actual* painted background of
     the section directly above the band onto it at runtime, so the footer
     panel always floats on a seamless continuation of the previous section —
     whatever colour that section happens to be. var(--flicker-canvas) is only
     the SSR fallback (today's page bodies paint canvas, so there's no flash).
     Padding matches home's .ln-belly inset. */
  .flk-footer-band{ background:var(--flicker-canvas); padding:clamp(5px, 0.5vw, 9px); }
`;

/* Resolve the background actually painted at the bottom edge of `root`: descend
   to the bottom-most leaf, then walk back up to the first ancestor that paints a
   non-transparent background. This is what the eye sees directly above the band. */
function bottomPaintedBackground(root) {
  let el = root;
  while (el && el.lastElementChild) el = el.lastElementChild;
  for (; el && el !== document.documentElement; el = el.parentElement) {
    const bg = getComputedStyle(el).backgroundColor;
    if (bg && bg !== "transparent" && !/^rgba\(0,\s*0,\s*0,\s*0\)$/.test(bg)) {
      return bg;
    }
  }
  return "";
}

export function ContentChrome({ children }) {
  const bandRef = useRef(null);

  useEffect(() => {
    const band = bandRef.current;
    if (!band) return;
    const main = band.previousElementSibling; // <main> holding the page body
    if (!main) return;

    const sync = () => {
      const bg = bottomPaintedBackground(main);
      if (bg) band.style.background = bg;
    };

    sync();
    // Re-resolve after fonts settle / layout shifts so we read the final paint.
    const onResize = () => sync();
    window.addEventListener("resize", onResize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);

    return () => window.removeEventListener("resize", onResize);
  }, [children]);

  return (
    <React.Fragment>
      <style>{CHROME_CSS}</style>
      <SiteNav />
      <main>{children}</main>
      <div className="flk-footer-band" ref={bandRef}>
        <SiteFooter />
      </div>
    </React.Fragment>
  );
}
