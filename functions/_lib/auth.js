const SESSION_MESSAGE = "letoile-admin-session";

export function parseCookies(request) {
  const header = request.headers.get("cookie") || "";
  const cookies = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function toHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signSession(secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(SESSION_MESSAGE));
  return toHex(sig);
}

export async function verifySession(request, env) {
  const secret = env.SESSION_SECRET;
  if (!secret) return false;
  const cookies = parseCookies(request);
  if (!cookies.letoile_admin) return false;
  const expected = await signSession(secret);
  return cookies.letoile_admin === expected;
}

export function sessionCookie(token) {
  return `letoile_admin=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`;
}

export function clearSessionCookie() {
  return `letoile_admin=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
