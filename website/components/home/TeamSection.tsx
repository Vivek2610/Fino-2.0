import Link from "next/link";
import TeamCard from "@/components/team/TeamCard";
import { getTeam } from "@/lib/team";
import Title from "@/components/content/Title";
import type { HomeContent } from "@/lib/content";

export default async function TeamSection({ content }: { content: HomeContent["team"] }) {
  const team = (await getTeam()).slice(0, 3);
  const h = content.heading;
  return (
    <section className="section" id="team" data-fx-key="team" data-nav="light" aria-labelledby="team-title">
      <div className="container layer">
        <div className="head-row">
          <div className="head-row__title">
            {h.eyebrow && (
              <p className="eyebrow" data-reveal>
                {h.eyebrow}
              </p>
            )}
            <h2 id="team-title" className="h2" data-reveal>
              <Title title={h.title} emphasis={h.emphasis} />
            </h2>
          </div>
          {h.intro && (
            <p className="muted" data-reveal>
              {h.intro}
            </p>
          )}
        </div>
        <div className="team-grid" data-stagger>
          {team.map((m) => (
            <TeamCard key={m.slug} member={m} />
          ))}
        </div>
        <div className="section-cta">
          <Link className="btn btn--forest" href="/our-team" data-reveal>
            {content.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
