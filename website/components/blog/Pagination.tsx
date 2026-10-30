import Link from "next/link";

const href = (base: string, n: number) => (n === 1 ? base : `${base}/page/${n}`);

/** Crawlable pagination (plain links, rel=prev/next). */
export default function Pagination({ page, totalPages, base = "/blog" }: { page: number; totalPages: number; base?: string }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Blog pages">
      {page > 1 ? (
        <Link className="link" href={href(base, page - 1)} rel="prev">
          <span aria-hidden="true">←</span> Newer
        </Link>
      ) : (
        <span />
      )}
      <ol>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <Link href={href(base, n)} aria-current={n === page ? "page" : undefined}>
              {n}
            </Link>
          </li>
        ))}
      </ol>
      {page < totalPages ? (
        <Link className="link" href={href(base, page + 1)} rel="next">
          Older <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
