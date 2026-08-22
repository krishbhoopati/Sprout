import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const steps = [
  {
    title: "Tell us about your space",
    body: "Yard, balcony, or raised bed — share your sunlight, size, and growing zone.",
  },
  {
    title: "Get your season-long plan",
    body: "Personalized crop picks, planting dates, and care tasks laid out week by week.",
  },
  {
    title: "Grow with confidence",
    body: "Track progress and adjust as the season goes, so nothing goes to waste.",
  },
];

export function Landing() {
  return (
    <div className="min-h-screen">
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/landingpage1.png')" }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/20 to-black/55" />

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

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 pb-16 text-center">
          <section className="max-w-5xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
              Season-long garden planning
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight text-white md:text-7xl">
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
            <p className="mt-4 text-sm text-white/70">
              Free to start · No garden experience needed
            </p>
          </section>
        </main>

        <div className="hidden justify-center pb-6 md:flex">
          <svg
            className="h-6 w-6 animate-bounce text-white/70"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      <section className="bg-sprout-50 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
              How Sprout works
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              From bare soil to full harvest, in three steps.
            </p>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="card text-left">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sprout-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sprout-700 px-6 py-16 text-center text-white md:py-20">
        <h2 className="text-3xl font-extrabold md:text-4xl">
          Ready to grow something good?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-white/85">
          Get a garden plan built around your space, your climate, and your
          season.
        </p>
        <div className="mt-8">
          <Link
            to="/signup"
            className="btn-primary rounded-full bg-white px-6 py-3 text-base text-sprout-700 hover:bg-sprout-50"
          >
            Plan my garden
          </Link>
        </div>
      </section>

      <footer className="bg-sprout-50 px-6 py-8 text-center text-sm text-slate-500">
        <Logo className="mx-auto justify-center text-sprout-700" />
        <p className="mt-3">© {new Date().getFullYear()} Sprout. Grow local, grow sustainable.</p>
      </footer>
    </div>
  );
}
