"use client";
import React from "react";

/* =====================================================================
   Flicker — site footer (ported from Footer v2.html).
   Rendered directly inside <Listen>'s black container (.ln-belly) — the
   full-bleed black section the flipped card morphs into. There is NO
   wrapper container and NO own background: the white panel sits straight
   in the flip section's single black paint (the container provides the
   inset), so no seam can exist in either scroll direction. All CSS is
   scoped under .site-footer.
   ===================================================================== */

const FOOTER_CSS = `
  .site-footer {
    /* ---- scoped design tokens ---- */
    --surface:  #FAF9F5;   /* footer panel surface */
    --panel:    var(--surface);
    --ink:      #22191B;
    --ink-soft: #3D3034;
    --muted:    #7A6B6F;
    --hair:     #ECDFC4;
    --field:    #FBF3DE;
    --chip:     #FBF3DE;
    --chip-h:   #ECDFC4;
    --brick:    #C13441;
    --brick-h:  #A82934;
    --on-brick: #FFF9EC;
    --f-sans:    var(--font-sans);
    --f-serif:   var(--font-serif);
    --f-display: var(--font-serif-display);

    /* No wrapper, no own black — the parent .ln-belly (the flip section's
       black container) paints the only black and insets this panel. */
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    background: var(--panel);
    border-radius: clamp(20px, 2.2vw, 30px);
    padding: 30px;
    overflow: hidden;
  }
  .site-footer, .site-footer *, .site-footer *::before, .site-footer *::after { box-sizing: border-box; }
  .site-footer .footer-shell { width: 100%; margin: 0 auto; }

  .site-footer .eyebrow {
    font-family: var(--f-sans);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  /* ---- Top CTA ---- */
  .site-footer .footer-cta {
    text-align: center;
    padding: clamp(8px, 1.4vw, 26px) 0 clamp(44px, 6.5vw, 92px);
  }
  .site-footer .footer-eyebrow {
    margin: 0 auto;
    max-width: 42ch;
    color: var(--muted);
    line-height: 1.7;
  }
  .site-footer .footer-heading {
    margin: clamp(44px, 5.5vw, 84px) 0 0;
    font-family: var(--f-serif);
    font-weight: 600;
    font-size: clamp(var(--text-3xl), 12.5vw, var(--text-7xl));
    line-height: var(--leading-heading);
    letter-spacing: -0.03em;
    color: var(--ink);
    text-align: center;
    text-wrap: balance;
  }
  .site-footer .footer-cta-buttons {
    margin-top: clamp(14px, 1.6vw, 22px);
    display: flex;
    gap: 12px;            /* between-button distance — matches the hero CTAs */
    justify-content: center;
    flex-wrap: wrap;
  }
  .site-footer .btn {
    display: inline-flex;
    align-items: center;
    gap: 12px;           /* label↔arrow gap — matches the hero .cta */
    padding: 14px 28px;  /* button size — matches the hero .cta */
    font-family: var(--f-sans);
    font-size: var(--text-base);
    font-weight: 600;
    letter-spacing: -0.005em;
    line-height: 1;
    white-space: nowrap;
    text-decoration: none;
    color: var(--ink);
    border: none;
    border-radius: var(--radius-full, 999px);
    cursor: pointer;
    transition: background-color 100ms cubic-bezier(.16,1,.3,1),
                color 100ms cubic-bezier(.16,1,.3,1),
                border-color 100ms cubic-bezier(.16,1,.3,1);
  }
  .site-footer .btn .tri { width: 10px; height: 7px; display: block; opacity: 0.85; }
  /* CTA buttons follow the hero approach (see .cta in Hero v6.html):
     primary  = body-color fill (the black variant) + light text + sliding arrow;
     secondary = white fill with a neutral-grey hairline that drops on hover.
     Hierarchy + lift/scale/arrow-slide functionality mirror the hero buttons. */
  .site-footer .btn-arrow { display: inline-flex; align-items: center; }
  .site-footer .btn-arrow i { font-size: 16px; line-height: 1; display: block; }
  .site-footer .btn-primary { background: var(--ink); color: var(--on-brick); }
  .site-footer .btn-primary:hover { background: var(--ink-soft); }
  .site-footer .btn-secondary { background: #FFFFFF; color: var(--ink); border: 1px solid #E7E4DE; }
  .site-footer .btn-secondary:hover { background: #EEECE7; border-color: transparent; }

  /* ---- Main grid ---- */
  .site-footer .footer-grid {
    display: grid;
    grid-template-columns: 50% 1fr 1fr 1fr;
    gap: clamp(28px, 3vw, 56px);
    align-items: start;
    padding-bottom: clamp(176px, 26vw, 368px);
  }
  .site-footer .footer-col { min-width: 0; }
  .site-footer .footer-col-title {
    margin: 0 0 22px;
    font-family: var(--f-sans);
    font-weight: 600;
    font-size: var(--text-lg);
    line-height: 1.12;
    letter-spacing: -0.04em;
    color: var(--ink);
  }
  .site-footer .footer-newsletter .footer-col-title { max-width: 16ch; }

  /* ---- Newsletter (Shadcn Input — exact styles from Figma) ---- */
  .site-footer .newsletter-form {
    display: flex;
    align-items: center;
    gap: 12px;            /* --sm: gap between field text and Submit */
    width: 320px;        /* Figma "Vertical Field" width */
    max-width: 100%;
    min-height: 40px;
    background: #FFFFFF;             /* --general/input */
    border: 1px solid #E7E4E0;      /* --general/border */
    border-radius: 8px;             /* --rounded-lg */
    padding: 9.5px 16px;            /* --hacks-to-fit-scale/9p5 × --md */
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);   /* shadow-xs */
    overflow: hidden;
  }
  .site-footer .newsletter-form input {
    flex: 1 1 auto;
    min-width: 0;
    border: none;
    background: none;
    color: var(--ink);              /* --general/foreground */
    font-family: var(--f-sans);
    font-size: var(--text-sm);      /* paragraph/small — 14px */
    line-height: 20px;
    padding: 0;
    outline: none;
  }
  .site-footer .newsletter-form input::placeholder { color: var(--muted); }   /* --general/muted-foreground */
  .site-footer .newsletter-form button {
    flex: 0 0 auto;
    background: none;
    border: none;
    padding: 0;
    color: #71717A;                 /* --general/muted-foreground */
    font-family: var(--f-sans);
    font-size: var(--text-sm);      /* paragraph/small — 14px */
    line-height: 20px;
    cursor: pointer;
    transition: color .2s cubic-bezier(.16,1,.3,1);
  }
  .site-footer .newsletter-form button:hover { color: var(--ink); }
  .site-footer .newsletter-disclaimer {
    margin: 18px 0 0;
    max-width: 340px;
    font-family: var(--f-sans);
    font-size: var(--text-sm);
    line-height: 1.55;
    color: var(--muted);
    text-wrap: pretty;
  }

  /* ---- Link columns ---- */
  .site-footer .footer-col ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .site-footer .footer-col ul a {
    font-family: var(--f-sans);
    font-size: var(--text-base);
    font-weight: 400;
    color: var(--ink-soft);
    text-decoration: none;
    transition: color .2s cubic-bezier(.16,1,.3,1);
  }
  .site-footer .footer-col ul a:hover { color: var(--brick); }

  /* ---- Bottom bar ---- */
  .site-footer .footer-bottom {
    display: grid;
    grid-template-columns: 50% 1fr 1fr 1fr;
    align-items: center;
    gap: clamp(28px, 3vw, 56px);
    padding-top: clamp(22px, 2.4vw, 34px);
    border-top: 1px solid var(--hair);
  }
  .site-footer .footer-copyright {
    font-family: var(--f-sans);
    font-size: var(--text-sm);
    letter-spacing: 0.02em;
    color: var(--muted);
  }
  .site-footer .footer-legal {
    display: flex;
    grid-column: 2 / 4;
    justify-content: flex-start;
    gap: clamp(20px, 3vw, 44px);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .site-footer .footer-legal a {
    font-family: var(--f-sans);
    font-size: var(--text-sm);
    font-weight: 400;
    color: var(--ink-soft);
    text-decoration: none;
    white-space: nowrap;
    transition: color .2s cubic-bezier(.16,1,.3,1);
  }
  .site-footer .footer-legal a:hover { color: var(--brick); }
  .site-footer .footer-brand { grid-column: 4; justify-self: start; display: inline-flex; align-items: center; }
  .site-footer .footer-brand img { height: 21px; width: auto; display: block; }

  /* ---- Responsive ---- */
  @media (max-width: 900px) {
    .site-footer .footer-grid { grid-template-columns: 1fr 1fr; gap: 40px 28px; }
    .site-footer .footer-newsletter { grid-column: 1 / -1; }
  }
  @media (max-width: 560px) {
    .site-footer .footer-grid { grid-template-columns: 1fr; }
    .site-footer .footer-bottom { grid-template-columns: 1fr; justify-items: start; gap: 16px; }
    .site-footer .footer-legal { grid-column: auto; justify-content: flex-start; }
    .site-footer .footer-brand { grid-column: auto; justify-self: start; }
  }
`;

