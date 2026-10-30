import Image from "next/image";
import Link from "next/link";
import { siteConfig, formattedAddress } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/settings";
import Title from "@/components/content/Title";
import type { HomeContent } from "@/lib/content";
import DeliveryMap from "./DeliveryMap";

const Icon = {
  pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" />
      <path d="m3 6 9 7 9-7" />
    </svg>
  ),
};

export default async function LocationSection({ content }: { content: HomeContent["location"] }) {
  const settings = await getSiteSettings();
  const l = settings.location;
  const c = settings.contact;
  const address = formattedAddress(settings);
  const h = content.heading;
  return (
    <section
      className="section section--linen"
      id="location"
      data-fx-key="location"
      data-nav="light"
      aria-labelledby="location-title"
    >
      <div className="container layer">
        <div className="head-row">
          <div className="head-row__title">
            {h.eyebrow && <p className="eyebrow">{h.eyebrow}</p>}
            <h2 id="location-title" className="h2">
              <Title title={h.title} emphasis={h.emphasis} />
            </h2>
          </div>
          {h.intro && <p className="muted">{h.intro}</p>}
        </div>

        <div className="location__grid">
          <DeliveryMap settings={settings} />

          <article className="house" data-reveal="card">
            <div className="house__head">
              <div>
                <span className="label">Our house</span>
                <h3>{l.name ?? "FINO JEWELLERY"}</h3>
              </div>
              <Image
                className="house__logo"
                src={siteConfig.logo.src}
                alt={siteConfig.logo.alt}
                width={siteConfig.logo.width}
                height={siteConfig.logo.height}
              />
            </div>
            {content.houseNote && (
              <p className="muted" style={{ fontSize: "0.9rem" }}>
                {content.houseNote}
              </p>
            )}
            <dl className="house__rows">
              <div>
                {Icon.pin}
                <dt>Address</dt>
                <dd>{address ?? <span className="placeholder-tag">Address to be confirmed</span>}</dd>
              </div>
              <div>
                {Icon.clock}
                <dt>Hours</dt>
                <dd>
                  {l.openingHours?.length ? (
                    l.openingHours.map((h) => <span key={h} style={{ display: "block" }}>{h}</span>)
                  ) : (
                    <span className="placeholder-tag">Hours to be confirmed</span>
                  )}
                </dd>
              </div>
              <div>
                {Icon.mail}
                <dt>Trade enquiries</dt>
                <dd>
                  {c.email || c.phone ? (
                    <>
                      {c.phone && (
                        <a href={`tel:${c.phone.replace(/\s/g, "")}`} style={{ display: "block" }}>
                          {c.phone}
                        </a>
                      )}
                      {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
                    </>
                  ) : (
                    "Use the enquiry form below."
                  )}
                </dd>
              </div>
            </dl>
            <div className="house__actions">
              {l.mapUrl && address ? (
                <a className="btn btn--forest" href={l.mapUrl} target="_blank" rel="noopener noreferrer">
                  Get directions
                </a>
              ) : null}
              <Link className="btn btn--light" href="#contact">
                Send an enquiry
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
