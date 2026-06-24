"use client";
import React from "react";
import Link from "next/link";
import { useReveal } from "./use-reveal";
import { getPost, readNext, catLabel, ARTICLE } from "./blog-data";

/* =====================================================================
   BlogPost — the imported "Blog Post" page, ported to JSX and re-skinned
   onto the Flicker design system. Back-link, category eyebrow, title,
   21:9 parallax hero, a sticky meta rail (Published + Share) and a typed
   article body (lead / p / h2 / quote / img / specs), then a "Read next"
   grid. Per-post title/category/date come from blog-data; the article
   body is the shared ARTICLE sample. Scroll-reveal + hero parallax via
   useReveal({ parallax: true }).
   ===================================================================== */
const { useRef } = React;

const POST_CSS = `
  .post-page{ background:var(--bg); color:var(--flicker-body); min-height:100vh; overflow-x:hidden; }
  .post-page .reveal{ opacity:0; transform:translateY(24px);
    transition:opacity .9s var(--ease-out), transform .9s var(--ease-out); }

  .post-head{ max-width:var(--page-max); margin:0 auto; padding:var(--page-head-pad-y) var(--page-gutter) var(--page-head-pad-y); }
  .post-back{ display:inline-flex; align-items:center; gap:8px; font-family:var(--font-sans);
    font-size:var(--text-xs); letter-spacing:0.01em; color:var(--flicker-ink-mute);
    margin-bottom:30px; transition:color .2s var(--ease-out); }
  .post-back:hover{ color:var(--flicker-brick); }
  /* category Label — design-system Tag/Badge (soft): light tint bg, solid hue text.
     Hue is per-category via --cat; bg is a light mix of that hue toward white. */
  .post-eyebrow{ display:inline-flex; align-items:center; margin-bottom:18px;
    --cat:var(--flicker-brick);
    padding:5px 11px 6px; border-radius:var(--radius-full); line-height:1;
    background:color-mix(in srgb, var(--cat) 15%, #fff); color:var(--cat);
    font-family:var(--font-sans); font-size:var(--text-2xs); font-weight:var(--weight-semibold);
    letter-spacing:var(--tracking-wide); text-transform:uppercase; }
  .post-eyebrow[data-cat="Product"]{ --cat:var(--flicker-brick); }
  .post-eyebrow[data-cat="Reading"]{ --cat:var(--flicker-brunswick-green); }
  .post-eyebrow[data-cat="Community"]{ --cat:var(--flicker-prussian-blue); }
  .post-eyebrow[data-cat="Press"]{ --cat:var(--flicker-liver); }
  .post-title{ margin:0; font-family:var(--font-serif); font-size:clamp(2.1rem, 5vw, 3.6rem);
    line-height:1.05; letter-spacing:var(--tracking-tight); font-weight:var(--weight-semibold);
    color:var(--flicker-body); max-width:18ch; }

  .post-hero{ max-width:var(--page-max); margin:56px auto 0; padding:0 var(--page-gutter); }
  .post-hero-media{ position:relative; overflow:hidden; aspect-ratio:21/9; background:var(--flicker-canvas-soft);
    border-radius:var(--radius); }
  .post-hero-fill{ position:absolute; inset:-8% 0; background:var(--flicker-canvas-soft);
    display:flex; align-items:center; justify-content:center; }
  .post-hero-fill::after{ content:""; width:clamp(40px, 9%, 76px); aspect-ratio:51/52;
    background-color:var(--flicker-canvas-shade);
    -webkit-mask:url(/flicker/logo-mark-flicker.svg) center / contain no-repeat;
    mask:url(/flicker/logo-mark-flicker.svg) center / contain no-repeat; }
  .post-hero-label{ display:none; }
  /* real cover photo (royalty-free, local) fills the tile and hides the mark */
  .post-hero-media .media-img,
  .post-fig-media .media-img,
  .post-next-card .nc-media .media-img{ position:absolute; inset:0; width:100%; height:100%;
    object-fit:cover; display:block; }
  .post-hero-media[data-has-image="true"] .post-hero-fill::after,
  .post-fig-media[data-has-image="true"]::after,
  .post-next-card .nc-media[data-has-image="true"] .nc-fill::after{ display:none; }
  .post-hero-cap{ margin:14px 0 0; font-family:var(--font-sans); font-size:var(--text-sm);
    color:var(--flicker-ink-mute); letter-spacing:0.01em; }

  .post-body{ max-width:var(--page-max); margin:0 auto; padding:64px var(--page-gutter) 0;
    display:grid; grid-template-columns:200px 1fr; gap:64px; align-items:start; }
  .post-rail{ position:sticky; top:80px; display:flex; flex-direction:column; gap:30px; }
  .post-rail-label{ font-family:var(--font-sans); font-size:var(--text-2xs); text-transform:uppercase;
    letter-spacing:0.14em; color:var(--flicker-ink-mute); margin-bottom:8px; }
  .post-rail-value{ font-family:var(--font-sans); font-size:var(--text-sm); color:var(--flicker-body); }
  .post-shares{ display:flex; flex-direction:column; gap:9px; align-items:flex-start; }
  .post-shares a{ font-family:var(--font-sans); font-size:var(--text-sm); color:var(--flicker-ink-mute);
    transition:color .2s var(--ease-out); }
  .post-shares a:hover{ color:var(--flicker-brick); }

  .post-article{ max-width:var(--page-prose); }
  .post-lead{ margin:0 0 26px; font-family:var(--font-sans); font-size:var(--text-lg); line-height:1.5;
    letter-spacing:-0.012em; color:var(--flicker-ink-soft); font-weight:var(--weight-regular); }
  .post-p{ margin:0 0 24px; font-family:var(--font-sans); font-size:var(--text-base); line-height:1.72;
    color:var(--flicker-ink-soft); }
  .post-h2{ margin:44px 0 18px; font-family:var(--font-serif); font-size:var(--text-xl);
    line-height:var(--leading-heading); letter-spacing:-0.015em;
    font-weight:var(--weight-semibold); color:var(--flicker-body); }
  .post-quote{ margin:36px 0; padding-left:22px; border-left:2px solid var(--flicker-brick);
    font-family:var(--font-serif); font-style:italic; font-size:var(--text-lg); line-height:1.42;
    letter-spacing:-0.018em; font-weight:var(--weight-semibold); color:var(--flicker-body); }
  .post-fig{ margin:38px 0; }
  .post-fig-media{ position:relative; overflow:hidden; aspect-ratio:16/9; background:var(--flicker-canvas-soft);
    border-radius:var(--radius); display:flex; align-items:center; justify-content:center; }
  .post-fig-media::after{ content:""; width:clamp(36px, 11%, 64px); aspect-ratio:51/52;
    background-color:var(--flicker-canvas-shade);
    -webkit-mask:url(/flicker/logo-mark-flicker.svg) center / contain no-repeat;
    mask:url(/flicker/logo-mark-flicker.svg) center / contain no-repeat; }
  .post-fig-media span{ display:none; }
  .post-fig figcaption{ margin:12px 0 0; font-family:var(--font-sans); font-size:var(--text-sm);
    color:var(--flicker-ink-mute); letter-spacing:0.01em; }
  .post-specs{ margin:38px 0; border:1px solid var(--flicker-canvas-shade); }
  .post-specs-title{ padding:14px 20px; border-bottom:1px solid var(--flicker-canvas-shade);
    font-family:var(--font-sans); font-size:var(--text-2xs); text-transform:uppercase;
    letter-spacing:0.14em; color:var(--flicker-ink-mute); }
  .post-specs-row{ display:grid; grid-template-columns:140px 1fr; gap:16px; padding:14px 20px;
    font-family:var(--font-sans); font-size:var(--text-sm); }
  .post-specs-row:not(:last-child){ border-bottom:1px solid rgba(34,25,27,0.08); }
  .post-specs-row .k{ color:var(--flicker-ink-mute); }
  .post-specs-row .v{ color:var(--flicker-ink-soft); }

  /* read next */
  .post-next{ max-width:var(--page-max); margin:104px auto 0; padding:0 var(--page-gutter) 96px; }
  .post-next-head{ display:flex; align-items:baseline; justify-content:space-between;
    padding-bottom:22px; border-bottom:1px solid var(--flicker-canvas-shade); }
  .post-next-head h2{ margin:0; font-family:var(--font-serif); font-size:clamp(1.4rem, 2.4vw, 1.9rem);
    line-height:1; letter-spacing:-0.015em; font-weight:var(--weight-semibold);
    color:var(--flicker-body); }
  .post-next-head a{ font-family:var(--font-sans); font-size:var(--text-sm); color:var(--flicker-ink-mute);
    border-bottom:1px solid var(--flicker-canvas-shade);
    transition:color .2s var(--ease-out), border-color .2s var(--ease-out); }
  .post-next-head a:hover{ color:var(--flicker-brick); border-color:var(--flicker-brick); }
  .post-next-grid{ display:grid; grid-template-columns:repeat(3, 1fr); gap:32px; padding-top:36px; }
  .post-next-card .nc-media{ position:relative; overflow:hidden; aspect-ratio:16/10; margin-bottom:16px;
    background:var(--flicker-canvas-soft); border-radius:var(--radius); }
  .post-next-card .nc-fill{ position:absolute; inset:0; background:var(--flicker-canvas-soft);
    display:flex; align-items:center; justify-content:center;
    transition:transform 1s var(--ease-out); transform-origin:center; }
  .post-next-card .nc-fill::after{ content:""; width:clamp(28px, 13%, 52px); aspect-ratio:51/52;
    background-color:var(--flicker-canvas-shade);
    -webkit-mask:url(/flicker/logo-mark-flicker.svg) center / contain no-repeat;
    mask:url(/flicker/logo-mark-flicker.svg) center / contain no-repeat; }
  .post-next-card:hover .nc-fill{ transform:scale(1.06); }
  .post-next-card .nc-label{ display:none; }
  .post-next-card .nc-date{ display:block; font-family:var(--font-sans); font-size:var(--text-sm);
    color:var(--flicker-ink-mute); letter-spacing:0.01em; margin-bottom:8px; }
  .post-next-card .nc-title{ margin:0; font-family:var(--font-serif); font-size:var(--text-lg);
    line-height:1.32; letter-spacing:-0.015em; font-weight:var(--weight-regular);
    color:var(--flicker-body); transition:color .25s var(--ease-out); }
  .post-next-card:hover .nc-title{ color:var(--flicker-brick); }

  @media (max-width:860px){
    .post-head{ padding:var(--page-head-pad-y-sm) 24px var(--page-head-pad-y-sm); }
    .post-hero{ padding:0 24px; }
    .post-body{ grid-template-columns:1fr; gap:28px; padding:44px 24px 0; }
    .post-rail{ position:static; top:auto; flex-direction:row; gap:36px; flex-wrap:wrap; }
    .post-article{ max-width:none; }
    .post-shares{ flex-direction:row; gap:16px; flex-wrap:wrap; }
    .post-next{ padding:0 24px 64px; }
    .post-next-grid{ grid-template-columns:1fr; gap:28px; }
  }
`;

