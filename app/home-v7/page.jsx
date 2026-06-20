"use client";

import dynamic from "next/dynamic";

// Mount the v7 home composition client-only, exactly like app/page.jsx mounts
// app-v6. app-v7 calls gsap.registerPlugin(...) and reads #tweak-defaults at
// module top level — both require the browser (and the beforeInteractive vendor
// globals). ssr:false keeps every component's DOM/window/global-lib access off
// the server. This route is a SEPARATE preview of the "Home A" design; the
// shipping page at / (app-v6) is untouched.
const App = dynamic(() => import("../../components/app-v7"), { ssr: false });

export default function Page() {
  return <App />;
}
