import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function Landing() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <header className="flex shrink-0 items-center justify-between px-6 py-4 md:px-12">
        <Logo className="text-sprout-700" />
        <nav className="flex items-center gap-5 text-sm">
          <Link
            to="/login"
            className="font-medium text-slate-700 transition-[color,opacity] duration-150 hover:text-slate-900 active:opacity-60"
          >
            Log in
          </Link>
          <Link to="/signup" className="btn-primary rounded-full">
            Get Started
          </Link>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-[96rem] shrink-0 px-6 pb-6 md:px-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold leading-tight text-slate-900 md:text-6xl">
            More food from every square foot.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600 md:text-xl">
            Sprout intelligently plans your garden around your space and
            season, helping you grow efficiently while reducing packaging,
            transportation, and food waste.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/signup" className="btn-primary rounded-full px-6 py-3 text-base">
              Plan my garden
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto min-h-0 w-full max-w-[96rem] flex-1 px-6 pb-6 md:px-16">
        <div className="relative h-full w-full overflow-hidden rounded-2xl">
          <video
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/sproutbackg.mp4" type="video/mp4" />
            <source src="/sproutbackg.mov" type="video/quicktime" />
          </video>
        </div>
      </div>
    </div>
  );
}
