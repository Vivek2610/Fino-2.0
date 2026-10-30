/**
 * Redirects are edited in Sanity (studio → Redirects) and loaded when the site
 * is built or the server starts — redeploy after adding one.
 */
async function sanityRedirects() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) return [];
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const version = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-10-01";
  const query = encodeURIComponent(
    `*[_type == "redirect" && defined(from) && defined(to) && !(_id in path("drafts.**"))]{ from, to, permanent }`,
  );
  try {
    const res = await fetch(`https://${projectId}.apicdn.sanity.io/v${version}/data/query/${dataset}?query=${query}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { result } = await res.json();
    // only plain paths (no pattern characters), never redirect a path to itself
    const plain = (p) => typeof p === "string" && /^\/[A-Za-z0-9\-._~/%]*$/.test(p);
    return (result ?? [])
      .filter((r) => plain(r.from) && (plain(r.to) || /^https?:\/\//.test(r.to)) && r.from !== r.to)
      .map((r) => ({ source: r.from, destination: r.to, permanent: r.permanent !== false }));
  } catch (err) {
    console.warn("[sanity] could not load redirects:", err.message);
    return [];
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // images uploaded in Sanity are served from its CDN
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" }],
  },
  redirects: sanityRedirects,
};

export default nextConfig;
