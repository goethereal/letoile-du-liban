import { verifySession } from "../_lib/auth.js";
import { supabaseHeaders } from "../_lib/supabase.js";

const FIELDS = ["name", "description", "image_url", "sort_order"];

function pickFields(body) {
  const out = {};
  for (const key of FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

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

  if (!body.id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const res = await fetch(`${baseUrl}/rest/v1/categories?id=eq.${encodeURIComponent(body.id)}`, {
    method: "PATCH",
    headers: { ...supabaseHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(pickFields(body))
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : 400,
    headers: { "content-type": "application/json" }
  });
}
