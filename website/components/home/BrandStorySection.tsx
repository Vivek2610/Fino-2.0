import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import Title from "@/components/content/Title";
import ScrubText from "@/components/content/ScrubText";
import type { HomeContent } from "@/lib/content";

export default function BrandStorySection({ content }: { content: HomeContent["story"] }) {
  const { heading: h, image, pillars } = content;
  return (
    <section className="section" id="story" data-fx-key="story" data-nav="light" aria-labelledby="story-title">
      <div className="container layer story__grid">
        <div className="story__media" data-reveal="clip">
          <div className="story__media-inner" data-scrub="zoom">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 900px) 34vw, 86vw"
            />
          </div>
          <div className="story__badge" aria-hidden="true">
            <Image src={siteConfig.logo.src} alt="" width={26} height={34} />
          </div>
        </div>
        <div className="story__copy">
          {h.eyebrow && (
            <p className="eyebrow" data-reveal>
              {h.eyebrow}
            </p>
          )}
          <h2 id="story-title" className="h2" data-reveal>
            <Title title={h.title} emphasis={h.emphasis} lineBreak />
          </h2>
          {h.intro && (
            <p className="lead" data-scrub="read">
              <ScrubText text={h.intro} />
            </p>
          )}
          {content.body && (
            <p className="muted" data-scrub="read">
              <ScrubText text={content.body} />
            </p>
          )}
          <ul className="story__stats" data-reveal="pillars">
            {pillars.map((p) => (
              <li key={p.title}>
                <strong>{p.title}</strong>
                <span>{p.label}</span>
              </li>
            ))}
          </ul>
          <Link className="link link--ink" href={content.cta.href} data-reveal>
            {content.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
