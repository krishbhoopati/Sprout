-- Sprout initial schema (IMPLEMENTATION.md §9)
-- Access is via the Supabase client; RLS policies live in rls-policies.sql.

create extension if not exists pgcrypto;

-- ---- profiles -------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  city text,
  created_at timestamptz not null default now()
);

-- Create a profile row automatically on new user signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---- gardens --------------------------------------------------------------
create table if not exists public.gardens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  city text,
  latitude double precision,
  longitude double precision,
  width_m numeric(6, 2) not null check (width_m > 0),
  length_m numeric(6, 2) not null check (length_m > 0),
  sunlight_level text not null check (sunlight_level in ('full_sun', 'partial_sun', 'shade')),
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gardens_user_id_idx on public.gardens (user_id);

-- ---- garden_obstacles -----------------------------------------------------
create table if not exists public.garden_obstacles (
  id uuid primary key default gen_random_uuid(),
  garden_id uuid not null references public.gardens (id) on delete cascade,
  x integer not null,
  y integer not null,
  width_cells integer not null check (width_cells > 0),
  height_cells integer not null check (height_cells > 0)
);
create index if not exists garden_obstacles_garden_id_idx on public.garden_obstacles (garden_id);

-- ---- crops (reference data) ----------------------------------------------
create table if not exists public.crops (
  id text primary key,
  name text not null,
  spacing_cm numeric not null,
  days_to_maturity integer not null,
  harvest_duration_days integer not null,
  sunlight_requirement text not null check (sunlight_requirement in ('full_sun', 'partial_sun', 'shade')),
  height_cm numeric not null,
  minimum_yield_kg numeric not null,
  maximum_yield_kg numeric not null,
  estimated_price_per_kg numeric not null,
  planting_month_start integer not null,
  planting_month_end integer not null,
  difficulty text not null default 'easy'
);

-- ---- crop_relationships (reference data) ----------------------------------
create table if not exists public.crop_relationships (
  id uuid primary key default gen_random_uuid(),
  crop_id text not null references public.crops (id) on delete cascade,
  related_crop_id text not null references public.crops (id) on delete cascade,
  relationship_type text not null check (relationship_type in ('companion', 'conflict')),
  score numeric not null default 1
);

-- ---- garden_preferences ---------------------------------------------------
create table if not exists public.garden_preferences (
  id uuid primary key default gen_random_uuid(),
  garden_id uuid not null references public.gardens (id) on delete cascade,
  crop_id text not null references public.crops (id) on delete cascade,
  priority text not null default 'preferred' check (priority in ('must_have', 'preferred', 'optional'))
);
create index if not exists garden_preferences_garden_id_idx on public.garden_preferences (garden_id);

-- ---- planting_plans -------------------------------------------------------
create table if not exists public.planting_plans (
  id uuid primary key default gen_random_uuid(),
  garden_id uuid not null references public.gardens (id) on delete cascade,
  status text not null default 'complete' check (status in ('pending', 'processing', 'complete', 'failed')),
  estimated_minimum_yield_kg numeric not null default 0,
  estimated_maximum_yield_kg numeric not null default 0,
  estimated_minimum_savings numeric not null default 0,
  estimated_maximum_savings numeric not null default 0,
  space_utilization numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists planting_plans_garden_id_idx on public.planting_plans (garden_id);

-- ---- plot_assignments -----------------------------------------------------
create table if not exists public.plot_assignments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.planting_plans (id) on delete cascade,
  crop_id text not null references public.crops (id),
  x integer not null,
  y integer not null,
  width_cells integer not null,
  height_cells integer not null,
  plant_date date not null,
  harvest_start date not null,
  harvest_end date not null,
  plant_count integer not null default 1,
  estimated_minimum_yield_kg numeric not null default 0,
  estimated_maximum_yield_kg numeric not null default 0,
  successor_assignment_id uuid references public.plot_assignments (id) on delete set null,
  explanation text
);
create index if not exists plot_assignments_plan_id_idx on public.plot_assignments (plan_id);

-- ---- notifications --------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  garden_id uuid references public.gardens (id) on delete set null,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on public.notifications (user_id);

-- ---- world_generations ----------------------------------------------------
create table if not exists public.world_generations (
  id uuid primary key default gen_random_uuid(),
  garden_id uuid not null references public.gardens (id) on delete cascade,
  operation_id text,
  world_id text,
  status text not null default 'processing' check (status in ('pending', 'processing', 'ready', 'failed')),
  result_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists world_generations_garden_id_idx on public.world_generations (garden_id);

-- ---- marketplace_listings (P2) -------------------------------------------
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text,
  description text,
  quantity numeric,
  unit text,
  exchange_type text,
  approximate_area numeric,
  image_path text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);
