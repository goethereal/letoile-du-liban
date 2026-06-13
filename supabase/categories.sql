-- L'Étoile du Liban — collection category cards
-- Run this in the Supabase SQL editor (after schema.sql / seed.sql have already run).

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Row Level Security: anyone can read, only the service role (used by
-- Netlify Functions for the admin panel) can write.
alter table categories enable row level security;

create policy "Public read access"
  on categories for select
  using (true);

-- Realtime: let the public site subscribe to live changes
alter publication supabase_realtime add table categories;

-- Seed the 4 existing collection cards
insert into categories (name, description, sort_order) values
('Heritage Soaps', 'Olive, laurel, jasmine, green tea, lavender, rosemary and targeted honey soaps for daily ritual care.', 1),
('Loofah Rituals', 'Natural exfoliating soaps with chamomile, wild mint, cedar, lavender, and green tea.', 2),
('Aromatic Body Oils', 'Fast-absorbing perfumed oils for massage, hydration, relaxation, and long-lasting scent.', 3),
('Beauty Treatments', 'Shea butter, green tea scrub, lip balms, turmeric honey and alum honey care.', 4);
