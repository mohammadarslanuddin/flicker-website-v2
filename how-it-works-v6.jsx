/* global React, gsap, ScrollTrigger, lottie */
const { useRef, useEffect } = React;

/* ==================================================================== *
 *  Flicker — "How it works"  (one continuous pinned section)            *
 *                                                                       *
 *  A single pinned ScrollTrigger drives three phases back-to-back, so   *
 *  there is no seam / gap between them:                                  *
 *                                                                       *
 *   0.00 – 0.24  SCRUB  : the four genre rows slide horizontally while   *
 *                         the heading sits top-left and the first Lottie *
 *                         rides in a small box parked bottom-right       *
 *                         (inset by the page margin, on top of rows).    *
 *   0.24 – 0.40  MORPH  : the box grows into a MARGINED stage panel      *
 *                         (never full-bleed). Heading + rows fade out,   *
 *                         the phone glides to center, copy + rail appear.*
 *   0.40 – 1.00  BEATS  : three scroll-scrubbed beats — phone pinned     *
 *                         center, each Lottie scrubs its own timeline,   *
 *                         left copy reveals word-by-word, right vertical *
 *                         rail advances + step label crossfades.         *
 * ==================================================================== */

const GENRE_ROWS = [
["Self-development", "Productivity", "Habits", "Psychology",
"Mindfulness", "Communication", "Confidence", "Focus"],
["Business", "Leadership", "Strategy", "Marketing",
"Finance", "Investing", "Entrepreneurship", "Negotiation"],
["History", "Biography", "Memoir", "Politics",
"Society", "Culture", "Essays", "Travel"],
["Science", "Technology", "Innovation", "Health",
"Philosophy", "Creativity", "Nature", "Design"]];

const DIRECTIONS = [-1, 1, -1, 1];
const SEP = "\u00a0\u00b7\u00a0";
const TRAVEL_FRACTION = 0.15;

const BEATS = [
{
  path: "uploads/Home-Books.json",
  frames: 178,
  step: "Step 1:",
  title: "Pick a Book",
  copy:
  "Browse hand-picked summaries across business, psychology, and productivity \u2014 new titles added weekly."
},
{
  path: "uploads/Book-Detail.json",
  frames: 180,
  step: "Step 2:",
  title: "Get the AI Summary",
  copy:
  "Open an AI-curated summary built around the core ideas \u2014 no fluff. Read, listen, or save for later."
},
{
  path: "uploads/Book-Detail-Reading-v2.json",
  frames: 240,
  step: "Step 3:",
  title: "Read, Listen or Save",
  copy:
  "Read or listen to the key chapters to take in the whole book, then save it to your shelf for later."
}];


const SCRUB_END = 0.24; // genre horizontal scrub completes
const MORPH_END = 0.40; // box → margined panel completes
const PHONE_AR = 917 / 412;

const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
function lerpRect(a, b, t) {
  return { l: lerp(a.l, b.l, t), tp: lerp(a.tp, b.tp, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) };
}

function mixColor(a, b, t) {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}
const INK = [34, 25, 27];
const GRAY = [188, 180, 173];

// Crossfade visibility for beat `i` given the step float `sf` (0..3).
function beatVis(i, sf) {
  const band = 0.16;
  let o = 1;
  if (i > 0) o = Math.min(o, clamp01((sf - (i - band)) / band));
  if (i < BEATS.length - 1) o = Math.min(o, clamp01((i + 1 - sf) / band));
  return o;
}

