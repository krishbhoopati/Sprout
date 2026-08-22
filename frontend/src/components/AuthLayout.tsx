import type { ReactNode } from "react";
import { Logo } from "./Logo";

// Auth pages share the landing page's full-bleed garden hero so signing in
// feels like a continuation of the landing experience.
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/landingpage1.png')" }}
      />
      <div className="fixed inset-0 -z-10 bg-black/40" />

      <div className="mb-6">
        <Logo className="text-white" />
      </div>
      <div className="card w-full max-w-sm bg-white/95 backdrop-blur">
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
      {footer && <div className="mt-4 text-sm text-white/90">{footer}</div>}
    </div>
  );
}
