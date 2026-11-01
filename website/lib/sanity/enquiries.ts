import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";
import { sanityConfig } from "./client";

/**
 * Saves contact-form messages to Sanity (studio → Enquiries).
 *
 * Needs SANITY_API_WRITE_TOKEN (an Editor token) on the server. The token is
 * never sent to the browser.
 *
 * Privacy: each enquiry gets an ID like "enquiry.<uuid>". In Sanity, IDs that
 * contain a dot are private — only logged-in studio members (or a token) can
 * read them, even when the dataset is public. Never change this prefix.
 */
const token = process.env.SANITY_API_WRITE_TOKEN;

const writeClient =
  sanityConfig.projectId && token
    ? createClient({
        ...sanityConfig,
        token,
        useCdn: false,
        ...(process.env.SANITY_API_HOST ? { apiHost: process.env.SANITY_API_HOST, useProjectHostname: false } : {}),
      })
    : null;

export const canSaveEnquiries = Boolean(writeClient);

export async function saveEnquiry(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  page?: string | null;
}): Promise<string> {
  if (!writeClient) throw new Error("Sanity enquiries not configured");
  const doc = await writeClient.create({
    _id: `enquiry.${randomUUID()}`,
    _type: "enquiry",
    status: "new",
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
    page: data.page || undefined,
    submittedAt: new Date().toISOString(),
  });
  return doc._id;
}
