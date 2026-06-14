import { verifySession } from "../../lib/auth.mjs";

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

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" }
    });
  }

  const res = await fetch(`${baseUrl}/rest/v1/orders?select=*&order=created_at.desc`, {
    headers: supabaseHeaders()
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : 400,
    headers: { "content-type": "application/json" }
  });
};

export const config = { path: "/api/orders" };
