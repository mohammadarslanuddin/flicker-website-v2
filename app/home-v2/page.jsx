"use client";

import dynamic from "next/dynamic";

// Mount the home composition client-only. app-v7 calls gsap.registerPlugin(...)
// and reads #tweak-defaults at module top level — both require the browser (and
// the beforeInteractive vendor globals). ssr:false keeps every component's
// DOM/window/global-lib access off the server.
// (ssr:false dynamic imports are only permitted inside a Client Component.)
const App = dynamic(() => import("../../components/app-v7"), { ssr: false });

export default function Page() {
  return <App />;
}
