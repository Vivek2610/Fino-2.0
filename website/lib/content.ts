/**
 * Editable page text — Home page, index pages and legal pages.
 *
 * Every text has a default (the copy the site launched with). Sanity values
 * replace a default only when filled in, so an empty field never blanks the
 * site. Edit in the studio: Home page / Other pages / Legal pages.
 */
import { cache } from "react";
import { sanityFetch } from "./sanity/client";
import { HOME_QUERY, LEGAL_PAGE_QUERY, LISTING_PAGE_QUERY } from "./sanity/queries";
import { toWebImage, type SanityImage, type WebImage } from "./sanity/image";
import { mapSeo, portableTextToBlocks, text, type RawSeo, type Seo } from "./sanity/mappers";
import type { BlogBlock } from "./blog";

export type Heading = { eyebrow?: string; title: string; emphasis?: string; intro?: string };
export type Cta = { label: string; href: string };

type RawHeading = { eyebrow: string | null; title: string | null; emphasis: string | null; intro: string | null } | null;
type RawCta = { label: string | null; href: string | null } | null;

function heading(raw: RawHeading | undefined, d: Heading): Heading {
  // the title + its italic part belong together: use the CMS pair only if a title is set
  const hasTitle = Boolean(text(raw?.title));
  return {
    eyebrow: text(raw?.eyebrow) ?? d.eyebrow,
    title: hasTitle ? text(raw?.title)! : d.title,
    emphasis: hasTitle ? text(raw?.emphasis) : d.emphasis,
    intro: text(raw?.intro) ?? d.intro,
  };
}
const cta = (raw: RawCta | undefined, d: Cta): Cta =>
  text(raw?.label) && text(raw?.href) ? { label: text(raw!.label)!, href: text(raw!.href)! } : d;

/* ------------------------------------------------------------------ */
/* Home page                                                           */
/* ------------------------------------------------------------------ */
export const HOME_DEFAULTS = {
  hero: {
    eyebrow: "Fine gold jewellery · For the trade",
    title: "Bold by Nature,",
    emphasis: "Golden by Design." as string | undefined,
    lead: "FINO JEWELLERY creates fine gold jewellery for jewellers and retailers — composed with Italian restraint and a quiet touch of Arabian elegance.",
    primaryCta: { label: "Discover our collection", href: "#collection" },
    secondaryCta: { label: "Partner with FINO", href: "#contact" },
  },
  story: {
    heading: {
      eyebrow: "Our philosophy",
      title: "One golden thread,",
      emphasis: "from facet to clasp.",
      intro:
        "FINO JEWELLERY creates fine gold jewellery for the jewellers and retailers who bring it to their own clients. We believe a piece should feel inevitable — bold in presence, exact in its making.",
    } as Heading,
    body: "Our design language pairs the clarity of Italian fashion with the geometry and light of Arabian craftsmanship: proportion, rhythm and surface, never ornament for its own sake.",
    image: {
      src: "/images/fino-brand-story.jpg",
      alt: "Close view of hammered, faceted gold beads from the FINO necklace",
      width: 1000,
      height: 1250,
    } as WebImage,
    pillars: [
      { title: "Precision", label: "Every facet considered" },
      { title: "Partnership", label: "Built for the trade" },
      { title: "Gold", label: "At the heart of it all" },
    ],
    cta: { label: "Become a trade partner", href: "#contact" },
  },
  collection: {
    heading: {
      eyebrow: "The collection",
      title: "Composed for the jeweller's counter",
      intro: "A selection for trade partners. Enquire for availability, specifications and terms.",
    } as Heading,
    featured: [] as string[],
    ctaLabel: "View the full collection",
  },
  craft: {
    heading: {
      eyebrow: "The golden current",
      title: "Light, moving",
      emphasis: "across gold",
      intro: "Hammered surfaces and sharp facets, made to hold light differently with every turn.",
    } as Heading,
    quote: "Bold by Nature, Golden by Design.",
  },
  team: {
    heading: {
      eyebrow: "Our team",
      title: "The people",
      emphasis: "behind the gold",
      intro: "Trade relationships at FINO JEWELLERY are personal. Meet the people you will work with.",
    } as Heading,
    ctaLabel: "Meet the whole team",
  },
  location: {
    heading: {
      eyebrow: "Our house & our reach",
      title: "One house.",
      emphasis: "Delivered worldwide.",
      intro:
        "A single house welcomes trade partners by appointment — and our pieces travel to jewellers across the world.",
    } as Heading,
    houseNote: "Trade partners are welcome by appointment at our single location.",
  },
  contact: {
    heading: {
      eyebrow: "Contact",
      title: "Begin a",
      emphasis: "conversation",
      intro:
        "For trade partnerships, collection enquiries or an appointment, write to us and the FINO team will reply.",
    } as Heading,
  },
  seo: undefined as Seo | undefined,
};
export type HomeContent = typeof HOME_DEFAULTS;

type RawHome = {
  hero: { eyebrow: string | null; title: string | null; emphasis: string | null; lead: string | null; primaryCta: RawCta; secondaryCta: RawCta } | null;
  story: { heading: RawHeading; body: string | null; image: SanityImage; pillars: { title: string | null; label: string | null }[] | null; cta: RawCta } | null;
  collection: { heading: RawHeading; ctaLabel: string | null; featured: (string | null)[] | null } | null;
  craft: { heading: RawHeading; quote: string | null } | null;
  team: { heading: RawHeading; ctaLabel: string | null } | null;
  location: { heading: RawHeading; houseNote: string | null } | null;
  contact: { heading: RawHeading } | null;
  seo: RawSeo;
} | null;

