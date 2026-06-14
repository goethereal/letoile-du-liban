import { verifySession } from "../_lib/auth.js";
import { supabaseHeaders } from "../_lib/supabase.js";

const ALLOWED_KEYS = [
  "hero_image",
  "story_image",
  "hero_headline",
  "hero_description",
  "story_headline",
  "story_description",
  "cta_headline",
  "cta_description",
  "cta_email",
  "cta_phone",
  "shipping_rate"
];

export async function onRequestPut({ request, env }) {
  const authenticated = await verifySession(request, env);
  if (!authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  const baseUrl = env.SUPABASE_URL;
  if (!baseUrl || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server is not configured (missing Supabase env vars)." }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  if (!ALLOWED_KEYS.includes(body.key)) {
    return new Response(JSON.stringify({ error: "Invalid key" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const update = { updated_at: new Date().toISOString() };
  if (body.image_url !== undefined) update.image_url = body.image_url || null;
  if (body.text_value !== undefined) update.text_value = body.text_value || null;
  if (body.number_value !== undefined) update.number_value = body.number_value === null ? null : Number(body.number_value);

  const res = await fetch(`${baseUrl}/rest/v1/site_settings?key=eq.${encodeURIComponent(body.key)}`, {
    method: "PATCH",
    headers: { ...supabaseHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(update)
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : 400,
    headers: { "content-type": "application/json" }
  });
}
