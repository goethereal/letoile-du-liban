import { verifySession } from "../_lib/auth.js";

export async function onRequest({ request, env }) {
  const authenticated = await verifySession(request, env);
  return new Response(JSON.stringify({ authenticated }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
