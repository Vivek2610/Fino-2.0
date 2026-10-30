import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import TeamCard, { PortraitPlaceholder } from "@/components/team/TeamCard";
import { getMember, getOtherMembers, getTeam } from "@/lib/team";
import { breadcrumbJsonLd, memberJsonLd, memberMetadata } from "@/lib/seo";

export const revalidate = 3600;
type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getTeam()).map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Params) {
  const m = await getMember((await params).slug);
  return m ? memberMetadata(m) : {};
}

export default async function TeamMemberPage({ params }: Params) {
  const m = await getMember((await params).slug);
  if (!m) notFound();
  const others = await getOtherMembers(m);
  const contactHref = `/contact?subject=${encodeURIComponent(`For ${m.name}`)}`;
  return (
    <main id="main">
      <div className="container page-head page-head--tight">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/our-team">Our Team</Link></li>
            <li aria-current="page">{m.name}</li>
          </ol>
        </nav>
      </div>

      <article className="container profile">
        <div className="profile__portrait" data-reveal="clip">
          {m.portrait ? (
            <Image src={m.portrait.src} alt={m.portrait.alt} fill priority sizes="(min-width: 900px) 40vw, 92vw" />
          ) : (
            <PortraitPlaceholder />
          )}
        </div>
        <div className="profile__info">
          <p className="eyebrow eyebrow--line" data-reveal>{m.role}</p>
          <h1 className="h2" data-reveal>{m.name}</h1>
          {m.placeholder && <span className="placeholder-tag">Placeholder profile</span>}
          <p className="lead" data-reveal>{m.bio}</p>
          <div className="product-detail__desc" data-reveal>
            {m.biography.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {(m.focus.length > 0 || m.languages.length > 0) && (
            <dl className="detail-list" data-reveal>
              {m.focus.length > 0 && (
                <div>
                  <dt>Looks after</dt>
                  <dd>{m.focus.join(" · ")}</dd>
                </div>
              )}
              {m.languages.length > 0 && (
                <div>
                  <dt>Languages</dt>
                  <dd>{m.languages.join(" · ")}</dd>
                </div>
              )}
            </dl>
          )}
          <div className="product-detail__actions" data-reveal>
            {m.email ? (
              <a className="btn btn--forest" href={`mailto:${m.email}`}>
                Email {m.name.split(" ")[0]}
              </a>
            ) : (
              <Link className="btn btn--forest" href={contactHref}>
                Get in touch
              </Link>
            )}
            {m.links.map((l) => (
              <a key={l.href} className="link" href={l.href} target="_blank" rel="noopener noreferrer me" style={{ color: "var(--gold-deep)" }}>
                {l.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
            <Link className="link" href="/our-team" style={{ color: "var(--gold-deep)" }}>
              <span aria-hidden="true">←</span> The whole team
            </Link>
          </div>
        </div>
      </article>

      {others.length > 0 && (
        <section className="section section--linen" aria-labelledby="others-title">
          <div className="container">
            <div className="head-row">
              <div className="head-row__title">
                <p className="eyebrow" data-reveal>Our team</p>
                <h2 id="others-title" className="h2" data-reveal>Meet the <em>team</em></h2>
              </div>
            </div>
            <div className="team-grid" data-stagger>
              {others.map((o) => (
                <TeamCard key={o.slug} member={o} />
              ))}
            </div>
          </div>
        </section>
      )}

      <JsonLd data={memberJsonLd(m)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Our Team", path: "/our-team" },
          { name: m.name, path: `/our-team/${m.slug}` },
        ])}
      />
    </main>
  );
}
