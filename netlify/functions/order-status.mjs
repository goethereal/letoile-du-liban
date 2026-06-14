import { verifySession } from "../../lib/auth.mjs";
import { sendOrderStatusEmail } from "../../lib/email.mjs";

const VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered"];

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

  if (!body.id || !VALID_STATUSES.includes(body.status)) {
    return new Response(JSON.stringify({ error: "Missing or invalid id/status" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const res = await fetch(`${baseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(body.id)}`, {
    method: "PATCH",
    headers: { ...supabaseHeaders(), Prefer: "return=representation" },
    body: JSON.stringify({ status: body.status })
  });
  const data = await res.json();
  if (!res.ok) {
    return new Response(JSON.stringify(data), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const order = Array.isArray(data) ? data[0] : data;
  if (order) {
    try {
      await sendOrderStatusEmail(order);
    } catch (err) {
      console.error("Failed to send order status email:", err);
    }
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

export const config = { path: "/api/order-status" };
