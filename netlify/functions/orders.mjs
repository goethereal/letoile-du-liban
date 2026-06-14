import { verifySession } from "../../lib/auth.mjs";
import { sendOrderConfirmationEmail } from "../../lib/email.mjs";

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
  const baseUrl = process.env.SUPABASE_URL;
  if (!baseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server is not configured." }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }

  if (req.method === "GET") {
    const authenticated = await verifySession(req);
    if (!authenticated) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "content-type": "application/json" }
      });
    }
    const res = await fetch(`${baseUrl}/rest/v1/orders?select=*&order=created_at.desc`, {
      headers: supabaseHeaders()
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : 400, headers: { "content-type": "application/json" }
    });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid request body." }), {
        status: 400, headers: { "content-type": "application/json" }
      });
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
    const res = await fetch(`${baseUrl}/rest/v1/orders`, {
      method: "POST",
      headers: { ...supabaseHeaders(), Prefer: "return=representation" },
      body: JSON.stringify(order)
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify(data), {
        status: 400, headers: { "content-type": "application/json" }
      });
    }
    const inserted = Array.isArray(data) ? data[0] : data;
    try { await sendOrderConfirmationEmail(inserted || order); } catch (e) {
      console.error("Confirmation email failed:", e);
    }
    return new Response(JSON.stringify(inserted || order), {
      status: 201, headers: { "content-type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405, headers: { "content-type": "application/json" }
  });
};

export const config = { path: "/api/orders" };
