"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { siteConfig } from "@/lib/site-config";

export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("a[href], button");
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  return (
    <div
      id="mobile-menu"
      ref={panel}
      className="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      hidden={!open}
    >
      <div className="mobile-menu__top">
        <Image src={siteConfig.logo.src} alt={siteConfig.logo.alt} width={31} height={40} />
        <button ref={closeBtn} type="button" className="nav__toggle" onClick={onClose}>
          Close
        </button>
      </div>
      <ul>
        {siteConfig.nav.map((item) => (
          <li key={item.href}>
            <Link href={item.href} onClick={onClose}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mobile-menu__foot">{siteConfig.tagline}</p>
    </div>
  );
}
