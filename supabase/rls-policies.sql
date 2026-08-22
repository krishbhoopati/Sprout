-- Sprout Row Level Security (IMPLEMENTATION.md §10)
-- Ownership-only policies. Backend uses the secret key and bypasses RLS.

-- ---- profiles -------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "own profile - select" on public.profiles
  for select using (id = auth.uid());
create policy "own profile - update" on public.profiles
  for update using (id = auth.uid());

-- ---- gardens --------------------------------------------------------------
alter table public.gardens enable row level security;

create policy "own gardens - select" on public.gardens
  for select using (user_id = auth.uid());
create policy "own gardens - insert" on public.gardens
  for insert with check (user_id = auth.uid());
create policy "own gardens - update" on public.gardens
  for update using (user_id = auth.uid());
create policy "own gardens - delete" on public.gardens
  for delete using (user_id = auth.uid());

-- ---- child tables: access through the owning garden ----------------------
alter table public.garden_obstacles enable row level security;
create policy "obstacles via garden" on public.garden_obstacles
  for all using (
    exists (select 1 from public.gardens g
            where g.id = garden_obstacles.garden_id and g.user_id = auth.uid())
  );

alter table public.garden_preferences enable row level security;
create policy "preferences via garden" on public.garden_preferences
  for all using (
    exists (select 1 from public.gardens g
            where g.id = garden_preferences.garden_id and g.user_id = auth.uid())
  );

alter table public.planting_plans enable row level security;
create policy "plans via garden" on public.planting_plans
  for select using (
    exists (select 1 from public.gardens g
            where g.id = planting_plans.garden_id and g.user_id = auth.uid())
  );

alter table public.plot_assignments enable row level security;
create policy "assignments via plan" on public.plot_assignments
  for select using (
    exists (
      select 1 from public.planting_plans p
      join public.gardens g on g.id = p.garden_id
      where p.id = plot_assignments.plan_id and g.user_id = auth.uid()
    )
  );

alter table public.world_generations enable row level security;
create policy "world via garden" on public.world_generations
  for select using (
    exists (select 1 from public.gardens g
            where g.id = world_generations.garden_id and g.user_id = auth.uid())
  );

-- ---- reference data: readable by any authenticated user, no writes --------
alter table public.crops enable row level security;
create policy "crops readable" on public.crops
  for select to authenticated using (true);

alter table public.crop_relationships enable row level security;
create policy "relationships readable" on public.crop_relationships
  for select to authenticated using (true);

-- ---- notifications --------------------------------------------------------
-- Inserts come from the backend (secret key bypasses RLS).
alter table public.notifications enable row level security;
create policy "own notifications - select" on public.notifications
  for select using (user_id = auth.uid());
create policy "own notifications - update" on public.notifications
  for update using (user_id = auth.uid());

-- ---- marketplace_listings (P2) -------------------------------------------
alter table public.marketplace_listings enable row level security;
create policy "published listings readable" on public.marketplace_listings
  for select to authenticated using (status = 'published' or user_id = auth.uid());
create policy "own listings - insert" on public.marketplace_listings
  for insert with check (user_id = auth.uid());
create policy "own listings - update" on public.marketplace_listings
  for update using (user_id = auth.uid());
create policy "own listings - delete" on public.marketplace_listings
  for delete using (user_id = auth.uid());

-- ---- storage: garden-images bucket ---------------------------------------
-- Each user can read/write only objects under a folder named after their uid.
create policy "own garden images" on storage.objects
  for all using (
    bucket_id = 'garden-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'garden-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
