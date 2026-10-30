/**
 * Blog data layer — CMS-ready.
 *
 * Every page reads posts ONLY through the async functions at the bottom of this
 * file. Posts come from Sanity via `fetchAllPosts()`; see README → "Sanity CMS".
 *
 * The posts below are SAMPLES so the layout can be reviewed. They are marked
 * `sample: true`, which labels them in the UI, sets `noindex`, and keeps them
 * out of the sitemap, RSS feed and structured data.
 */

import { cache } from "react";
import { sanityFetch } from "./sanity/client";
import { POSTS_QUERY } from "./sanity/queries";
import { toWebImage, type SanityImage } from "./sanity/image";
import { clean, mapSeo, portableTextToBlocks, text, type RawSeo } from "./sanity/mappers";

/** Inline text run with formatting (from the CMS rich-text editor). */
export type Span = { text: string; bold?: boolean; italic?: boolean; href?: string };

export type BlogBlock =
  | { type: "paragraph"; text: string; spans?: Span[] }
  | { type: "heading"; text: string; level?: 2 | 3 }
  | { type: "quote"; text: string; cite?: string; spans?: Span[] }
  | { type: "list"; items: string[]; ordered?: boolean; itemSpans?: Span[][] }
  | { type: "image"; src: string; alt: string; width: number; height: number; caption?: string };

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO dates */
  publishedAt: string;
  updatedAt?: string;
  category: { slug: string; title: string; description?: string };
  tags: string[];
  author: { name: string; role?: string; slug?: string } | null;
  cover: { src: string; alt: string; width: number; height: number } | null;
  body: BlogBlock[];
  /** Optional SEO overrides from the CMS */
  seo?: { title?: string; description?: string; ogImage?: string; noindex?: boolean };
  /** Sample content — remove once real posts come from the CMS */
  sample?: boolean;
};

export const POSTS_PER_PAGE = 6;

