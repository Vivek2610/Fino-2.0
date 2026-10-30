/** GROQ queries. Projections return the shapes the website already uses. */

const IMAGE = `{ asset->{ _id, url, metadata { dimensions { width, height } } }, crop, hotspot, alt, caption }`;
export const SEO = `seo { title, description, noindex, ogImage ${IMAGE} }`;
const HEADING = `{ eyebrow, title, emphasis, intro }`;
const CTA = `{ label, href }`;

const PUBLISHED = `!(_id in path("drafts.**"))`;

export const PRODUCTS_QUERY = `*[_type == "product" && defined(slug.current) && ${PUBLISHED}]
  | order(coalesce(order, 9999) asc, name asc) {
    "slug": slug.current, name,
    "category": category->{ "slug": slug.current, title, description },
    summary, description, "images": images[] ${IMAGE},
    details[]{ label, value }, tags, featured, ${SEO}
  }`;

export const TEAM_QUERY = `*[_type == "teamMember" && defined(slug.current) && ${PUBLISHED}]
  | order(coalesce(order, 9999) asc, name asc) {
    "slug": slug.current, name, role, bio, biography, portrait ${IMAGE},
    focus, languages, email, links[]{ label, href }, order, ${SEO}
  }`;

export const POSTS_QUERY = `*[_type == "post" && defined(slug.current) && ${PUBLISHED}]
  | order(publishedAt desc) {
    "slug": slug.current, title, excerpt, publishedAt, updatedAt, tags,
    "category": category->{ "slug": slug.current, title, description },
    "author": author->{ name, role, "slug": slug.current },
    cover ${IMAGE},
    body[]{ ..., _type == "accessibleImage" => ${IMAGE.slice(0, -1)}, _type } },
    ${SEO}
  }`;

export const SETTINGS_QUERY = `*[_id == "siteSettings"][0]{
  description, social[]{ label, href }, email, phone,
  location { name, streetAddress, city, postalCode, country, openingHours, mapUrl, lat, lon, image ${IMAGE} },
  deliveryHeadline, deliveryNote, markets[]{ name, lat, lon, primary },
  "craftVideo": craftVideo.asset->url, craftPoster ${IMAGE}, defaultOgImage ${IMAGE}
}`;

export const HOME_QUERY = `*[_id == "homePage"][0]{
  hero { eyebrow, title, emphasis, lead, primaryCta ${CTA}, secondaryCta ${CTA} },
  story { heading ${HEADING}, body, image ${IMAGE}, pillars[]{ title, label }, cta ${CTA} },
  collection { heading ${HEADING}, ctaLabel, "featured": featured[]->slug.current },
  craft { heading ${HEADING}, quote },
  team { heading ${HEADING}, ctaLabel },
  location { heading ${HEADING}, houseNote },
  contact { heading ${HEADING} },
  ${SEO}
}`;

export const LISTING_PAGE_QUERY = `*[_id == $id][0]{ heading ${HEADING}, ${SEO} }`;

export const LEGAL_PAGE_QUERY = `*[_id == $id][0]{
  title, updatedAt, reviewed,
  body[]{ ..., _type == "accessibleImage" => ${IMAGE.slice(0, -1)}, _type } },
  ${SEO}
}`;

export const REDIRECTS_QUERY = `*[_type == "redirect" && defined(from) && defined(to) && ${PUBLISHED}]{ from, to, permanent }`;
