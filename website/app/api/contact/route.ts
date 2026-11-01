import { NextResponse } from "next/server";
import { validateContact } from "@/lib/validation";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { canSaveEnquiries, saveEnquiry } from "@/lib/sanity/enquiries";

export const runtime = "nodejs";

// Very small in-memory rate limit (per server instance). Replace with a shared
// store (e.g. Upstash/Redis) if deployed across many instances.
const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 10 * 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  return h.n > 5;
}

/** Path of the page the form was sent from (same site only), for context in the studio. */
function sourcePage(req: Request): string | null {
  const ref = req.headers.get("referer");
  if (!ref) return null;
  try {
    const u = new URL(ref);
    return u.host === new URL(req.url).host || u.host === req.headers.get("host") ? u.pathname + u.search : null;
  } catch {
    return null;
  }
}

/** Email (Resend) or webhook notification. Returns false when neither is configured. */
async function notify(data: { name: string; email: string; subject: string; message: string }) {
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (webhook) {
    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "fino-website", receivedAt: new Date().toISOString(), ...data }),
    });
    if (!r.ok) throw new Error(`Webhook responded ${r.status}`);
    return true;
  }
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (key && to && from) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: data.email,
        subject: `[FINO website] ${data.subject}`,
        text: `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`,
      }),
    });
    if (!r.ok) throw new Error(`Resend responded ${r.status}`);
    return true;
  }
  return false; // not configured
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many messages. Please try again later." }, { status: 429 });
  }

  // Spam protection: honeypot + minimum time on page.
  const elapsed = Number(body.elapsed ?? 0);
  if ((typeof body.website === "string" && body.website.trim() !== "") || elapsed < 2500) {
    return NextResponse.json({ ok: false, error: "Your message could not be verified. Please try again." }, { status: 400 });
  }

  // CAPTCHA (Google reCAPTCHA) — checked on the server; tokens are single-use.
  if (!(await verifyRecaptcha(body.recaptchaToken, ip))) {
    return NextResponse.json(
      { ok: false, captcha: true, error: "The security check failed. Please tick “I'm not a robot” again and resend." },
      { status: 403 },
    );
  }

  const { data, errors } = validateContact(body);
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors, error: "Please correct the highlighted fields." }, { status: 422 });
  }

  // Save to Sanity (studio → Enquiries) and send the email/webhook in parallel.
  // The visitor sees success if at least one of them worked — the message is
  // then safely with the team. If nothing is configured, say so honestly.
  const [saved, notified] = await Promise.allSettled([
    canSaveEnquiries ? saveEnquiry({ ...data, page: sourcePage(req) }) : Promise.resolve(null),
    notify(data),
  ]);
  if (saved.status === "rejected") console.error("Saving enquiry to Sanity failed:", saved.reason);
  if (notified.status === "rejected") console.error("Enquiry email/webhook failed:", notified.reason);

  const savedOk = saved.status === "fulfilled" && saved.value !== null;
  const notifiedOk = notified.status === "fulfilled" && notified.value === true;
  if (savedOk || notifiedOk) return NextResponse.json({ ok: true });

  const nothingConfigured = !canSaveEnquiries && notified.status === "fulfilled" && notified.value === false;
  if (nothingConfigured) {
    return NextResponse.json(
      { ok: false, error: "Online enquiries are not connected yet, so your message was not sent. Please try again later." },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: false, error: "Your message could not be sent. Please try again." }, { status: 502 });
}
