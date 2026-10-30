import Image from "next/image";
import { siteConfig } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/settings";
import Title from "@/components/content/Title";
import type { HomeContent } from "@/lib/content";
import ScrubText from "@/components/content/ScrubText";
import CraftVideo from "./CraftVideo";

export default async function CraftVideoSection({ content }: { content: HomeContent["craft"] }) {
  const { src, poster, posterAlt } = (await getSiteSettings()).craftVideo;
  const h = content.heading;
  return (
    <section
      className="section section--forest craft"
      id="craft"
      data-fx-key="craft"
      data-nav="dark"
      aria-labelledby="craft-title"
    >
      <div className="container layer">
        <div className="craft__head">
          {h.eyebrow && (
            <p className="eyebrow" data-reveal>
              {h.eyebrow}
            </p>
          )}
          <h2 id="craft-title" className="h2" data-reveal>
            <Title title={h.title} emphasis={h.emphasis} />
          </h2>
          {h.intro && (
            <p className="muted" data-reveal>
              {h.intro}
            </p>
          )}
        </div>
        <div className="craft__frame" data-scrub="screen">
          <div className="craft__screen" id="fx-craft-frame">
            {src ? (
              <CraftVideo src={src} poster={poster} label={posterAlt} />
            ) : (
              <Image src={poster} alt={posterAlt} fill sizes="(min-width: 1320px) 1150px, 92vw" />
            )}
            <div className="craft__caption" aria-hidden="true">
              <span>FINO · {src ? "Campaign film" : "Faceted Gold Bead Necklace"}</span>
              <span>Bold by nature · Golden by design</span>
            </div>
          </div>
        </div>
        {src && <p className="craft__note">Campaign visual created with AI from a photograph of the FINO necklace.</p>}
        <blockquote className="craft__quote" data-reveal>
          <p data-scrub="words">
            <ScrubText text={`\u201C${content.quote}\u201D`} />
          </p>
          <footer>— {siteConfig.name}</footer>
        </blockquote>
      </div>
    </section>
  );
}
