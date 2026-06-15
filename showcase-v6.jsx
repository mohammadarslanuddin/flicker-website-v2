/* global React, gsap, ScrollTrigger */
const { useRef, useEffect } = React;

/* ==================================================================== *
 *  Flicker — "Summaries Across Every Subject" (pinned showcase)         *
 *                                                                       *
 *  ENTRANCE (pre-pin, gated at ~80% of the section in view):            *
 *    The heading + body sit CENTERED and rise in with a fade + blur,     *
 *    one line at a time. Once a line has finished fading in, its words   *
 *    fill gray -> ink (the same two-tone scroll-fill used in section 3). *
 *                                                                       *
 *  PINNED TIMELINE (scrub):                                              *
 *    0.00 - 0.45  FILL : heading words fill, then the body words fill.   *
 *    0.45 - 0.72  RISE : the centered block pushes UP, opening space at  *
 *                        the bottom; the carousel fades + unblurs in.    *
 *    0.72 - 1.00  DWELL: everything rests, the carousel keeps looping.   *
 *                                                                       *
 *  CAROUSEL: all 13 covers auto-scroll slowly on a seamless loop. No     *
 *  rotation. Hover pauses the loop and the cover resizes + expands into  *
 *  a card (cover · title · author · descriptor · genre tag · button),    *
 *  on a light tonal tint of the cover's dominant colour (MUI-HCT style). *
 * ==================================================================== */

const SHOWCASE_BOOKS = [
{ cover: "books/01.png", title: "Moby Dick", author: "Herman Melville", genre: "Classics", desc: "The hunt that becomes obsession." },
{ cover: "books/02.png", title: "Big Magic", author: "Elizabeth Gilbert", genre: "Creativity", desc: "Creative living beyond fear." },
{ cover: "books/03.png", title: "Unfu*k Yourself", author: "Gary John Bishop", genre: "Self-development", desc: "Get out of your head, into your life." },
{ cover: "books/04.png", title: "Illusion", author: "Harper Ruso", genre: "Photography", desc: "Discover the power of perception." },
{ cover: "books/05.png", title: "How to Win Friends and Influence People", author: "Dale Carnegie", genre: "Communication", desc: "Timeless principles for working with people." },
{ cover: "books/06.png", title: "The Four Agreements", author: "Don Miguel Ruiz", genre: "Personal Growth", desc: "Four agreements for personal freedom." },
{ cover: "books/07.png", title: "Smarter Faster Better", author: "Charles Duhigg", genre: "Productivity", desc: "The science of real productivity." },
{ cover: "books/08.png", title: "Loud", author: "Drew Afualo", genre: "Memoir", desc: "Accept nothing less than you deserve." },
{ cover: "books/09.png", title: "You Can Heal Your Life", author: "Louise Hay", genre: "Motivational", desc: "Change your thoughts, change your life." },
{ cover: "books/10.png", title: "The Courage to Be Disliked", author: "Ichiro Kishimi & Fumitake Koga", genre: "Psychology", desc: "Freedom begins where approval ends." },
{ cover: "books/11.png", title: "Authority", author: "Jeff Vandermeer", genre: "Science Fiction", desc: "Book two of the Southern Reach." },
{ cover: "books/12.png", title: "Cage the Raven", author: "", genre: "Fiction", desc: "A modern fable of freedom." },
{ cover: "books/13.png", title: "The Investigator", author: "John Sandford", genre: "Thriller", desc: "A Letty Davenport novel." }];


const HEAD_END = 0.18; // heading fill completes
const BODY_END = 0.36; // body fill completes
const RISE_END = 0.66; // block fully risen, carousel fully in

