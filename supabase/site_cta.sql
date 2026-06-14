-- L'Étoile du Liban — editable contact/CTA section
-- Run this in the Supabase SQL editor (after site_content.sql has already run).

insert into site_settings (key, text_value) values
('cta_headline', 'Bring Khan Al Saboun rituals to your customers.'),
('cta_description', 'For retail, spa, boutique, gifting, and wholesale inquiries, request availability, pricing, and curated product recommendations.'),
('cta_email', 'hello@example.com'),
('cta_phone', '+1 (313) 312-3706')
on conflict (key) do nothing;
