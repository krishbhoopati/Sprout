import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Logo } from "./Logo";
import { useAuth } from "@/features/auth/AuthContext";
import { BellIcon, ChevronDownIcon } from "@/features/dashboard/icons";

// Critically damped by default; nothing here was thrown, so nothing
// should overshoot.
const MENU_SPRING = { type: "spring" as const, damping: 1, duration: 0.25 };

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the account menu on an outside click, not just on blur, so a
  // click on the bell or nav doesn't leave it stranded open.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  // "Garden" covers the whole gardening flow (dashboard, wizard, crops, plans);
  // "Marketplace" is its own top-level area.
  const inGarden =
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/gardens") ||
    location.pathname.startsWith("/plans");

  const linkClass = (active: boolean) =>
    `relative px-1 py-1 text-sm font-semibold transition-colors duration-150 ${
      active ? "text-sprout-700" : "text-slate-500 hover:text-slate-800"
    }`;

  const underline = (active: boolean) =>
    active && (
      <motion.span
        layoutId="nav-underline"
        className="absolute -bottom-[13px] left-0 right-0 h-0.5 rounded-full bg-sprout-600"
        transition={MENU_SPRING}
      />
    );

  return (
    <header
      className={`sticky top-0 z-30 border-b bg-white/70 backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-200 ${
        scrolled
          ? "border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.15)]"
          : "border-transparent shadow-none"
      }`}
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-3 items-center px-4 py-3 sm:px-6 lg:px-10 xl:px-14">
        <div className="justify-self-start">
          <Logo to="/dashboard" />
        </div>
        <nav className="flex items-center justify-center gap-6">
          <Link to="/dashboard" className={linkClass(inGarden)}>
            Garden
            {underline(inGarden)}
          </Link>
          <NavLink to="/marketplace" className={({ isActive }) => linkClass(isActive)}>
            {({ isActive }) => (
              <>
                Marketplace
                {underline(isActive)}
              </>
            )}
          </NavLink>
        </nav>
        <div className="flex items-center gap-4 justify-self-end text-sm">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-[background-color,color,transform] duration-150 hover:bg-slate-900/5 hover:text-slate-700 active:scale-90"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-sprout-500" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full py-1 transition-transform duration-150 active:scale-95"
              onClick={() => setMenuOpen((v) => !v)}
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
              <motion.span
                animate={{ rotate: menuOpen ? 180 : 0 }}
                transition={MENU_SPRING}
                className="flex"
              >
                <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" />
              </motion.span>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -2 }}
                  transition={MENU_SPRING}
                  style={{ transformOrigin: "top right" }}
                  className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white/95 py-1 shadow-lg backdrop-blur-md"
                >
                  <button
                    type="button"
                    className="block w-full px-3.5 py-2 text-left text-sm text-slate-600 transition-colors duration-100 hover:bg-slate-50"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
