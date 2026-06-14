import { verifySession } from "../_lib/auth.js";
import { supabaseHeaders } from "../_lib/supabase.js";
import { sendOrderStatusEmail } from "../_lib/email.js";

const VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered"];

export async function onRequestPut({ request, env }) {
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

  let body;
  try {
    body = await request.json();
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

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(body.id)}`, {
    method: "PATCH",
    headers: { ...supabaseHeaders(env), Prefer: "return=representation" },
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
      await sendOrderStatusEmail(env, order);
    } catch (err) {
      console.error("Failed to send order status email:", err);
    }
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
