import Link from "next/link";
import Image from "next/image";
import { formattedAddress } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/settings";

export default async function Footer() {
  const siteConfig = await getSiteSettings();
  const year = new Date().getFullYear();
  const address = formattedAddress(siteConfig);
  return (
    <footer className="footer" id="footer" data-fx-key="footer" data-nav="dark">
      <div className="container layer">
        <div className="footer__top">
          <Link href="/" className="brand" aria-label={`${siteConfig.name} — home`}>
            <Image src={siteConfig.logo.src} alt="" width={siteConfig.logo.width} height={siteConfig.logo.height} />
            <span className="brand__word" aria-hidden="true">
              <span className="brand__name">FINO JEWELLERY</span>
              <span className="brand__tag">Bold by nature, golden by design</span>
            </span>
          </Link>
          <p className="footer__tag">{siteConfig.tagline}</p>
        </div>
        <ul className="footer__links">
          <li><Link href="/collection">Collection</Link></li>
          <li><Link href="/our-team">Our team</Link></li>
          <li><Link href="/blog">Blog</Link></li>
          <li><Link href="/contact?subject=Trade%20partnership">Trade partnership</Link></li>
          <li><Link href="/contact">Contact</Link></li>
          <li><Link href="/privacy-policy">Privacy policy</Link></li>
          <li><Link href="/terms">Terms</Link></li>
          {siteConfig.contact.email && (
            <li><a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a></li>
          )}
          {siteConfig.social.map((s) => (
            <li key={s.href}><a href={s.href} rel="noopener noreferrer" target="_blank">{s.label}</a></li>
          ))}
        </ul>
        <div className="footer__base">
          <p>
            © {year} {siteConfig.name}. All rights reserved.{address ? ` ${address}` : ""}
          </p>
          <span>Fine gold · For the trade</span>
        </div>
      </div>
    </footer>
  );
}
