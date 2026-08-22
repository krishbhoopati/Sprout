# Supabase setup

Run these in the Supabase SQL editor (or via the CLI) in order:

1. `migrations/0001_initial_schema.sql` — tables + the new-user profile trigger.
2. `seed.sql` — curated crops and companion/conflict relationships.
3. `rls-policies.sql` — row level security and the storage bucket policy.

## Storage

Create a **private** bucket named `garden-images`. The storage policy in
`rls-policies.sql` restricts each user to objects under a folder named after
their `auth.uid()` (e.g. `user-id/garden-id/original.jpg`).

## Keys

- Frontend uses the **publishable/anon** key (`VITE_SUPABASE_PUBLISHABLE_KEY`).
- Backend uses the **secret/service-role** key (`SUPABASE_SECRET_KEY`) and may
  bypass RLS. Never expose it to the browser.

`seed.sql` is generated from `backend/app/data/crop_seed_data.json`; edit the
JSON and regenerate rather than hand-editing the SQL.
