import { cache } from "react";
import { siteConfig, type SiteConfig } from "./site-config";
import { sanityFetch } from "./sanity/client";
import { SETTINGS_QUERY } from "./sanity/queries";
import { imageUrl, toWebImage, type SanityImage } from "./sanity/image";
import { text } from "./sanity/mappers";

type RawSettings = {
  description: string | null;
  social: { label: string; href: string }[] | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  location: {
    name: string | null; streetAddress: string | null; city: string | null; postalCode: string | null;
    country: string | null; openingHours: string[] | null; mapUrl: string | null;
    lat: number | null; lon: number | null; image: SanityImage;
  } | null;
  deliveryHeadline: string | null;
  deliveryNote: string | null;
  markets: { name: string; lat: number; lon: number; primary: boolean | null }[] | null;
  craftVideo: string | null;
  craftPoster: SanityImage;
  defaultOgImage: SanityImage;
} | null;

/**
 * Business details from Sanity (studio → Site settings) merged over the
 * defaults in lib/site-config.ts. Empty CMS fields keep the default, so the
 * site always renders. Cached per request.
 */
export const getSiteSettings = cache(async (): Promise<SiteConfig> => {
  const raw = await sanityFetch<RawSettings>(SETTINGS_QUERY);
  if (!raw) return siteConfig;
  const d = siteConfig;
  const l = raw.location;
  const poster = toWebImage(raw.craftPoster, { aspect: 16 / 9, maxWidth: 1920 });
  const locImg = toWebImage(l?.image ?? null, { maxWidth: 1200 });
  return {
    ...d,
    description: text(raw.description) ?? d.description,
    contact: {
      email: text(raw.email) ?? d.contact.email,
      phone: text(raw.phone) ?? d.contact.phone,
      whatsapp: text(raw.whatsapp) ?? d.contact.whatsapp,
    },
    location: {
      name: text(l?.name) ?? d.location.name,
      streetAddress: text(l?.streetAddress) ?? d.location.streetAddress,
      city: text(l?.city) ?? d.location.city,
      postalCode: text(l?.postalCode) ?? d.location.postalCode,
      country: text(l?.country) ?? d.location.country,
      openingHours: l?.openingHours?.filter(Boolean).length ? l.openingHours.filter(Boolean) : d.location.openingHours,
      mapUrl: text(l?.mapUrl) ?? d.location.mapUrl,
      image: locImg ? { src: locImg.src, alt: locImg.alt } : d.location.image,
      coordinates: typeof l?.lat === "number" && typeof l?.lon === "number" ? { lat: l.lat, lon: l.lon } : d.location.coordinates,
    },
    delivery: {
      headline: text(raw.deliveryHeadline) ?? d.delivery.headline,
      note: text(raw.deliveryNote) ?? d.delivery.note,
      markets: raw.markets?.length
        ? raw.markets.map((m) => ({ name: m.name, lat: m.lat, lon: m.lon, ...(m.primary ? { primary: true } : {}) }))
        : d.delivery.markets,
    },
    social: raw.social?.length ? raw.social : d.social,
    craftVideo: {
      src: text(raw.craftVideo) ?? d.craftVideo.src,
      poster: poster?.src ?? d.craftVideo.poster,
      posterAlt: poster?.alt || d.craftVideo.posterAlt,
    },
    defaultOgImage: imageUrl(raw.defaultOgImage) ?? d.defaultOgImage,
  };
});
