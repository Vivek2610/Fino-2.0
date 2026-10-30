import BlogIndex from "@/components/blog/BlogIndex";
import { getPostsPage } from "@/lib/blog";
import { listingMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getListingPage } from "@/lib/content";
import Title from "@/components/content/Title";

export const revalidate = 3600; // refresh from the CMS hourly (ISR); publishing revalidates instantly

export async function generateMetadata() {
  return {
    ...listingMetadata(await getListingPage("page-blog"), "/blog"),
    alternates: {
      canonical: `${siteConfig.url}/blog`,
      types: { "application/rss+xml": `${siteConfig.url}/blog/rss.xml` },
    },
  };
}

export default async function BlogPage() {
  const [{ posts, page, totalPages }, listing] = await Promise.all([getPostsPage(1), getListingPage("page-blog")]);
  const h = listing.heading;
  return (
    <BlogIndex
      posts={posts}
      page={page}
      totalPages={totalPages}
      path="/blog"
      eyebrow={h.eyebrow}
      title={<Title title={h.title} emphasis={h.emphasis} />}
      intro={h.intro ?? ""}
    />
  );
}
