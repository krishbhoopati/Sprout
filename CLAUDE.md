# Sprout

**At the start of every session, read `context.md` in the repo root first** (it is
gitignored, local-only session handoff notes). It has a "NEXT SESSION: START HERE"
block with the current state and the exact next actions. If `context.md` is missing,
fall back to `IMPLEMENTATION.md`.

## Standing rules
- Work on the **main** branch.
- **Never put the word "claude" in a commit message.**
- **Never commit `context.md`** (already gitignored). Keep it updated at the end of a
  session so the next session can resume.
- Keep `.env` and `.env.example` present for both `frontend/` and `backend/`; never
  commit real secrets.

## Quick orientation
- `frontend/` React+Vite+TS+Tailwind (Supabase client). Dev: `cd frontend && npm run dev`.
- `backend/` FastAPI + Supabase client. venv at `backend/.venv`.
  Tests: `cd backend && ./.venv/Scripts/python.exe -m pytest -q`.
  Run: `cd backend && ./.venv/Scripts/python.exe -m uvicorn app.main:app --reload`.
- `supabase/` migrations, seed, RLS. `n8n/` weather workflow. `render.yaml` deploy.
