import { verifySession } from "../_lib/auth.js";
import { supabaseHeaders } from "../_lib/supabase.js";
import { sendOrderConfirmationEmail } from "../_lib/email.js";

function cfgError(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server is not configured." }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
  return null;
}

// Admin: list all orders
export async function onRequestGet({ request, env }) {
  const authenticated = await verifySession(request, env);
  if (!authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "content-type": "application/json" }
    });
  }
  const err = cfgError(env);
  if (err) return err;

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`, {
    headers: supabaseHeaders(env)
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : 400,
    headers: { "content-type": "application/json" }
  });
}

// Public: create an order, then send confirmation email
export async function onRequestPost({ request, env }) {
  const err = cfgError(env);
  if (err) return err;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400, headers: { "content-type": "application/json" }
    });
  }

  const required = ["customer_name", "customer_email", "shipping_address", "items", "total"];
  for (const field of required) {
    if (!body[field]) {
      return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
        status: 400, headers: { "content-type": "application/json" }
      });
    }
  }

  const order = {
    id: body.id || crypto.randomUUID(),
    user_id: body.user_id || null,
    customer_name: body.customer_name,
    customer_email: body.customer_email,
    customer_phone: body.customer_phone || null,
    shipping_address: body.shipping_address,
    items: body.items,
    subtotal: Number(body.subtotal || 0),
    shipping: Number(body.shipping || 0),
    total: Number(body.total || 0),
    status: "pending"
  };

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/orders`, {
    method: "POST",
    headers: { ...supabaseHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(order)
  });
  const data = await res.json();
  if (!res.ok) {
    return new Response(JSON.stringify(data), {
      status: 400, headers: { "content-type": "application/json" }
    });
  }

  const inserted = Array.isArray(data) ? data[0] : data;
  try {
    await sendOrderConfirmationEmail(env, inserted || order);
  } catch (e) {
    console.error("Confirmation email failed:", e);
  }

  return new Response(JSON.stringify(inserted || order), {
    status: 201, headers: { "content-type": "application/json" }
  });
}
