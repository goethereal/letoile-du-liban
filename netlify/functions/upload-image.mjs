import { verifySession } from "../../lib/auth.mjs";

const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

const MAX_BYTES = 5 * 1024 * 1024;

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" }
    });
  }

  const authenticated = await verifySession(req);
  if (!authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  const baseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server is not configured (missing Supabase env vars)." }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const { contentType, dataBase64 } = body || {};
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) {
    return new Response(JSON.stringify({ error: "Unsupported image type. Use JPEG, PNG, WEBP, or GIF." }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }
  if (!dataBase64) {
    return new Response(JSON.stringify({ error: "Missing image data." }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const bytes = Buffer.from(dataBase64, "base64");
  if (bytes.length > MAX_BYTES) {
    return new Response(JSON.stringify({ error: "Image too large (max 5MB)." }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const res = await fetch(`${baseUrl}/storage/v1/object/product-images/${path}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "content-type": contentType
    },
    body: bytes
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(JSON.stringify({ error: `Upload failed: ${text}` }), {
      status: 502,
      headers: { "content-type": "application/json" }
    });
  }

  const publicUrl = `${baseUrl}/storage/v1/object/public/product-images/${path}`;
  return new Response(JSON.stringify({ url: publicUrl }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

export const config = { path: "/api/upload-image" };
