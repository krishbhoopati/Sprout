# Sprout Backend (FastAPI)

Plan generation, weather proxy, World Labs, and the n8n webhook. Data access is
through the Supabase client (secret key, server-side only).

## Quick start

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in Supabase values
uvicorn app.main:app --reload
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

With `MOCK_WEATHER=true` and `MOCK_WORLD_LABS=true` (defaults), those integrations
work without external keys. Real data (gardens, plans, notifications) needs the
Supabase env vars set.

## Tests

```bash
pytest
```

Covers the optimizer invariants (boundary, no space+time overlap, obstacles,
succession ordering, must-have precedence, impossible requests), the yield/savings
ranges, and the n8n webhook secret check.

## Layout

```
app/
  main.py          FastAPI app, CORS, error shape, router mounting
  config.py        pydantic-settings env loading
  auth.py          Supabase JWT verification (JWKS + HS256 fallback)
  supabase_client  server-side Supabase client (secret key)
  crops_repo.py    loads the curated crop dataset
  models/          pydantic request/response schemas
  routes/          gardens, crops, plans, weather, world, webhooks
  services/        optimizer, estimates, weather, world_labs
  data/            crop_seed_data.json
tests/
```
