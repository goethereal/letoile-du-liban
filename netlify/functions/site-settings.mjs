import { verifySession } from "../../lib/auth.mjs";

const ALLOWED_KEYS = [
  "hero_image",
  "story_image",
  "hero_headline",
  "hero_description",
  "story_headline",
  "story_description"
];

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "content-type": "application/json",
    "user-agent": "EtherealAgent/1.0"
  };
}

export default async (req) => {
  const authenticated = await verifySession(req);
  if (!authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  const baseUrl = process.env.SUPABASE_URL;
  if (!baseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server is not configured (missing Supabase env vars)." }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }

  if (req.method !== "PUT") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" }
    });
  }

  let body;
  try {
    body = await req.json();
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

  const res = await fetch(`${baseUrl}/rest/v1/site_settings?key=eq.${encodeURIComponent(body.key)}`, {
    method: "PATCH",
    headers: { ...supabaseHeaders(), Prefer: "return=representation" },
    body: JSON.stringify(update)
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : 400,
    headers: { "content-type": "application/json" }
  });
};

export const config = { path: "/api/site-settings" };