const samplePosts: Post[] = [
  {
    slug: "caring-for-fine-gold-jewellery",
    title: "Caring for fine gold jewellery",
    excerpt:
      "Simple habits that keep gold looking its best — a guide jewellers can share with their own clients.",
    publishedAt: "2026-10-20",
    category: { slug: "care", title: "Care & keeping" },
    tags: ["gold", "care", "guide"],
    author: null,
    cover: { src: "/images/fino-brand-story.jpg", alt: "Close view of faceted gold beads", width: 1000, height: 1250 },
    sample: true,
    body: [
      {
        type: "paragraph",
        text: "Gold is resilient, but its finish deserves attention. A few everyday habits help a piece keep its lustre for years.",
      },
      { type: "heading", text: "Everyday wear" },
      {
        type: "list",
        items: [
          "Put jewellery on last, after perfume, lotion and hairspray.",
          "Take it off for swimming, cleaning and the gym.",
          "Store each piece separately so surfaces don't rub against one another.",
        ],
      },
      { type: "heading", text: "Gentle cleaning" },
      {
        type: "paragraph",
        text: "Warm water, a drop of mild soap and a soft brush are usually enough. Rinse, then dry with a lint-free cloth. Textured and hammered surfaces benefit from a soft brush reaching into the detail.",
      },
      {
        type: "quote",
        text: "A piece is only finished when it is worn — and only beautiful for as long as it is cared for.",
      },
      {
        type: "paragraph",
        text: "For anything beyond routine care, a professional jeweller is always the right first call.",
      },
    ],
  },
  {
    slug: "faceted-gold-light-and-form",
    title: "Faceted gold: how light and form work together",
    excerpt: "Why a faceted, hammered surface catches light differently from a polished one.",
    publishedAt: "2026-10-08",
    category: { slug: "design", title: "Design" },
    tags: ["design", "gold", "facets"],
    author: null,
    cover: { src: "/images/fino-craft-poster.jpg", alt: "Faceted gold beads on deep green", width: 1920, height: 1080 },
    sample: true,
    body: [
      {
        type: "paragraph",
        text: "A polished surface reflects light like a mirror. A faceted, hammered one breaks it into many small highlights — so the piece seems to change as it moves.",
      },
      { type: "heading", text: "Geometry" },
      {
        type: "paragraph",
        text: "Facets give gold an architectural quality: planes that meet at deliberate angles, each catching light from a different direction.",
      },
      {
        type: "image",
        src: "/images/fino-collection-01.jpg",
        alt: "The Faceted Gold Bead Necklace",
        width: 1200,
        height: 1600,
        caption: "Graduated faceted beads, each with a hammered finish.",
      },
      { type: "heading", text: "Texture" },
      {
        type: "paragraph",
        text: "Hammering adds a second, finer layer of light — a soft shimmer across each plane, rather than a single hard flash.",
      },
    ],
  },
  {
    slug: "presenting-gold-at-the-counter",
    title: "Presenting gold at the counter",
    excerpt: "Ideas for displaying fine gold so it reads beautifully in a showroom.",
    publishedAt: "2026-09-24",
    category: { slug: "trade", title: "For the trade" },
    tags: ["retail", "display", "trade"],
    author: null,
    cover: { src: "/images/fino-collection-01.jpg", alt: "Gold necklace on a cream background", width: 1200, height: 1600 },
    sample: true,
    body: [
      {
        type: "paragraph",
        text: "How a piece is shown shapes how it is seen. Calm backgrounds, controlled light and space around each piece let gold speak for itself.",
      },
      { type: "heading", text: "Light" },
      {
        type: "paragraph",
        text: "Warm, directional light brings out depth in gold; flat, cold light can make it look lifeless.",
      },
      { type: "heading", text: "Space" },
      {
        type: "list",
        ordered: true,
        items: ["Fewer pieces per display.", "Neutral, natural surfaces.", "One clear hero piece per case."],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* CMS integration point — Sanity                                      */
/* ------------------------------------------------------------------ */
type RawPost = {
  slug: string; title: string; excerpt: string | null; publishedAt: string; updatedAt: string | null;
  tags: string[] | null; category: { slug: string; title: string; description: string | null } | null;
  author: { name: string; role: string | null; slug: string | null } | null;
  cover: SanityImage; body: Parameters<typeof portableTextToBlocks>[0]; seo: RawSeo;
};

/**
 * Posts come from Sanity (studio → Blog → Posts). Until the first post is
 * published — or if Sanity isn't configured — the labelled samples are shown.
 */
const fetchAllPosts = cache(async (): Promise<Post[]> => {
  const raw = await sanityFetch<RawPost[]>(POSTS_QUERY);
  if (!raw?.length) return samplePosts;
  return raw.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? "",
    publishedAt: p.publishedAt,
    updatedAt: clean(p.updatedAt),
    category: p.category
      ? { slug: p.category.slug, title: p.category.title, description: text(p.category.description) }
      : { slug: "journal", title: "Journal" },
    tags: p.tags ?? [],
    author: p.author ? { name: p.author.name, role: clean(p.author.role), slug: clean(p.author.slug) } : null,
    cover: toWebImage(p.cover, { maxWidth: 1600 }),
    body: portableTextToBlocks(p.body),
    seo: mapSeo(p.seo),
  }));
});

export async function getAllPosts(): Promise<Post[]> {
  const posts = await fetchAllPosts();
  return [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return (await getAllPosts()).find((p) => p.slug === slug);
}

export async function getCategories(): Promise<{ slug: string; title: string; description?: string; count: number }[]> {
  const map = new Map<string, { slug: string; title: string; description?: string; count: number }>();
  for (const p of await getAllPosts()) {
    const c = map.get(p.category.slug) ?? { ...p.category, count: 0 };
    c.count += 1;
    map.set(c.slug, c);
  }
  return [...map.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export async function getPostsPage(page: number, category?: string) {
  const all = (await getAllPosts()).filter((p) => !category || p.category.slug === category);
  const totalPages = Math.max(1, Math.ceil(all.length / POSTS_PER_PAGE));
  const posts = all.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
  return { posts, page, totalPages, total: all.length };
}

export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const others = (await getAllPosts()).filter((p) => p.slug !== post.slug);
  const score = (p: Post) =>
    (p.category.slug === post.category.slug ? 2 : 0) + p.tags.filter((t) => post.tags.includes(t)).length;
  return others.sort((a, b) => score(b) - score(a)).slice(0, limit);
}

/** Indexable = real content (not a sample, not marked noindex). */
export const isIndexable = (p: Post) => !p.sample && !p.seo?.noindex;

export function readingMinutes(post: Post) {
  const words = post.body
    .map((b) => (b.type === "image" ? "" : "text" in b ? b.text : b.items.join(" ")))
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatDate(iso: string) {
  // Fixed locale + UTC so server and browser render identically.
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(iso),
  );
}
