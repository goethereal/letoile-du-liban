# L'Étoile du Liban — Khan Al Saboun Distributor

Public product catalog + password-protected admin CMS, backed by Supabase.

## Architecture

- **Public catalog** (`index.html`) — reads the `products` table directly via the
  Supabase anon key (read-only, enforced by RLS) and subscribes to realtime
  changes so new/edited/deleted products appear instantly.
- **Admin panel** (`/admin/`) — password-protected (HMAC session cookie). Add,
  edit, delete products and upload images.
- **Netlify Functions** (`netlify/functions/`) — handle admin login/session/logout
  and all product writes + image uploads using the Supabase **service role** key
  (never exposed to the browser).

## One-time setup

### 1. Supabase project
1. Create a new Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`, then `supabase/seed.sql`
   (seed data is the existing 30-product Khan Al Saboun catalog with prices left
   blank — fill them in from the admin panel).
3. Note the **Project URL**, **anon public key**, and **service_role key**
   (Settings → API).

### 2. Environment variables (Netlify site settings → Environment variables)
| Variable | Value | Exposed to browser? |
|---|---|---|
| `SUPABASE_URL` | Project URL | Yes (injected into `config.js` at build time) |
| `SUPABASE_ANON_KEY` | anon public key | Yes (safe by design — RLS restricts to read-only) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **No** — server-side only, used by Netlify Functions |
| `ADMIN_PASSWORD` | admin panel password | No |
| `SESSION_SECRET` | random long string | No |

### 3. Deploy
Push to GitHub and link the repo in Netlify. The build runs
`node scripts/inject-config.js`, which writes `config.js` with the public
Supabase URL + anon key so the static pages can talk to Supabase.

## Admin panel

Visit `/admin/login.html`, sign in with `ADMIN_PASSWORD`. From `/admin/` you can
add, edit, and delete products (including image upload to the
`product-images` Supabase Storage bucket).
