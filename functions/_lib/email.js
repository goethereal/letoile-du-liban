// Email sending from Cloudflare Workers requires raw TCP via cloudflare:sockets.
// For now, status-change emails are sent by the Netlify function (lib/email.mjs).
// This stub keeps the Cloudflare build clean.
export async function sendOrderStatusEmail(_env, _order) {
  return { sent: false };
}
