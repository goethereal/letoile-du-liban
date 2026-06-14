import { verifySession } from "../_lib/auth.js";
import { supabaseHeaders } from "../_lib/supabase.js";

const FIELDS = [
  "name",
  "description",
  "price",
  "image_url",
  "category",
  "category_eyebrow",
  "category_description",
  "size",
  "product_tag",
  "ritual_tags",
  "ritual_detail",
  "sort_order",
  "stock_quantity"
];

function pickFields(body) {
  const out = {};
  for (const key of FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

function configError(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server is not configured (missing Supabase env vars)." }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
  return null;
}

async function unauthorized(request, env) {
  const authenticated = await verifySession(request, env);
  if (!authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }
  return null;
}

export async function onRequestPost({ request, env }) {
  const cfgErr = configError(env);
  if (cfgErr) return cfgErr;
  const authErr = await unauthorized(request, env);
  if (authErr) return authErr;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/products`, {
    method: "POST",
    headers: { ...supabaseHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(pickFields(body))
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.ok ? 201 : 400,
    headers: { "content-type": "application/json" }
  });
}

export async function onRequestPut({ request, env }) {
  const cfgErr = configError(env);
  if (cfgErr) return cfgErr;
  const authErr = await unauthorized(request, env);
  if (authErr) return authErr;

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

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(body.id)}`, {
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

export async function onRequestDelete({ request, env }) {
  const cfgErr = configError(env);
  if (cfgErr) return cfgErr;
  const authErr = await unauthorized(request, env);
  if (authErr) return authErr;

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

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(body.id)}`, {
    method: "DELETE",
    headers: supabaseHeaders(env)
  });
  if (!res.ok) {
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

export async function onRequestGet({ request, env }) {
  const cfgErr = configError(env);
  if (cfgErr) return cfgErr;
  const authErr = await unauthorized(request, env);
  if (authErr) return authErr;

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "content-type": "application/json" }
  });
}
