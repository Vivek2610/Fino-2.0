import type { SiteConfig } from "@/lib/site-config";

/** Same projection the dotted map (public/images/world-dots.svg) was drawn with. */
const W = 1000;
const H = 394;
const LAT_TOP = 84;
const LAT_BOTTOM = -58;
const project = (lat: number, lon: number) => ({
  x: ((lon + 180) / 360) * W,
  y: ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * H,
});

export default function DeliveryMap({ settings }: { settings: SiteConfig }) {
  const { markets, headline, note } = settings.delivery;
  const home = settings.location.coordinates;
  const primary = markets.find((m) => m.primary);
  const hubLL = home ?? (primary ? { lat: primary.lat, lon: primary.lon } : null);
  const hub = hubLL ? project(hubLL.lat, hubLL.lon) : null;

  return (
    <div className="map" data-reveal="scale" role="img" aria-label={`${headline}: ${markets.map((m) => m.name).join(", ")}`}>
      <div className="map__badge" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
        </svg>
        {headline}
      </div>

      <div className="map__canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/world-dots.svg" alt="" width={W} height={H} />
        {hub && (
          <svg className="map__arcs" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            {markets
              .filter((m) => !m.primary || home)
              .map((m) => {
                const p = project(m.lat, m.lon);
                const mx = (hub.x + p.x) / 2;
                const my = (hub.y + p.y) / 2 - Math.min(90, Math.hypot(p.x - hub.x, p.y - hub.y) * 0.28);
                return <path key={m.name} d={`M${hub.x},${hub.y} Q${mx},${my} ${p.x},${p.y}`} />;
              })}
          </svg>
        )}
        {markets.map((m, i) => {
          const p = project(m.lat, m.lon);
          return (
            <span
              key={m.name}
              className={`pin${m.primary && !home ? " pin--home" : ""}`}
              style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%`, animationDelay: `${(p.x % 7) * 0.4}s`, transitionDelay: `${300 + i * 90}ms` }}
              aria-hidden="true"
            >
              {m.primary && <span className="pin__label">{m.name} · Primary market</span>}
            </span>
          );
        })}
        {home && (
          <span
            className="pin pin--home"
            style={{ left: `${(project(home.lat, home.lon).x / W) * 100}%`, top: `${(project(home.lat, home.lon).y / H) * 100}%` }}
            aria-hidden="true"
          >
            <span className="pin__label">{settings.location.name ?? settings.name}</span>
          </span>
        )}
      </div>

      <div className="map__legend">
        <strong>
          <i aria-hidden="true" /> Trade delivery
        </strong>
        {note}
      </div>
    </div>
  );
}
