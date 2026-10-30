import Image from "next/image";
import Link from "next/link";
import { formatDate, readingMinutes, type Post } from "@/lib/blog";

export default function PostCard({ post, featured = false, headingLevel = 2 }: { post: Post; featured?: boolean; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className={`card post-card${featured ? " post-card--featured" : ""}`} data-reveal="card">
      <div className="card__media post-card__media">
        <span className="card__badge">{post.category.title}</span>
        {post.cover && (
          <Image
            src={post.cover.src}
            alt={post.cover.alt}
            fill
            sizes={featured ? "(min-width: 900px) 55vw, 92vw" : "(min-width: 1100px) 30vw, (min-width: 640px) 46vw, 92vw"}
          />
        )}
      </div>
      <div className="card__body">
        <p className="post-meta">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{readingMinutes(post)} min read</span>
        </p>
        <H className="post-card__title">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </H>
        <p>{post.excerpt}</p>
        <div className="card__foot">
          <span className="card__status">{post.sample ? "Sample post" : post.category.title}</span>
          <span className="card__cta" aria-hidden="true">Read →</span>
        </div>
      </div>
    </article>
  );
}