function ArticleBlock({ block, index }) {
  if (block.type === "lead") return <p className="post-lead">{block.text}</p>;
  if (block.type === "p") return <p className="post-p">{block.text}</p>;
  if (block.type === "h2") return <h2 className="post-h2">{block.text}</h2>;
  if (block.type === "quote") return <blockquote className="post-quote">{block.text}</blockquote>;
  if (block.type === "img") {
    return (
      <figure className="post-fig">
        <div className="post-fig-media" data-has-image={block.image ? "true" : undefined}>
          {block.image
            ? <img className="media-img" src={block.image} alt={block.media || ""} loading="lazy" />
            : <span>{block.media}</span>}
        </div>
        <figcaption>{block.caption}</figcaption>
      </figure>
    );
  }
  if (block.type === "specs") {
    return (
      <div className="post-specs">
        <div className="post-specs-title">{block.title}</div>
        {block.items.map((row, i) => (
          <div className="post-specs-row" key={i}>
            <span className="k">{row[0]}</span>
            <span className="v">{row[1]}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function BlogPost({ slug }) {
  const rootRef = useRef(null);
  useReveal(rootRef, { parallax: true });

  const post = getPost(slug);
  const next = readNext(post.slug);

  return (
    <React.Fragment>
      <style>{POST_CSS}</style>
      <div className="post-page" ref={rootRef} data-screen-label="Blog Post">
        {/* title */}
        <div className="post-head">
          <Link href="/blog" className="post-back reveal" data-reveal data-delay="0">
            <span aria-hidden="true">&larr;</span> Blog
          </Link>
          <div className="reveal" data-reveal data-delay="60">
            <span className="post-eyebrow" data-cat={post.cat}>{catLabel(post.cat)}</span>
            <h1 className="post-title">{post.title}</h1>
          </div>
        </div>

        {/* hero */}
        <div className="post-hero reveal" data-reveal data-delay="120">
          <div className="post-hero-media" data-has-image={post.image ? "true" : undefined}>
            <div className="post-hero-fill" data-parallax="0.12">
              {post.image
                ? <img className="media-img" src={post.image} alt={post.media || ""} />
                : <span className="post-hero-label">{post.media}</span>}
            </div>
          </div>
          <p className="post-hero-cap">{ARTICLE.heroCaption}</p>
        </div>

        {/* body: meta rail + article */}
        <div className="post-body">
          <aside className="post-rail reveal" data-reveal data-delay="80">
            <div>
              <div className="post-rail-label">Published</div>
              <div className="post-rail-value">{post.date}</div>
            </div>
            <div>
              <div className="post-rail-label">Share</div>
              <div className="post-shares">
                {ARTICLE.shares.map((s) => (
                  <a key={s} href="#">{s}</a>
                ))}
              </div>
            </div>
          </aside>

          <article className="post-article reveal" data-reveal data-delay="140">
            {ARTICLE.body.map((block, i) => (
              <ArticleBlock block={block} index={i} key={i} />
            ))}
          </article>
        </div>

        {/* read next */}
        <div className="post-next">
          <div className="post-next-head reveal" data-reveal data-delay="0">
            <h2>Read next</h2>
            <Link href="/blog">View all posts</Link>
          </div>
          <div className="post-next-grid">
            {next.map((n, i) => (
              <Link
                key={n.id}
                href={"/blog/" + n.slug}
                className="post-next-card reveal"
                data-reveal
                data-delay={i * 70}
              >
                <div className="nc-media" data-has-image={n.image ? "true" : undefined}>
                  <div className="nc-fill">
                    {n.image
                      ? <img className="media-img" src={n.image} alt={n.media || ""} loading="lazy" />
                      : <span className="nc-label">{n.media}</span>}
                  </div>
                </div>
                <span className="nc-date">{n.date}</span>
                <h3 className="nc-title">{n.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
