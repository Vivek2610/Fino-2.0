import type { BlogBlock, Span } from "@/lib/blog";
import { imageUrl, toWebImage, type SanityImage } from "./image";

export type RawSeo = { title?: string | null; description?: string | null; noindex?: boolean | null; ogImage?: SanityImage } | null;
export type Seo = { title?: string; description?: string; ogImage?: string; noindex?: boolean };

/** Sanity returns null for empty fields; the website expects undefined. */
export const clean = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);
export const text = (v: string | null | undefined): string | undefined => (v && v.trim() ? v.trim() : undefined);

export function mapSeo(raw: RawSeo | undefined): Seo | undefined {
  if (!raw) return undefined;
  const seo: Seo = {
    title: text(raw.title),
    description: text(raw.description),
    ogImage: imageUrl(raw.ogImage ?? null),
    noindex: raw.noindex ?? undefined,
  };
  return Object.values(seo).some((v) => v !== undefined) ? seo : undefined;
}

/* ------------------------------------------------------------------ */
/* Portable Text → BlogBlock[] (rendered by components/blog/PostBody)   */
/* ------------------------------------------------------------------ */
type PTSpan = { _type: "span"; text: string; marks?: string[] };
type PTBlock = {
  _type: "block";
  _key?: string;
  style?: string;
  listItem?: "bullet" | "number";
  children?: PTSpan[];
  markDefs?: { _key: string; _type: string; href?: string }[];
};
type PTNode = PTBlock | ({ _type: "accessibleImage" } & NonNullable<SanityImage>) | { _type: string };

function spansOf(b: PTBlock): Span[] {
  const defs = new Map((b.markDefs ?? []).map((d) => [d._key, d]));
  return (b.children ?? [])
    .filter((c) => c._type === "span" && c.text)
    .map((c) => {
      const marks = c.marks ?? [];
      const link = marks.map((m) => defs.get(m)).find((d) => d?._type === "link");
      return {
        text: c.text,
        ...(marks.includes("strong") ? { bold: true } : {}),
        ...(marks.includes("em") ? { italic: true } : {}),
        ...(link?.href ? { href: link.href } : {}),
      };
    });
}
const plain = (spans: Span[]) => spans.map((s) => s.text).join("");

export function portableTextToBlocks(nodes: PTNode[] | null | undefined): BlogBlock[] {
  const out: BlogBlock[] = [];
  for (const n of nodes ?? []) {
    if (n._type === "accessibleImage") {
      const img = toWebImage(n as SanityImage, { maxWidth: 1440 });
      if (img) out.push({ type: "image", ...img });
      continue;
    }
    if (n._type !== "block") continue;
    const b = n as PTBlock;
    const spans = spansOf(b);
    const txt = plain(spans);
    if (!txt.trim()) continue;
    if (b.listItem) {
      const ordered = b.listItem === "number";
      const prev = out[out.length - 1];
      if (prev?.type === "list" && Boolean(prev.ordered) === ordered) {
        prev.items.push(txt);
        prev.itemSpans = [...(prev.itemSpans ?? []), spans];
      } else {
        out.push({ type: "list", ordered, items: [txt], itemSpans: [spans] });
      }
      continue;
    }
    switch (b.style) {
      case "h2":
      case "h3":
        out.push({ type: "heading", level: b.style === "h3" ? 3 : 2, text: txt });
        break;
      case "blockquote":
        out.push({ type: "quote", text: txt, spans });
        break;
      default:
        out.push({ type: "paragraph", text: txt, spans });
    }
  }
  return out;
}
