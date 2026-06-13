-- L'Étoile du Liban — Supabase schema
-- Run this once in the Supabase project's SQL editor (Database > SQL Editor > New query).

-- Products table
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10,2),
  image_url text,
  category text not null default 'Uncategorized',
  category_eyebrow text not null default '',
  category_description text not null default '',
  size text not null default '',
  product_tag text not null default '',
  ritual_tags text[] not null default '{}',
  ritual_detail text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Row Level Security: anyone can read, only the service role (used by
-- Netlify Functions for the admin panel) can write.
alter table products enable row level security;

create policy "Public read access"
  on products for select
  using (true);

-- Realtime: let the public catalog subscribe to live changes
alter publication supabase_realtime add table products;

-- Storage bucket for product images (public read)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');
