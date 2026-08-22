# Sprout

Turn a yard, balcony, raised bed, or community plot into a season-long food garden with succession planting.

Sprout takes a garden's dimensions, sunlight level, and a list of vegetables you eat, then produces an optimized season-long planting plan that reuses each garden section over time. See [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) for the full build plan.

## Structure

```
frontend/   React + Vite + TS + Tailwind (Supabase client)
backend/    FastAPI + Supabase client (planned)
supabase/   migrations, seed, RLS policies (planned)
n8n/        weather workflow (planned)
```

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
