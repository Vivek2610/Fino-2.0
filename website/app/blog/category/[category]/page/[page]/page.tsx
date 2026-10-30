import { notFound, redirect } from "next/navigation";
import BlogIndex from "@/components/blog/BlogIndex";
import { getCategories, getPostsPage } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;
type Params = { params: Promise<{ category: string; page: string }> };

export async function generateMetadata({ params }: Params) {
  const { category, page } = await params;
  const c = (await getCategories()).find((x) => x.slug === category);
  if (!c) return {};
  return pageMetadata({ title: `${c.title} — Blog, page ${page}`, path: `/blog/category/${c.slug}/page/${page}` });
}

export default async function BlogCategoryPagedPage({ params }: Params) {
  const { category, page: raw } = await params;
  const c = (await getCategories()).find((x) => x.slug === category);
  if (!c) notFound();
  const n = Number(raw);
  if (n === 1) redirect(`/blog/category/${c.slug}`);
  if (!Number.isInteger(n) || n < 1) notFound();
  const { posts, page, totalPages } = await getPostsPage(n, c.slug);
  if (n > totalPages) notFound();
  return (
    <BlogIndex
      posts={posts}
      page={page}
      totalPages={totalPages}
      activeCategory={c}
      path={`/blog/category/${c.slug}/page/${n}`}
      title={<>{c.title} <em>· page {n}</em></>}
      intro={`Articles on ${c.title.toLowerCase()} from the FINO Journal.`}
    />
  );
}
