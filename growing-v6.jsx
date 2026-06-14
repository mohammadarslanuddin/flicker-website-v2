/* global React, gsap, ScrollTrigger, lottie */
const { useRef, useEffect } = React;

/* ==================================================================== *
 *  Flicker — "Readers Are Already Growing" (section 05)                 *
 *                                                                       *
 *  HEADER — behaves exactly like the previous (Summaries) section. It    *
 *  reveals FROM BLUR on scroll (every layer: bg-ellipses glow,           *
 *  subsection-dots field, avatar badge, heading, lead), is PINNED in the *
 *  CENTRE of the viewport while the heading + body fill gray -> ink,      *
 *  then releases and scrolls up, fading out to blur as the bento begins.  *
 *  Reveal/fill/exit are all driven by scroll POSITION (scrubbed), so the  *
 *  SVG layers are reliably visible whenever the header is on screen.      *
 *                                                                       *
 *  BENTO — a staggered 3-column grid (LEFT highest · RIGHT mid · CENTER  *
 *  lowest). Each card's imagery is a Lottie (flush, never cropped)        *
 *  except the audio-player card. A card fades + blurs IN as it reaches    *
 *  ~80% (title/description reveal word-by-word, its Lottie plays) and     *
 *  fades + blurs OUT the same way as it leaves — in BOTH scroll           *
 *  directions. Scroll back and a card re-reveals and its Lottie restarts. *
 * ==================================================================== */

// Royalty-free real-face portraits (randomuser.me — free to use).
const AVATARS = [
"uploads/avatars/men-32.jpg",
"uploads/avatars/women-44.jpg",
"uploads/avatars/men-52.jpg",
"uploads/avatars/women-68.jpg"];


// Lottie imagery sources + their natural aspect (so they are never cropped).
const LOTTIE = {
  aisearch: { path: "uploads/Ai-Search.json", w: 402, h: 317 },
  communities: { path: "uploads/Communities.json", w: 402, h: 371 },
  save: { path: "uploads/Save-what-you-like.json", w: 402, h: 188 },
  readlisten: { path: "uploads/REad-or-Listen.json", w: 402, h: 194 },
  plans: { path: "uploads/Learning-Plans.json", w: 402, h: 399 },
  listen: { path: "uploads/audio-player-card.json", w: 402, h: 274 }
};

// Static waveform for the audio card — heights (%), first 9 are "played".
const WAVE = [30, 52, 74, 44, 90, 62, 100, 70, 84, 54, 38, 66, 48, 80, 58, 34,
62, 88, 46, 72, 40, 56, 30, 50, 78, 42, 64, 36, 54, 70, 44, 60];
const WAVE_ON = 9;

