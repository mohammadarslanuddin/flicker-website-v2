"use client";
import React from "react";
import { useReveal } from "./use-reveal";

/* =====================================================================
   DocTemplate — the imported "Template" page, ported to JSX and re-skinned
   onto the Flicker design system. This is the DEFAULT template for any
   page that isn't bespoke: legal docs (Privacy, Terms, Cookies…) and the
   404. Two modes:
     • document — eyebrow + title + "updated" line, a sticky "Contents"
       index (derived from the sections) and the section bodies.
     • error — centered code / title / text / back-home link (used by 404).
   Headings use Fraunces (var(--font-serif)); body uses Outfit; the accent
   is brick. Scroll-reveal comes from useReveal.
   ===================================================================== */
const { useRef } = React;

const DOC_CSS = `
  .doc-page{ background:var(--bg); color:var(--flicker-body); min-height:100vh; overflow-x:hidden; }
  .doc-page .reveal{ opacity:0; transform:translateY(20px);
    transition:opacity .85s var(--ease-out), transform .85s var(--ease-out); }

  .doc-wrap{ max-width:var(--page-max); margin:0 auto; }
  .doc-head{ padding:var(--page-head-pad-y) var(--page-gutter) var(--page-head-pad-y); }
  .doc-back{ display:inline-flex; align-items:center; gap:8px; font-family:var(--font-sans);
    font-size:var(--text-xs); letter-spacing:0.01em; color:var(--flicker-ink-mute);
    margin-bottom:30px; transition:color .2s var(--ease-out); }
  .doc-back:hover{ color:var(--flicker-brick); }
  .doc-eyebrow{ display:inline-block; font-family:var(--font-sans); font-size:var(--text-xs);
    color:var(--flicker-ink-mute); letter-spacing:0.01em; margin-bottom:18px; }
  .doc-title{ margin:0; font-family:var(--font-serif); font-size:clamp(2.1rem, 5vw, 3.6rem);
    line-height:1.05; letter-spacing:var(--tracking-tight); font-weight:var(--weight-semibold);
    color:var(--flicker-body); max-width:18ch; }
  .doc-updated{ margin:24px 0 0; font-family:var(--font-sans); font-size:var(--text-sm);
    color:var(--flicker-ink-mute); letter-spacing:0.01em; }
  .doc-divider{ max-width:var(--page-max); margin:48px auto 0; padding:0 var(--page-gutter); }
  .doc-divider > div{ height:1px; background:var(--flicker-canvas-shade); }

  .doc-body{ max-width:var(--page-max); margin:0 auto; padding:56px var(--page-gutter) 0;
    display:grid; grid-template-columns:200px 1fr; gap:64px; align-items:start; }
  .doc-toc{ position:sticky; top:96px; }
  .doc-toc-label{ font-family:var(--font-sans); font-size:var(--text-2xs); text-transform:uppercase;
    letter-spacing:0.14em; color:var(--flicker-ink-mute); margin-bottom:14px; }
  .doc-toc nav{ display:flex; flex-direction:column; gap:10px; }
  .doc-toc a{ font-family:var(--font-sans); font-size:var(--text-sm); line-height:1.4;
    color:var(--flicker-ink-mute); transition:color .2s var(--ease-out); }
  .doc-toc a:hover{ color:var(--flicker-brick); }

  .doc-content{ max-width:var(--page-prose); }
  .doc-section{ padding-bottom:44px; scroll-margin-top:96px; }
  .doc-section h2{ margin:0 0 18px; font-family:var(--font-serif); font-size:var(--text-xl);
    line-height:var(--leading-heading); letter-spacing:var(--tracking-tight);
    font-weight:var(--weight-semibold); color:var(--flicker-body); }
  .doc-section p{ margin:0 0 18px; font-family:var(--font-sans); font-size:var(--text-base);
    line-height:1.72; color:var(--flicker-ink-soft); }
  .doc-tail{ height:96px; }

  /* ---- Error / 404 ---- */
  .doc-error{ min-height:100vh; display:flex; flex-direction:column; align-items:center;
    justify-content:center; text-align:center; padding:80px var(--page-gutter); }
  .doc-error-code{ font-family:var(--font-mono); font-size:var(--text-xs); letter-spacing:0.22em;
    text-transform:uppercase; color:var(--flicker-ink-mute); margin-bottom:24px; }
  .doc-error h1{ margin:0; font-family:var(--font-serif); font-size:clamp(2.4rem, 6vw, 4.3rem);
    line-height:1.0; letter-spacing:var(--tracking-tighter); font-weight:var(--weight-semibold);
    color:var(--flicker-body); }
  .doc-error p{ margin:26px auto 0; max-width:42ch; font-family:var(--font-sans);
    font-size:var(--text-lg); line-height:1.6; color:var(--flicker-ink-mute); }
  .doc-error-link{ display:inline-flex; align-items:center; gap:9px; margin-top:40px;
    font-family:var(--font-sans); font-size:var(--text-base); letter-spacing:-0.01em;
    color:var(--flicker-body); border-bottom:1px solid var(--flicker-canvas-shade);
    padding-bottom:3px; transition:color .2s var(--ease-out), border-color .2s var(--ease-out); }
  .doc-error-link:hover{ color:var(--flicker-brick); border-color:var(--flicker-brick); }

  @media (max-width:860px){
    .doc-head{ padding:var(--page-head-pad-y-sm) 24px var(--page-head-pad-y-sm); }
    .doc-divider{ padding:0 24px; }
    .doc-body{ grid-template-columns:1fr; gap:28px; padding:40px 24px 0; }
    .doc-toc{ position:static; top:auto; }
    .doc-toc nav{ flex-direction:row; flex-wrap:wrap; gap:10px 18px; }
    .doc-content{ max-width:none; }
  }
`;

