import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { Disclaimer } from "./Disclaimer";

export function Layout() {
  const [theme, toggle] = useTheme();
  return (
    <div className="app">
      <header className="header">
        <strong className="brand">KAIROS</strong>
        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/methodology">Methodology</NavLink>
        </nav>
        <button className="theme-btn" onClick={toggle} aria-label="Toggle dark mode">
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </header>
      <main>
        <Outlet context={{ theme }} />
      </main>
      <footer>
        <Disclaimer />
      </footer>
    </div>
  );
}
