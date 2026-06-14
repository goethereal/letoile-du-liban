-- L'Étoile du Liban — customer accounts, profiles, and orders
-- Run this in the Supabase SQL editor (or via the management API).

-- ---- Profiles ----
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---- Orders ----
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text,
  customer_email text,
  customer_phone text,
  shipping_address jsonb,
  items jsonb not null default '[]',
  subtotal numeric not null default 0,
  shipping numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table orders enable row level security;

drop policy if exists "Users can view own orders" on orders;
create policy "Users can view own orders" on orders
  for select using (auth.uid() = user_id);

drop policy if exists "Orders insert" on orders;
create policy "Orders insert" on orders
  for insert with check (user_id is null or auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
  before update on orders
  for each row execute procedure public.set_updated_at();

-- Realtime for admin order dashboard
do $$
begin
  alter publication supabase_realtime add table orders;
exception when duplicate_object then null;
end $$;
