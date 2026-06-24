"use client";
import React from "react";
import Link from "next/link";
import { useReveal } from "./use-reveal";
import { POSTS, CATS, catLabel } from "./blog-data";

/* =====================================================================
   BlogIndex — the imported "Newsroom" page, ported to JSX and re-skinned
   onto the Flicker design system. Sticky category-filter rail + press
   email on the left; a featured post, a filterable list, and a "Load
   more" control on the right. Cards link to /blog/<slug>. Headings use
   Fraunces; media tiles are token-skinned hatch placeholders.
   ===================================================================== */
const { useRef, useState } = React;

const BLOG_CSS = `
  .blog-page{ background:var(--bg); color:var(--flicker-body); min-height:100vh; overflow-x:hidden; }
  .blog-page .reveal{ opacity:0; transform:translateY(22px);
    transition:opacity .85s var(--ease-out), transform .85s var(--ease-out); }

  .blog-head{ max-width:var(--page-max); margin:0 auto; padding:var(--page-head-pad-y) var(--page-gutter) var(--page-head-pad-y); }
  .blog-title{ margin:0; font-family:var(--font-serif); font-size:clamp(3rem, 6vw, 4.75rem);
    line-height:0.98; letter-spacing:var(--tracking-tighter); font-weight:var(--weight-semibold);
    color:var(--flicker-body); }

  .blog-main{ max-width:var(--page-max); margin:0 auto; padding:56px var(--page-gutter) 0;
    display:grid; grid-template-columns:168px 1fr; gap:60px; align-items:start; }

  /* left rail */
  .blog-rail{ position:sticky; top:96px; }
  .blog-tabs{ display:flex; flex-direction:column; gap:9px; margin-bottom:56px; }
  .blog-tab{ display:flex; align-items:center; gap:8px; border:none; background:transparent;
    cursor:pointer; text-align:left; padding:0; font-family:var(--font-sans);
    font-size:var(--text-sm); letter-spacing:-0.005em; color:var(--flicker-ink-mute);
    transition:color .2s var(--ease-out); }
  .blog-tab .dot{ width:5px; height:5px; border-radius:50%; flex:none;
    background:var(--flicker-brick); opacity:0; transition:opacity .2s var(--ease-out); }
  .blog-tab[data-active="true"]{ color:var(--flicker-body); font-weight:var(--weight-medium); }
  .blog-tab[data-active="true"] .dot{ opacity:1; }
  .blog-tab:hover{ color:var(--flicker-body); }
  .blog-press{ font-family:var(--font-sans); font-size:var(--text-xs); line-height:1.65;
    color:var(--flicker-ink-mute); letter-spacing:0.01em; max-width:18ch; }
  .blog-press a{ color:var(--flicker-ink-soft); border-bottom:1px solid var(--flicker-canvas-shade);
    transition:color .2s var(--ease-out), border-color .2s var(--ease-out); }
  .blog-press a:hover{ color:var(--flicker-brick); border-color:var(--flicker-brick); }

  /* media placeholder tile — solid canvas with the Flicker mark watermark */
  .blog-media{ position:relative; overflow:hidden; background:var(--flicker-canvas-soft);
    border-radius:var(--radius); }
  .blog-media .fill{ position:absolute; inset:0; background:var(--flicker-canvas-soft);
    display:flex; align-items:center; justify-content:center;
    transition:transform 1.05s var(--ease-out); transform-origin:center; }
  .blog-media .fill::after{ content:""; width:clamp(30px, 13%, 60px); aspect-ratio:51/52;
    background-color:var(--flicker-canvas-shade);
    -webkit-mask:url(/flicker/logo-mark-flicker.svg) center / contain no-repeat;
    mask:url(/flicker/logo-mark-flicker.svg) center / contain no-repeat; }
  .blog-media[data-has-image="true"] .fill::after{ display:none; }
  .blog-media .label{ display:none; }
  .blog-media .media-img{ position:absolute; inset:0; width:100%; height:100%;
    object-fit:cover; display:block; }

  /* featured */
  .blog-featured{ display:block; }
  .blog-featured .blog-media{ aspect-ratio:21/9; }
  .blog-featured .blog-media .label{ font-size:12px; letter-spacing:0.2em; }
  .blog-featured:hover .blog-media .fill{ transform:scale(1.04); }
  .blog-featured-row{ display:grid; grid-template-columns:168px 1fr; gap:24px; align-items:baseline;
    padding:22px 0 26px; border-bottom:1px solid var(--flicker-canvas-shade); }
  .blog-featured-date{ font-family:var(--font-sans); font-size:var(--text-sm);
    color:var(--flicker-ink-mute); letter-spacing:0.01em; }
  .blog-featured-title{ margin:0; font-family:var(--font-serif); font-size:clamp(1.4rem, 2.4vw, 1.9rem);
    line-height:1.14; letter-spacing:-0.015em; font-weight:var(--weight-semibold);
    color:var(--flicker-body); max-width:24ch; transition:color .25s var(--ease-out); }
  .blog-featured:hover .blog-featured-title{ color:var(--flicker-brick); }

  /* list row */
  .blog-row{ display:grid; grid-template-columns:96px 176px 1fr 124px; gap:24px; align-items:center;
    padding:26px 0; border-bottom:1px solid var(--flicker-canvas-shade); }
  .row-date{ font-family:var(--font-sans); font-size:var(--text-sm); color:var(--flicker-ink-mute); letter-spacing:0.01em; }
  .row-thumb{ aspect-ratio:16/10; }
  .row-thumb .label{ font-size:9px; letter-spacing:0.16em; }
  .blog-row:hover .row-thumb .fill{ transform:scale(1.07); }
  .row-title{ margin:0; font-family:var(--font-serif); font-size:var(--text-lg); line-height:1.32;
    letter-spacing:-0.015em; font-weight:var(--weight-regular); color:var(--flicker-body);
    max-width:40ch; transition:color .25s var(--ease-out); }
  .blog-row:hover .row-title{ color:var(--flicker-brick); }
  /* category Label — design-system Tag/Badge (soft): light tint bg, solid hue text.
     Hue is per-category via --cat; bg is a light mix of that hue toward white. */
  .row-cat{ justify-self:end; display:inline-flex; align-items:center; line-height:1;
    --cat:var(--flicker-brick);
    padding:4px 10px 5px; border-radius:var(--radius-full);
    background:color-mix(in srgb, var(--cat) 15%, #fff); color:var(--cat);
    font-family:var(--font-sans); font-size:var(--text-2xs); font-weight:var(--weight-semibold);
    letter-spacing:var(--tracking-wide); text-transform:uppercase; }
  .row-cat[data-cat="Product"]{ --cat:var(--flicker-brick); }
  .row-cat[data-cat="Reading"]{ --cat:var(--flicker-brunswick-green); }
  .row-cat[data-cat="Community"]{ --cat:var(--flicker-prussian-blue); }
  .row-cat[data-cat="Press"]{ --cat:var(--flicker-liver); }

  /* load more */
  .blog-more{ display:flex; justify-content:center; padding:52px 0 8px; }
  .blog-more button{ display:inline-flex; align-items:center; gap:9px; background:transparent;
    border:none; cursor:pointer; font-family:var(--font-sans); font-size:var(--text-base);
    letter-spacing:-0.01em; color:var(--flicker-body); padding:8px; transition:color .2s var(--ease-out); }
  .blog-more button:hover{ color:var(--flicker-brick); }

  .blog-empty{ font-family:var(--font-sans); color:var(--flicker-ink-mute); padding:40px 0; }
  .blog-tail{ height:96px; }

  @media (max-width:900px){
    .blog-head{ padding:var(--page-head-pad-y-sm) 24px var(--page-head-pad-y-sm); }
    .blog-main{ grid-template-columns:1fr; gap:32px; padding:36px 24px 0; }
    .blog-rail{ position:static; top:auto; }
    .blog-tabs{ flex-direction:row; flex-wrap:wrap; gap:8px 18px; margin-bottom:28px; }
    .blog-featured-row{ grid-template-columns:1fr; gap:8px; }
  }
  @media (max-width:760px){
    .blog-row{ grid-template-columns:96px 1fr; grid-template-areas:"thumb date" "thumb title";
      gap:4px 16px; padding:20px 0; }
    .row-thumb{ grid-area:thumb; }
    .row-date{ grid-area:date; align-self:end; }
    .row-title{ grid-area:title; align-self:start; }
    .row-cat{ display:none; }
  }
`;

