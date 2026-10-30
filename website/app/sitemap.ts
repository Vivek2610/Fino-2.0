import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { getProducts, getProductCategories, isIndexableProduct } from "@/lib/products";
import { getAllPosts, getCategories, isIndexable } from "@/lib/blog";
import { getTeam, isIndexableMember } from "@/lib/team";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();
  const pages = ["", "/collection", "/our-team", "/blog", "/contact", "/privacy-policy", "/terms"].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  const products = (await getProducts())
    .filter(isIndexableProduct)
    .map((p) => ({ url: `${base}/collection/${p.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 }));
  const posts = (await getAllPosts()).filter(isIndexable);
  const blogPosts = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt ?? p.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const liveCats = new Set(posts.map((p) => p.category.slug));
  const blogCats = (await getCategories())
    .filter((c) => liveCats.has(c.slug))
    .map((c) => ({ url: `${base}/blog/category/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 }));
  const productCats = (await getProductCategories()).map((c) => ({
    url: `${base}/collection/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const members = (await getTeam()).filter(isIndexableMember).map((m) => ({
    url: `${base}/our-team/${m.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));
  return [...pages, ...products, ...productCats, ...members, ...blogPosts, ...blogCats];
}
