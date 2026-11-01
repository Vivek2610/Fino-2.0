import Link from "next/link";
import PostCard from "@/components/blog/PostCard";
import Title from "@/components/content/Title";
import { getAllPosts } from "@/lib/blog";
import type { HomeContent } from "@/lib/content";

export default async function BlogSection({ content }: { content: HomeContent["blog"] }) {
  const posts = (await getAllPosts()).slice(0, 3);
  const h = content.heading;
  return (
    <section className="section" id="blog" data-fx-key="blog" data-nav="light" aria-labelledby="blog-title">
      <div className="container layer">
        <div className="head-row">
          <div className="head-row__title">
            {h.eyebrow && (
              <p className="eyebrow" data-reveal>
                {h.eyebrow}
              </p>
            )}
            <h2 id="blog-title" className="h2" data-reveal>
              <Title title={h.title} emphasis={h.emphasis} />
            </h2>
          </div>
          {h.intro && (
            <p className="muted" data-reveal>
              {h.intro}
            </p>
          )}
        </div>
        {posts.length > 0 && (
          <div className="post-grid" data-stagger>
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} headingLevel={3} />
            ))}
          </div>
        )}
        <div className="section-cta">
          <Link className="btn btn--forest" href="/blog" data-reveal>
            {content.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
