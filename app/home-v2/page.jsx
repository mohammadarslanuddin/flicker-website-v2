"use client";

import dynamic from "next/dynamic";

// Mount the whole app client-only. app-v6 calls gsap.registerPlugin(...) and
// reads #tweak-defaults at module top level — both require the browser (and the
// beforeInteractive vendor globals). ssr:false matches the original's CSR-only
// behavior and keeps every component's DOM/window access off the server.
// (ssr:false dynamic imports are only permitted inside a Client Component.)
const App = dynamic(() => import("../../components/app-v6"), { ssr: false });

export default function Page() {
  return <App />;
}
