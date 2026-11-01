import Link from "next/link";
import Image from "next/image";
import PhoneLink from "@/components/layout/PhoneLink";
import { PhoneIcon, WhatsAppIcon } from "@/components/layout/PhoneActions";
import { whatsappUrl } from "@/lib/site-config";
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
          <li><Link href="/privacy-policy">Privacy policy</Link></li>
          <li><Link href="/terms">Terms</Link></li>
          {siteConfig.contact.phone && (
            <li className="footer__phone">
              <PhoneLink phone={siteConfig.contact.phone} whatsapp={siteConfig.contact.whatsapp} />
              {whatsappUrl(siteConfig.contact.whatsapp || siteConfig.contact.phone) && (
                <a
                  className="footer__icon"
                  href={whatsappUrl(siteConfig.contact.whatsapp || siteConfig.contact.phone, "Hello FINO JEWELLERY, I'd like to enquire about your collection.")!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat on WhatsApp (opens in a new tab)"
                >
                  <WhatsAppIcon />
                </a>
              )}
              <a className="footer__icon" href={`tel:${siteConfig.contact.phone.replace(/[^\d+]/g, "")}`} aria-label="Call us">
                <PhoneIcon />
                </a>
            </li>
          )}
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
