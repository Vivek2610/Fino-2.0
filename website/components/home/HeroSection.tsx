import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import Title from "@/components/content/Title";
import type { HomeContent } from "@/lib/content";

export default function HeroSection({ content }: { content: HomeContent["hero"] }) {
  return (
    <section className="hero" id="top" data-fx-key="hero" data-nav="dark" aria-labelledby="hero-title">
      <div className="container layer hero__grid">
        <div className="hero__copy">
          {content.eyebrow && <p className="eyebrow eyebrow--line">{content.eyebrow}</p>}
          <h1 id="hero-title" className="h1">
            <Title title={content.title} emphasis={content.emphasis} lineBreak />
          </h1>
          {content.lead && <p className="lead">{content.lead}</p>}
          <div className="hero__ctas">
            <Link className="btn btn--forest" href={content.primaryCta.href}>
              {content.primaryCta.label}
            </Link>
            <Link className="link" href={content.secondaryCta.href}>
              {content.secondaryCta.label} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <a className="hero__meta" href="#story">
            Scroll <i aria-hidden="true" /> to begin
          </a>
        </div>

        <div className="hero__visual">
          <div className="hero__slot" id="fx-hero-slot">
            <Image
              className="fx-static"
              src="/images/fino-necklace-cutout.png"
              alt="The FINO Faceted Gold Bead Necklace — a graduated strand of hammered, faceted gold beads"
              width={740}
              height={783}
              priority
              sizes="(min-width: 900px) 44vw, 80vw"
            />
            {/* The exact supplied logo, framed by the necklace's loop. While the
                cinematic layer runs, its 7 facets lift away onto the beads. */}
            <Image
              id="fx-hero-logo"
              className="hero__logo fx-static"
              src={siteConfig.logo.src}
              alt={siteConfig.logo.alt}
              width={siteConfig.logo.width}
              height={siteConfig.logo.height}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
