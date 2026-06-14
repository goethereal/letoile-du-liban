import { verifySession } from "../_lib/auth.js";
import { supabaseHeaders } from "../_lib/supabase.js";

export async function onRequestGet({ request, env }) {
  const authenticated = await verifySession(request, env);
  if (!authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server is not configured (missing Supabase env vars)." }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`, {
    headers: supabaseHeaders(env)
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : 400,
    headers: { "content-type": "application/json" }
  });
}