function MediaTile({ className, label, image }) {
  return (
    <div className={"blog-media " + (className || "")} data-has-image={image ? "true" : undefined}>
      <div className="fill">
        {image
          ? <img className="media-img" src={image} alt={label || ""} loading="lazy" />
          : <span className="label">{label}</span>}
      </div>
    </div>
  );
}

export function BlogIndex() {
  const rootRef = useRef(null);
  const [filter, setFilter] = useState("All");
  const [visible, setVisible] = useState(8);

  const filtered = filter === "All" ? POSTS : POSTS.filter((p) => p.cat === filter);
  const featured = filtered[0] || null;
  const rest = filtered.slice(1);
  const visibleRest = rest.slice(0, visible);
  const hasMore = rest.length > visible;

  useReveal(rootRef, { revealKey: filter + ":" + visible });

  const select = (key) => { setFilter(key); setVisible(8); };

  return (
    <React.Fragment>
      <style>{BLOG_CSS}</style>
      <div className="blog-page" ref={rootRef} data-screen-label="Blog">
        <div className="blog-head">
          <h1 className="blog-title reveal" data-reveal data-delay="0">Blog</h1>
        </div>

        <div className="blog-main">
          {/* left rail */}
          <aside className="blog-rail reveal" data-reveal data-delay="120">
            <nav className="blog-tabs">
              {CATS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className="blog-tab"
                  data-active={c.key === filter}
                  onClick={() => select(c.key)}
                >
                  <span className="dot" />
                  {c.label}
                </button>
              ))}
            </nav>
            <div className="blog-press">
              For all press inquiries<br />
              <a href="mailto:blogs@flickerapp.com">blogs@flickerapp.com</a>
            </div>
          </aside>

          {/* content */}
          <div>
            {featured ? (
              <Link href={"/blog/" + featured.slug} className="blog-featured reveal" data-reveal data-delay="60">
                <MediaTile label={featured.media} image={featured.image} />
                <div className="blog-featured-row">
                  <span className="blog-featured-date">{featured.date}</span>
                  <h2 className="blog-featured-title">{featured.title}</h2>
                </div>
              </Link>
            ) : (
              <p className="blog-empty">No posts in this category yet.</p>
            )}

            {visibleRest.map((post, i) => (
              <Link
                key={post.id}
                href={"/blog/" + post.slug}
                className="blog-row reveal"
                data-reveal
                data-delay={i * 60}
              >
                <span className="row-date">{post.date}</span>
                <MediaTile className="row-thumb" label={post.media} image={post.image} />
                <h3 className="row-title">{post.title}</h3>
                <span className="row-cat" data-cat={post.cat}>{catLabel(post.cat)}</span>
              </Link>
            ))}

            {hasMore ? (
              <div className="blog-more">
                <button type="button" onClick={() => setVisible((v) => v + 6)}>
                  Load more posts <span aria-hidden="true">&darr;</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="blog-tail" />
      </div>
    </React.Fragment>
  );
}
