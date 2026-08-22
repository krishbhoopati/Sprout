import { useNavigate, useLocation, Link, NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "@/features/auth/AuthContext";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // "Garden" covers the whole gardening flow (dashboard, wizard, crops, plans);
  // "Marketplace" is its own top-level area.
  const inGarden =
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/gardens") ||
    location.pathname.startsWith("/plans");

  const linkClass = (active: boolean) =>
    `text-sm font-semibold transition ${
      active ? "text-sprout-700" : "text-slate-500 hover:text-slate-800"
    }`;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-3 items-center px-4 py-3">
        <div className="justify-self-start">
          <Logo to="/dashboard" />
        </div>
        <nav className="flex items-center justify-center gap-6">
          <Link to="/dashboard" className={linkClass(inGarden)}>
            Garden
          </Link>
          <NavLink
            to="/marketplace"
            className={({ isActive }) => linkClass(isActive)}
          >
            Marketplace
          </NavLink>
        </nav>
        <div className="flex items-center gap-3 justify-self-end text-sm">
          {user?.email && (
            <span className="hidden text-slate-500 sm:inline">
              {user.email}
            </span>
          )}
          <button className="btn-secondary" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
