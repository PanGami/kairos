import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";

export function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const isGuest = !user;

  return (
    <div className="overview-screen">
      <section className="overview-hero stage-1" aria-label={t.dashboard.heroAriaLabel}>
        <h1 className="overview-headline">{t.dashboard.headline}</h1>
        <p className="overview-lead">{t.dashboard.lead}</p>
      </section>

      <section className="overview-pillars stage-2" aria-label={t.dashboard.pillarsAriaLabel}>
        {t.dashboard.pillars.map((item) => (
          <div
            key={item.code}
            className={`overview-pillar-col${item.primary ? " pillar-primary" : ""}`}
          >
            <h2 className="pillar-title">
              <span className="pillar-code">{item.code}</span>
              {item.title}
            </h2>
            <p className="pillar-desc">{item.desc}</p>
          </div>
        ))}
      </section>

      <section className="cta-launch-strip stage-3" aria-label={t.dashboard.ctaAriaLabel}>
        <div className="cta-launch-copy">
          <h2 className="cta-launch-title">{t.dashboard.ctaTitle}</h2>
          <p className="cta-launch-desc">{t.dashboard.ctaDesc}</p>
        </div>
        <div className="cta-launch-actions">
          <Link to="/watcher" className="btn btn-primary">
            {t.dashboard.openWatcher}
          </Link>
          <Link to="/methodology" className="btn btn-ghost">
            {t.dashboard.readMethodology}
          </Link>
          {isGuest && (
            <Link to="/login" className="btn btn-secondary">
              {t.dashboard.signInGoogle}
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
