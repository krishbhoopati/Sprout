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

Both `frontend/` and `backend/` read their config from a local `.env`
(gitignored; see the `.env.example` in each for the variable names).

## Backend — quick start

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate  |  macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload   # http://localhost:8000/docs
pytest                          # optimizer + estimates + webhook tests
```

Mock flags (`MOCK_WEATHER`, `MOCK_WORLD_LABS`) default to `true`, so those
integrations work with no external keys. See `supabase/README.md` for the
database migrations, crop seed, and RLS setup.

## Frontend — quick start

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```