const DEFAULT_ERROR = {
  code: "Error 404",
  title: "Page not found",
  text: "The page you are looking for may have been moved, renamed, or no longer exists. Let’s get you back on track.",
};

export function DocTemplate({ doc, mode = "document", error }) {
  const rootRef = useRef(null);
  useReveal(rootRef);

  if (mode === "error") {
    const e = { ...DEFAULT_ERROR, ...(error || {}) };
    return (
      <React.Fragment>
        <style>{DOC_CSS}</style>
        <div className="doc-page" ref={rootRef} data-screen-label="Error">
          <div className="doc-error">
            <div className="reveal" data-reveal data-delay="0">
              <div className="doc-error-code">{e.code}</div>
              <h1>{e.title}</h1>
              <p>{e.text}</p>
              <div>
                <a className="doc-error-link" href="/">
                  Back to home <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  const d = doc || {};
  const sections = d.sections || [];

  return (
    <React.Fragment>
      <style>{DOC_CSS}</style>
      <div className="doc-page" ref={rootRef} data-screen-label="Document">
        {/* title */}
        <div className="doc-wrap doc-head">
          <a className="doc-back reveal" data-reveal data-delay="0" href="/">
            <span aria-hidden="true">&larr;</span> Home
          </a>
          <div className="reveal" data-reveal data-delay="60">
            {d.eyebrow ? <span className="doc-eyebrow">{d.eyebrow}</span> : null}
            <h1 className="doc-title">{d.title}</h1>
            {d.updated ? <p className="doc-updated">{d.updated}</p> : null}
          </div>
        </div>

        {/* divider */}
        <div className="doc-divider reveal" data-reveal data-delay="100">
          <div />
        </div>

        {/* index + content */}
        <div className="doc-body">
          <aside className="doc-toc reveal" data-reveal data-delay="80">
            <div className="doc-toc-label">Contents</div>
            <nav>
              {sections.map((s) => (
                <a key={s.id} href={"#" + s.id}>{s.label}</a>
              ))}
            </nav>
          </aside>

          <div className="doc-content reveal" data-reveal data-delay="140">
            {sections.map((sec) => (
              <section key={sec.id} id={sec.id} className="doc-section">
                <h2>{sec.title}</h2>
                {sec.paras.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </section>
            ))}
          </div>
        </div>
        <div className="doc-tail" />
      </div>
    </React.Fragment>
  );
}
