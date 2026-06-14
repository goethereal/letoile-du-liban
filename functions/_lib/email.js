const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered"
};

const STATUS_MESSAGES = {
  confirmed: "Your order has been confirmed and is being prepared.",
  shipped: "Your order is on its way!",
  delivered: "Your order has been delivered. We hope you enjoy it!"
};

async function send(env, { to, subject, text }) {
  const key = env.RESEND_API_KEY;
  // Switch to "L'Étoile du Liban <orders@letoileduliban.shop>" once letoileduliban.shop is verified in the Resend dashboard
  const from = env.RESEND_FROM || "L'Étoile du Liban <onboarding@resend.dev>";
  if (!key || !to) return { sent: false };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ from, to, subject, text })
  });
  return { sent: res.ok, status: res.status };
}

export async function sendOrderConfirmationEmail(env, order) {
  if (!order.customer_email) return { sent: false };
  const itemLines = (order.items || [])
    .map((i) => `  - ${i.name} × ${i.qty}  $${(Number(i.price || 0) * i.qty).toFixed(2)}`)
    .join("\n");
  const addr = order.shipping_address || {};
  const addrText = [addr.line1, addr.line2, [addr.city, addr.state, addr.postal_code].filter(Boolean).join(", "), addr.country]
    .filter(Boolean).join(", ");

  const text = `Hello ${order.customer_name || ""},

Thank you for your order! We've received it and will be in touch soon.

Order #${order.id.slice(0, 8).toUpperCase()}

Items:
${itemLines}

Subtotal: $${Number(order.subtotal || 0).toFixed(2)}
Shipping: ${Number(order.shipping || 0) > 0 ? "$" + Number(order.shipping).toFixed(2) : "Free"}
Total:    $${Number(order.total || 0).toFixed(2)}

Shipping to: ${addrText}

— L'Étoile du Liban`;

  return send(env, {
    to: order.customer_email,
    subject: `Order Confirmed — L'Étoile du Liban #${order.id.slice(0, 8).toUpperCase()}`,
    text
  });
}

export async function sendOrderStatusEmail(env, order) {
  if (!order.customer_email) return { sent: false };
  const label = STATUS_LABELS[order.status] || order.status;
  const message = STATUS_MESSAGES[order.status] || `Your order status has been updated to: ${label}.`;
  const itemLines = (order.items || [])
    .map((i) => `  - ${i.name} × ${i.qty}`)
    .join("\n");

  const text = `Hello ${order.customer_name || ""},

${message}

Order #${order.id.slice(0, 8).toUpperCase()} — Status: ${label}

Items:
${itemLines}

Total: $${Number(order.total || 0).toFixed(2)}

— L'Étoile du Liban`;

  return send(env, {
    to: order.customer_email,
    subject: `Order Update — Your L'Étoile du Liban order is ${label}`,
    text
  });
}
