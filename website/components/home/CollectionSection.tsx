import Image from "next/image";
import Link from "next/link";
import ProductGrid from "@/components/products/ProductGrid";
import { getFeaturedProducts, getProducts } from "@/lib/products";
import { siteConfig } from "@/lib/site-config";
import Title from "@/components/content/Title";
import type { HomeContent } from "@/lib/content";

export default async function CollectionSection({ content }: { content: HomeContent["collection"] }) {
  const h = content.heading;
  // Products picked on the Home page in the CMS (in that order), else the "featured" ones
  const all = await getProducts();
  const picked = content.featured
    .map((slug) => all.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const products = picked.length ? picked.slice(0, 8) : await getFeaturedProducts(4);
  return (
    <section
      className="section section--linen collection"
      id="collection"
      data-fx-key="collection"
      data-nav="light"
      aria-labelledby="collection-title"
    >
      <div className="container layer">
        <div className="head-row">
          <div className="head-row__title">
            {h.eyebrow && (
              <p className="eyebrow" data-reveal>
                {h.eyebrow}
              </p>
            )}
            <h2 id="collection-title" className="h2" data-reveal>
              <Title title={h.title} emphasis={h.emphasis} />
            </h2>
          </div>
          {h.intro && (
            <p className="muted" data-reveal>
              {h.intro}
            </p>
          )}
        </div>
        <ProductGrid products={products} />

        {/* Finale of the necklace journey: the strand comes to rest just below,
            and the logo facets reassemble into this exact logo. */}
        <div className="collection__finale">
          <Link className="btn btn--forest" href="/collection" data-reveal>
            {content.ctaLabel}
          </Link>
          <div className="collection__seal" aria-hidden="true">
            <span className="collection__rule" />
            <Image
              id="fx-final-logo"
              className="collection__logo fx-static"
              src={siteConfig.logo.src}
              alt=""
              width={siteConfig.logo.width}
              height={siteConfig.logo.height}
            />
            <span className="collection__rule" />
          </div>
        </div>
      </div>
    </section>
  );
}
