import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function Landing() {
  return (
    <div className="relative h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/landingpage1.png')" }}
      />
      <div className="fixed inset-0 -z-10 bg-black/40" />

      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <Logo className="text-white" />
        <nav className="flex items-center gap-5 text-sm">
          <Link
            to="/login"
            className="font-medium text-white/90 transition hover:text-white"
          >
            Log in
          </Link>
          <Link to="/signup" className="btn-primary rounded-full">
            Get Started
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex h-[calc(100vh-72px)] max-w-6xl flex-col items-center justify-start px-4 pt-16 text-center md:pt-24">
        <section className="max-w-5xl">
          <h1 className="text-5xl font-extrabold leading-tight text-white md:text-7xl">
            Grow food that's good for the planet.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-white/90 md:text-2xl">
            Sprout plans a season-long garden for your own yard, balcony, or
            raised bed, cutting food miles, packaging waste, and the
            environmental footprint of what ends up on your plate.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/signup" className="btn-primary rounded-full px-6 py-3 text-base">
              Plan my garden
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
