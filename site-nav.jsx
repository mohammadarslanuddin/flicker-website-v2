/* global React, ReactDOM, gsap, ScrollSmoother, ScrollTrigger */
/* =====================================================================
   Flicker — top bar (logo + icon-only hamburger) + compact DROP-DOWN menu
   + custom cursor.

   The menu is NOT a full-screen takeover: clicking the hamburger drops a
   small contained panel down from the top-right (anchored under the icon),
   morphing open — growing left then down — with the items staggering in. A transparent
   backdrop catches outside clicks to close. Jump-to-section uses ScrollSmoother.

   Rendered through a portal into <body> so the bar / panel / cursor live
   OUTSIDE #smooth-content and stay truly fixed. Because the portal target is
   outside React's root, every handler is wired with NATIVE addEventListener.
   ===================================================================== */
const { useRef, useEffect, useState } = React;

// One single word per section we've built — each jumps to that section.
const MENU_ITEMS = [
{ label: "Home", target: '[data-screen-label="01 Hero"]' },
{ label: "How it works", target: '[data-screen-label="02 How it works"]' },
{ label: "Summaries", target: '[data-screen-label="03 Summaries"]' },
{ label: "Why Flicker App", target: '[data-screen-label="05 Growing"]' },
{ label: "Blogs", target: '[data-screen-label="06 Listen"]' }];

// Inline Flicker mark (accepts currentColor) for the dock pill.
const FLICKER_MARK =
'<svg viewBox="0 0 77 78" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
'<path fill-rule="evenodd" clip-rule="evenodd" d="M23.9795 77.1383C23.6821 77.6506 23.1698 77.9463 22.5722 77.9463C21.9745 77.9463 21.4652 77.6535 21.1649 77.1383L11.6317 60.7182C11.3343 60.2059 11.3343 59.6175 11.6317 59.1052C17.2373 49.4534 22.8401 39.8016 28.4458 30.1469C28.7431 29.6346 29.2554 29.3389 29.8531 29.3389H69.3903C69.985 29.3389 70.4973 29.6316 70.7976 30.1469C71.0949 30.6592 71.0949 31.2476 70.7976 31.7599L61.2644 48.18C60.967 48.6952 60.4547 48.9879 59.8571 48.9879H41.2617C40.667 48.9879 40.1547 49.2807 39.8544 49.7959C34.5638 58.912 29.2701 68.0251 23.9795 77.1383ZM12.5708 38.1095C12.2735 38.6218 11.7612 38.9175 11.1635 38.9175C10.5688 38.9175 10.0565 38.6248 9.75622 38.1095L0.22302 21.6895C-0.0743402 21.1772 -0.0743402 20.5888 0.22302 20.0764L11.4108 0.807976C11.7082 0.292745 12.2205 0 12.8152 0H75.1697C75.7644 0 76.2767 0.292745 76.577 0.807976C76.8743 1.32028 76.8743 1.9087 76.577 2.421L67.0438 18.8411C66.7464 19.3534 66.2341 19.649 65.6365 19.649H24.2238C23.6291 19.649 23.1168 19.9418 22.8165 20.457C19.4013 26.3412 15.9831 32.2254 12.5679 38.1095H12.5708Z" fill="currentColor"></path>' +
'</svg>';


