import { notFound, redirect } from "next/navigation";
import BlogIndex from "@/components/blog/BlogIndex";
import { getAllPosts, getPostsPage, POSTS_PER_PAGE } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;
type Params = { params: Promise<{ page: string }> };

export async function generateStaticParams() {
  const pages = Math.ceil((await getAllPosts()).length / POSTS_PER_PAGE);
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ page: String(i + 2) }));
}

export async function generateMetadata({ params }: Params) {
  const { page } = await params;
  return pageMetadata({ title: `Blog — page ${page}`, path: `/blog/page/${page}` });
}

export default async function BlogPagedPage({ params }: Params) {
  const n = Number((await params).page);
  if (n === 1) redirect("/blog");
  if (!Number.isInteger(n) || n < 1) notFound();
  const { posts, page, totalPages } = await getPostsPage(n);
  if (n > totalPages) notFound();
  return (
    <BlogIndex
      posts={posts}
      page={page}
      totalPages={totalPages}
      path={`/blog/page/${n}`}
      title={<>Blog <em>· page {n}</em></>}
      intro="Stories, guides and ideas from FINO JEWELLERY."
    />
  );
}
