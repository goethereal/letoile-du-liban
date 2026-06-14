import nodemailer from "nodemailer";

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

function getTransport(env) {
  const host = env.SMTP_HOST;
  const port = Number(env.SMTP_PORT || 587);
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

export async function sendOrderStatusEmail(env, order) {
  const transport = getTransport(env);
  if (!transport || !order.customer_email) return { sent: false };

  const label = STATUS_LABELS[order.status] || order.status;
  const message = STATUS_MESSAGES[order.status] || `Your order status is now: ${label}.`;
  const itemLines = (order.items || [])
    .map((item) => `- ${item.name} x${item.qty}`)
    .join("\n");

  const text = `Hello ${order.customer_name || ""},\n\n${message}\n\nOrder #${order.id}\nStatus: ${label}\n\nItems:\n${itemLines}\n\nTotal: $${Number(order.total || 0).toFixed(2)}\n\nThank you for shopping with L'Étoile du Liban.`;

  await transport.sendMail({
    from: env.SMTP_USER,
    to: order.customer_email,
    subject: `Order Update — Your L'Étoile du Liban order is ${label}`,
    text
  });

  return { sent: true };
}
