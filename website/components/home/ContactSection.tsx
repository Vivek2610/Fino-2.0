import ContactForm from "@/components/forms/ContactForm";
import { formattedAddress } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/settings";
import Title from "@/components/content/Title";
import type { Heading } from "@/lib/content";

export default async function ContactSection({ heading: h, headingLevel = 2 }: { heading: Heading; headingLevel?: 1 | 2 }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  const siteConfig = await getSiteSettings();
  const address = formattedAddress(siteConfig);
  return (
    <section className="section" id="contact" data-fx-key="contact" data-nav="light" aria-labelledby="contact-title">
      <div className="container layer contact__grid">
        <div className="contact__aside">
          {h.eyebrow && <p className="eyebrow">{h.eyebrow}</p>}
          <H id="contact-title" className="h2">
            <Title title={h.title} emphasis={h.emphasis} />
          </H>
          {h.intro && <p className="muted">{h.intro}</p>}
          <dl className="contact__list">
            <div>
              <dt>Email</dt>
              <dd>
                {siteConfig.contact.email ? (
                  <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
                ) : (
                  <span className="placeholder-tag">Email to be confirmed</span>
                )}
              </dd>
            </div>
            {siteConfig.contact.phone && (
              <div>
                <dt>Telephone</dt>
                <dd>
                  <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}>{siteConfig.contact.phone}</a>
                </dd>
              </div>
            )}
            <div>
              <dt>Location</dt>
              <dd>{address ?? <span className="placeholder-tag">Address to be confirmed</span>}</dd>
            </div>
          </dl>
        </div>
        <div data-reveal="scale">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
