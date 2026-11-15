import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";
import { useTheme } from "../hooks/useTheme";
import { Disclaimer } from "./Disclaimer";

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function Layout() {
  const [theme, toggle] = useTheme();
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const themeLabel = theme === "dark" ? t.nav.switchToLight : t.nav.switchToDark;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <Link to="/" className="brand-group">
              <img
                src="/logo.png"
                alt=""
                width={28}
                height={28}
                className="brand-logo"
                aria-hidden="true"
              />
              <strong className="brand-mark">KAIROS</strong>
              <span className="pill pill-muted">{t.nav.brandTag}</span>
            </Link>
            <nav className="topbar-nav" aria-label={t.nav.primaryAriaLabel}>
              <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                {t.nav.dashboard}
              </NavLink>
              <NavLink to="/watcher" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                {t.nav.watcher}
              </NavLink>
              <NavLink to="/methodology" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                {t.nav.methodology}
              </NavLink>
            </nav>
          </div>

          <div className="topbar-right">
            <div className="locale-toggle" role="group" aria-label={t.nav.languageGroupLabel}>
              <button
                type="button"
                className={`locale-btn${locale === "en" ? " active" : ""}`}
                aria-pressed={locale === "en"}
                aria-label={t.nav.switchToEnglish}
                onClick={() => setLocale("en")}
              >
                EN
              </button>
              <button
                type="button"
                className={`locale-btn${locale === "id" ? " active" : ""}`}
                aria-pressed={locale === "id"}
                aria-label={t.nav.switchToIndonesian}
                onClick={() => setLocale("id")}
              >
                ID
              </button>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={toggle}
              aria-label={themeLabel}
              title={themeLabel}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            {user ? (
              <>
                <span className="pill pill-verified">{t.nav.verified}</span>
                <span className="user-identity" title={user.email}>
                  {user.name || user.email}
                </span>
                <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
                  {t.nav.signOut}
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary">
                {t.nav.signIn}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        <Outlet context={{ theme }} />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-provenance">
            <span className="provenance-item">{t.footer.dataAsOfSnapshot}</span>
            <span className="provenance-item">{t.footer.lastUpdateNightly}</span>
            <span className="provenance-item">{t.footer.sourceAudit}</span>
            <span className="provenance-item">{t.footer.pipelineTag}</span>
          </div>
          <Disclaimer />
          <nav className="footer-links" aria-label={t.nav.footerAriaLabel}>
            <Link to="/">{t.nav.dashboard}</Link>
            <Link to="/watcher">{t.nav.watcher}</Link>
            <Link to="/methodology">{t.nav.methodology}</Link>
            {!user && <Link to="/login">{t.nav.signIn}</Link>}
          </nav>
        </div>
      </footer>
    </div>
  );
}
