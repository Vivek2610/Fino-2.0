/**
 * Central brand + business configuration — the DEFAULTS.
 *
 * Brand constants (name, tagline, logo, navigation, site URL) live only here.
 * Business details (description, contact, address, delivery map, social,
 * campaign film) are edited in Sanity → Site settings; `getSiteSettings()` in
 * lib/settings.ts merges them over these defaults. Server components should
 * read business details through `getSiteSettings()`.
 *
 * Anything `null` is NOT yet verified: the UI shows a clearly marked
 * placeholder and leaves it out of structured data.
 */

export const siteConfig = {
  name: "FINO JEWELLERY",
  shortName: "FINO",
  tagline: "Bold by Nature, Golden by Design.",
  description: (
    "FINO JEWELLERY supplies fine gold jewellery to jewellers and retailers, with an Italian-market focus and a quiet touch of Arabian elegance."
  ) as string,
  /** Set NEXT_PUBLIC_SITE_URL in the environment. No domain is invented here. */
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  locale: "en",
  logo: {
    src: "/images/fino-logo.png",
    width: 275,
    height: 356,
    alt: "FINO JEWELLERY logo",
  },
  nav: [
    { label: "Home", href: "/", section: "home" },
    { label: "Collection", href: "/collection", section: "collection" },
    { label: "Our Team", href: "/our-team", section: "team" },
    { label: "Blog", href: "/blog", section: "blog" },
    { label: "Contact", href: "/contact", section: "contact" },
  ],
  contact: {
    email: null as string | null, // e.g. "trade@yourdomain.com"
    phone: null as string | null, // e.g. "+39 ..."
  },
  /** The brand has ONE physical location. */
  location: {
    name: null as string | null, // e.g. "FINO JEWELLERY Showroom"
    streetAddress: null as string | null,
    city: null as string | null,
    postalCode: null as string | null,
    country: null as string | null,
    openingHours: null as string[] | null, // e.g. ["Mon–Fri 09:30–18:00"]
    mapUrl: null as string | null, // Google Maps / Apple Maps link
    image: null as { src: string; alt: string } | null,
    /** Map pin for the house itself, e.g. { lat: 45.4642, lon: 9.19 } */
    coordinates: null as { lat: number; lon: number } | null,
  },
  /**
   * Delivery map (location section). These pins illustrate worldwide trade
   * delivery — they are NOT offices. Replace with the markets FINO actually
   * serves. `primary: true` marks the main market (Italy, per the brief); the
   * delivery arcs start from the house pin when coordinates are set, otherwise
   * from the primary market.
   */
  delivery: {
    headline: "Delivering worldwide" as string,
    note: "Trade orders are shipped to jewellers and retailers around the world." as string,
    markets: [
      { name: "Italy", lat: 45.46, lon: 9.19, primary: true },
      { name: "London", lat: 51.5, lon: -0.13 },
      { name: "Paris", lat: 48.86, lon: 2.35 },
      { name: "Dubai", lat: 25.2, lon: 55.27 },
      { name: "Riyadh", lat: 24.71, lon: 46.68 },
      { name: "Mumbai", lat: 19.08, lon: 72.88 },
      { name: "Singapore", lat: 1.35, lon: 103.82 },
      { name: "Hong Kong", lat: 22.32, lon: 114.17 },
      { name: "Tokyo", lat: 35.68, lon: 139.69 },
      { name: "Sydney", lat: -33.87, lon: 151.21 },
      { name: "Johannesburg", lat: -26.2, lon: 28.05 },
      { name: "New York", lat: 40.71, lon: -74.0 },
      { name: "Los Angeles", lat: 34.05, lon: -118.24 },
      { name: "São Paulo", lat: -23.55, lon: -46.63 },
    ] as { name: string; lat: number; lon: number; primary?: boolean }[],
  },
  /** Default share image (Sanity → Site settings → SEO defaults). */
  defaultOgImage: null as string | null,
  /** Only add real, existing profiles. */
  social: [] as { label: string; href: string }[],
  craftVideo: {
    /** Set to "/videos/fino-campaign-video.mp4" once the file is in public/videos. */
    src: null as string | null,
    poster: "/images/fino-craft-poster.jpg" as string,
    posterAlt: "Close view of the faceted gold beads of the FINO necklace" as string,
  },
};

export type SiteConfig = typeof siteConfig;

export function hasVerifiedAddress(cfg: SiteConfig = siteConfig) {
  const l = cfg.location;
  return Boolean(l.streetAddress && l.city && l.country);
}

export function formattedAddress(cfg: SiteConfig = siteConfig): string | null {
  const l = cfg.location;
  if (!hasVerifiedAddress(cfg)) return null;
  return [l.streetAddress, [l.postalCode, l.city].filter(Boolean).join(" "), l.country]
    .filter(Boolean)
    .join(", ");
}