export const getHomeContent = cache(async (): Promise<HomeContent> => {
  const r = await sanityFetch<RawHome>(HOME_QUERY);
  const d = HOME_DEFAULTS;
  if (!r) return d;
  const heroTitle = text(r.hero?.title);
  const pillars = (r.story?.pillars ?? [])
    .map((p) => ({ title: text(p.title) ?? "", label: text(p.label) ?? "" }))
    .filter((p) => p.title);
  return {
    hero: {
      eyebrow: text(r.hero?.eyebrow) ?? d.hero.eyebrow,
      title: heroTitle ?? d.hero.title,
      emphasis: heroTitle ? text(r.hero?.emphasis) : d.hero.emphasis,
      lead: text(r.hero?.lead) ?? d.hero.lead,
      primaryCta: cta(r.hero?.primaryCta, d.hero.primaryCta),
      secondaryCta: cta(r.hero?.secondaryCta, d.hero.secondaryCta),
    },
    story: {
      heading: heading(r.story?.heading, d.story.heading),
      body: text(r.story?.body) ?? d.story.body,
      image: toWebImage(r.story?.image ?? null, { aspect: 4 / 5, maxWidth: 1000 }) ?? d.story.image,
      pillars: pillars.length ? pillars : d.story.pillars,
      cta: cta(r.story?.cta, d.story.cta),
    },
    collection: {
      heading: heading(r.collection?.heading, d.collection.heading),
      featured: (r.collection?.featured ?? []).filter((s): s is string => Boolean(s)),
      ctaLabel: text(r.collection?.ctaLabel) ?? d.collection.ctaLabel,
    },
    craft: { heading: heading(r.craft?.heading, d.craft.heading), quote: text(r.craft?.quote) ?? d.craft.quote },
    team: { heading: heading(r.team?.heading, d.team.heading), ctaLabel: text(r.team?.ctaLabel) ?? d.team.ctaLabel },
    location: {
      heading: heading(r.location?.heading, d.location.heading),
      houseNote: text(r.location?.houseNote) ?? d.location.houseNote,
    },
    contact: { heading: heading(r.contact?.heading, d.contact.heading) },
    seo: mapSeo(r.seo),
  };
});

/* ------------------------------------------------------------------ */
/* Index pages: Collection, Our Team, Blog, Contact                    */
/* ------------------------------------------------------------------ */
export const LISTING_DEFAULTS = {
  "page-collection": {
    heading: {
      eyebrow: "The collection",
      title: "Fine gold,",
      emphasis: "for the trade",
      intro: "The full FINO JEWELLERY collection. Enquire about any piece for availability, specifications and trade terms.",
    },
    meta: {
      title: "Collection",
      description: "The FINO JEWELLERY collection of fine gold jewellery for trade partners. Enquire for availability and terms.",
    },
  },
  "page-our-team": {
    heading: {
      eyebrow: "Our team",
      title: "The people",
      emphasis: "behind the gold",
      intro: "Trade relationships at FINO JEWELLERY are personal. Meet the people you will work with — select a profile to learn more.",
    },
    meta: { title: "Our Team", description: "Meet the people behind FINO JEWELLERY — the team who look after our trade partners." },
  },
  "page-blog": {
    heading: {
      eyebrow: "The FINO Journal",
      title: "Notes on",
      emphasis: "gold, design and the trade",
      intro: "Stories, guides and ideas from FINO JEWELLERY — for the jewellers and retailers we work with.",
    },
    meta: { title: "Blog", description: "Stories on fine gold jewellery, design and the trade from FINO JEWELLERY." },
  },
  "page-contact": {
    heading: HOME_DEFAULTS.contact.heading,
    meta: {
      title: "Contact",
      description: "Contact FINO JEWELLERY about trade partnerships, collection enquiries or an appointment.",
    },
  },
} satisfies Record<string, { heading: Heading; meta: { title: string; description: string } }>;

export type ListingId = keyof typeof LISTING_DEFAULTS;
export type ListingPage = { heading: Heading; meta: { title: string; description: string; ogImage?: string; noindex?: boolean } };

export const getListingPage = cache(async (id: ListingId): Promise<ListingPage> => {
  const d = LISTING_DEFAULTS[id];
  const r = await sanityFetch<{ heading: RawHeading; seo: RawSeo } | null>(LISTING_PAGE_QUERY, { id });
  const seo = mapSeo(r?.seo);
  return {
    heading: heading(r?.heading, d.heading),
    meta: {
      title: seo?.title ?? d.meta.title,
      description: seo?.description ?? d.meta.description,
      ogImage: seo?.ogImage,
      noindex: seo?.noindex,
    },
  };
});

/* ------------------------------------------------------------------ */
/* Legal pages                                                         */
/* ------------------------------------------------------------------ */
export type LegalContent = { title: string; updatedAt?: string; reviewed: boolean; body: BlogBlock[]; seo?: Seo };

/** Returns null until the page has body text in Sanity — the built-in draft is shown instead. */
export const getLegalPage = cache(async (id: "legal-privacy-policy" | "legal-terms"): Promise<LegalContent | null> => {
  const r = await sanityFetch<{
    title: string | null; updatedAt: string | null; reviewed: boolean | null;
    body: Parameters<typeof portableTextToBlocks>[0]; seo: RawSeo;
  } | null>(LEGAL_PAGE_QUERY, { id });
  const body = portableTextToBlocks(r?.body);
  if (!r || !body.length) return null;
  return {
    title: text(r.title) ?? "",
    updatedAt: text(r.updatedAt),
    reviewed: Boolean(r.reviewed),
    body,
    seo: mapSeo(r.seo),
  };
});
