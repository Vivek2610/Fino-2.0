/**
 * Team data layer — CMS-ready.
 *
 * Every page reads team members ONLY through the async functions at the bottom
 * of this file. People come from Sanity via `fetchAllMembers()` (studio →
 * Team members); see README → "Sanity CMS". Until the first person is
 * published — or if Sanity isn't configured — the placeholders below are used.
 *
 * The entries below are clearly marked PLACEHOLDERS: labelled in the UI,
 * `noindex`, and excluded from the sitemap and structured data. Replace them
 * with real people, roles and biographies supplied by FINO JEWELLERY — never
 * invent them.
 */

import { cache } from "react";
import { sanityFetch } from "./sanity/client";
import { TEAM_QUERY } from "./sanity/queries";
import { toWebImage, type SanityImage } from "./sanity/image";
import { mapSeo, text, type RawSeo } from "./sanity/mappers";

export type TeamMember = {
  slug: string;
  name: string;
  role: string;
  /** one or two lines for cards and meta descriptions */
  bio: string;
  /** paragraphs for the profile page */
  biography: string[];
  portrait: { src: string; alt: string; width: number; height: number } | null;
  /** areas this person looks after, e.g. "Trade partnerships" */
  focus: string[];
  languages: string[];
  email: string | null;
  /** professional profiles only, e.g. LinkedIn */
  links: { label: string; href: string }[];
  /** display order */
  order: number;
  seo?: { title?: string; description?: string; ogImage?: string; noindex?: boolean };
  placeholder: boolean;
};

const placeholder = (n: number): TeamMember => ({
  slug: `team-member-${String(n).padStart(2, "0")}`,
  name: `Team member ${String(n).padStart(2, "0")}`,
  role: "Role to be confirmed",
  bio: "Short biography to be supplied by FINO JEWELLERY.",
  biography: [
    "Placeholder profile. Replace with this person's verified biography from the CMS — their background, what they look after for trade partners, and how to reach them.",
  ],
  portrait: null,
  focus: [],
  languages: [],
  email: null,
  links: [],
  order: n,
  placeholder: true,
});

const sampleMembers: TeamMember[] = [placeholder(1), placeholder(2), placeholder(3)];

/* ------------------------------------------------------------------ */
/* CMS integration point — Sanity                                      */
/* ------------------------------------------------------------------ */
type RawMember = {
  slug: string; name: string; role: string | null; bio: string | null; biography: string[] | null;
  portrait: SanityImage; focus: string[] | null; languages: string[] | null; email: string | null;
  links: { label: string; href: string }[] | null; order: number | null; seo: RawSeo;
};

const fetchAllMembers = cache(async (): Promise<TeamMember[]> => {
  const raw = await sanityFetch<RawMember[]>(TEAM_QUERY);
  if (!raw?.length) return sampleMembers;
  return raw.map((m, i) => ({
    slug: m.slug,
    name: m.name,
    role: m.role ?? "",
    bio: m.bio ?? "",
    biography: (m.biography ?? []).filter(Boolean),
    // portraits are shown at 4:5, cropped around the editor's hotspot
    portrait: toWebImage(m.portrait, { aspect: 4 / 5, maxWidth: 1000, alt: `Portrait of ${m.name}` }),
    focus: m.focus ?? [],
    languages: m.languages ?? [],
    email: text(m.email) ?? null,
    links: m.links ?? [],
    order: m.order ?? 1000 + i,
    seo: mapSeo(m.seo),
    placeholder: false,
  }));
});

export async function getTeam(): Promise<TeamMember[]> {
  return [...(await fetchAllMembers())].sort((a, b) => a.order - b.order);
}

export async function getMember(slug: string): Promise<TeamMember | undefined> {
  return (await getTeam()).find((m) => m.slug === slug);
}

export async function getOtherMembers(m: TeamMember, limit = 3): Promise<TeamMember[]> {
  return (await getTeam()).filter((x) => x.slug !== m.slug).slice(0, limit);
}

export const isIndexableMember = (m: TeamMember) => !m.placeholder && !m.seo?.noindex;