const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
const smooth = (t) => t * t * (3 - 2 * t);
const INK = [34, 25, 27];
const GRAY = [188, 180, 173];
const mixColor = (a, b, t) =>
`rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;

// Shadows pulled from the design tokens (GSAP tweens need literal values).
const SHADOW_SM = "0 1px 3px 0 hsl(345 30% 10% / 0.06), 0 1px 2px -1px hsl(345 30% 10% / 0.04)";
const SHADOW_LG = "0 12px 28px -8px hsl(345 30% 10% / 0.12), 0 4px 10px -3px hsl(345 30% 10% / 0.06)";

/* GSAP-morph a card open / closed. Driving size + tint + meta height in one
   eased timeline (instead of CSS transitions) keeps the open smooth and
   jump-free. killTweensOf guards against rapid enter/leave overlap. */
function expandCard(item) {
  // Suppress the hover-morph while the loop is being dragged — otherwise
  // every cover the pointer crosses would pop open mid-drag.
  if (item.closest(".sw-carousel")?.classList.contains("is-grabbing")) return;
  const card = item.querySelector(".sw-card");
  const bg = item.querySelector(".sw-card-bg");
  const cover = item.querySelector(".sw-cover");
  const meta = item.querySelector(".sw-meta");
  const btn = item.querySelector(".sw-btn");
  if (!card) return;
  gsap.killTweensOf([card, bg, cover, meta, btn]);
  // Tint is a fixed-hue layer; only its opacity ramps — no colour shift.
  gsap.to(bg, { opacity: 1, duration: 0.55, ease: "power3.out" });
  gsap.to(card, { scale: 1.03, padding: 14, duration: 0.55, ease: "power3.out" });
  gsap.to(cover, { width: "64%", duration: 0.6, ease: "power3.out" });
  gsap.to(meta, { height: "auto", opacity: 1, marginTop: 14, duration: 0.6, ease: "power3.out" });
  // Button fades in only AFTER the meta height has fully opened, so the
  // overflow:hidden container never clips it mid-expand (no cropping).
  gsap.to(btn, { opacity: 1, duration: 0.3, delay: 0.4, ease: "power2.out" });
}
function collapseCard(item) {
  const card = item.querySelector(".sw-card");
  const bg = item.querySelector(".sw-card-bg");
  const cover = item.querySelector(".sw-cover");
  const meta = item.querySelector(".sw-meta");
  const btn = item.querySelector(".sw-btn");
  if (!card) return;
  gsap.killTweensOf([card, bg, cover, meta, btn]);
  gsap.to(btn, { opacity: 0, duration: 0.2, ease: "power2.in" });
  gsap.to(meta, { height: 0, opacity: 0, marginTop: 0, duration: 0.45, ease: "power3.inOut" });
  gsap.to(cover, { width: "100%", duration: 0.5, ease: "power3.inOut" });
  gsap.to(bg, { opacity: 0, duration: 0.5, ease: "power3.inOut" });
  gsap.to(card, { scale: 1, padding: 0, duration: 0.5, ease: "power3.inOut" });
}

/* Dominant colour -> light tonal surface (high tone, moderate chroma). */
function dominantTint(img) {
  try {
    const s = 22;
    const c = document.createElement("canvas");
    c.width = s;c.height = s;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0, s, s);
    const d = x.getImageData(0, 0, s, s).data;
    let rs = 0,gs = 0,bs = 0,ws = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i],g = d[i + 1],b = d[i + 2],a = d[i + 3];
      if (a < 200) continue;
      const mx = Math.max(r, g, b),mn = Math.min(r, g, b);
      const w = mx - mn + 4;
      rs += r * w;gs += g * w;bs += b * w;ws += w;
    }
    if (!ws) return null;
    const R = rs / ws / 255,G = gs / ws / 255,B = bs / ws / 255;
    const mx = Math.max(R, G, B),mn = Math.min(R, G, B),l = (mx + mn) / 2;
    let h = 0,sat = 0;
    if (mx !== mn) {
      const dd = mx - mn;
      sat = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
      if (mx === R) h = (G - B) / dd + (G < B ? 6 : 0);else
      if (mx === G) h = (B - R) / dd + 2;else
      h = (R - G) / dd + 4;
      h *= 60;
    }
    const S = Math.round(Math.max(26, Math.min(56, sat * 100)));
    return `hsl(${Math.round(h)}, ${S}%, 93%)`;
  } catch (e) {
    return null;
  }
}

function SubjectShowcase() {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const headRef = useRef(null);
  const lineRefs = useRef([]); // the 3 fade-in blocks: line1, line2, body
  const headWordRefs = useRef([]);
  const bodyWordRefs = useRef([]);
  const carouselRef = useRef(null);
  const tintRefs = useRef([]); // per-item card wrappers (for --tint)

  // reset accumulators each render
  headWordRefs.current = [];
  bodyWordRefs.current = [];
  let hIdx = 0;

  useEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    const section = sectionRef.current;
    if (!section) return;
    let killed = false,st = null,entryTl = null,exitST = null,lastP = 0,marqueeCleanup = null;

    const render = (p) => {
      lastP = p;
      // ---- heading fill, then body fill ----
      const hw = headWordRefs.current;
      const hf = clamp01(p / HEAD_END) * hw.length;
      for (let j = 0; j < hw.length; j++)
      if (hw[j]) hw[j].style.color = mixColor(GRAY, INK, clamp01(hf - j));

      const bw = bodyWordRefs.current;
      const bf = clamp01((p - HEAD_END) / (BODY_END - HEAD_END)) * bw.length;
      for (let j = 0; j < bw.length; j++)
      if (bw[j]) bw[j].style.color = mixColor(GRAY, INK, clamp01(bf - j));

      // ---- rise the centered block up + reveal the carousel ----
      const rp = smooth(clamp01((p - BODY_END) / (RISE_END - BODY_END)));
      const UP = window.innerHeight * 0.28;
      if (headRef.current)
      headRef.current.style.transform = `translate(-50%, calc(-50% - ${rp * UP}px))`;

      if (carouselRef.current) {
        // blur resolves quickly (gone by ~halfway through the rise) so it is
        // a short, soft entrance rather than a long-held blur.
        const cb = 1 - clamp01(rp * 2.2);
        carouselRef.current.style.opacity = clamp01(rp * 1.5);
        carouselRef.current.style.filter = `blur(${cb * 12}px)`;
        carouselRef.current.style.transform = `translateY(${(1 - clamp01(rp * 1.6)) * 40}px)`;
      }
    };

    const build = () => {
      // ENTRY — short fade + blur + rise, one line at a time (pre-pin).
      gsap.set(lineRefs.current, { opacity: 0, y: 28, filter: "blur(9px)" });
      entryTl = gsap.to(lineRefs.current, {
        opacity: 1, y: 0, filter: "blur(0px)",
        ease: "power2.out", duration: 0.5, stagger: 0.22,
        scrollTrigger: { trigger: section, start: "top 80%", end: "top 56%", scrub: 1 }
      }).scrollTrigger;

      // PIN — fill + rise + dwell only. The pin releases once the carousel
      // has settled, so the section then scrolls away in normal flow.
      st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => "+=" + window.innerHeight * 2,
        pin: pinRef.current,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => render(self.progress),
        onRefresh: () => render(lastP)
      });

      // EXIT — after the pin releases the section scrolls up like any other
      // content; it fades out over the following viewport so the NEXT section
      // (Growing) only begins to appear once this one has almost gone. The
      // BLUR is held off until the fade-out has crossed 50%, so the section
      // dissolves cleanly first, then softens — and nothing from the sections
      // ahead overlaps because this one is fully transparent before they show.
      exitST = ScrollTrigger.create({
        trigger: section,
        start: "bottom bottom",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          const e = self.progress;
          if (pinRef.current) {
            pinRef.current.style.opacity = String(1 - e);
            // Blur ramps 0 -> 20px only across the second half of the fade.
            const b = e > 0.5 ? (e - 0.5) / 0.5 * 20 : 0;
            pinRef.current.style.filter = b > 0 ? `blur(${b}px)` : "none";
          }
        }
      });
      render(0);
    };

    /* ---- Draggable auto-loop -------------------------------------------
       Replaces the old CSS marquee. A rAF loop writes translateX every
       frame: a slow leftward baseline (same cadence as the 90s keyframe),
       paused while a cover is hovered. Pointer-drag (mouse + touch) and
       horizontal wheel scrub the position directly; releasing a drag with
       speed carries a little inertia, then the baseline resumes. The two
       book copies make the wrap seamless. */
    function setupMarquee() {
      const carousel = carouselRef.current;
      const track = carousel && carousel.querySelector(".sw-track");
      if (!track) return null;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let half = track.scrollWidth / 2;       // width of one book copy
      let pos = 0;                            // current translateX (px)
      let vx = 0;                             // inertia velocity (px/s)
      let hovering = false;                   // pause baseline on hover
      let dragging = false;
      let moved = false;                      // crossed the drag threshold
      let startX = 0,startPos = 0,lastX = 0,lastT = 0;
      let raf = 0,prev = 0;
      let visible = true;                     // false → loop idles (off-screen)

      const apply = () => {track.style.transform = `translateX(${pos}px)`;};
      const wrap = () => {
        if (half <= 0) return;
        pos = pos % half;                     // keep within one copy
        if (pos > 0) pos -= half;             // normalise into (-half, 0]
      };

      const frame = (t) => {
        const dt = Math.min((t - prev) / 1000 || 0, 0.05);
        prev = t;
        if (!dragging) {
          if (Math.abs(vx) > 2) {             // inertia after a flick
            pos += vx * dt;
            vx *= Math.pow(0.92, dt * 60);
          } else {
            vx = 0;
            if (!hovering && !reduce) pos -= half / 90 * dt; // slow baseline
          }
          wrap();
          apply();
        }
        // Stop re-arming once off-screen — this loop otherwise writes a
        // transform every frame forever, even parked and out of view.
        raf = visible ? requestAnimationFrame(frame) : 0;
      };

      // Hover pause (delegated — covers have pointer-events:auto).
      const onOver = () => {hovering = true;};
      const onOut = (e) => {if (!track.contains(e.relatedTarget)) hovering = false;};

      // Pointer drag.
      const onDown = (e) => {
        if (e.button != null && e.button !== 0) return;
        dragging = true;moved = false;vx = 0;
        startX = e.clientX;startPos = pos;
        lastX = e.clientX;lastT = e.timeStamp || performance.now();
      };
      const onMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        if (!moved && Math.abs(dx) > 4) {
          moved = true;
          carousel.classList.add("is-grabbing");
          collapseAll();                      // close any open card before sliding
        }
        if (!moved) return;
        pos = startPos + dx;
        const now = e.timeStamp || performance.now();
        const v = (e.clientX - lastX) / Math.max(now - lastT, 1) * 1000;
        if (Number.isFinite(v)) vx = v;       // px/s, used for inertia on release
        lastX = e.clientX;lastT = now;
        wrap();apply();
      };
      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        carousel.classList.remove("is-grabbing");
        if (moved) {
          suppressClick = true;               // swallow the trailing click
          setTimeout(() => {suppressClick = false;}, 0);
        }
      };

      // Horizontal wheel / trackpad scrub — never fights vertical page scroll.
      const onWheel = (e) => {
        const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
        if (!dx) return;
        e.preventDefault();
        vx = 0;
        pos -= dx;
        wrap();apply();
      };

      // A drag that moved should not trigger the cover's link.
      let suppressClick = false;
      const onClick = (e) => {
        if (suppressClick) {e.preventDefault();e.stopPropagation();}
      };

      const collapseAll = () => {
        track.querySelectorAll(".sw-item").forEach((it) => collapseCard(it));
      };

      track.addEventListener("mouseover", onOver);
      track.addEventListener("mouseout", onOut);
      track.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      track.addEventListener("wheel", onWheel, { passive: false });
      track.addEventListener("click", onClick, true);

      const onResizeMq = () => {half = track.scrollWidth / 2;wrap();apply();};
      window.addEventListener("resize", onResizeMq);

      prev = performance.now();
      raf = requestAnimationFrame(frame);

      // Idle the marquee loop while the carousel is off-screen.
      const io = new IntersectionObserver((entries) => {
        const nowVisible = entries.some((e) => e.isIntersecting);
        if (nowVisible === visible) return;
        visible = nowVisible;
        if (visible && !raf) { prev = performance.now(); raf = requestAnimationFrame(frame); }
      }, { rootMargin: "200px" });
      io.observe(carousel);

      return () => {
        io.disconnect();
        cancelAnimationFrame(raf);
        track.removeEventListener("mouseover", onOver);
        track.removeEventListener("mouseout", onOut);
        track.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        track.removeEventListener("wheel", onWheel);
        track.removeEventListener("click", onClick, true);
        window.removeEventListener("resize", onResizeMq);
      };
    }
    marqueeCleanup = setupMarquee();

    // Sample dominant colours for the per-card tints.
    SHOWCASE_BOOKS.forEach((b, i) => {
      const els = tintRefs.current.filter((e) => e && e.dataset.book === String(i));
      if (!els.length) return;
      const im = new Image();
      im.onload = () => {
        const tint = dominantTint(im);
        if (tint) els.forEach((e) => e.style.setProperty("--tint", tint));
      };
      im.src = b.cover;
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (killed) return;
        build();
        ScrollTrigger.refresh();
      });
    } else {
      build();
    }

    const onResize = () => render(lastP);
    window.addEventListener("resize", onResize);

    return () => {
      killed = true;
      window.removeEventListener("resize", onResize);
      if (marqueeCleanup) marqueeCleanup();
      if (st) st.kill();
      if (entryTl) entryTl.kill();
      if (exitST) exitST.kill();
    };
  }, []);

  const headLine = (text) => {
    const parts = text.split(" ");
    return parts.map((w, k) => {
      const idx = hIdx++;
      return (
        <span key={idx} className="sw-word" ref={(el) => {if (el) headWordRefs.current[idx] = el;}} style={{ letterSpacing: "-0.02em", fontWeight: "700" }}>
          {w}{k < parts.length - 1 ? " " : ""}
        </span>);

    });
  };
  const bodyText = (text) => {
    const parts = text.split(" ");
    return parts.map((w, k) =>
    <span key={k} className="sw-word" ref={(el) => {if (el) bodyWordRefs.current[k] = el;}}>
        {w}{k < parts.length - 1 ? " " : ""}
      </span>);

  };

  // two copies of the books for a seamless marquee loop
  const loop = SHOWCASE_BOOKS.concat(SHOWCASE_BOOKS);

  return (
    <section
      ref={sectionRef}
      data-screen-label="03 Summaries"
      data-no-autofade=""
      className="sw-section">

      <div ref={pinRef} className="sw-pin">
        {/* Centered heading block — rises up on scroll */}
        <div ref={headRef} className="sw-head">
          <h2 className="sw-h2">
            <span className="sw-line" ref={(el) => {if (el) lineRefs.current[0] = el;}}>{headLine("Summaries Across Every")}</span>
            <span className="sw-line" ref={(el) => {if (el) lineRefs.current[1] = el;}}>{headLine("Subject That Matters")}</span>
          </h2>
          <p className="sw-sub" ref={(el) => {if (el) lineRefs.current[2] = el;}}>
            {bodyText("From boardroom strategy to personal growth, Flicker App covers the books shaping how people think, work, and live.")}
          </p>
        </div>

        {/* Auto-looping carousel — revealed as the block rises */}
        <div ref={carouselRef} className="sw-carousel" style={{ opacity: 0 }}>
          <div className="sw-track">
            {loop.map((b, i) => {
              const bookIdx = i % SHOWCASE_BOOKS.length;
              return (
                <div key={i} className="sw-item" role="listitem"
                onMouseEnter={(e) => expandCard(e.currentTarget)}
                onMouseLeave={(e) => collapseCard(e.currentTarget)}>
                  <div
                    className="sw-card"
                    data-book={bookIdx}
                    ref={(el) => {if (el) tintRefs.current[i] = el;}} style={{ borderRadius: "18px" }}>

                    <div className="sw-card-bg"></div>
                    <img className="sw-cover" src={b.cover} alt={b.title} loading="lazy" />
                    <div className="sw-meta">
                      <h3 className="sw-title">{b.title}</h3>
                      {b.author ? <p className="sw-author">{b.author}</p> : null}
                      <p className="sw-desc">{b.desc}</p>
                      <span className="sw-tag">{b.genre}</span>
                      <a className="sw-btn" href="#">Start Learning</a>
                    </div>
                  </div>
                </div>);

            })}
          </div>
        </div>
      </div>
    </section>);

}

window.SubjectShowcase = SubjectShowcase;