const NAV_STYLE = `
  /* ---- Fixed top bar ---- */
  .flk-bar{
    position:fixed; top:0; left:0; right:0; z-index:1300;
    display:flex; align-items:center; justify-content:space-between;
    padding:24px 24px 22px; pointer-events:none;
    will-change:transform, opacity;
  }
  /* Show/hide on scroll is GSAP-driven (transform + opacity) — see the SiteNav
     scroll effect. A CSS transition is intentionally NOT used here: a running
     transition overrides even inline !important, so a class+transition approach
     never settles into the hidden state. */
  .flk-bar > *{ pointer-events:auto; }
  .flk-logo{ display:inline-flex; align-items:center; }
  .flk-logo img{ height:28px; width:90px; display:block; }
  .flk-bar-right{ display:flex; align-items:center; gap:14px; }
  /* Sign in — lives in the top bar next to the toggle. When the menu opens the
     dark container morphs in behind it and it INVERTS: same shape, flipped colors. */
  .flk-signin{ padding:10px 22px !important; font-size:15px; font-weight:600;
    font-family:var(--font-sans);
    transition:background-color .3s var(--ease-out,ease),
               color .3s var(--ease-out,ease),
               border-color .3s var(--ease-out,ease),
               box-shadow .3s var(--ease-out,ease); }
  .flk-bar-right.is-open .flk-signin{
    background:transparent !important;
    color:var(--flicker-canvas,#FFF9EC) !important;
    border-color:transparent !important;
    box-shadow:inset 0 0 0 1px rgba(255,249,236,0.34) !important;
    transition-delay:.16s;                /* flips after the panel sweeps under it */
  }

  /* Icon-only hamburger */
  .flk-menu-btn{
    display:inline-flex; align-items:center; justify-content:center;
    width:44px; height:44px; padding:0; margin:-8px -8px -8px 0;
    background:transparent; border:none; cursor:pointer; color:var(--ink,#22191B);
    transition:color .3s var(--ease-out,ease);
  }
  .flk-bar-right.is-open .flk-menu-btn{ color:var(--flicker-canvas,#FFF9EC); transition-delay:.06s; }
  .flk-menu-glyph{ position:relative; width:26px; height:14px; }
  .flk-menu-glyph i{
    position:absolute; left:0; right:0; height:2px; border-radius:2px;
    background:currentColor;
    transition:transform .4s cubic-bezier(.16,1,.3,1), top .4s cubic-bezier(.16,1,.3,1);
  }
  .flk-menu-glyph i:nth-child(1){ top:3px; }
  .flk-menu-glyph i:nth-child(2){ top:9px; }
  .flk-menu-glyph[data-open="true"] i:nth-child(1){ top:6px; transform:rotate(45deg); }
  .flk-menu-glyph[data-open="true"] i:nth-child(2){ top:6px; transform:rotate(-45deg); }
  /* Hover the toggle (while closed) — bars spread apart as a small affordance.
     No container background appears on hover; only the icon animates. */
  .flk-menu-btn:hover .flk-menu-glyph:not([data-open="true"]) i:nth-child(1){ top:1px; }
  .flk-menu-btn:hover .flk-menu-glyph:not([data-open="true"]) i:nth-child(2){ top:11px; }

  /* ---- Transparent backdrop (outside-click to close; NOT a visible sheet) -- */
  .flk-backdrop{ position:fixed; inset:0; z-index:1240; background:transparent; }

  /* ---- Compact drop-down panel (anchored top-right) ---- */
  .flk-menu-panel{
    position:fixed; top:16px; right:18px; z-index:1250;
    width:176px; height:56px; overflow:hidden;   /* collapsed / hover-pill size; GSAP grows it open */
    background:var(--flicker-body,#22191B);
    border-radius:16px; padding:66px 16px 16px;
    opacity:0; will-change:opacity;
    transition:opacity .15s var(--ease-out,ease);
  }
  /* Hover-intent pre-hint removed — the container stays invisible on hover. */
  .flk-menu-list{ display:flex; flex-direction:column; }

  /* Main menu items — text only, no button container. Resting opacity is dim
     (0.55); GSAP drives the entrance reveal then hands opacity back to CSS, and
     :hover brightens only the hovered item. */
  .flk-menu-link{
    position:relative;
    display:flex; align-items:center;
    padding:4px 0; text-decoration:none;
    color:#FFFFFF;
    font-family:var(--font-sans); font-weight:400; font-size:22px;
    line-height:1.2; letter-spacing:-0.01em;
    opacity:1; will-change:transform,opacity;
    transition:opacity .2s cubic-bezier(.22,1,.36,1);
  }

  /* Subtle divider + secondary "Resources" links — these ride the container
     morph; they have NO separate entrance animation. */
  /* Full-width divider: negative H-margins cancel the panel's 16px L / 8px R
     padding so the line spans the container edge-to-edge. Equal 12px gap each side. */
  .flk-menu-divider{ height:1px; background:rgba(255,249,236,0.12); margin:16px 0 0; }
  .flk-menu-caption{
    margin:16px 0 6px; padding:0; font-family:var(--font-sans);
    font-size:11px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase;
    color:rgba(255,249,236,0.42);
  }
  .flk-menu-caption:first-child{ margin-top:2px; }
  .flk-menu-sublink{
    position:relative;
    display:block; padding:3px 0; text-decoration:none;
    font-family:var(--font-sans); font-weight:400; font-size:14px;
    color:#FFFFFF; opacity:1;
    transition:opacity .2s cubic-bezier(.22,1,.36,1);
  }

  /* All links rest at full white. Hover only triggers the effect: the hovered link
     stays white while every OTHER link dims back. :not(:hover) keeps the hovered
     one untargeted (no specificity war). A 4px dot fades in on the hovered link. */
  .flk-menu-panel:has(.flk-menu-link:hover, .flk-menu-sublink:hover) .flk-menu-link:not(:hover),
  .flk-menu-panel:has(.flk-menu-link:hover, .flk-menu-sublink:hover) .flk-menu-sublink:not(:hover){
    opacity:0.4;
  }
  .flk-menu-link::after, .flk-menu-sublink::after{
    content:""; position:absolute; right:0; top:50%;
    width:4px; height:4px; border-radius:50%; background:currentColor;
    transform:translateY(-50%) scale(.35); opacity:0;
    transition:opacity .2s ease, transform .2s ease;
  }
  .flk-menu-link:hover::after, .flk-menu-sublink:hover::after{
    opacity:1; transform:translateY(-50%) scale(1);
  }

  /* =====================================================================
     Floating dock — ONE centered pill that holds everything: hamburger + logo
     on the left, a live scroll-progress badge dead-centre, and a brick "Get
     started" CTA at the end. Clicking the toggle GROWS the pill downward into
     a menu (height + radius morph) while staying centred within its margins.
     Re-themed to Flicker's warm light surfaces.
     ===================================================================== */
  .flk-dock{
    position:fixed; top:16px; left:50%; transform:translateX(-50%);
    z-index:1300; width:min(420px, calc(100vw - 40px));
    height:64px; box-sizing:border-box;
    background:#F4EFE9;
    border:none;
    border-radius:32px;
    overflow:hidden; opacity:0; pointer-events:none;
    will-change:height, opacity, transform;
    /* Only the surface tints transition — height/opacity/transform stay GSAP-driven. */
    transition:background-color .35s var(--ease-out,ease), border-color .35s var(--ease-out,ease), border-radius .45s var(--ease-out,ease);
  }
  .flk-dock.is-shown{ pointer-events:auto; }

  /* ---- Open state: the whole pill adopts the dark cosmos surface used by the
     top-nav dropdown (.flk-menu-panel) so both menus read as one system. The
     header + body invert to light on the dark ground. ---- */
  .flk-dock[data-open="true"]{
    background:rgb(86, 29, 32);
    /* Corner radius adopts the top-nav dropdown's 16px once toggled open. */
    border-radius:16px;
  }
  .flk-dock[data-open="true"] .flk-pill-toggle{ color:var(--flicker-canvas,#FFF9EC); }
  .flk-dock[data-open="true"] .flk-dock-logo{ color:var(--flicker-canvas,#FFF9EC); }
  /* Get started inverts to the outline treatment, mirroring the top-bar Sign in. */
  .flk-dock[data-open="true"] .flk-dock-cta{
    background:transparent !important;
    color:var(--flicker-canvas,#FFF9EC) !important;
    border-color:transparent !important;
    box-shadow:inset 0 0 0 1px rgba(255,249,236,0.34) !important;
  }

  /* Header row — always visible; becomes the menu's header when open */
  .flk-pillrow{
    position:relative; display:flex; align-items:center; justify-content:space-between;
    height:62px; padding:0 8px 0 14px; flex:0 0 auto;
  }
  .flk-pill-left{ display:flex; align-items:center; gap:8px; }
  .flk-pill-right{ display:flex; align-items:center; gap:8px; }
  .flk-pill-toggle{
    display:inline-flex; align-items:center; justify-content:center;
    width:28px; height:28px; padding:0; margin-left:0;
    background:transparent; border:none; cursor:pointer; color:var(--flicker-body,#22191B);
  }
  .flk-pill-glyph{ position:relative; width:20px; height:14px; }
  .flk-pill-glyph i{ position:absolute; left:0; right:0; height:2px; border-radius:2px;
    background:currentColor;
    transition:transform .4s cubic-bezier(.16,1,.3,1), top .4s cubic-bezier(.16,1,.3,1); }
  .flk-pill-glyph i:nth-child(1){ top:3px; }
  .flk-pill-glyph i:nth-child(2){ top:9px; }
  .flk-pill-glyph[data-open="true"] i:nth-child(1){ top:6px; transform:rotate(45deg); }
  .flk-pill-glyph[data-open="true"] i:nth-child(2){ top:6px; transform:rotate(-45deg); }
  .flk-pill-toggle:hover .flk-pill-glyph:not([data-open="true"]) i:nth-child(1){ top:1px; }
  .flk-pill-toggle:hover .flk-pill-glyph:not([data-open="true"]) i:nth-child(2){ top:11px; }
  .flk-dock-logo{ display:inline-flex; align-items:center; }
  .flk-dock-logo img{ height:22px; width:auto; display:block; }
  .flk-dock-logo .flk-dock-logo-white{ display:none; }
  .flk-dock[data-open="true"] .flk-dock-logo .flk-dock-logo-brick{ display:none; }
  .flk-dock[data-open="true"] .flk-dock-logo .flk-dock-logo-white{ display:block; }
  /* Scroll-progress bar — hugs the bottom edge of the pill (replaces the centred
     badge). Hairline track + brick fill; the dock's overflow:hidden + radius clip
     the ends so it follows the rounded bottom. Hidden while the menu is open. */
  .flk-pill-prog{
    position:absolute; left:0; right:0; bottom:0;
    height:3px; z-index:2; pointer-events:none;
    background:var(--flicker-canvas-shade,#ECDFC4);
    transition:opacity .25s var(--ease-out,ease);
  }
  .flk-pill-prog::before{
    content:""; position:absolute; left:0; top:0; bottom:0;
    width:var(--p,0%); background:var(--flicker-cosmos,#561D20);
    transition:width .15s linear;
  }
  .flk-dock[data-open="true"] .flk-pill-prog{ opacity:0; }
  /* Get started — matches the top-bar "Sign in" secondary button */
  .flk-dock-cta{ padding:11px 22px !important; font-size:15px; font-weight:600;
    font-family:var(--font-sans); white-space:nowrap; }

  /* Menu body — single column, revealed below the header when open (light) */
  .flk-pill-body{ display:block; padding:6px 8px 16px 16px; }
  .flk-body-cap{ margin:16px 0 6px; font-family:var(--font-sans); font-size:11px;
    font-weight:600; letter-spacing:0.14em; text-transform:uppercase;
    color:var(--flicker-ink-mute,#7A6B6F); }
  .flk-body-cap:first-child{ margin-top:2px; }
  .flk-body-div{ height:1px; background:var(--flicker-canvas-shade,#ECDFC4); margin:16px 0 0; }
  .flk-mlink{ position:relative; display:block; padding:4px 0; text-decoration:none;
    font-family:var(--font-sans); font-weight:400; font-size:22px; letter-spacing:-0.01em;
    color:var(--flicker-body,#22191B);
    transition:opacity .2s cubic-bezier(.22,1,.36,1); }
  .flk-slink{ position:relative; display:block; padding:3px 0; text-decoration:none;
    font-family:var(--font-sans); font-weight:400; font-size:14px;
    color:var(--flicker-ink-soft,#3D3034);
    transition:opacity .2s cubic-bezier(.22,1,.36,1); }
  /* Hover/selection behavior mirrors the top-nav dropdown: hovering any item
     dims the others to 0.4 while the hovered item keeps full weight, and a 4px
     dot fades in at its right edge — no color shift, exactly like the top nav. */
  .flk-pill-body:has(.flk-mlink:hover, .flk-slink:hover) .flk-mlink:not(:hover),
  .flk-pill-body:has(.flk-mlink:hover, .flk-slink:hover) .flk-slink:not(:hover){
    opacity:0.4;
  }
  .flk-mlink::after, .flk-slink::after{
    content:""; position:absolute; right:0; top:50%;
    width:4px; height:4px; border-radius:50%; background:currentColor;
    transform:translateY(-50%) scale(.35); opacity:0;
    transition:opacity .2s ease, transform .2s ease;
  }
  .flk-mlink:hover::after, .flk-slink:hover::after{
    opacity:1; transform:translateY(-50%) scale(1);
  }

  /* Body links + captions invert to light once the dark open surface is on. */
  .flk-dock[data-open="true"] .flk-body-cap{ color:rgba(255,249,236,0.42); }
  .flk-dock[data-open="true"] .flk-body-div{ background:rgba(255,249,236,0.12); }
  .flk-dock[data-open="true"] .flk-mlink{ color:#FFFFFF; }
  .flk-dock[data-open="true"] .flk-slink{ color:rgba(255,249,236,0.85); }

  /* ---- Custom cursor (single dot, invert / difference blend) ----
     Base fill is white so under mix-blend-mode:difference the dot renders as the
     dark heading ink over light areas, and inverts (goes light) over dark ones. */
  .flk-cursor-dot{
    position:fixed; top:0; left:0; border-radius:50%; pointer-events:none;
    z-index:2147483600; will-change:transform;
    width:7px; height:7px; background:#FFFFFF; mix-blend-mode:difference;
  }
  @media (hover:none),(pointer:coarse){ .flk-cursor-dot{ display:none; } }
  html.flk-cursor-on, html.flk-cursor-on *{ cursor:none !important; }
  html.flk-cursor-on [data-omelette-chrome],
  html.flk-cursor-on [data-omelette-chrome] *{ cursor:auto !important; }
`;

