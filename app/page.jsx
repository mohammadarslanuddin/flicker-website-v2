"use client";

import React from "react";
import dynamic from "next/dynamic";

const { useState, useEffect } = React;

// Mount the whole app client-only. app-v6 calls gsap.registerPlugin(...) and
// reads #tweak-defaults at module top level — both require the browser (and the
// beforeInteractive vendor globals). ssr:false matches the original's CSR-only
// behavior and keeps every component's DOM/window access off the server. This
// is the default home page.
const App = dynamic(() => import("../components/app-v6"), { ssr: false });

export default function Page() {
  // The home app's mount + GSAP/ScrollSmoother boot is ~1.3s of main-thread
  // long tasks. Mounting it while the preloader logo plays makes the lottie
  // stutter. So we hold the mount until the preloader signals the logo has
  // finished (`flicker:start-boot`) — the heavy boot then runs hidden behind
  // the overlay, and app-v6 fires `flicker:ready` when done to dismiss it.
  // Fallback timer guarantees the app mounts even if the preloader is absent
  // or never signals (e.g. lottie failed to load).
  const [boot, setBoot] = useState(false);

  useEffect(() => {
    if (boot) return;
    const go = () => setBoot(true);
    window.addEventListener("flicker:start-boot", go);
    const fallback = setTimeout(go, 4000);
    return () => {
      window.removeEventListener("flicker:start-boot", go);
      clearTimeout(fallback);
    };
  }, [boot]);

  return boot ? <App /> : null;
}
