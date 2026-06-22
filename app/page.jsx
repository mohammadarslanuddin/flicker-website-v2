"use client";

import dynamic from "next/dynamic";

// Mount the home composition client-only, exactly like the old app/page.jsx
// mounted app-v6. app-v7 calls gsap.registerPlugin(...) and reads
// #tweak-defaults at module top level — both require the browser (and the
// beforeInteractive vendor globals). ssr:false keeps every component's
// DOM/window/global-lib access off the server. This is the default home page.
const App = dynamic(() => import("../components/app-v7"), { ssr: false });

export default function Page() {
  return <App />;
}
