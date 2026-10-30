import { getAllPosts, isIndexable } from "@/lib/blog";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 3600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** RSS 2.0 feed of published (non-sample) posts. */
export async function GET() {
  const posts = (await getAllPosts()).filter(isIndexable);
  const items = posts
    .map(
      (p) => `<item>
  <title>${esc(p.title)}</title>
  <link>${siteConfig.url}/blog/${p.slug}</link>
  <guid isPermaLink="true">${siteConfig.url}/blog/${p.slug}</guid>
  <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
  <category>${esc(p.category.title)}</category>
  <description>${esc(p.excerpt)}</description>
</item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(siteConfig.name)} Journal</title>
  <link>${siteConfig.url}/blog</link>
  <description>${esc(siteConfig.description)}</description>
  <language>en</language>
  <atom:link href="${siteConfig.url}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
