import { verifySession } from "../_lib/auth.js";
import { supabaseHeaders } from "../_lib/supabase.js";

export async function onRequestGet({ request, env }) {
  if (!await verifySession(request, env)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "content-type": "application/json" }
    });
  }
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?select=id,full_name,email,customer_type,created_at&order=created_at.desc`,
    { headers: supabaseHeaders(env) }
  );
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : 400,
    headers: { "content-type": "application/json" }
  });
}

export async function onRequestPut({ request, env }) {
  if (!await verifySession(request, env)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "content-type": "application/json" }
    });
  }
  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid body." }), {
      status: 400, headers: { "content-type": "application/json" }
    });
  }
  const { id, customer_type } = body;
  if (!id || !["retail", "wholesale"].includes(customer_type)) {
    return new Response(JSON.stringify({ error: "id and customer_type (retail|wholesale) are required." }), {
      status: 400, headers: { "content-type": "application/json" }
    });
  }
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...supabaseHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify({ customer_type })
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : 400,
    headers: { "content-type": "application/json" }
  });
}
