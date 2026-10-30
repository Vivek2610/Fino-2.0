import Image from "next/image";
import Link from "next/link";
import type { BlogBlock, Span } from "@/lib/blog";

/** Inline formatting from the CMS: bold, italic and links. */
function Rich({ spans, fallback }: { spans?: Span[]; fallback: string }) {
  if (!spans?.length) return <>{fallback}</>;
  return (
    <>
      {spans.map((s, i) => {
        let node: React.ReactNode = s.text;
        if (s.bold) node = <strong>{node}</strong>;
        if (s.italic) node = <em>{node}</em>;
        if (s.href) {
          const internal = s.href.startsWith("/") || s.href.startsWith("#");
          node = internal ? (
            <Link href={s.href}>{node}</Link>
          ) : (
            <a href={s.href} target="_blank" rel="noopener noreferrer">
              {node}
            </a>
          );
        }
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}

/** Renders CMS body blocks as semantic HTML. Extend here for new block types. */
export default function PostBody({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="post-body">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "paragraph":
            return (
              <p key={i}>
                <Rich spans={b.spans} fallback={b.text} />
              </p>
            );
          case "heading":
            return b.level === 3 ? <h3 key={i}>{b.text}</h3> : <h2 key={i}>{b.text}</h2>;
          case "quote":
            return (
              <blockquote key={i}>
                <p>
                  <Rich spans={b.spans} fallback={b.text} />
                </p>
                {b.cite && <cite>{b.cite}</cite>}
              </blockquote>
            );
          case "list": {
            const items = b.items.map((t, j) => (
              <li key={j}>
                <Rich spans={b.itemSpans?.[j]} fallback={t} />
              </li>
            ));
            return b.ordered ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>;
          }
          case "image":
            return (
              <figure key={i}>
                <Image src={b.src} alt={b.alt} width={b.width} height={b.height} sizes="(min-width: 800px) 720px, 92vw" />
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
