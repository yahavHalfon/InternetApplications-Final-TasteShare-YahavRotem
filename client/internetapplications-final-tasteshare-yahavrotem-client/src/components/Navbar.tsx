import { ChefHat, Home, LogOut, PenSquare, Sparkles, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

type NavbarProps = {
  onLogout: () => void;
};

const navItems = [
  { to: "/feed", label: "Feed", icon: Home },
  { to: "/search", label: "AI Search", icon: Sparkles },
  { to: "/create", label: "Add Recipe", icon: PenSquare },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function Navbar({ onLogout }: NavbarProps) {
  return (
    <aside className="navbar-shell" aria-label="Primary Navigation">
      <div className="navbar-brand">
        <div className="navbar-brand-icon" aria-hidden="true">
          <ChefHat size={20} />
        </div>
        <span className="navbar-brand-text">TasteShare</span>
      </div>

      <nav className="navbar-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "navbar-link navbar-link-active" : "navbar-link")}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="navbar-footer">
        <button type="button" className="navbar-signout" onClick={onLogout}>
          <LogOut size={19} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Navbar;