const GRAY = [188, 180, 173];
const INK = [34, 25, 27];
const cl = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
const mix = (a, b, t) =>
`rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;

// Split text into reveal-word spans (hero-style blur-in + rise targets).
function words(text) {
  const parts = text.split(" ");
  return parts.map((w, i) =>
  <span key={i} className="gw-rw">{w}{i < parts.length - 1 ? "\u00a0" : ""}</span>
  );
}
// Heading/body keep the two-tone scroll-fill words.
function fillWords(text) {
  const parts = text.split(" ");
  return parts.map((w, i) =>
  <span key={i} className="gw-word">{w}{i < parts.length - 1 ? " " : ""}</span>
  );
}

function Growing() {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    const section = sectionRef.current;
    if (!section) return;

    const reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const anims = [];
    let ctx;
    let refreshHandler = null;

    // ---- Lottie: load each imagery cell paused; (re)play on card reveal. ----
    const loadLottie = (holder) => {
      if (typeof lottie === "undefined" || holder.__anim) return null;
      const a = lottie.loadAnimation({
        container: holder, renderer: "canvas", loop: false, autoplay: false,
        path: holder.dataset.lottie,
        rendererSettings: { progressiveLoad: true, preserveAspectRatio: "xMidYMid meet" }
      });
      holder.__anim = a;
      anims.push(a);
      a.addEventListener("DOMLoaded", () => {if (holder.__inview) a.goToAndPlay(0, true);});
      return a;
    };
    const playLottie = (holder) => {holder.__inview = true;const a = holder.__anim;if (a) {try {a.goToAndPlay(0, true);} catch (e) {}}};
    const stopLottie = (holder) => {holder.__inview = false;const a = holder.__anim;if (a) {try {a.stop();} catch (e) {}}};

    const build = () => {
      ctx = gsap.context((self) => {
        const q = (s) => self.selector(s);
        const holders = q(".gw-lottie");
        holders.forEach(loadLottie);

        // Reduced motion: show everything, play Lotties, no scroll motion.
        if (reduce) {
          gsap.set(q(".gw-glow, .gw-dots"), { opacity: 1 });
          holders.forEach(playLottie);
          if (window.lucide) window.lucide.createIcons();
          return;
        }

        /* ============ HEADER (reveal -> centre pin + fill -> exit) ======== */
        const group = q(".gw-header-group")[0];
        const glow = q(".gw-glow")[0];
        const dots = q(".gw-dots")[0];
        const badge = q(".gw-badge")[0];
        const avatars = q(".gw-avatar");
        const label = q(".gw-badge-label")[0];
        const h2 = q(".gw-h2")[0];
        const body = q(".gw-body")[0];
        const hw = q(".gw-h2 .gw-word");
        const bw = q(".gw-body .gw-word");

        // Initial hidden states. SVGs centred on the group via transform so
        // the glow morph keeps them centred.
        gsap.set([glow, dots], { xPercent: -50, yPercent: -50, opacity: 0 });
        gsap.set(badge, { opacity: 0, y: 24, filter: "blur(10px)" });
        gsap.set(avatars, { scale: 0, opacity: 0 });
        gsap.set(label, { opacity: 0, x: -6 });
        gsap.set([h2, body], { opacity: 0, y: 28, filter: "blur(12px)" });
        [...hw, ...bw].forEach((el) => {el.style.color = "rgb(188,180,173)";});

        // Glow — ambient morph across the whole section scroll (transform only).
        gsap.to(glow, {
          scale: 1.14, rotation: 6, ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "center top", scrub: 1 }
        });

        // REVEAL — scrubbed to scroll position so the layers are reliably
        // visible whenever the header is on screen (no missed onEnter).
        const entry = gsap.timeline({
          scrollTrigger: { trigger: group, start: "top 82%", end: "top 48%", scrub: 1 }
        });
        entry.
        to([glow, dots], { opacity: 1, duration: 0.5, ease: "power2.out" }, 0).
        to(badge, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power3.out" }, 0).
        to(avatars, { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.06 }, 0.08).
        to(label, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 0.26).
        to(h2, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power3.out" }, 0.12).
        to(body, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power3.out" }, 0.28);

        // PIN — hold the header centred while the words fill gray -> ink.
        const last = { v: 0 };
        const renderFill = (p) => {
          const hf = cl(p / 0.5) * hw.length;
          for (let j = 0; j < hw.length; j++) if (hw[j]) hw[j].style.color = mix(GRAY, INK, cl(hf - j));
          const bf = cl((p - 0.45) / 0.5) * bw.length;
          for (let j = 0; j < bw.length; j++) if (bw[j]) bw[j].style.color = mix(GRAY, INK, cl(bf - j));
        };
        ScrollTrigger.create({
          trigger: group, start: "center center",
          end: () => "+=" + window.innerHeight * 0.9,
          pin: group, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: (self) => {last.v = self.progress;renderFill(self.progress);},
          onRefresh: () => renderFill(last.v)
        });

        // EXIT — after the pin releases, the header scrolls up and fades out
        // to blur (opacity/filter only, so it never fights the pin transform).
        gsap.fromTo(group,
        { opacity: 1, filter: "blur(0px)" },
        {
          opacity: 0, filter: "blur(14px)", ease: "none",
          scrollTrigger: { trigger: group, start: "top top", end: "top -45%", scrub: 1 }
        });

        /* ============ CARDS — position-reliable reveal ====================
           Driven by discrete enter/leave callbacks (live scroll) PLUS a
           reconcile that runs on every ScrollTrigger refresh and on init,
           using each card's real getBoundingClientRect. A card is shown at
           FULL opacity whenever any part of it is in the viewport, and only
           fades out once it has scrolled above the top — so a reflow, a
           Tweaks change, or loading already-scrolled never leaves an on-screen
           card stuck hidden (the scrub approach did). It fades + blurs in and
           out the same way. Lotties (re)start whenever a card enters. */
        const reconcilers = [];
        q(".gw-card").forEach((card) => {
          const media = card.querySelector(".gw-media");
          const rw = card.querySelectorAll(".gw-rw");
          const bars = card.querySelectorAll(".gw-wave i");
          const holder = card.querySelector(".gw-lottie");

          const tlIn = gsap.timeline({ paused: true });
          tlIn.fromTo(card,
          { opacity: 0, y: 42, scale: 0.94, filter: "blur(12px)" },
          { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.7, ease: "power3.out" });
          if (media) tlIn.fromTo(media,
          { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.55, ease: "power2.out" }, "-=0.5");
          if (bars.length) tlIn.fromTo(bars,
          { scaleY: 0.12 }, { scaleY: 1, duration: 0.5, ease: "power2.out", stagger: 0.012 }, "-=0.4");
          tlIn.fromTo(rw,
          { opacity: 0, yPercent: 30, filter: "blur(12px)" },
          { opacity: 1, yPercent: 0, filter: "blur(0px)", duration: 0.55, ease: "power3.out", stagger: 0.04 }, "-=0.3");

          gsap.set(card, { opacity: 0 });

          const show = () => {tlIn.play();if (holder) playLottie(holder);};
          const hide = () => {tlIn.reverse();if (holder) stopLottie(holder);};

          ScrollTrigger.create({
            trigger: card, start: "top 88%", end: "bottom 12%",
            onEnter: show, onEnterBack: show,
            onLeave: hide, onLeaveBack: hide
          });

          // Reconcile from the real rect — robust to refresh / load-while-scrolled.
          reconcilers.push(() => {
            const r = card.getBoundingClientRect();
            const vh = window.innerHeight;
            const inView = r.top < vh * 0.9 && r.bottom > vh * 0.1;
            if (inView) {tlIn.progress(1).pause();if (holder) playLottie(holder);} else
            {tlIn.progress(0).pause();if (holder) stopLottie(holder);}
          });
        });
        const runReconcile = () => reconcilers.forEach((fn) => fn());
        // Run across a few frames so it lands AFTER ScrollSmoother applies its
        // transform (a single rAF can read a stale rect on large jumps).
        const reconcileSoon = () => {
          requestAnimationFrame(runReconcile);
          setTimeout(runReconcile, 80);
          setTimeout(runReconcile, 260);
        };
        refreshHandler = reconcileSoon;
        ScrollTrigger.addEventListener("refresh", refreshHandler);
        reconcileSoon();

        if (window.lucide) window.lucide.createIcons();
      }, section);
    };

    let killed = false;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {if (!killed) {build();ScrollTrigger.refresh();}});
    } else {build();}

    return () => {
      killed = true;
      if (refreshHandler) ScrollTrigger.removeEventListener("refresh", refreshHandler);
      anims.forEach((a) => a && a.destroy && a.destroy());
      if (ctx) ctx.revert();
    };
  }, []);

  // Lottie imagery cell — flush, sized to the Lottie's own aspect ratio.
  const Media = ({ kind }) => {
    const L = LOTTIE[kind];
    return (
      <div className="gw-media">
        <div className="gw-lottie" data-lottie={L.path}
        style={{ aspectRatio: L.w + " / " + L.h }} role="img"></div>
      </div>);

  };

  const Card = ({ kind, title, desc }) =>
  <article className="gw-card" data-kind={kind}>
      <Media kind={kind} />
      <div className="gw-card-body">
        <h3 className="gw-card-title">{words(title)}</h3>
        <p className="gw-card-desc">{words(desc)}</p>
      </div>
    </article>;


  return (
    <section ref={sectionRef} data-screen-label="05 Growing" data-no-autofade="" className="gw-section">
      <div className="gw-header-group">
        <div className="gw-glow" aria-hidden="true"></div>
        <div className="gw-dots" aria-hidden="true"></div>
        <div className="gw-head">
          <div className="gw-badge">
            <span className="gw-avatars" aria-hidden="true">
              {AVATARS.map((src, i) =>
              <img key={i} className="gw-avatar" src={src} alt="" loading="lazy" />
              )}
            </span>
            <span className="gw-badge-label"><b>1000+</b> Active User</span>
          </div>
          <h2 className="gw-h2">
            {fillWords("Readers Are Already")}<br />{fillWords("Growing With Flicker App")}
          </h2>
          <p className="gw-body">
            {fillWords("A community of busy professionals and lifelong learners is turning small moments into real progress.")}
          </p>
        </div>
      </div>

      <div className="gw-bento">
        {/* LEFT — highest */}
        <div className="gw-col gw-col-left">
          <Card kind="aisearch" title="AI Search"
          desc="Ask in plain words and find the exact insight you need, across every summary." />

          <Card kind="listen" title="Listen Your First Summary"
          desc="Receive live support, flicker support is always on demand and ready to serve." />
        </div>

        {/* CENTER — lowest */}
        <div className="gw-col gw-col-center">
          <Card kind="communities" title="Communities"
          desc="Learn alongside other curious minds. Share takeaways and grow with people chasing the same goals." />
          <Card kind="save" title="Save What You Like"
          desc="If you find something interesting, the app offers feature to save it as your favourite." />
        </div>

        {/* RIGHT — mid */}
        <div className="gw-col gw-col-right">
          <Card kind="readlisten" title="Read or Listen"
          desc="Get every summary in text and audio. Switch between them to fit your day." />
          <Card kind="plans" title="Learning Plans"
          desc="Follow guided paths built around your goals, with the right books in the right order." />
        </div>
      </div>
    </section>);

}

window.Growing = Growing;