"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { siteConfig } from "@/lib/site-config";
import MobileMenu from "./MobileMenu";

/**
 * Top bar. Its theme follows the section underneath it: sections marked
 * data-nav="dark" (hero, film, footer) give a deep-green bar with gold type,
 * everything else gives an ivory bar.
 */
export default function Navbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">(pathname === "/" ? "dark" : "light");
  const [open, setOpen] = useState(false);
  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    let raf = 0;
    const probe = () => {
      raf = 0;
      const y = 40; // just inside the bar
      const sections = document.querySelectorAll<HTMLElement>("[data-nav]");
      let next: "dark" | "light" = "light";
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) {
          next = s.dataset.nav === "dark" ? "dark" : "light";
          break;
        }
      }
      setTheme(next);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(probe);
    };
    probe();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  // Active page indication (every nav item is a real, crawlable page)
  const isActive = (section: string) => {
    if (section === "home") return pathname === "/";
    if (section === "collection") return pathname.startsWith("/collection");
    if (section === "team") return pathname.startsWith("/our-team");
    if (section === "blog") return pathname.startsWith("/blog");
    if (section === "contact") return pathname.startsWith("/contact");
    return false;
  };

  return (
    <>
      <header className="nav" data-theme={theme}>
        <nav className="container nav__inner" aria-label="Primary">
          <Link href="/#top" className="brand" aria-label={`${siteConfig.name} — home`}>
            <Image src={siteConfig.logo.src} alt="" width={siteConfig.logo.width} height={siteConfig.logo.height} priority />
            <span className="brand__word" aria-hidden="true">
              <span className="brand__name">FINO JEWELLERY</span>
              <span className="brand__tag">Bold by nature, golden by design</span>
            </span>
          </Link>
          <ul className="nav__links">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isActive(item.section) ? "true" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            Menu
            <span className="nav__toggle-lines" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </nav>
      </header>
      {/* Rendered outside the header: its backdrop-filter would otherwise trap position:fixed */}
      <MobileMenu open={open} onClose={closeMenu} />
    </>
  );
}
