/* =====================================================================
   Blog data — ported from the imported "Newsroom" / "Blog Post" design,
   re-themed to Flicker's world (AI book summaries). Drives the blog
   index (filter + featured + list) and the single-post template.
   No CMS: one fully-authored sample article (ARTICLE) is reused for
   every post slug; per-post title / category / date come from POSTS.
   ===================================================================== */

export const CATS = [
  { key: "All", label: "All" },
  { key: "Product", label: "Product" },
  { key: "Reading", label: "Reading" },
  { key: "Community", label: "Community" },
  { key: "Press", label: "Press Releases" },
];

// Public-facing label for a post's category (singular-ish, for the list rail).
const CAT_LABEL = {
  Product: "Product",
  Reading: "Reading",
  Community: "Community",
  Press: "Press Release",
};
export function catLabel(key) {
  return CAT_LABEL[key] || key;
}

export function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// `image` (optional): a real cover photo (royalty-free, served locally from
// public/uploads/blog/). Posts without one fall back to the Flicker-mark
// placeholder tile — intentionally left on a few so both states are visible.
const RAW_POSTS = [
  { id: 1, cat: "Product", date: "Jun 18 2026", media: "Flicker 3.0 hero", image: "/uploads/blog/flicker-3-hero.jpg", title: "Introducing Flicker 3.0: the fastest way to finish a book" },
  { id: 2, cat: "Reading", date: "Jun 02 2026", media: "Micro-reading", image: "/uploads/blog/micro-reading.jpg", title: "The 12-minute habit: how micro-reading rewires your week" },
  { id: 3, cat: "Community", date: "May 21 2026", media: "Readers", title: "Community spotlight: the lifelong learners powering Flicker" },
  { id: 4, cat: "Press", date: "May 09 2026", media: "Studio", title: "Flicker raises Series B to bring big ideas to more readers" },
  { id: 5, cat: "Product", date: "Apr 27 2026", media: "Listen mode", image: "/uploads/blog/listen-audio.jpg", title: "Designing Listen: the story behind our audio summaries" },
  { id: 6, cat: "Reading", date: "Apr 12 2026", media: "Retention", title: "Inside the system that helps key ideas actually stick" },
  { id: 7, cat: "Community", date: "Mar 30 2026", media: "Reader stories", image: "/uploads/blog/reader-stories.jpg", title: "From skim to deep-read: reader stories from 2026" },
  { id: 8, cat: "Press", date: "Mar 14 2026", media: "Publishers", title: "Flicker partners with leading publishers for official summaries" },
  { id: 9, cat: "Reading", date: "Feb 26 2026", media: "Curation", image: "/uploads/blog/curation.jpg", title: "Curation at Flicker: how we pick the ideas worth your minutes" },
  { id: 10, cat: "Product", date: "Feb 08 2026", media: "Calm reader", title: "Building a calmer reader: our approach to focused reading" },
  { id: 11, cat: "Community", date: "Jan 22 2026", media: "Fellows", title: "Meet the Flicker Fellows championing a reading habit" },
  { id: 12, cat: "Press", date: "Jan 10 2026", media: "Milestone", title: "Flicker reaches 10 million curious minds worldwide" },
];

export const POSTS = RAW_POSTS.map((p) => ({ ...p, slug: slugify(p.title) }));

// One fully-authored sample article, reused for every slug (placeholder copy).
export const ARTICLE = {
  heroCaption: "Flicker 3.0 running on the redesigned reading surface (Illustration: Flicker)",
  shares: ["Copy link", "X", "LinkedIn", "Facebook"],
  body: [
    { type: "lead", text: "Today we are introducing Flicker 3.0 — the biggest update to the way we read, listen, and remember big ideas since we started. It is built around a single belief: the world's best thinking should fit into the gaps of a busy day." },
    { type: "p", text: "For the past year our team has been rethinking the summary itself, from the source text up. The result is a calmer reader that surfaces a book's core argument the moment you open it, keeps every idea in its original context, and never makes finishing feel like a chore. Everything that used to feel like work now happens quietly, in the background." },
    { type: "p", text: "We started where most people start — opening the app with twelve spare minutes — and asked what was getting in the way. The answer was almost always the same: too much to read, chosen too late. Flicker 3.0 moves that choice earlier and out of sight, so the page stays out of your way until the moment you actually want to dive deeper." },
    { type: "img", media: "Reading surface — close-up", image: "/uploads/blog/reading-surface.jpg", caption: "The redesigned reading surface keeps the next idea within a thumb's reach." },
    { type: "h2", text: "Big ideas, distilled the moment they land" },
    { type: "p", text: "At the core of 3.0 is a new curation engine that profiles a book in real time. Arguments keep their nuance, evidence stays attached to its claim, and dense chapters are reconciled into a clear through-line before you ever see a summary. It is the kind of work that should be invisible — and now it is." },
    { type: "quote", text: "The best summary is the one that makes you think, not just skim. 3.0 is our clearest expression of that idea yet." },
    { type: "p", text: "We also rebuilt Listen to draw from the same source as the written summary, so switching between reading and listening is instant and never loses your place. Highlights, notes, and your weekly idea all flow from one continuous library." },
    { type: "specs", title: "What's new in 3.0", items: [
      ["Summaries", "The core of any book in ~12 minutes"],
      ["Listen", "Studio-quality audio for every title"],
      ["Highlights", "Save and revisit the ideas that matter"],
      ["Library", "Fresh titles added every week"],
    ] },
    { type: "p", text: "Flicker 3.0 begins rolling out today and will reach everyone over the coming weeks. We cannot wait to see what you read with it." },
  ],
};

export function getPost(slug) {
  return POSTS.find((p) => p.slug === slug) || POSTS[0];
}

// Up to three "read next" cards — other posts, newest first.
export function readNext(slug, n = 3) {
  return POSTS.filter((p) => p.slug !== slug).slice(0, n);
}
