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
    const body = req.body || {};
    const png = body.format === "png";
    const buf = Buffer.from(String(body.data || ""), "base64");
    if (!buf.length) return res.status(400).json({ error: "No llegó ninguna imagen." });
    if (buf.length > MAX_BYTES) return res.status(413).json({ error: "La imagen es demasiado grande." });
    const okMagic = png
      ? buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
      : buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    if (!okMagic) return res.status(400).json({ error: "El formato de imagen no es válido." });
    const blob = await put(png ? "diario-golero/img/escudo.png" : "diario-golero/img/foto.jpg", buf, {
      access: "public",
      addRandomSuffix: true,
      contentType: png ? "image/png" : "image/jpeg",
    });
    return res.status(200).json({ url: blob.url });
  } catch (e) {
    return res.status(500).json({ error: "Error del servidor: " + String((e && e.message) || e).slice(0, 300) });
  }
}
