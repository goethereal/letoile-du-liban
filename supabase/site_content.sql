-- L'Étoile du Liban — editable site text content (hero + story sections)
-- Run this in the Supabase SQL editor (after site_settings.sql has already run).

alter table site_settings add column if not exists text_value text;

-- Seed the four editable text slots with the current copy
insert into site_settings (key, text_value) values
('hero_headline', '600 years of Lebanese alchemy.'),
('hero_description', 'Khan Al Saboun brings Tripoli''s legendary soapmaking heritage into modern organic luxury — crafted with olive oil, botanicals, honey, loofah, and aromatic oils.'),
('story_headline', 'Born in Tripoli''s ancient souks, preserved for the world.'),
('story_description', 'Khan Al Saboun is a legendary Lebanese brand with over 600 years of history. Revitalized by Dr. Bader Hassoun, it preserves traditional soapmaking methods while transforming them into a global symbol of luxury, purity, and botanical care.')
on conflict (key) do nothing;
