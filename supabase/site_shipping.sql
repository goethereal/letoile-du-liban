-- L'Étoile du Liban — flat-rate shipping setting
-- Run this in the Supabase SQL editor (after site_settings.sql has already run).

alter table site_settings add column if not exists number_value numeric;

insert into site_settings (key, number_value) values
('shipping_rate', 0)
on conflict (key) do nothing;
