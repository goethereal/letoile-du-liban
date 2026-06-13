import { clearSessionCookie } from "../../lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": clearSessionCookie() }
  });
};

export const config = { path: "/api/admin-logout" };
