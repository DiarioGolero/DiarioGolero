import { put } from "@vercel/blob";
import { timingSafeEqual } from "node:crypto";

const MAX_BYTES = 3 * 1024 * 1024;

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD || "";
  const got = String(req.headers["x-admin-password"] || "");
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
  }
  try {
    if (!process.env.ADMIN_PASSWORD) {
      return res.status(500).json({ error: "Falta configurar ADMIN_PASSWORD en Vercel." });
    }
    if (!authorized(req)) return res.status(401).json({ error: "Clave incorrecta." });
    const data = String((req.body && req.body.data) || "");
    const buf = Buffer.from(data, "base64");
    if (!buf.length) return res.status(400).json({ error: "No llegó ninguna imagen." });
    if (buf.length > MAX_BYTES) return res.status(413).json({ error: "La imagen es demasiado grande." });
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    if (!isJpeg) return res.status(400).json({ error: "El formato de imagen no es válido." });
    const blob = await put("diario-golero/img/foto.jpg", buf, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/jpeg",
    });
    return res.status(200).json({ url: blob.url });
  } catch (e) {
    return res.status(500).json({ error: "Error del servidor: " + String((e && e.message) || e).slice(0, 300) });
  }
}
