-- L'Étoile du Liban — editable site images (hero + story section)
-- Run this in the Supabase SQL editor (after schema.sql / categories.sql have already run).

create table if not exists site_settings (
  key text primary key,
  image_url text,
  updated_at timestamptz not null default now()
);

-- Row Level Security: anyone can read, only the service role (used by
-- Netlify Functions for the admin panel) can write.
alter table site_settings enable row level security;

create policy "Public read access"
  on site_settings for select
  using (true);

-- Realtime: let the public site subscribe to live changes
alter publication supabase_realtime add table site_settings;

-- Seed the two editable image slots
insert into site_settings (key, image_url) values
('hero_image', null),
('story_image', null)
on conflict (key) do nothing;
