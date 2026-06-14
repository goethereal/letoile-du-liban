-- L'Étoile du Liban — product stock management
-- Run this in the Supabase SQL editor (after schema.sql has already run).

alter table products add column if not exists stock_quantity integer not null default 0;
