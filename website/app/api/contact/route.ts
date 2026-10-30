import { NextResponse } from "next/server";
import { validateContact } from "@/lib/validation";

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

async function deliver(data: { name: string; email: string; subject: string; message: string }) {
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

  const { data, errors } = validateContact(body);
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors, error: "Please correct the highlighted fields." }, { status: 422 });
  }

  try {
    const sent = await deliver(data);
    if (!sent) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Online enquiries are not connected yet, so your message was not sent. Please try again later.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact delivery failed:", err);
    return NextResponse.json({ ok: false, error: "Your message could not be sent. Please try again." }, { status: 502 });
  }
}
