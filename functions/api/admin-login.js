import { signSession, sessionCookie } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return new Response(JSON.stringify({ error: "Server is not configured (missing env vars)." }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }

  let password;
  try {
    const body = await request.json();
    password = body?.password;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  if (!password || password !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Incorrect password." }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  const token = await signSession(env.SESSION_SECRET);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": sessionCookie(token) }
  });
}
