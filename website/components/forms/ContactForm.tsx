"use client";

import { useEffect, useRef, useState } from "react";
import { validateContact, LIMITS, type FieldErrors, type ContactInput } from "@/lib/validation";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "success" } | { kind: "error"; message: string };

export default function ContactForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [subject, setSubject] = useState("");
  const startedAt = useRef<number>(0);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    const s = new URLSearchParams(window.location.search).get("subject");
    if (s) setSubject(s.slice(0, LIMITS.subject));
  }, []);

  useEffect(() => {
    if (status.kind === "success" || status.kind === "error") statusRef.current?.focus();
  }, [status]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const raw = Object.fromEntries(fd.entries()) as Record<string, string>;
    const { errors: v } = validateContact(raw as Partial<ContactInput>);
    setErrors(v);
    if (Object.keys(v).length) {
      const first = Object.keys(v)[0];
      (form.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...raw, elapsed: Date.now() - startedAt.current }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; errors?: FieldErrors };
      if (res.ok && body.ok) {
        setStatus({ kind: "success" });
        form.reset();
        setSubject("");
      } else {
        if (body.errors) setErrors(body.errors);
        setStatus({ kind: "error", message: body.error ?? "Your message could not be sent. Please try again." });
      }
    } catch {
      setStatus({ kind: "error", message: "Network error — your message was not sent. Please try again." });
    }
  }

  const field = (name: keyof ContactInput) => ({
    id: `cf-${name}`,
    name,
    // Browser extensions (e.g. Microsoft Editor, Grammarly) add attributes to
    // form fields before React loads; don't treat that as a hydration error.
    suppressHydrationWarning: true,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `cf-${name}-err` : undefined,
  });

  return (
    <form className="form" noValidate onSubmit={onSubmit} aria-label="Contact form" suppressHydrationWarning>
      <div className="form__row">
        <div className="field">
          <label htmlFor="cf-name">Name</label>
          <input {...field("name")} autoComplete="name" maxLength={LIMITS.name} required />
          {errors.name && <span className="field__error" id="cf-name-err">{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="cf-email">Email</label>
          <input {...field("email")} type="email" autoComplete="email" maxLength={LIMITS.email} required />
          {errors.email && <span className="field__error" id="cf-email-err">{errors.email}</span>}
        </div>
      </div>
      <div className="field">
        <label htmlFor="cf-subject">Subject</label>
        <input
          {...field("subject")}
          maxLength={LIMITS.subject}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        {errors.subject && <span className="field__error" id="cf-subject-err">{errors.subject}</span>}
      </div>
      <div className="field">
        <label htmlFor="cf-message">Message</label>
        <textarea {...field("message")} rows={6} maxLength={LIMITS.message} required />
        {errors.message && <span className="field__error" id="cf-message-err">{errors.message}</span>}
      </div>
      {/* Honeypot — hidden from people and assistive tech */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" tabIndex={-1} autoComplete="off" suppressHydrationWarning />
      </div>
      <div ref={statusRef} tabIndex={-1} aria-live="polite">
        {status.kind === "success" && (
          <p className="form__status">Thank you — your message has been sent. The FINO team will be in touch.</p>
        )}
        {status.kind === "error" && <p className="form__status form__status--error">{status.message}</p>}
      </div>
      <div>
        <button className="btn btn--forest" type="submit" disabled={status.kind === "sending"}>
          {status.kind === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
