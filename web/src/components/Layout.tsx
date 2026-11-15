import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { Disclaimer } from "./Disclaimer";

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function Layout() {
  const [theme, toggle] = useTheme();
  const { user, logout } = useAuth();
  const themeLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <Link to="/" className="brand-group">
              <strong className="brand-mark">KAIROS</strong>
              <span className="pill pill-muted">EOD RISK MONITOR</span>
            </Link>
            <nav className="topbar-nav" aria-label="Primary navigation">
              <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                Dashboard
              </NavLink>
              <NavLink to="/methodology" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                Methodology
              </NavLink>
            </nav>
          </div>

          <div className="topbar-right">
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
                <span className="pill pill-verified">
                  <span className="geo-dot" aria-hidden="true" />
                  VERIFIED
                </span>
                <span className="user-identity" title={user.email}>
                  {user.name || user.email}
                </span>
                <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary">
                Sign In
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
            <span className="provenance-item">DATA AS OF EOD SNAPSHOT</span>
            <span className="provenance-item">LAST SUCCESSFUL UPDATE NIGHTLY BATCH</span>
            <span className="provenance-item">SOURCE YFINANCE AND KAGGLE AUDITED REPAIR</span>
            <span className="provenance-item">END-OF-DAY BATCH PIPELINE</span>
          </div>
          <Disclaimer />
          <nav className="footer-links" aria-label="Footer navigation">
            <Link to="/">Dashboard</Link>
            <Link to="/methodology">Methodology</Link>
            <Link to="/login">Account Settings</Link>
            <Link to="/methodology">Documentation</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
