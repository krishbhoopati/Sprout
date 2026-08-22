import { useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "@/features/auth/AuthContext";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Logo to="/dashboard" />
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
