# Sprout

Turn a yard, balcony, raised bed, or community plot into a season-long food garden with succession planting.

Sprout takes a garden's dimensions, sunlight level, and a list of vegetables you eat, then produces an optimized season-long planting plan that reuses each garden section over time (lettuce in spring hands the same cells off to beans in summer). The plan renders on a cell grid with a timeline slider, estimates seasonal yield and grocery savings, generates a real 3D preview of the garden with World Labs (Marble), and surfaces weather notifications from an n8n workflow.

> **Live:**
> Frontend — https://sprout-1-qckn.onrender.com · Backend — https://sprout-ldna.onrender.com

See [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) for the full architecture and build plan.

## What it does

- **Auth** — Supabase email/password; the browser talks to Supabase directly for auth and RLS-protected reads.
- **Gardens** — create/list/delete gardens with dimensions, sunlight, city, and an optional photo (stored in Supabase Storage). Delete is a two-step confirm on the dashboard.
- **Crop selection** — a curated crop dataset with must-have / preferred / optional priorities.
- **Optimizer** — a two-stage space-and-time heuristic that runs in a single request, placing crops on a grid and scheduling succession handoffs.
- **Plan view** — a garden grid sized to the plan, with a dashed cell overlay and each crop block labelled with its real-world size, a legend, a timeline slider that swaps crops for successors by date, and yield/savings ranges.
- **3D preview** — the backend sends the garden photo + planned crops to the World Labs Marble API and the plan page renders the generated Gaussian-splat world in-app (via Spark/three.js), with a link out to the full hosted world.
- **Notifications** — an n8n weather workflow posts frost/watering alerts through a signed webhook; the panel falls back to a few built-in notifications if the API is unreachable.
- **Marketplace** — list surplus produce to sell, trade, or give away (linked to a curated crop or a free-text "other"), browse other growers' listings filtered by crop and city, and reserve an item — the seller gets a notification and the handoff is arranged offline (no in-app payments).

## Structure

```
frontend/   React + Vite + TS + Tailwind (Supabase client, Spark/three.js 3D)
backend/    FastAPI + Supabase client — optimizer, estimates, weather, World Labs, webhook
supabase/   migrations, seed, RLS policies, storage bucket
n8n/        weather notification workflow
render.yaml two-service Render deploy (static site + web service)
```

Both `frontend/` and `backend/` read config from a local `.env` (gitignored; see the `.env.example` in each for variable names).

## Backend — quick start

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate  |  macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # fill in your Supabase values
uvicorn app.main:app --reload   # http://localhost:8000/docs
pytest                          # optimizer + estimates + webhook tests
```

`MOCK_WEATHER=true` (default) mocks the forecast so no weather key is needed. The **3D preview needs a real World Labs key** and `MOCK_WORLD_LABS=false` — there is no built-in demo world, so with mock mode on the preview has nothing to render. Everything else works with just the Supabase env vars set. See [`supabase/README.md`](./supabase/README.md) to provision the database, seed crops, and enable RLS.

## Frontend — quick start

```bash
cd frontend
npm install
cp .env.example .env    # fill in your Supabase + API values
npm run dev             # http://localhost:5173
```

The frontend requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` — it fails fast at startup if they are missing rather than running against placeholders.

## Deployment (Render)

Two services, defined in [`render.yaml`](./render.yaml): a static site (`frontend/`) and a Python web service (`backend/`). Notes that are easy to miss:

- **`VITE_API_BASE_URL`** is baked into the frontend at build time — set it to the backend URL before building.
- **`FRONTEND_URL`** on the backend must match the frontend origin **with no trailing slash** (CORS does an exact match).
- Add a static-site **rewrite** rule `/*` → `/index.html` so client-side routes work on refresh.
- Set `MOCK_WORLD_LABS=false` in production for the real 3D preview.

See [`IMPLEMENTATION.md` §20](./IMPLEMENTATION.md) for the full deploy walkthrough.
