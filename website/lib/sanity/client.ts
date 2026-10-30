import { createClient, type QueryParams } from "@sanity/client";

/**
 * Sanity connection. Configure in .env.local:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, NEXT_PUBLIC_SANITY_API_VERSION
 * Without a project ID the site runs on the built-in sample content.
 */
export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-10-01",
};

export const isSanityConfigured = Boolean(sanityConfig.projectId);

/** Cache tag on every CMS request — the publish webhook revalidates it. */
export const SANITY_TAG = "sanity";

const client = isSanityConfigured
  ? createClient({
      ...sanityConfig,
      useCdn: false, // Next.js caches responses; the webhook keeps them fresh
      perspective: "published",
      token: process.env.SANITY_API_READ_TOKEN || undefined,
      // testing only: point at a local mock of the Sanity API
      ...(process.env.SANITY_API_HOST ? { apiHost: process.env.SANITY_API_HOST, useProjectHostname: false } : {}),
    })
  : null;

/**
 * Fetch from Sanity. Returns `null` when Sanity is not configured or the
 * request fails, so callers can fall back to built-in content and the site
 * never breaks because the CMS is unreachable.
 */
export async function sanityFetch<T>(query: string, params: QueryParams = {}): Promise<T | null> {
  if (!client) return null;
  try {
    return await client.fetch<T>(
      query,
      params,
      // Local development (`npm run dev`): always fetch fresh, so published
      // changes show on the next page refresh. Production: cache for up to an
      // hour; the publish webhook (/api/revalidate) refreshes it instantly.
      process.env.NODE_ENV === "development"
        ? { cache: "no-store" }
        : { next: { revalidate: 3600, tags: [SANITY_TAG] } },
    );
  } catch (err) {
    console.error("[sanity] query failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
