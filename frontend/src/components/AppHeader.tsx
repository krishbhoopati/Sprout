import { useNavigate, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "@/features/auth/AuthContext";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Show a back control on every authed page except the dashboard (the top-level
  // landing spot once signed in). Fall back to the dashboard when there is no
  // in-app history to return to (e.g. after a hard refresh or a shared link).
  const showBack = location.pathname !== "/dashboard";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              type="button"
              className="btn-secondary flex items-center gap-1"
              onClick={handleBack}
              aria-label="Go back"
            >
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12.5 15L7.5 10L12.5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back
            </button>
          )}
          <Logo to="/dashboard" />
        </div>
        <div className="flex items-center gap-3 text-sm">
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
