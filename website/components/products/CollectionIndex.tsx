import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import ProductGrid from "./ProductGrid";
import { getProductCategories, type Product } from "@/lib/products";
import { breadcrumbJsonLd, collectionJsonLd } from "@/lib/seo";

/** Shared listing view for /collection and /collection/category/[slug]. */
export default async function CollectionIndex({
  products,
  activeCategory,
  path,
  title,
  intro,
  eyebrow,
}: {
  products: Product[];
  activeCategory?: { slug: string; title: string };
  path: string;
  title: React.ReactNode;
  intro: string;
  eyebrow?: string;
}) {
  const categories = await getProductCategories();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Collection", path: "/collection" },
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
                <li><Link href="/collection">Collection</Link></li>
                <li aria-current="page">{activeCategory.title}</li>
              </>
            ) : (
              <li aria-current="page">Collection</li>
            )}
          </ol>
        </nav>
        <p className="eyebrow eyebrow--line" data-reveal>{eyebrow ?? "The collection"}</p>
        <h1 className="h2" data-reveal>{title}</h1>
        <p className="lead" data-reveal>{intro}</p>
        {categories.length > 0 && (
          <nav className="chips" aria-label="Categories" data-reveal>
            <Link href="/collection" aria-current={!activeCategory ? "page" : undefined}>All</Link>
            {categories.map((c) => (
              <Link key={c.slug} href={`/collection/category/${c.slug}`} aria-current={activeCategory?.slug === c.slug ? "page" : undefined}>
                {c.title} <span>{c.count}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
      <section className="container collection-list" aria-label="Products">
        {products.length ? (
          <ProductGrid products={products} headingLevel={2} />
        ) : (
          <p className="muted">New pieces will appear here soon.</p>
        )}
        <aside className="trade-band" data-reveal>
          <div>
            <p className="eyebrow">For the trade</p>
            <p className="trade-band__title">Looking for specifications or trade terms?</p>
          </div>
          <Link className="btn btn--forest" href="/contact?subject=Collection%20enquiry">
            Send an enquiry
          </Link>
        </aside>
      </section>
      <JsonLd data={collectionJsonLd(products, path, activeCategory ? `${activeCategory.title} — Collection` : "Collection")} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </main>
  );
}
