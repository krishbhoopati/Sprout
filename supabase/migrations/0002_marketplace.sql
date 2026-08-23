-- Sprout marketplace (crop surplus listings + reservations).
-- Extends the generic marketplace_listings stub from 0001 to link listings to
-- the crops reference table, carry a price and location, and track reservations.
-- Access is via the backend (secret key); RLS from rls-policies.sql is unchanged.

alter table public.marketplace_listings
  add column if not exists crop_id text references public.crops (id),
  add column if not exists price_per_unit numeric,
  add column if not exists city text,
  add column if not exists reserved_by uuid references auth.users (id) on delete set null,
  add column if not exists reserved_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- exchange_type: how the surplus is offered.
alter table public.marketplace_listings
  drop constraint if exists marketplace_listings_exchange_type_check;
alter table public.marketplace_listings
  add constraint marketplace_listings_exchange_type_check
  check (exchange_type is null or exchange_type in ('sell', 'trade', 'free'));

-- status: draft (unused in v1) -> published -> reserved -> completed/archived.
alter table public.marketplace_listings
  drop constraint if exists marketplace_listings_status_check;
alter table public.marketplace_listings
  add constraint marketplace_listings_status_check
  check (status in ('draft', 'published', 'reserved', 'completed', 'archived'));

create index if not exists marketplace_listings_status_idx
  on public.marketplace_listings (status);
create index if not exists marketplace_listings_crop_id_idx
  on public.marketplace_listings (crop_id);
create index if not exists marketplace_listings_reserved_by_idx
  on public.marketplace_listings (reserved_by);
