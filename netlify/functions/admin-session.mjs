import { verifySession } from "../../lib/auth.mjs";

export default async (req) => {
  const authenticated = await verifySession(req);
  return new Response(JSON.stringify({ authenticated }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

export const config = { path: "/api/admin-session" };
