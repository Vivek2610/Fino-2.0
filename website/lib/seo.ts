import type { Metadata } from "next";
import { siteConfig, hasVerifiedAddress, type SiteConfig } from "./site-config";
import type { Product } from "./products";
import type { Post } from "./blog";
import type { TeamMember } from "./team";

/** CMS images are already absolute (cdn.sanity.io); local ones live under /public. */
export const absoluteUrl = (src: string) => (/^https?:\/\//.test(src) ? src : `${siteConfig.url}${src}`);

export function pageMetadata({
  title,
  description,
  path,
  image,
}: {
  title?: string;
  description?: string;
  path: string;
  image?: string;
}): Metadata {
  const fullTitle = title ? `${title} — ${siteConfig.name}` : `${siteConfig.name} — ${siteConfig.tagline}`;
  const desc = description ?? siteConfig.description;
  const url = `${siteConfig.url}${path}`;
  const og = image ?? "/og-image.jpg";
  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: siteConfig.name,
      type: "website",
      images: [{ url: og, width: 1200, height: 630, alt: siteConfig.name }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: desc, images: [og] },
  };
}

/** Metadata for an index page edited in Sanity → Other pages. */
export function listingMetadata(page: { meta: { title: string; description: string; ogImage?: string; noindex?: boolean } }, path: string): Metadata {
  const meta = pageMetadata({ title: page.meta.title, description: page.meta.description, path, image: page.meta.ogImage });
  return page.meta.noindex ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export function organizationJsonLd(cfg: SiteConfig = siteConfig) {
  const siteConfig = cfg;
  const l = siteConfig.location;
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": hasVerifiedAddress(cfg) ? "JewelryStore" : "Organization",
    name: siteConfig.name,
    slogan: siteConfig.tagline,
    url: siteConfig.url,
    logo: `${siteConfig.url}${siteConfig.logo.src}`,
    description: siteConfig.description,
  };
  if (siteConfig.contact.email) base.email = siteConfig.contact.email;
  if (siteConfig.contact.phone) base.telephone = siteConfig.contact.phone;
  if (siteConfig.social.length) base.sameAs = siteConfig.social.map((s) => s.href);
  if (hasVerifiedAddress(cfg)) {
    base.address = {
      "@type": "PostalAddress",
      streetAddress: l.streetAddress,
      addressLocality: l.city,
      postalCode: l.postalCode ?? undefined,
      addressCountry: l.country,
    };
    if (l.openingHours?.length) base.openingHours = l.openingHours;
    if (l.mapUrl) base.hasMap = l.mapUrl;
  }
  return base;
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${siteConfig.url}${it.path}`,
    })),
  };
}

/** Product schema without price/offers/reviews — those are never fabricated. */
export function productJsonLd(p: Product) {
  if (p.placeholder || p.seo?.noindex) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description.join(" "),
    category: p.category?.title,
    image: p.images.map((im) => absoluteUrl(im.src)),
    brand: { "@type": "Brand", name: siteConfig.name },
    url: `${siteConfig.url}/collection/${p.slug}`,
  };
}

/** CollectionPage + ItemList for collection listings (real products only). */
export function collectionJsonLd(products: Product[], path: string, name: string) {
  const items = products.filter((p) => !p.placeholder && !p.seo?.noindex);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: `${siteConfig.url}${path}`,
    isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${siteConfig.url}/collection/${p.slug}`,
        name: p.name,
      })),
    },
  };
}

export function productMetadata(p: Product): Metadata {
  const img = p.seo?.ogImage ?? p.images[0]?.src;
  const meta = pageMetadata({
    title: p.seo?.title ?? p.name,
    description: p.seo?.description ?? p.summary,
    path: `/collection/${p.slug}`,
    image: img,
  });
  return p.placeholder || p.seo?.noindex ? { ...meta, robots: { index: false, follow: true } } : meta;
}

/* ------------------------------------------------------------------ */
/* Blog                                                                */
/* ------------------------------------------------------------------ */

export function postMetadata(p: Post, indexable: boolean): Metadata {
  const title = p.seo?.title ?? p.title;
  const description = p.seo?.description ?? p.excerpt;
  const path = `/blog/${p.slug}`;
  const image = p.seo?.ogImage ?? p.cover?.src ?? "/og-image.jpg";
  const base = pageMetadata({ title, description, path, image });
  return {
    ...base,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: p.publishedAt,
      modifiedTime: p.updatedAt ?? p.publishedAt,
      section: p.category.title,
      tags: p.tags,
      authors: p.author ? [p.author.name] : undefined,
      images: [{ url: image, alt: p.cover?.alt ?? title }],
    },
  };
}

export function blogPostingJsonLd(p: Post) {
  const url = `${siteConfig.url}/blog/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.excerpt,
    datePublished: p.publishedAt,
    dateModified: p.updatedAt ?? p.publishedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    image: p.cover ? absoluteUrl(p.cover.src) : undefined,
    articleSection: p.category.title,
    keywords: p.tags.join(", "),
    author: p.author
      ? { "@type": "Person", name: p.author.name }
      : { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: `${siteConfig.url}${siteConfig.logo.src}` },
    },
  };
}

export function blogListJsonLd(posts: Post[], path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${siteConfig.name} Journal`,
    url: `${siteConfig.url}${path}`,
    publisher: { "@type": "Organization", name: siteConfig.name },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${siteConfig.url}/blog/${p.slug}`,
      datePublished: p.publishedAt,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Team                                                                */
/* ------------------------------------------------------------------ */

export function memberMetadata(m: TeamMember): Metadata {
  const meta = pageMetadata({
    title: m.seo?.title ?? `${m.name}, ${m.role}`,
    description: m.seo?.description ?? m.bio,
    path: `/our-team/${m.slug}`,
    image: m.portrait?.src,
  });
  const noindex = m.placeholder || m.seo?.noindex;
  return {
    ...meta,
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { ...meta.openGraph, type: "profile" },
  };
}

function personLd(m: TeamMember) {
  return {
    "@type": "Person",
    name: m.name,
    jobTitle: m.role,
    description: m.bio,
    url: `${siteConfig.url}/our-team/${m.slug}`,
    image: m.portrait ? absoluteUrl(m.portrait.src) : undefined,
    email: m.email ? `mailto:${m.email}` : undefined,
    knowsLanguage: m.languages.length ? m.languages : undefined,
    knowsAbout: m.focus.length ? m.focus : undefined,
    sameAs: m.links.length ? m.links.map((l) => l.href) : undefined,
    worksFor: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
  };
}

/** ProfilePage + Person for a team member (real people only). */
export function memberJsonLd(m: TeamMember) {
  if (m.placeholder || m.seo?.noindex) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${siteConfig.url}/our-team/${m.slug}`,
    mainEntity: personLd(m),
  };
}

/** AboutPage listing the team (real people only). */
export function teamJsonLd(members: TeamMember[]) {
  const real = members.filter((m) => !m.placeholder && !m.seo?.noindex);
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `Our Team — ${siteConfig.name}`,
    url: `${siteConfig.url}/our-team`,
    mainEntity: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      employee: real.map(personLd),
    },
  };
}
