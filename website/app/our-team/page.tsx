import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import TeamCard from "@/components/team/TeamCard";
import { getTeam } from "@/lib/team";
import { breadcrumbJsonLd, listingMetadata, teamJsonLd } from "@/lib/seo";
import { getListingPage } from "@/lib/content";
import Title from "@/components/content/Title";

export const revalidate = 3600; // refresh from the CMS hourly (ISR); publishing revalidates instantly

export async function generateMetadata() {
  return listingMetadata(await getListingPage("page-our-team"), "/our-team");
}

export default async function OurTeamPage() {
  const [team, page] = await Promise.all([getTeam(), getListingPage("page-our-team")]);
  const h = page.heading;
  return (
    <main id="main">
      <div className="container page-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li aria-current="page">Our Team</li>
          </ol>
        </nav>
        {h.eyebrow && <p className="eyebrow eyebrow--line" data-reveal>{h.eyebrow}</p>}
        <h1 className="h2" data-reveal>
          <Title title={h.title} emphasis={h.emphasis} />
        </h1>
        {h.intro && <p className="lead" data-reveal>{h.intro}</p>}
      </div>
      <section className="container collection-list" aria-label="Team members">
        <div className="team-grid" data-stagger>
          {team.map((m) => (
            <TeamCard key={m.slug} member={m} headingLevel={2} />
          ))}
        </div>
        <aside className="trade-band" data-reveal>
          <div>
            <p className="eyebrow">Work with us</p>
            <p className="trade-band__title">Talk to the team about a trade partnership.</p>
          </div>
          <Link className="btn btn--forest" href="/contact?subject=Trade%20partnership">
            Contact the team
          </Link>
        </aside>
      </section>
      <JsonLd data={teamJsonLd(team)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Our Team", path: "/our-team" }])} />
    </main>
  );
}
