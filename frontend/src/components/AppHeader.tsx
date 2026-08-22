import { useState } from "react";
import { useNavigate, useLocation, Link, NavLink } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "@/features/auth/AuthContext";
import { BellIcon, ChevronDownIcon } from "@/features/dashboard/icons";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="mx-auto grid max-w-[1600px] grid-cols-3 items-center px-4 py-3 sm:px-6 lg:px-10 xl:px-14">
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
        <div className="flex items-center gap-4 justify-self-end text-sm">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-sprout-500" />
          </button>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={() => setMenuOpen((v) => !v)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
            >
              {user?.email && (
                <span className="hidden text-slate-600 sm:inline">
                  {user.email}
                </span>
              )}
              <span
                className="h-8 w-8 shrink-0 rounded-full bg-slate-200"
                aria-hidden="true"
              />
              <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="block w-full px-3.5 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
