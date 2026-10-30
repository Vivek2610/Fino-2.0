/**
 * Collection data layer — CMS-ready.
 *
 * Every page reads products ONLY through the async functions at the bottom of
 * this file. Products come from Sanity via `fetchAllProducts()` (studio →
 * Collection → Products); see README → "Sanity CMS". Until the first product
 * is published — or if Sanity isn't configured — the sample data below is used.
 *
 * `placeholder: true` items are development placeholders: labelled in the UI,
 * `noindex`, and excluded from the sitemap and structured data. Never add
 * prices, stock, certifications or specifications that are not verified.
 */

import { cache } from "react";
import { sanityFetch } from "./sanity/client";
import { PRODUCTS_QUERY } from "./sanity/queries";
import { toWebImage, type SanityImage } from "./sanity/image";
import { clean, mapSeo, text, type RawSeo } from "./sanity/mappers";

export type ProductImage = { src: string; alt: string; width: number; height: number };

export type Product = {
  slug: string;
  name: string;
  category: { slug: string; title: string; description?: string } | null;
  /** one line for cards and meta descriptions */
  summary: string;
  /** paragraphs for the detail page */
  description: string[];
  images: ProductImage[];
  /** Only verified facts, e.g. { label: "Metal", value: "18k yellow gold" } */
  details: { label: string; value: string }[];
  tags?: string[];
  /** show on the homepage selection */
  featured?: boolean;
  /** Optional SEO overrides from the CMS */
  seo?: { title?: string; description?: string; ogImage?: string; noindex?: boolean };
  placeholder: boolean;
};

const placeholder = (n: number): Product => ({
  slug: `collection-piece-${String(n).padStart(2, "0")}`,
  name: `Collection piece ${String(n).padStart(2, "0")}`,
  category: null,
  summary: "Placeholder — product name and image to be supplied.",
  description: ["Placeholder entry. Replace with a verified product name, description and photographs from the CMS."],
  images: [],
  details: [],
  featured: true,
  placeholder: true,
});

const sampleProducts: Product[] = [
  {
    slug: "faceted-gold-bead-necklace",
    name: "Faceted Gold Bead Necklace",
    category: { slug: "necklaces", title: "Necklaces" },
    summary: "A graduated strand of hammered, faceted gold beads.",
    description: [
      "Polyhedral gold beads, each surface finely hammered to catch the light, graduate in scale toward the centre of the strand.",
      "The facets break light into many small highlights, so the necklace seems to change as it moves. It is finished with a clasp and a short extender chain.",
      "Specifications and trade terms are available on enquiry.",
    ],
    images: [
      { src: "/images/fino-collection-01.jpg", alt: "Faceted Gold Bead Necklace on a cream background", width: 1200, height: 1600 },
      { src: "/images/fino-product-forest.jpg", alt: "Faceted Gold Bead Necklace on deep green", width: 1200, height: 1600 },
      { src: "/images/fino-brand-story.jpg", alt: "Close view of the hammered, faceted beads", width: 1000, height: 1250 },
      { src: "/images/fino-necklace-photo.jpg", alt: "Original product photograph of the Faceted Gold Bead Necklace", width: 1087, height: 1447 },
    ],
    details: [],
    tags: ["necklace", "gold", "faceted"],
    featured: true,
    placeholder: false,
  },
  placeholder(2),
  placeholder(3),
  placeholder(4),
];

/* ------------------------------------------------------------------ */
/* CMS integration point — Sanity                                      */
/* ------------------------------------------------------------------ */
type RawProduct = {
  slug: string; name: string; category: { slug: string; title: string; description: string | null } | null;
  summary: string | null; description: string[] | null; images: SanityImage[] | null;
  details: { label: string; value: string }[] | null; tags: string[] | null; featured: boolean | null; seo: RawSeo;
};

const fetchAllProducts = cache(async (): Promise<Product[]> => {
  const raw = await sanityFetch<RawProduct[]>(PRODUCTS_QUERY);
  if (!raw?.length) return sampleProducts;
  return raw.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category
      ? { slug: p.category.slug, title: p.category.title, description: text(p.category.description) }
      : null,
    summary: p.summary ?? "",
    description: (p.description ?? []).filter(Boolean),
    // product photography is shown at 3:4, cropped around the editor's hotspot
    images: (p.images ?? [])
      .map((img) => toWebImage(img, { aspect: 3 / 4, maxWidth: 1200, alt: p.name }))
      .filter((i): i is ProductImage => Boolean(i)),
    details: p.details ?? [],
    tags: clean(p.tags),
    featured: Boolean(p.featured),
    seo: mapSeo(p.seo),
    placeholder: false,
  }));
});

export async function getProducts(): Promise<Product[]> {
  return fetchAllProducts();
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const all = await getProducts();
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}

export async function getProductCategories(): Promise<{ slug: string; title: string; description?: string; count: number }[]> {
  const map = new Map<string, { slug: string; title: string; description?: string; count: number }>();
  for (const p of await getProducts()) {
    if (!p.category) continue;
    const c = map.get(p.category.slug) ?? { ...p.category, count: 0 };
    c.count += 1;
    map.set(c.slug, c);
  }
  return [...map.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export async function getRelatedProducts(p: Product, limit = 3): Promise<Product[]> {
  const others = (await getProducts()).filter((x) => x.slug !== p.slug);
  const score = (x: Product) =>
    (x.category && p.category && x.category.slug === p.category.slug ? 2 : 0) +
    (x.tags ?? []).filter((t) => (p.tags ?? []).includes(t)).length -
    (x.placeholder ? 1 : 0);
  return others.sort((a, b) => score(b) - score(a)).slice(0, limit);
}

export const isIndexableProduct = (p: Product) => !p.placeholder && !p.seo?.noindex;
export const primaryImage = (p: Product): ProductImage | null => p.images[0] ?? null;
