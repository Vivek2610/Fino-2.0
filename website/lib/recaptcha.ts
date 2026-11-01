/**
 * Server-side check of a Google reCAPTCHA token (v2 checkbox or v3 score).
 * Enforced only when RECAPTCHA_SECRET_KEY is set, so local development works
 * without keys. In production, always set the keys.
 */
const VERIFY_URL =
  process.env.RECAPTCHA_VERIFY_URL || // testing only
  "https://www.google.com/recaptcha/api/siteverify";

/** v3 only: 0.0 = bot … 1.0 = human. Google's suggested default is 0.5. */
const MIN_SCORE = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);

export async function verifyRecaptcha(token: unknown, ip?: string | null): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || !token || token.length > 4096) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "local") body.set("remoteip", ip);
    const r = await fetch(VERIFY_URL, { method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(8000) });
    const d = (await r.json()) as { success?: boolean; score?: number; action?: string; "error-codes"?: string[] };
    if (!d.success) {
      console.warn("[recaptcha] rejected:", d["error-codes"]);
      return false;
    }
    if (typeof d.score === "number") {
      // v3 token: check the score and that it was made for this form
      if (d.action && d.action !== "contact") return false;
      if (d.score < MIN_SCORE) {
        console.warn("[recaptcha] low score:", d.score);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error("[recaptcha] verify failed:", err instanceof Error ? err.message : err);
    return false;
  }
}
