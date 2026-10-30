import Image from "next/image";
import Link from "next/link";
import { primaryImage, type Product } from "@/lib/products";

export function PlaceholderMark() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 4 40 24 24 44 8 24Z" stroke="currentColor" strokeWidth="1" />
      <path d="M8 24h32M24 4v40" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}

export default function ProductCard({
  product,
  index,
  headingLevel = 3,
}: {
  product: Product;
  index: number;
  headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const img = primaryImage(product);
  const href = `/collection/${product.slug}`;
  const enquire = `/contact?subject=${encodeURIComponent(`Enquiry: ${product.name}`)}`;
  return (
    <article className="card" data-reveal="card">
      <div className="card__media">
        <span className="card__badge">Edition {String(index + 1).padStart(2, "0")}</span>
        {img ? (
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(min-width: 1100px) 23vw, (min-width: 560px) 46vw, 92vw"
          />
        ) : (
          <div className="card__placeholder">
            <PlaceholderMark />
            <span className="placeholder-tag">Image to be supplied</span>
          </div>
        )}
      </div>
      <div className="card__body">
        <span className="label">{product.category?.title ?? "To be announced"}</span>
        <H>
          <Link href={href}>{product.name}</Link>
        </H>
        <p>{product.summary}</p>
        <div className="card__foot">
          <span className="card__status">{product.placeholder ? "Placeholder" : "Trade enquiry"}</span>
          <Link className="card__cta" href={enquire} aria-label={`Enquire about ${product.name}`}>
            Inquire →
          </Link>
        </div>
      </div>
    </article>
  );
}
