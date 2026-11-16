import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../hooks/useLocale";
import { useTheme } from "../hooks/useTheme";
import type { FooterTopicKey } from "../i18n/messages";
import { Disclaimer } from "./Disclaimer";
import { FooterInfoModal } from "./FooterInfoModal";

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

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.25" cy="6.75" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Layout() {
  const [theme, toggle] = useTheme();
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const [activeTopic, setActiveTopic] = useState<FooterTopicKey | null>(null);
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

          <div className="footer-main">
            <div className="footer-brand">
              <Link to="/" className="brand-group">
                <img
                  src="/logo.png"
                  alt=""
                  width={34}
                  height={34}
                  className="footer-brand-logo"
                  aria-hidden="true"
                />
                <strong className="footer-brand-name">KAIROS</strong>
              </Link>
              <span className="footer-brand-sub">{t.footer.brandSubtitle}</span>
            </div>

            <div className="footer-columns">
              <div className="footer-col" role="group" aria-label={t.footer.colInfoAriaLabel}>
                <button type="button" className="footer-topic-btn" onClick={() => setActiveTopic("about")}>
                  {t.footer.links.about}
                </button>
                <button type="button" className="footer-topic-btn" onClick={() => setActiveTopic("contact")}>
                  {t.footer.links.contact}
                </button>
                <button type="button" className="footer-topic-btn" onClick={() => setActiveTopic("help")}>
                  {t.footer.links.help}
                </button>
                <button type="button" className="footer-topic-btn" onClick={() => setActiveTopic("terms")}>
                  {t.footer.links.terms}
                </button>
              </div>

              <div className="footer-col" role="group" aria-label={t.footer.colResourcesAriaLabel}>
                <button type="button" className="footer-topic-btn" onClick={() => setActiveTopic("glossary")}>
                  {t.footer.links.glossary}
                </button>
                <button type="button" className="footer-topic-btn" onClick={() => setActiveTopic("privacy")}>
                  {t.footer.links.privacy}
                </button>
              </div>
            </div>

            <div className="footer-socials" role="group" aria-label={t.footer.socialAriaLabel}>
              <a
                href="https://www.linkedin.com/in/panca-nugraha-wicaksana/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-icon footer-social-btn"
                aria-label={t.footer.links.linkedinAriaLabel}
              >
                <LinkedInIcon />
              </a>
              <a
                href="https://www.instagram.com/pangami_"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-icon footer-social-btn"
                aria-label={t.footer.links.instagramAriaLabel}
              >
                <InstagramIcon />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <FooterInfoModal topic={activeTopic} onClose={() => setActiveTopic(null)} />
    </div>
  );
}
