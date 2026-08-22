# Sprout

Turn a yard, balcony, raised bed, or community plot into a season-long food garden with succession planting.

Sprout takes a garden's dimensions, sunlight level, and a list of vegetables you eat, then produces an optimized season-long planting plan that reuses each garden section over time. See [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) for the full build plan.

## Structure

```
frontend/   React + Vite + TS + Tailwind (Supabase client)
backend/    FastAPI + Supabase client — optimizer, weather, World Labs, webhook
supabase/   migrations, seed, RLS policies, storage bucket
n8n/        weather notification workflow
render.yaml two-service Render deploy (static site + web service)
```

## Backend — quick start

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate  |  macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # fill in your Supabase values
uvicorn app.main:app --reload   # http://localhost:8000/docs
pytest                          # optimizer + estimates + webhook tests
```

Mock flags (`MOCK_WEATHER`, `MOCK_WORLD_LABS`) default to `true`, so those
integrations work with no external keys. See `supabase/README.md` to provision
the database, seed crops, and enable RLS.

## Frontend — quick start

```bash
cd frontend
npm install
cp .env.example .env      # fill in your Supabase + API values
npm run dev
```

The dev server runs on http://localhost:5173.

### Environment

Copy `frontend/.env.example` to `frontend/.env` and set:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable/anon key (safe in browser with RLS on)
- `VITE_API_BASE_URL` — FastAPI backend base URL (e.g. `http://localhost:8000`)

The app runs without a configured backend; API-dependent screens show empty/placeholder states.
