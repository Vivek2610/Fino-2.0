"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import styles from "./Recaptcha.module.css";

/**
 * Google reCAPTCHA for the contact form.
 *
 *   v2 (default) — the "I'm not a robot" checkbox, shown above the Send button.
 *   v3           — invisible; Google scores each send in the background.
 *
 * Keys come from https://www.google.com/recaptcha/admin and are tied to the
 * version chosen there, so NEXT_PUBLIC_RECAPTCHA_VERSION must match the keys.
 * Env: NEXT_PUBLIC_RECAPTCHA_SITE_KEY (public), RECAPTCHA_SECRET_KEY (server).
 */
declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (el: HTMLElement, opts: Record<string, unknown>) => number;
      getResponse: (id?: number) => string;
      reset: (id?: number) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
export const RECAPTCHA_VERSION = process.env.NEXT_PUBLIC_RECAPTCHA_VERSION === "v3" ? "v3" : "v2";

let scriptPromise: Promise<void> | null = null;
function loadScript() {
  if (window.grecaptcha?.ready) return new Promise<void>((r) => window.grecaptcha!.ready(r));
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src =
        RECAPTCHA_VERSION === "v3"
          ? `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`
          : "https://www.google.com/recaptcha/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = () => window.grecaptcha!.ready(() => resolve());
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("reCAPTCHA failed to load"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export type RecaptchaHandle = {
  /** Token to send with the form, or null if the visitor hasn't passed yet. */
  getToken: () => Promise<string | null>;
  reset: () => void;
};

const Recaptcha = forwardRef<RecaptchaHandle, { onError?: () => void }>(function Recaptcha({ onError }, ref) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const ready = useRef(false);
  const errCb = useRef(onError);
  errCb.current = onError;

  useImperativeHandle(ref, () => ({
    getToken: async () => {
      if (!RECAPTCHA_SITE_KEY || !ready.current || !window.grecaptcha) return null;
      if (RECAPTCHA_VERSION === "v3") {
        try {
          return await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "contact" });
        } catch {
          return null;
        }
      }
      if (widgetId.current === null) return null;
      return window.grecaptcha.getResponse(widgetId.current) || null;
    },
    reset: () => {
      if (RECAPTCHA_VERSION === "v2" && widgetId.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetId.current);
      }
    },
  }));

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !window.grecaptcha) return;
        if (RECAPTCHA_VERSION === "v2" && box.current && widgetId.current === null) {
          widgetId.current = window.grecaptcha.render(box.current, {
            sitekey: RECAPTCHA_SITE_KEY,
            theme: "light",
            "error-callback": () => errCb.current?.(),
          });
        }
        ready.current = true;
      })
      .catch(() => errCb.current?.());
    return () => {
      cancelled = true;
    };
  }, []);

  if (!RECAPTCHA_SITE_KEY) return null;
  return (
    <div className={styles.wrap}>
      {RECAPTCHA_VERSION === "v2" && <div ref={box} className={styles.box} />}
      {/* v3: Google allows hiding its floating badge when the notice below is shown. */}
      {RECAPTCHA_VERSION === "v3" && <style>{".grecaptcha-badge{visibility:hidden!important}"}</style>}
      <p className={styles.note}>
        This form is protected by reCAPTCHA. The Google{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </a>{" "}
        and{" "}
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
          Terms of Service
        </a>{" "}
        apply.
      </p>
    </div>
  );
});

export default Recaptcha;