export function SiteFooter() {
  return (
    <React.Fragment>
      <style>{FOOTER_CSS}</style>
      <footer className="site-footer" style={{ backgroundColor: "var(--surface)" }}>
          <div className="footer-shell">

            {/* Top CTA */}
            <div className="footer-cta">
              <p className="footer-eyebrow eyebrow">Join a growing library of<br />the world’s best ideas</p>
              <h2 className="footer-heading" style={{ fontSize: "var(--text-4xl)", fontFamily: 'var(--font-serif)', color: "rgb(82, 28, 31)", letterSpacing: "-0.03em", lineHeight: "var(--leading-heading)" }}>
                <div><span style={{ color: "rgb(201, 26, 58)", fontSize: "var(--text-4xl)" }}>One Idea, Every Week</span></div>
                <div style={{ fontSize: "var(--text-4xl)" }}>Habit-framed.</div>
              </h2>
              <div className="footer-cta-buttons">
                <a href="#start" className="btn btn-primary">Become a member<span className="btn-arrow" aria-hidden="true"><i className="ph ph-arrow-right"></i></span></a>
                <a href="#download" className="btn btn-secondary"><span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}><img src="uploads/logos_apple-app-store.svg" alt="" width="20" height="20" style={{ display: "block" }} /><img src="uploads/devicon_google.svg" alt="" width="20" height="20" style={{ display: "block" }} /></span>Download The App</a>
              </div>
            </div>

            {/* Main columns */}
            <div className="footer-grid">
              <div className="footer-col footer-newsletter">
                <h3 className="footer-col-title">Never miss what’s next</h3>
                <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                  <input type="email" placeholder="Your Email" aria-label="Your email" />
                  <button type="submit">Submit</button>
                </form>
                <p className="newsletter-disclaimer">
                  By submitting your email, you’ll be the first to know about new
                  summaries and updates from Flicker App. You can unsubscribe at any time.
                </p>
              </div>

              <div className="footer-col">
                <h3 className="footer-col-title">Social</h3>
                <ul>
                  <li><a href="#instagram">Instagram</a></li>
                  <li><a href="#linkedin">LinkedIn</a></li>
                  <li><a href="#x">X (Twitter)</a></li>
                  <li><a href="#youtube">YouTube</a></li>
                  <li><a href="#bluesky">Bluesky</a></li>
                </ul>
              </div>

              <div className="footer-col">
                <h3 className="footer-col-title">Pages</h3>
                <ul>
                  <li><a href="#library">Library</a></li>
                  <li><a href="#how-it-works">How it works</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                  <li><a href="#faq">FAQ</a></li>
                  <li><a href="#blog">Blog</a></li>
                </ul>
              </div>

              <div className="footer-col">
                <h3 className="footer-col-title">Contact</h3>
                <ul>
                  <li><a href="mailto:hello@flickerapp.com">Reach us</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="footer-bottom">
              <span className="footer-copyright">© 2026 Flicker App, All Right Reserved. Made with Love.</span>
              <ul className="footer-legal">
                <li><a href="#terms">Terms &amp; conditions</a></li>
                <li><a href="#privacy">Privacy policy</a></li>
                <li><a href="#cookies">Cookies</a></li>
              </ul>
              <a className="footer-brand" href="#top" aria-label="Flicker App home">
                <img src="flicker/logo-flicker-brick.svg" alt="Flicker App" />
              </a>
            </div>

          </div>
      </footer>
    </React.Fragment>);
}

window.SiteFooter = SiteFooter;