function SiteNav() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [docked, setDocked] = useState(false);
  const [pillOpen, setPillOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [host] = useState(() =>
  typeof document !== "undefined" ? document.createElement("div") : null);

  const panelRef = useRef(null);
  const backdropRef = useRef(null);
  const linksRef = useRef([]);
  const openTlRef = useRef(null);
  const closeTlRef = useRef(null);
  const openWRef = useRef(320);
  const openHRef = useRef(120);
  const didMountRef = useRef(false);
  const dotRef = useRef(null);
  const btnRef = useRef(null);
  const logoRef = useRef(null);
  const openRef = useRef(false);        // latest open state for the stable scroll cb
  const openYRef = useRef(0);           // scroll position when the menu was opened
  const barRef = useRef(null);          // the top bar (GSAP-animated show/hide)
  const lastYRef = useRef(0);           // last significant scroll position (hysteresis)
  const dockRef = useRef(null);         // the floating dock / morphing pill
  const pillBtnRef = useRef(null);      // the toggle inside the pill
  const dockLogoRef = useRef(null);     // logo inside the pill
  const pillBodyRef = useRef(null);     // menu body that grows under the pill
  const pillLinksRef = useRef([]);      // body links (for native click wiring)
  const pillOpenTlRef = useRef(null);
  const pillCloseTlRef = useRef(null);
  const pillOpenHRef = useRef(320);
  const pillMountedRef = useRef(false);
  const dockedRef = useRef(false);      // latest docked state for the stable scroll cb
  const heroElRef = useRef(null);       // cached hero section element
  const progRef = useRef(0);            // last rounded progress (avoid per-frame re-render)
  const pillOpenRef = useRef(false);    // latest pill-open state for the scroll cb
  const pillBaseYRef = useRef(0);       // scroll position when the pill menu opened
  const upAccRef = useRef(0);           // accumulated upward scroll distance
  const downAccRef = useRef(0);         // accumulated downward scroll distance
  const barHiddenRef = useRef(false);   // latest bar-hidden state for the scroll cb

  useEffect(() => {
    if (!host) return;
    document.body.appendChild(host);
    return () => {if (host.parentNode) host.parentNode.removeChild(host);};
  }, [host]);

  /* ---------- Navigate to a section ---------- */
  const go = (target) => {
    setOpen(false);
    const el = document.querySelector(target);
    if (!el) return;
    const smoother = typeof ScrollSmoother !== "undefined" && ScrollSmoother.get ?
    ScrollSmoother.get() : null;
    setTimeout(() => {
      // Smooth + sluggish glide: a long, gentle tween so it never races between
      // far-apart sections. power2.inOut keeps the middle from speeding up.
      const DUR = 2.2,EASE = "power2.inOut";
      if (smoother && typeof gsap !== "undefined") {
        gsap.to(smoother, { scrollTop: smoother.offset(el, "top top"),
          duration: DUR, ease: EASE, overwrite: true });
      } else {
        // Manual eased rAF tween (no ScrollToPlugin loaded).
        const startY = window.pageYOffset;
        const endY = el.getBoundingClientRect().top + startY;
        const t0 = performance.now(),ms = DUR * 1000;
        const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const step = (now) => {
          const p = Math.min(1, (now - t0) / ms);
          window.scrollTo(0, startY + (endY - startY) * ease(p));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, 60);
  };

  /* ---------- Build the OPEN + CLOSE timelines once ----------
     The container is ONE element that grows (width/height, pinned top-right so it
     expands left + down) while its contents reveal. Two separate timelines —
     open (≈0.85s, the reveal overlaps the expansion for a single-gesture feel) and
     close (≈0.4s, items blur out together with no stagger, then it collapses). */
  useEffect(() => {
    if (typeof gsap === "undefined") return;
    const panel = panelRef.current;
    if (!panel) return;

    const idleW = 176,idleH = 56; // collapsed / hover-pill size
    const items = panel.querySelectorAll(
      ".flk-menu-link, .flk-menu-divider, .flk-menu-caption, .flk-menu-sublink");

    gsap.set(items, { opacity: 0 }); // contents hidden until first open

    const armWillChange = () => {
      panel.style.transition = "none";
      panel.style.overflow = "hidden";
      panel.style.willChange = "width, height, opacity";
    };

    // OPEN — TWO-STAGE expansion (inverted). Stage 1: the pill stretches on the
    // X-AXIS only (width grows, height stays the idle pill height). Stage 2, right
    // after stage 1 completes: it expands along the Y-AXIS into the full container.
    // The item reveal overlaps the vertical stretch. onComplete hands items to CSS.
    const openTl = gsap.timeline({ paused: true,
      onStart: armWillChange,
      onComplete: () => {
        panel.style.willChange = "auto";panel.style.overflow = "visible";
        gsap.set(items, { clearProps: "opacity,filter,transform" });
      } });
    openTl.
    to(panel, { opacity: 1, duration: 0.15, overwrite: "auto" }, 0).
    to(panel, { width: () => openWRef.current, height: idleH,
      duration: 0.4, ease: "expo.out" }, 0) // stage 1: x-axis
    .to(panel, { height: () => openHRef.current,
      duration: 0.45, ease: "expo.out" }, 0.4) // stage 2: y-axis
    .fromTo(items,
    { opacity: 0, filter: "blur(12px)", y: 8 },
    { opacity: 1, filter: "blur(0px)", y: 0,
      duration: 0.5, stagger: 0.035, ease: "power2.out" }, 0.45); // reveal rides the y-stretch

    // CLOSE — items blur out together (no stagger), then the container collapses.
    const closeTl = gsap.timeline({ paused: true,
      onStart: armWillChange,
      onComplete: () => {
        panel.style.willChange = "auto";
        openTl.pause(0); // rewind the open timeline so it stops holding opacity:1
        gsap.set(panel, { clearProps: "width,height,opacity,overflow,transition" });
      } });
    // CLOSE — items blur out together (no stagger), THEN the container visibly
    // collapses back to the idle pill size, and only fades to transparent at the
    // very end (so the shrink is seen, not masked by an early fade).
    closeTl.
    to(items, { opacity: 0, filter: "blur(8px)", duration: 0.2, ease: "power2.in" }, 0).
    to(panel, { width: idleW, height: idleH, duration: 0.35, ease: "expo.inOut" }, 0.1).
    to(panel, { opacity: 0, duration: 0.15, ease: "power2.in" }, 0.30);

    openTlRef.current = openTl;
    closeTlRef.current = closeTl;
    return () => {openTl.kill();closeTl.kill();};
  }, []);

  /* ---------- Drive open / close (replay the prebuilt timelines) ---------- */
  useEffect(() => {
    const openTl = openTlRef.current,closeTl = closeTlRef.current;
    if (!openTl || !closeTl) return;
    if (open) {
      const panel = panelRef.current;
      openWRef.current = Math.min(330, window.innerWidth - 36);
      // Measure the natural expanded height at the target width (synchronous,
      // before paint) so the open tween animates to a real number, not "auto".
      const prev = { w: panel.style.width, h: panel.style.height, ov: panel.style.overflow };
      panel.style.overflow = "visible";
      panel.style.width = openWRef.current + "px";
      panel.style.height = "auto";
      openHRef.current = Math.ceil(panel.getBoundingClientRect().height);
      panel.style.width = prev.w;panel.style.height = prev.h;panel.style.overflow = prev.ov;
      closeTl.pause(); // stop the opposing timeline first
      openTl.invalidate().restart();
    } else if (didMountRef.current) {
      openTl.pause();
      closeTl.invalidate().restart();
    }
    didMountRef.current = true;
  }, [open]);

  /* ---------- Native click wiring (portal is outside React's root) ------- */
  useEffect(() => {
    const btn = btnRef.current;
    const pill = pillBtnRef.current;
    const dockLogo = dockLogoRef.current;
    const logo = logoRef.current;
    const backdrop = backdropRef.current;
    const links = linksRef.current.filter(Boolean);
    const pillLinks = pillLinksRef.current.filter(Boolean);

    const onBtn = (e) => {e.preventDefault();setOpen((v) => !v);};
    const onPill = (e) => {e.preventDefault();setPillOpen((v) => !v);};
    const onLogo = (e) => {e.preventDefault();go(MENU_ITEMS[0].target);};
    const onBackdrop = () => {setOpen(false);setPillOpen(false);};
    if (btn) btn.addEventListener("click", onBtn);
    if (pill) pill.addEventListener("click", onPill);
    if (logo) logo.addEventListener("click", onLogo);
    if (dockLogo) dockLogo.addEventListener("click", onLogo);
    if (backdrop) backdrop.addEventListener("click", onBackdrop);
    const handlers = links.map((el, i) => {
      const h = (e) => {e.preventDefault();go(MENU_ITEMS[i].target);};
      el.addEventListener("click", h);
      return h;
    });
    const pillHandlers = pillLinks.map((el, i) => {
      const h = (e) => {e.preventDefault();setPillOpen(false);go(MENU_ITEMS[i].target);};
      el.addEventListener("click", h);
      return h;
    });
    return () => {
      if (btn) btn.removeEventListener("click", onBtn);
      if (pill) pill.removeEventListener("click", onPill);
      if (logo) logo.removeEventListener("click", onLogo);
      if (dockLogo) dockLogo.removeEventListener("click", onLogo);
      if (backdrop) backdrop.removeEventListener("click", onBackdrop);
      links.forEach((el, i) => el.removeEventListener("click", handlers[i]));
      pillLinks.forEach((el, i) => el.removeEventListener("click", pillHandlers[i]));
    };
  }, []);

  /* ---------- Escape closes ---------- */
  useEffect(() => {
    const onKey = (e) => {if (e.key === "Escape") {setOpen(false);setPillOpen(false);}};
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------- Scroll behaviour ----------
     (1) Hide the bar on scroll-down, reveal on scroll-up (always shown near top).
     (2) If the menu is open, auto-close it once the user has scrolled a bit
         (>140px) from where it was opened.

     Detection (below) only flips the `hidden` STATE — with an 8px hysteresis so
     ScrollSmoother's tiny settle deltas don't toggle it. The GSAP animation lives
     in a separate effect keyed on `hidden`, so it runs a handful of times (on real
     transitions) rather than every scroll frame — no per-frame overwrite war. */
  useEffect(() => {
    openRef.current = open;
    if (open) {
      const sm = typeof ScrollSmoother !== "undefined" && ScrollSmoother.get ?
      ScrollSmoother.get() : null;
      openYRef.current = sm ? sm.scrollTop() : window.pageYOffset;
      setHidden(false);                 // keep the bar visible while the menu is open
    }
  }, [open]);

  useEffect(() => {
    const onUpd = (y, dir) => {
      // --- Scroll progress (0–100) through the whole page ---
      const max = typeof ScrollTrigger !== "undefined" && ScrollTrigger.maxScroll ?
      ScrollTrigger.maxScroll(window) :
      document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(100, Math.max(0, y / max * 100)) : 0;
      const pr = Math.round(p);
      if (pr !== progRef.current) {progRef.current = pr;setProgress(pr);}

      // --- Dock reveal: anywhere past the hero, whenever the user scrolls UP ---
      const hero = heroElRef.current ||
      (heroElRef.current = document.querySelector('[data-screen-label="01 Hero"]'));
      const pastHero = hero ?
      hero.getBoundingClientRect().bottom <= 80 :
      y > window.innerHeight * 0.85;

      // The top bar lives only in the hero zone; it hides once we're past it.
      if (pastHero !== barHiddenRef.current) {barHiddenRef.current = pastHero;setHidden(pastHero);}

      // Direction: trust the actual (smoothed) scroll-position delta first.
      // self.direction lags and STICKS to +1 (down) while ScrollSmoother eases
      // through the long pinned sections, so relying on it meant the dock never
      // revealed once you were inside the "How it works" pin (~30%+). dy is the
      // real position movement this frame — reveal on any upward frame, and only
      // fall back to ScrollTrigger's direction when the frame is perfectly flat.
      const dy = y - lastYRef.current;
      lastYRef.current = y;
      const goingUp = dy < 0 || (dy === 0 && dir != null && dir < 0);

      let next = dockedRef.current;
      if (!pastHero) {next = false;downAccRef.current = 0;}
      else if (goingUp) {next = true;downAccRef.current = 0;}        // any scroll-up → reveal
      else if (dy > 0) {
        downAccRef.current += dy;
        if (downAccRef.current > 50) next = false;                   // sustained down → hide
      }
      if (next !== dockedRef.current) {dockedRef.current = next;setDocked(next);}

      // --- Auto-close the menu after scrolling a bit while it's open ---
      if (openRef.current) {
        if (Math.abs(y - openYRef.current) > 140) setOpen(false);
      }
      if (pillOpenRef.current && Math.abs(y - pillBaseYRef.current) > 120) setPillOpen(false);
    };

    if (typeof ScrollTrigger !== "undefined" && ScrollTrigger.create) {
      const sm0 = typeof ScrollSmoother !== "undefined" && ScrollSmoother.get ?
      ScrollSmoother.get() : null;
      lastYRef.current = sm0 ? sm0.scrollTop() : window.pageYOffset;
      // Give the trigger an explicit FULL-DOCUMENT range. With no trigger/start/end
      // ScrollTrigger defaults to a finite span (~0 → one viewport of progress),
      // so onUpdate clamps and stops firing past ~30% — freezing the progress
      // badge AND the dock-reveal logic. We deliberately pass NO trigger element:
      // only then are start/end read as ABSOLUTE scroll positions, so end:"max"
      // resolves to the full maxScroll. (With a trigger element, a numeric end is
      // measured RELATIVE to that element and clamps early.)
      const st = ScrollTrigger.create({
        start: 0,
        end: "max",
        invalidateOnRefresh: true,
        onUpdate: (self) => onUpd(self.scroll(), self.direction)
      });
      return () => st.kill();
    }
    lastYRef.current = window.pageYOffset;
    const onScroll = () => {
      const y = window.pageYOffset;
      onUpd(y, y < lastYRef.current ? -1 : 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Animate the bar in/out whenever `hidden` actually changes (GSAP-driven; no CSS
     transition, which would otherwise override even inline !important and stall). */
  useEffect(() => {
    const bar = barRef.current;
    if (!bar || typeof gsap === "undefined") return;
    if (hidden) {
      gsap.to(bar, { yPercent: -18, opacity: 0, duration: 0.35, ease: "power2.out",
        overwrite: true, onComplete: () => {bar.style.pointerEvents = "none";} });
    } else {
      bar.style.pointerEvents = "";
      gsap.to(bar, { yPercent: 0, opacity: 1, duration: 0.4, ease: "power2.out",
        overwrite: true });
    }
  }, [hidden]);

  /* ---------- Dock reveal (gsap-driven so it survives ScrollSmoother's
     per-frame re-renders — a CSS opacity transition gets restarted every frame
     and never settles). Runs only on a real `docked` transition. ------------- */
  useEffect(() => {
    const dock = dockRef.current;
    if (!dock || typeof gsap === "undefined") return;
    if (docked) {
      gsap.to(dock, { xPercent: -50, y: 0, opacity: 1, duration: 0.5,
        ease: "power3.out", overwrite: "auto" });
    } else {
      if (pillOpenRef.current) setPillOpen(false);   // collapse the menu when leaving the zone
      gsap.to(dock, { xPercent: -50, y: -12, opacity: 0, duration: 0.3,
        ease: "power2.out", overwrite: "auto" });
    }
  }, [docked]);

  /* ---------- Build the pill OPEN / CLOSE morph once ----------
     The whole pill grows DOWNWARD: height expands from the header row to the full
     menu height and the corner radius eases from a full pill to a soft card, while
     the body's columns blur-stagger in. Centring is held by CSS translateX(-50%). */
  useEffect(() => {
    if (typeof gsap === "undefined") return;
    const dock = dockRef.current, body = pillBodyRef.current;
    if (!dock || !body) return;
    const items = body.querySelectorAll(".flk-body-cap, .flk-mlink, .flk-slink");
    const rowH = 64;

    gsap.set(items, { opacity: 0 });

    const arm = () => {dock.style.willChange = "height";};

    const openTl = gsap.timeline({ paused: true, onStart: arm,
      onComplete: () => {
        dock.style.willChange = "auto";
        gsap.set(dock, { height: "auto" });
        gsap.set(items, { clearProps: "opacity,filter,transform" });
      } });
    openTl
    .to(dock, { height: () => pillOpenHRef.current,
      duration: 0.55, ease: "expo.out" }, 0)
    .fromTo(items, { opacity: 0, filter: "blur(10px)", y: 8 },
      { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.5, stagger: 0.03,
        ease: "power2.out" }, 0.16);

    const closeTl = gsap.timeline({ paused: true, onStart: arm,
      onComplete: () => {
        dock.style.willChange = "auto";
        openTl.pause(0);
        gsap.set(dock, { clearProps: "height" });
      } });
    closeTl
    .to(items, { opacity: 0, filter: "blur(8px)", duration: 0.18, ease: "power2.in" }, 0)
    .to(dock, { height: rowH, duration: 0.45, ease: "expo.inOut" }, 0.06);

    pillOpenTlRef.current = openTl;
    pillCloseTlRef.current = closeTl;
    return () => {openTl.kill();closeTl.kill();};
  }, []);

  /* ---------- Drive pill open / close ---------- */
  useEffect(() => {
    const openTl = pillOpenTlRef.current, closeTl = pillCloseTlRef.current;
    const dock = dockRef.current;
    if (!openTl || !closeTl || !dock) return;
    if (pillOpen) {
      pillOpenRef.current = true;
      const sm = typeof ScrollSmoother !== "undefined" && ScrollSmoother.get ?
      ScrollSmoother.get() : null;
      pillBaseYRef.current = sm ? sm.scrollTop() : window.pageYOffset;
      // Measure the natural expanded height (header + body) before animating.
      const prevH = dock.style.height;
      dock.style.height = "auto";
      pillOpenHRef.current = Math.ceil(dock.getBoundingClientRect().height);
      dock.style.height = prevH || "64px";
      closeTl.pause();
      openTl.invalidate().restart();
    } else if (pillMountedRef.current) {
      pillOpenRef.current = false;
      openTl.pause();
      closeTl.invalidate().restart();
    }
    pillMountedRef.current = true;
  }, [pillOpen]);

  /* ---------- Custom cursor (GSAP quickTo) ---------- */
  useEffect(() => {
    if (typeof gsap === "undefined") return;
    const fine = window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    const dot = dotRef.current;
    if (!dot) return;

    document.documentElement.classList.add("flk-cursor-on");
    gsap.set(dot, { xPercent: -50, yPercent: -50, x: -100, y: -100 });

    const xDot = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" });
    const yDot = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });

    const move = (e) => {xDot(e.clientX);yDot(e.clientY);};

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.classList.remove("flk-cursor-on");
    };
  }, []);

  if (!host) return null;

  return ReactDOM.createPortal(
    <React.Fragment>
      <style>{NAV_STYLE}</style>

      {/* Top bar — logo + Sign in + icon-only hamburger */}
      <header className="flk-bar" ref={barRef}>
        <a className="flk-logo" href="#" aria-label="Flicker home" ref={logoRef}>
          <img src="flicker/logo-flicker-brick.svg" alt="Flicker" />
        </a>
        <div className={"flk-bar-right" + (open ? " is-open" : "")}>
          <a href="#signin" className="cta cta-secondary flk-signin">Sign in</a>
          <button type="button" className="flk-menu-btn" ref={btnRef}
          aria-expanded={open} aria-label="Toggle menu">
            <span className="flk-menu-glyph" data-open={open}><i></i><i></i></span>
          </button>
        </div>
      </header>

      {/* Floating dock — ONE pill: [toggle · logo] · progress% · Get started.
          Clicking the toggle grows it downward into the menu. */}
      <div className={"flk-dock" + (docked ? " is-shown" : "")} ref={dockRef} data-open={pillOpen} aria-hidden={!docked}>
        <div className="flk-pillrow">
          <div className="flk-pill-left">
            <a className="flk-dock-logo" href="#" aria-label="Flicker home" ref={dockLogoRef}>
              <img className="flk-dock-logo-brick" src="flicker/logo-flicker-brick.svg" alt="Flicker" />
              <img className="flk-dock-logo-white" src="flicker/logo-flicker-white.svg" alt="Flicker" />
            </a>
          </div>
          <div className="flk-pill-right">
            <a href="#start" className="cta cta-secondary flk-dock-cta">Sign In</a>
            <button type="button" className="flk-pill-toggle" ref={pillBtnRef}
            aria-expanded={pillOpen} aria-label="Toggle menu">
              <span className="flk-pill-glyph" data-open={pillOpen}><i></i><i></i></span>
            </button>
          </div>
        </div>

        <span className="flk-pill-prog" style={{ "--p": progress + "%" }} aria-hidden="true"></span>

        <div className="flk-pill-body" ref={pillBodyRef}>
          <p className="flk-body-cap">Menu</p>
          {MENU_ITEMS.map((it, i) =>
          <a className="flk-mlink" href="#" key={it.label}
          ref={(el) => {if (el) pillLinksRef.current[i] = el;}}>{it.label}</a>
          )}
          <div className="flk-body-div" aria-hidden="true"></div>
          <p className="flk-body-cap">Resources</p>
          <a className="flk-slink" href="#terms-conditions">Terms &amp; Conditions</a>
          <a className="flk-slink" href="#privacy">Privacy Policy</a>
          <a className="flk-slink" href="#terms-of-service">Terms of Service</a>
          <a className="flk-slink" href="#cookies">Cookies</a>
          <p className="flk-body-cap">Social</p>
          <a className="flk-slink" href="#instagram">Instagram</a>
          <a className="flk-slink" href="#youtube">YouTube</a>
          <a className="flk-slink" href="#linkedin">LinkedIn</a>
        </div>
      </div>

      {/* Transparent backdrop — always rendered (so the native click listener
                                                                                               binds at mount); only catches clicks while open. */}
      <div className="flk-backdrop" ref={backdropRef}
      style={{ pointerEvents: open || pillOpen ? "auto" : "none" }}
      aria-hidden={!(open || pillOpen)}></div>

      {/* Compact drop-down panel */}
      <div className="flk-menu-panel" ref={panelRef}
      data-state={open ? "open" : "closed"}
      style={{ pointerEvents: open ? "auto" : "none", padding: "70px 8px 16px 16px", backgroundColor: "rgb(86, 29, 32)" }} aria-hidden={!open}>
        <p className="flk-menu-caption">Menu</p>
        <nav className="flk-menu-list">
          {MENU_ITEMS.map((it, i) =>
          <a className="flk-menu-link" href="#" key={it.label}
          ref={(el) => {if (el) linksRef.current[i] = el;}}>
              {it.label}
            </a>
          )}
        </nav>
        <div className="flk-menu-divider" aria-hidden="true"></div>
        <p className="flk-menu-caption">Resources</p>
        <a className="flk-menu-sublink" href="#terms-conditions">Terms &amp; Conditions</a>
        <a className="flk-menu-sublink" href="#privacy">Privacy Policy</a>
        <a className="flk-menu-sublink" href="#terms-of-service">Terms of Service</a>
        <a className="flk-menu-sublink" href="#cookies">Cookies</a>
        <p className="flk-menu-caption">Social</p>
        <a className="flk-menu-sublink" href="#instagram">Instagram</a>
        <a className="flk-menu-sublink" href="#youtube">YouTube</a>
        <a className="flk-menu-sublink" href="#linkedin">LinkedIn</a>
      </div>

      {/* Custom cursor — single invert-blend dot */}
      <div className="flk-cursor-dot" ref={dotRef} aria-hidden="true"></div>
    </React.Fragment>,
    host
  );
}

window.SiteNav = SiteNav;