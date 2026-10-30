import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import PostCard from "./PostCard";
import Pagination from "./Pagination";
import { getCategories, isIndexable, type Post } from "@/lib/blog";
import { blogListJsonLd, breadcrumbJsonLd } from "@/lib/seo";

/** Shared listing view for /blog, /blog/page/[n] and /blog/category/[slug]. */
export default async function BlogIndex({
  posts,
  page,
  totalPages,
  activeCategory,
  path,
  title,
  intro,
  eyebrow,
}: {
  posts: Post[];
  page: number;
  totalPages: number;
  activeCategory?: { slug: string; title: string };
  path: string;
  title: React.ReactNode;
  intro: string;
  eyebrow?: string;
}) {
  const categories = await getCategories();
  const [first, ...rest] = posts;
  const featured = page === 1 && !activeCategory && first;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    ...(activeCategory ? [{ name: activeCategory.title, path }] : []),
  ];
  return (
    <main id="main">
      <div className="container page-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            {activeCategory ? (
              <>
                <li><Link href="/blog">Blog</Link></li>
                <li aria-current="page">{activeCategory.title}</li>
              </>
            ) : (
              <li aria-current="page">Blog</li>
            )}
          </ol>
        </nav>
        <p className="eyebrow eyebrow--line">{eyebrow ?? "The FINO Journal"}</p>
        <h1 className="h2">{title}</h1>
        <p className="lead">{intro}</p>
        {categories.length > 0 && (
          <nav className="chips" aria-label="Categories">
            <Link href="/blog" aria-current={!activeCategory ? "page" : undefined}>All</Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/blog/category/${c.slug}`}
                aria-current={activeCategory?.slug === c.slug ? "page" : undefined}
              >
                {c.title} <span>{c.count}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>

      <section className="container blog-list" aria-label="Articles">
        {posts.length === 0 ? (
          <p className="muted">No articles yet — new stories will appear here soon.</p>
        ) : (
          <>
            {featured && <PostCard post={first} featured />}
            <div className="post-grid" data-stagger>
              {(featured ? rest : posts).map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </>
        )}
        <Pagination page={page} totalPages={totalPages} base={activeCategory ? `/blog/category/${activeCategory.slug}` : "/blog"} />
      </section>

      <JsonLd data={blogListJsonLd(posts.filter(isIndexable), path)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </main>
  );
}
