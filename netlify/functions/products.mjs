import { verifySession } from "../../lib/auth.mjs";

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

  let body = {};
  if (req.method !== "GET") {
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body." }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }
  }

  if (req.method === "POST") {
    const res = await fetch(`${baseUrl}/rest/v1/products`, {
      method: "POST",
      headers: { ...supabaseHeaders(), Prefer: "return=representation" },
      body: JSON.stringify(pickFields(body))
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.ok ? 201 : 400,
      headers: { "content-type": "application/json" }
    });
  }

  if (req.method === "PUT") {
    if (!body.id) {
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }
    const res = await fetch(`${baseUrl}/rest/v1/products?id=eq.${encodeURIComponent(body.id)}`, {
      method: "PATCH",
      headers: { ...supabaseHeaders(), Prefer: "return=representation" },
      body: JSON.stringify(pickFields(body))
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : 400,
      headers: { "content-type": "application/json" }
    });
  }

  if (req.method === "DELETE") {
    if (!body.id) {
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }
    const res = await fetch(`${baseUrl}/rest/v1/products?id=eq.${encodeURIComponent(body.id)}`, {
      method: "DELETE",
      headers: supabaseHeaders()
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

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "content-type": "application/json" }
  });
};

export const config = { path: "/api/products" };
