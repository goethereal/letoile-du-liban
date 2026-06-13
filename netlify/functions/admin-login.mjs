import { signSession, sessionCookie } from "../../lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" }
    });
  }

  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return new Response(JSON.stringify({ error: "Server is not configured (missing env vars)." }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }

  let password;
  try {
    const body = await req.json();
    password = body?.password;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Incorrect password." }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  const token = await signSession(process.env.SESSION_SECRET);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": sessionCookie(token) }
  });
};

export const config = { path: "/api/admin-login" };
