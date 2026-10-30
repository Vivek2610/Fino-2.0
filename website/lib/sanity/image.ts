import { createImageUrlBuilder } from "@sanity/image-url";
import { sanityConfig } from "./client";

/** Raw image as returned by the IMAGE projection in queries.ts */
export type SanityImage = {
  asset?: { _ref?: string; _id?: string; url?: string; metadata?: { dimensions?: { width: number; height: number } } } | null;
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  hotspot?: { x: number; y: number; height: number; width: number } | null;
  alt?: string | null;
  caption?: string | null;
} | null;

export type WebImage = { src: string; alt: string; width: number; height: number; caption?: string };

const builder = sanityConfig.projectId
  ? createImageUrlBuilder({ projectId: sanityConfig.projectId, dataset: sanityConfig.dataset })
  : null;

/**
 * Turns a Sanity image into { src, alt, width, height } for next/image.
 * With `aspect` (width / height) the image is cropped around the editor's
 * hotspot; otherwise the editor's crop is applied at natural proportions.
 */
export function toWebImage(img: SanityImage, opts: { aspect?: number; maxWidth?: number; alt?: string } = {}): WebImage | null {
  if (!builder || !img?.asset) return null;
  const dims = img.asset.metadata?.dimensions;
  const maxWidth = opts.maxWidth ?? 1600;
  // natural size after the editor's crop
  const crop = img.crop ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const natW = dims ? dims.width * (1 - crop.left - crop.right) : maxWidth;
  const natH = dims ? dims.height * (1 - crop.top - crop.bottom) : maxWidth;
  const width = Math.round(Math.min(maxWidth, natW));
  const height = Math.round(opts.aspect ? width / opts.aspect : width * (natH / natW));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let b = builder.image(img as any).width(width).auto("format").quality(85);
  if (opts.aspect) b = b.height(height).fit("crop");
  return {
    src: b.url(),
    alt: img.alt ?? opts.alt ?? "",
    width,
    height,
    ...(img.caption ? { caption: img.caption } : {}),
  };
}

/** Plain URL (e.g. share images). */
export function imageUrl(img: SanityImage, w = 1200, h = 630): string | undefined {
  if (!builder || !img?.asset) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return builder.image(img as any).width(w).height(h).fit("crop").auto("format").url();
}
