import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import PostBody from "@/components/blog/PostBody";
import PostCard from "@/components/blog/PostCard";
import { formatDate, getAllPosts, getPost, getRelatedPosts, isIndexable, readingMinutes } from "@/lib/blog";
import { blogPostingJsonLd, breadcrumbJsonLd, postMetadata } from "@/lib/seo";

export const revalidate = 3600;
type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getAllPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params) {
  const p = await getPost((await params).slug);
  if (!p) return {};
  return postMetadata(p, isIndexable(p));
}

export default async function BlogPostPage({ params }: Params) {
  const p = await getPost((await params).slug);
  if (!p) notFound();
  const related = await getRelatedPosts(p);
  return (
    <main id="main">
      <article className="post">
        <header className="container post__head">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href={`/blog/category/${p.category.slug}`}>{p.category.title}</Link></li>
            </ol>
          </nav>
          <Link className="eyebrow eyebrow--line" href={`/blog/category/${p.category.slug}`}>
            {p.category.title}
          </Link>
          <h1 className="h1 post__title">{p.title}</h1>
          <p className="lead">{p.excerpt}</p>
          <p className="post-meta">
            {p.author && (
              <>
                <span>By {p.author.name}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{readingMinutes(p)} min read</span>
            {p.updatedAt && p.updatedAt !== p.publishedAt && (
              <>
                <span aria-hidden="true">·</span>
                <span>Updated <time dateTime={p.updatedAt}>{formatDate(p.updatedAt)}</time></span>
              </>
            )}
          </p>
          {p.sample && <span className="placeholder-tag">Sample post — replace via the CMS</span>}
        </header>

        {p.cover && (
          <div className="container">
            <div className="post__cover">
              <Image src={p.cover.src} alt={p.cover.alt} fill priority sizes="(min-width: 1320px) 1150px, 92vw" />
            </div>
          </div>
        )}

        <div className="container post__layout">
          <PostBody blocks={p.body} />
          {p.tags.length > 0 && (
            <ul className="post__tags" aria-label="Tags">
              {p.tags.map((t) => (
                <li key={t}>#{t}</li>
              ))}
            </ul>
          )}
          <aside className="post__cta">
            <p className="eyebrow">For the trade</p>
            <p className="post__cta-title">Interested in FINO JEWELLERY for your counter?</p>
            <Link className="btn btn--forest" href="/contact?subject=Trade%20partnership">
              Become a trade partner
            </Link>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="section section--linen" aria-labelledby="related-title">
          <div className="container">
            <div className="head-row">
              <div className="head-row__title">
                <p className="eyebrow">Keep reading</p>
                <h2 id="related-title" className="h2">More from the <em>Journal</em></h2>
              </div>
              <Link className="link" href="/blog" style={{ color: "var(--gold-deep)" }}>
                All articles <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="post-grid">
              {related.map((r) => (
                <PostCard key={r.slug} post={r} headingLevel={3} />
              ))}
            </div>
          </div>
        </section>
      )}

      {isIndexable(p) && <JsonLd data={blogPostingJsonLd(p)} />}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: p.category.title, path: `/blog/category/${p.category.slug}` },
          { name: p.title, path: `/blog/${p.slug}` },
        ])}
      />
    </main>
  );
}
