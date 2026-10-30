import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import ProductGallery from "@/components/products/ProductGallery";
import ProductGrid from "@/components/products/ProductGrid";
import { PlaceholderMark } from "@/components/products/ProductCard";
import { getProduct, getProducts, getRelatedProducts } from "@/lib/products";
import { breadcrumbJsonLd, productJsonLd, productMetadata } from "@/lib/seo";

export const revalidate = 3600;
type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params) {
  const p = await getProduct((await params).slug);
  return p ? productMetadata(p) : {};
}

export default async function ProductPage({ params }: Params) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const related = await getRelatedProducts(p);
  const enquire = `/contact?subject=${encodeURIComponent(`Enquiry: ${p.name}`)}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Collection", path: "/collection" },
    ...(p.category ? [{ name: p.category.title, path: `/collection/category/${p.category.slug}` }] : []),
    { name: p.name, path: `/collection/${p.slug}` },
  ];
  return (
    <main id="main">
      <div className="container page-head page-head--tight">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/collection">Collection</Link></li>
            {p.category && (
              <li><Link href={`/collection/category/${p.category.slug}`}>{p.category.title}</Link></li>
            )}
            <li aria-current="page">{p.name}</li>
          </ol>
        </nav>
      </div>

      <article className="container product-detail">
        <div data-reveal="clip">
          {p.images.length ? (
            <ProductGallery images={p.images} name={p.name} />
          ) : (
            <div className="gallery__main">
              <div className="card__placeholder">
                <PlaceholderMark />
                <span className="placeholder-tag">Image to be supplied</span>
              </div>
            </div>
          )}
        </div>

        <div className="product-detail__info">
          {p.category ? (
            <Link className="eyebrow eyebrow--line" href={`/collection/category/${p.category.slug}`} data-reveal>
              {p.category.title}
            </Link>
          ) : (
            <p className="eyebrow eyebrow--line" data-reveal>The collection</p>
          )}
          <h1 className="h2" data-reveal>{p.name}</h1>
          {p.placeholder && <span className="placeholder-tag">Placeholder product</span>}
          <p className="lead" data-reveal>{p.summary}</p>
          <div className="product-detail__desc" data-reveal>
            {p.description.map((d, i) => (
              <p key={i}>{d}</p>
            ))}
          </div>
          <dl className="detail-list" data-reveal>
            {p.details.length > 0 ? (
              p.details.map((d) => (
                <div key={d.label}>
                  <dt>{d.label}</dt>
                  <dd>{d.value}</dd>
                </div>
              ))
            ) : (
              <div>
                <dt>Specifications</dt>
                <dd>Available on enquiry.</dd>
              </div>
            )}
            <div>
              <dt>Availability</dt>
              <dd>For trade partners — enquire for terms.</dd>
            </div>
          </dl>
          <div className="product-detail__actions" data-reveal>
            <Link className="btn btn--forest" href={enquire}>
              Enquire about this piece
            </Link>
            <Link className="link" href="/collection" style={{ color: "var(--gold-deep)" }}>
              <span aria-hidden="true">←</span> Back to the collection
            </Link>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="section section--linen" aria-labelledby="related-title">
          <div className="container">
            <div className="head-row">
              <div className="head-row__title">
                <p className="eyebrow" data-reveal>You may also like</p>
                <h2 id="related-title" className="h2" data-reveal>More from the <em>collection</em></h2>
              </div>
            </div>
            <ProductGrid products={related} />
          </div>
        </section>
      )}

      <JsonLd data={productJsonLd(p)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </main>
  );
}
