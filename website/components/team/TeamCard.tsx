import Image from "next/image";
import Link from "next/link";
import type { TeamMember } from "@/lib/team";

export function PortraitPlaceholder() {
  return (
    <svg viewBox="0 0 100 110" fill="currentColor" aria-hidden="true">
      <circle cx="50" cy="38" r="20" />
      <path d="M10 110c2-26 20-40 40-40s38 14 40 40Z" />
    </svg>
  );
}

/** Whole card links to the member's profile page. */
export default function TeamCard({ member, headingLevel = 3 }: { member: TeamMember; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="card team-card" data-reveal="card">
      <div className="card__media">
        {member.placeholder && <span className="card__badge">Placeholder profile</span>}
        {member.portrait ? (
          <Image
            src={member.portrait.src}
            alt={member.portrait.alt}
            fill
            sizes="(min-width: 960px) 30vw, (min-width: 560px) 46vw, 92vw"
          />
        ) : (
          <PortraitPlaceholder />
        )}
      </div>
      <div className="card__body">
        <span className="label">{member.role}</span>
        <H>
          <Link href={`/our-team/${member.slug}`}>{member.name}</Link>
        </H>
        <p>{member.bio}</p>
        <div className="card__foot">
          <span className="card__status">{member.focus[0] ?? "FINO JEWELLERY"}</span>
          <span className="card__cta" aria-hidden="true">View profile →</span>
        </div>
      </div>
    </article>
  );
}
