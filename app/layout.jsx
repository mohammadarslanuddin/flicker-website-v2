import Script from "next/script";
import { Preloader } from "../components/preloader";

export const metadata = {
  title: "Flicker App: Smart Book Summaries, Read or Listen in Minutes",
  description:
    "Get the core ideas from the world's best books in minutes. Flicker App delivers AI-curated book summaries for busy professionals and lifelong learners.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// Rendered verbatim as the page's #tweak-defaults JSON island. The EDITMODE
// delimiters are load-bearing: the design-tool host rewrites the block between
// them on disk (see app-v6's setTweak / __edit_mode_set_keys protocol), and
// app-v6's DEFAULTS reads this node at runtime. Keep the delimiters intact.
const TWEAK_DEFAULTS_JSON = `
/*EDITMODE-BEGIN*/{
  "tone": "paper",
  "speed": 0.5,
  "density": 8,
  "spread": 1.8,
  "cardSize": 0.4,
  "showCounter": true,
  "showPlateLabels": true,
  "perspective": "flat",
  "heroBg": "halo-bottom"
}/*EDITMODE-END*/
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Design tokens + Phosphor icon fonts + the page's component CSS, all
            served statically from /public so their relative @import / url()
            references resolve exactly as they did in the original index.html. */}
        <link rel="stylesheet" href="/flicker/colors_and_type.css" />
        <link rel="stylesheet" type="text/css" href="/vendor/phosphor/regular/style.css" />
        <link rel="stylesheet" type="text/css" href="/vendor/phosphor/fill/style.css" />
        <link rel="stylesheet" href="/page.css" />
      </head>
      <body className="flicker-root" suppressHydrationWarning>
        {/* Branded loading overlay. Mounted here (a sibling of #smooth-wrapper)
            so position:fixed resolves against the viewport, not ScrollSmoother's
            transformed #smooth-content. It self-gates to the home route. */}
        <Preloader />

        {/* ScrollSmoother needs the wrapper + content pair. #root keeps the
            original DOM shape (and the #root { min-height:100vh } rule). */}
        <div id="smooth-wrapper">
          <div id="smooth-content">
            <div id="root">{children}</div>
          </div>
        </div>

        <script
          type="application/json"
          id="tweak-defaults"
          dangerouslySetInnerHTML={{ __html: TWEAK_DEFAULTS_JSON }}
        />

        {/* Vendored libraries kept as globals (ScrollSmoother is a GSAP Club
            plugin not on npm and expects a global gsap). beforeInteractive +
            source order guarantees gsap → plugins → ScrollSmoother are attached
            to window before the client-only app module evaluates. Babel and the
            vendored React/ReactDOM are intentionally dropped — Next bundles
            React and SWC compiles the JSX at build time. */}
        <Script src="/vendor/gsap.min.js" strategy="beforeInteractive" />
        <Script src="/vendor/ScrollTrigger.min.js" strategy="beforeInteractive" />
        <Script src="/vendor/Flip.min.js" strategy="beforeInteractive" />
        <Script src="/vendor/lottie.min.js" strategy="beforeInteractive" />
        <Script src="/vendor/ScrollSmoother.min.js" strategy="beforeInteractive" />
        {/* Registers the <image-slot> custom element (idempotently guarded). */}
        <Script src="/image-slot.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
