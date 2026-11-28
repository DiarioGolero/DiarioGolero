import { put, list } from "@vercel/blob";
import { timingSafeEqual } from "node:crypto";

export function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD || "";
  const got = String(req.headers["x-admin-password"] || "");
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function readJson(path, fallback) {
  const { blobs } = await list({ prefix: path, limit: 1 });
  if (!blobs.length) return fallback;
  const r = await fetch(blobs[0].url + "?v=" + Date.now(), { cache: "no-store" });
  if (!r.ok) return fallback;
  try {
    return await r.json();
  } catch {
    return fallback;
  }
}

export async function writeJson(path, data) {
  await put(path, JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}
