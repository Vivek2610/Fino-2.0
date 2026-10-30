import { notFound } from "next/navigation";
import BlogIndex from "@/components/blog/BlogIndex";
import { getCategories, getPostsPage } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;
type Params = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { category } = await params;
  const c = (await getCategories()).find((x) => x.slug === category);
  if (!c) return {};
  return pageMetadata({
    title: `${c.title} — Blog`,
    description: `Articles on ${c.title.toLowerCase()} from the FINO JEWELLERY Journal.`,
    path: `/blog/category/${c.slug}`,
  });
}

export default async function BlogCategoryPage({ params }: Params) {
  const { category } = await params;
  const c = (await getCategories()).find((x) => x.slug === category);
  if (!c) notFound();
  const { posts, page, totalPages } = await getPostsPage(1, c.slug);
  return (
    <BlogIndex
      posts={posts}
      page={page}
      totalPages={totalPages}
      activeCategory={c}
      path={`/blog/category/${c.slug}`}
      title={<>{c.title}</>}
      intro={c.description ?? `Articles on ${c.title.toLowerCase()} from the FINO Journal.`}
    />
  );
}