function HowItWorks() {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const headingRef = useRef(null);
  const rowsRef = useRef(null);
  const panelRef = useRef(null);
  const gridRef = useRef(null);
  const copyColRef = useRef(null);
  const railColRef = useRef(null);
  const railFillRef = useRef(null);
  const phoneRef = useRef(null);
  const boxVideoRef = useRef(null);
  const trackRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const holderRefs = [useRef(null), useRef(null), useRef(null)];
  const copyBeatRefs = [useRef(null), useRef(null), useRef(null)];
  const railBeatRefs = [useRef(null), useRef(null), useRef(null)];
  const wordRefs = useRef([[], [], []]);
  const headWordRefs = useRef([]); // Phase-A heading words (scroll-fill)

  useEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    const section = sectionRef.current;
    if (!section) return;

    // Kick the looping product video (muted autoplay needs an explicit nudge).
    const bvEl = boxVideoRef.current && boxVideoRef.current.querySelector("video");
    if (bvEl) {bvEl.muted = true;const pr = bvEl.play();if (pr && pr.catch) pr.catch(() => {});}

    const anims = [null, null, null];
    const ready = [false, false, false];
    let tracks = [];
    let lastP = 0;
    let killed = false;

    /* ---- Lottie (deferred so it never blocks the hero) ---- */
    const loadLotties = () => {
      if (typeof lottie === "undefined") return;
      BEATS.forEach((b, i) => {
        if (anims[i]) return;
        const a = lottie.loadAnimation({
          container: holderRefs[i].current,
          renderer: "svg",
          loop: false,
          autoplay: false,
          path: b.path,
          rendererSettings: { preserveAspectRatio: "xMidYMid meet", progressiveLoad: false }
        });
        a.addEventListener("DOMLoaded", () => {
          ready[i] = true;
          a.goToAndStop(0, true);
          render(lastP);
        });
        anims[i] = a;
      });
    };

    /* ---- measure genre-row travel (content is duplicated 2×) ---- */
    const setupTracks = () => {
      tracks = trackRefs.map((r, i) => {
        const el = r.current;
        if (!el) return null;
        const half = el.scrollWidth / 2;
        const dir = DIRECTIONS[i];
        const travel = half * TRAVEL_FRACTION;
        const fromX = dir === 1 ? -travel : 0;
        const toX = dir === 1 ? 0 : -travel;
        return { el, fromX, toX };
      }).filter(Boolean);
    };

    /* ---- geometry for box / panel / phone in viewport px ---- */
    const geom = () => {
      const VW = window.innerWidth;
      const VH = window.innerHeight;
      const mH = Math.max(28, Math.min(VW * 0.022, 40));
      const mV = Math.max(30, Math.min(VH * 0.05, 52));
      // Stage WIDTH kept reduced (but a touch wider than the 0.6 minimum so
      // the flanking copy/rail get breathing room from the panel edges).
      // Height stays scaled up (0.9) so the panel reads taller than square.
      const STAGE_W = 0.72;
      const STAGE_H = 0.9;
      const panelW = (VW - 2 * mH) * STAGE_W;
      const panelH = (VH - 2 * mV) * STAGE_H;
      const panelFull = { l: (VW - panelW) / 2, tp: (VH - panelH) / 2, w: panelW, h: panelH };

      const boxW = Math.min(VW * 0.30, 460);
      const boxH = boxW * 0.62;
      const boxRect = { l: VW - mH - boxW, tp: VH - mV - boxH, w: boxW, h: boxH };

      // Phone — full: sized by HEIGHT so the app Lottie fills the stage's
      // top/bottom margins (still leaving a small even inset). Width follows
      // the locked phone aspect ratio, so the Lottie is never distorted and
      // nothing inside the frame is altered — only the outer rect grows.
      const vInset = Math.max(20, Math.min(panelFull.h * 0.045, 40));
      const pFullH = panelFull.h - 2 * vInset;
      const pFullW = pFullH / PHONE_AR;
      const phoneFull = {
        l: VW / 2 - pFullW / 2,
        tp: panelFull.tp + (panelFull.h - pFullH) / 2,
        w: pFullW, h: pFullH
      };
      // Phone — inside the corner box (a cut-off preview, clipped by the box)
      const pBoxW = boxW * 0.54;
      const pBoxH = pBoxW * PHONE_AR;
      const phoneBox = {
        l: boxRect.l + boxW / 2 - pBoxW / 2,
        tp: boxRect.tp + boxH * 0.16,
        w: pBoxW, h: pBoxH
      };
      return { panelFull, boxRect, phoneFull, phoneBox };
    };

    const setRect = (el, r) => {
      el.style.left = r.l + "px";
      el.style.top = r.tp + "px";
      el.style.width = r.w + "px";
      el.style.height = r.h + "px";
    };

    /* ---- master scrub renderer ---- */
    const render = (p) => {
      lastP = p;
      const panel = panelRef.current;
      const phone = phoneRef.current;
      if (!panel || !phone) return;
      const G = geom();

      // ---- Phase A: genre scrub ----
      const scrubP = clamp01(p / SCRUB_END);
      tracks.forEach((t) => gsap.set(t.el, { x: lerp(t.fromX, t.toX, scrubP) }));

      // Heading text-fill-on-scroll, tied to the horizontal genre scrub:
      // words fill gray -> ink as the horizontal scroll applies (Phase A),
      // completing just before the morph fades the heading out.
      {
        const hwords = headWordRefs.current;
        const hfill = clamp01(scrubP / 0.85) * hwords.length;
        for (let j = 0; j < hwords.length; j++)
        if (hwords[j]) hwords[j].style.color = mixColor(GRAY, INK, clamp01(hfill - j));
      }

      // ---- Phase B: morph ----
      const m = clamp01((p - SCRUB_END) / (MORPH_END - SCRUB_END));
      const me = smooth(m);
      if (headingRef.current) gsap.set(headingRef.current, { opacity: 1 - clamp01(me * 1.4), y: -me * 12 });
      if (rowsRef.current) gsap.set(rowsRef.current, { opacity: 1 - clamp01(me * 1.6) });

      // panel + phone rects interpolate box → full
      const panelRect = lerpRect(G.boxRect, G.panelFull, me);
      setRect(panel, panelRect);
      panel.style.borderRadius = lerp(15, 22, me) + "px";

      // ---- Box reveal ----
      // The bottom-right box stays hidden until the genre scrub passes 40%,
      // then slides up, unblurs and fades into view (GSAP-driven). By the
      // time the morph begins (scrubP === 1) it is fully resolved.
      const rev = smooth(clamp01((scrubP - 0.40) / 0.60));
      gsap.set(panel, { opacity: rev, y: (1 - rev) * 48, filter: `blur(${(1 - rev) * 14}px)` });

      const phoneRect = lerpRect(G.phoneBox, G.phoneFull, me);
      // phone is a child of the panel → position relative to the panel box
      const relPhone = { l: phoneRect.l - panelRect.l, tp: phoneRect.tp - panelRect.tp, w: phoneRect.w, h: phoneRect.h };
      setRect(phone, relPhone);

      // ---- Video ↔ Lottie crossfade ----
      // In the box state the looping product video covers the phone. As the
      // box morphs into the full stage it crossfades into the phone's 1st
      // Lottie; from there the beats run exactly as before.
      const phoneShow = smooth(clamp01(me / 0.6));
      phone.style.opacity = phoneShow;
      const bv = boxVideoRef.current;
      if (bv) {
        setRect(bv, relPhone);
        bv.style.opacity = 1 - phoneShow;
      }

      const gridOp = clamp01((m - 0.55) / 0.45);
      if (copyColRef.current) gsap.set(copyColRef.current, { opacity: gridOp });
      if (railColRef.current) gsap.set(railColRef.current, { opacity: gridOp });

      // ---- Phase C: beats ----
      const sp = clamp01((p - MORPH_END) / (1 - MORPH_END));
      const sf = sp * BEATS.length;

      BEATS.forEach((b, i) => {
        const vis = beatVis(i, sf);
        const holder = holderRefs[i].current;
        if (holder) holder.style.opacity = vis;
        if (ready[i] && anims[i]) anims[i].goToAndStop(clamp01(sf - i) * b.frames, true);

        const cb = copyBeatRefs[i].current;
        if (cb) {
          cb.style.opacity = vis;
          cb.style.transform = `translateY(calc(-50% + ${(1 - vis) * 12}px))`;
        }
        const words = wordRefs.current[i];
        if (words && words.length) {
          const head = clamp01(sf - i) * words.length;
          for (let j = 0; j < words.length; j++) words[j].style.color = mixColor(GRAY, INK, clamp01(head - j));
        }
        const rb = railBeatRefs[i].current;
        if (rb) {
          rb.style.opacity = vis;
          rb.style.transform = `translateY(calc(-50% + ${(1 - vis) * 10}px))`;
        }
      });
      if (railFillRef.current) railFillRef.current.style.height = sp * 100 + "%";
    };

    /* ---- build ---- */
    let st = null,loadTrigger = null,entryT = null,rowsEntryT = null,exitST = null;
    const build = () => {
      setupTracks();

      // Genre rows: gentle fade + rise as the section arrives.
      gsap.set(rowsRef.current, { opacity: 0, y: 24 });
      rowsEntryT = gsap.to(rowsRef.current, {
        opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 80%", end: "top 40%", scrub: 1 }
      }).scrollTrigger;

      // Heading: fade + blur in as the section arrives. The word-by-word
      // gray -> ink fill is NOT done here — it runs in render() during the
      // pinned horizontal genre scrub (Phase A), so the text fills as the
      // horizontal scroll applies.
      gsap.set(headingRef.current, { opacity: 0, y: 24, filter: "blur(8px)" });
      entryT = gsap.to(headingRef.current, {
        opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, ease: "power3.out",
        scrollTrigger: {
          trigger: section, start: "top 82%", end: "top 40%", scrub: 1
        }
      }).scrollTrigger;

      st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => "+=" + window.innerHeight * 7,
        pin: pinRef.current,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefreshInit: setupTracks,
        onUpdate: (self) => render(self.progress),
        onRefresh: () => render(lastP)
      });

      loadTrigger = ScrollTrigger.create({
        trigger: section,
        start: "top bottom+=60%",
        once: true,
        onEnter: loadLotties
      });

      // EXIT — once the pin releases, the section scrolls up in normal flow
      // like the sections ahead (Showcase / Growing) instead of fading in
      // place. Anchoring the trigger to the section BOTTOM (not a pinned-scroll
      // offset) means this only runs AFTER the pin lets go, so the panel rides
      // up with the scroll and fades out over the following viewport — the next
      // section (Showcase) only appears once this one has almost gone. Blur is
      // held off until the fade passes 50% so it dissolves cleanly, then softens.
      exitST = ScrollTrigger.create({
        trigger: section,
        start: "bottom bottom",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          const e = self.progress;
          if (pinRef.current) {
            pinRef.current.style.opacity = String(1 - e);
            const b = e > 0.5 ? (e - 0.5) / 0.5 * 20 : 0;
            pinRef.current.style.filter = b > 0 ? `blur(${b}px)` : "none";
          }
        }
      });

      render(0);
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (killed) return;
        build();
        ScrollTrigger.refresh();
        if (window.lucide) window.lucide.createIcons();
      });
    } else {
      build();
    }

    const onResize = () => {setupTracks();render(lastP);};
    window.addEventListener("resize", onResize);
    const idle = window.setTimeout(loadLotties, 4500);

    return () => {
      killed = true;
      window.clearTimeout(idle);
      window.removeEventListener("resize", onResize);
      if (st) st.kill();
      if (loadTrigger) loadTrigger.kill();
      if (entryT) entryT.kill();
      if (rowsEntryT) rowsEntryT.kill();
      if (exitST) exitST.kill();
      anims.forEach((a) => a && a.destroy && a.destroy());
    };
  }, []);

  const rowText = (items) => {
    const joined = items.join(SEP);
    return joined + SEP + joined + SEP;
  };
  const renderHeadWords = (text) => {
    headWordRefs.current = [];
    const parts = text.split(" ");
    return parts.map((w, j) =>
    <span
      key={j}
      className="hiw-fill-word"
      ref={(el) => {if (el) headWordRefs.current[j] = el;}}>
        {w}{j < parts.length - 1 ? " " : ""}
      </span>
    );
  };
  const renderWords = (text, beatIdx) => {
    wordRefs.current[beatIdx] = [];
    const parts = text.split(" ");
    return parts.map((w, j) =>
    <span
      key={j}
      className="rword"
      ref={(el) => {if (el) wordRefs.current[beatIdx][j] = el;}}>
        {w}{j < parts.length - 1 ? " " : ""}
      </span>
    );
  };

  return (
    <section
      ref={sectionRef}
      data-screen-label="02 How it works"
      data-no-autofade=""
      className="hiw-section">

      <div ref={pinRef} className="hiw-pin">

        {/* Heading (genre-scrub phase, top-left) */}
        <div ref={headingRef} className="hiw-heading">
          <p className="t-h1" style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.02em" }}>{renderHeadWords("Three steps from a great book to a clear insight you can use today.")}</p>
        </div>

        {/* Genre rows (full-bleed, behind the box) */}
        <div ref={rowsRef} className="hiw-rows" role="list">
          {GENRE_ROWS.map((items, i) =>
          <div key={i} className="genre-row" role="listitem">
              <div
              ref={trackRefs[i]}
              className="genre-track"
              style={{ fontFamily: "Outfit", opacity: 0.3, fontSize: "72px", lineHeight: "1.25" }}>
                {rowText(items)}
              </div>
            </div>
          )}
        </div>

        {/* Stage panel — box → margined card. Phone + columns live inside. */}
        <div ref={panelRef} className="hiw-panel">
          <div ref={gridRef} className="hiw-grid">
            <div ref={copyColRef} className="hiw-copy" style={{ opacity: 0 }}>
              {BEATS.map((b, i) =>
              <div key={i} ref={copyBeatRefs[i]} className="hiw-copy-beat" style={{ opacity: i === 0 ? 1 : 0 }}>
                  <p>{renderWords(b.copy, i)}</p>
                </div>
              )}
            </div>
            <div ref={railColRef} className="hiw-rail" style={{ opacity: 0 }}>
              <div className="rail-track"><div ref={railFillRef} className="rail-fill"></div></div>
              <div className="rail-labels">
                {BEATS.map((b, i) =>
                <div key={i} ref={railBeatRefs[i]} className="rail-beat" style={{ opacity: i === 0 ? 1 : 0 }}>
                    <p className="rail-step" style={{ fontSize: "14px" }}>{b.step}</p>
                    <p className="rail-title" style={{ fontFamily: "var(--font-serif)", fontWeight: "700", letterSpacing: "-0.04em", fontSize: "21px" }}>{b.title}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Looping product video — visible only in the bottom-right box
                                                state; crossfades into the 1st Lottie as the box morphs full.
                                                Wrapper clips the rounded corners (mask) so no edge line leaks. */}
          <div ref={boxVideoRef} className="hiw-box-video" aria-hidden="true">
            <video
              src="uploads/Sign-Up-Personalisation.webm"
              muted
              loop
              autoPlay
              playsInline></video>
          </div>

          {/* Phone (child of panel so the box clips it; rect JS-driven) */}
          <div ref={phoneRef} className="hiw-phone" aria-hidden="true">
            <div className="phone-frame">
              <div className="phone-screen">
                {BEATS.map((b, i) =>
                <div
                  key={i}
                  ref={holderRefs[i]}
                  className="lottie-holder"
                  role="img"
                  aria-label="A demonstration of the Flicker App reading experience"
                  style={{ opacity: i === 0 ? 1 : 0 }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}

window.HowItWorks = HowItWorks;