import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Logo />
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/login" className="btn-secondary">
            Log in
          </Link>
          <Link to="/signup" className="btn-primary">
            Get Started
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
              Grow a season of food from the space you already have.
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              Sprout turns your yard, balcony, or raised bed into an optimized,
              season-long planting plan — reusing the same soil as crops hand off
              to their successors. Lettuce in spring becomes beans in summer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="btn-primary px-6 py-3 text-base">
                Plan my garden
              </Link>
              <Link to="/login" className="btn-secondary px-6 py-3 text-base">
                I already have an account
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Free to try · No credit card · Built for the growing season.
            </p>
          </div>

          <div className="rounded-2xl border border-sprout-100 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-4 gap-2">
              {[
                "Lettuce",
                "Beans",
                "Tomato",
                "Carrot",
                "Kale",
                "Peas",
                "Basil",
                "Radish",
              ].map((c, i) => (
                <div
                  key={c}
                  className={`flex aspect-square items-center justify-center rounded-lg text-xs font-semibold text-white ${
                    ["bg-sprout-300", "bg-sprout-400", "bg-sprout-500", "bg-sprout-600"][
                      i % 4
                    ]
                  }`}
                >
                  {c}
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-slate-500">
              Same soil, second harvest.
            </p>
          </div>
        </section>

        <section className="grid gap-6 border-t border-slate-200 py-14 md:grid-cols-3">
          {[
            {
              title: "Space & time optimizer",
              body: "Two crops can share the same cells as long as their seasons don't overlap.",
            },
            {
              title: "Succession planting",
              body: "Scrub the timeline and watch each crop hand off to its successor.",
            },
            {
              title: "Yield & savings",
              body: "See estimated harvest and grocery savings as honest ranges.",
            },
          ].map((f) => (
            <div key={f.title} className="card">
              <h3 className="font-semibold text-sprout-700">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        Sprout — grow more from your space.
      </footer>
    </div>
  );
}
