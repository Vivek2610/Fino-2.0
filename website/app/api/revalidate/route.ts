import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { SANITY_TAG } from "@/lib/sanity/client";

/**
 * Called by a Sanity webhook whenever content is published, unpublished or
 * deleted, so the site updates within seconds instead of within the hour.
 * Setup: README → "Sanity CMS" → "Instant updates".
 */
export async function POST(req: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "SANITY_REVALIDATE_SECRET is not set" }, { status: 500 });
  }
  const body = await req.text();
  const signature = req.headers.get(SIGNATURE_HEADER_NAME) ?? "";
  if (!(await isValidSignature(body, signature, secret))) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }
  // Every CMS request is tagged "sanity": refresh the data, then every page.
  revalidateTag(SANITY_TAG);
  revalidatePath("/", "layout");
  let type: string | undefined;
  try {
    type = (JSON.parse(body) as { _type?: string })._type;
  } catch {
    /* body is optional */
  }
  return NextResponse.json({ ok: true, revalidated: type ?? "all", at: new Date().toISOString() });
}
