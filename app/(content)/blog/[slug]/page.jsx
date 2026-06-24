import { BlogPost } from "../../../../components/blog-post";
import { POSTS, getPost } from "../../../../components/blog-data";

// Pre-render the known posts; unknown slugs still resolve (getPost falls back).
export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  return { title: post.title + " — Flicker Blog" };
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <BlogPost slug={slug} />;
}
