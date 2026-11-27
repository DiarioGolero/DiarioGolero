import { put, list } from "@vercel/blob";
import { timingSafeEqual } from "node:crypto";

const FILE = "diario-golero/articles.json";
const SECTIONS = ["Liga", "Copa", "Selección", "Fichajes", "Internacional", "Otros"];

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD || "";
  const got = String(req.headers["x-admin-password"] || "");
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function readArticles() {
  const { blobs } = await list({ prefix: FILE, limit: 1 });
  if (!blobs.length) return [];
  const r = await fetch(blobs[0].url + "?v=" + Date.now(), { cache: "no-store" });
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

const str = (v, max) => String(v ?? "").slice(0, max);

function clean(input) {
  if (!Array.isArray(input) || input.length > 300) return null;
  const out = [];
  for (const a of input) {
    if (!a || typeof a !== "object") return null;
    const id = str(a.id, 40);
    if (!/^[A-Za-z0-9-]{1,40}$/.test(id)) return null;
    const title = str(a.title, 140).trim();
    const body = str(a.body, 30000).trim();
    if (!title || !body) return null;
    out.push({
      id,
      type: a.type === "ed" ? "ed" : "news",
      live: a.type !== "ed" && a.live === true,
      title,
      sec: SECTIONS.includes(a.sec) ? a.sec : "Otros",
      author: str(a.author, 60).trim() || "Redacción",
      lead: str(a.lead, 220).trim(),
      body,
      date: Number.isFinite(a.date) ? a.date : Date.now(),
    });
  }
  return out;
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");
      return res.status(200).json(await readArticles());
    }
    if (req.method === "POST") {
      res.setHeader("Cache-Control", "no-store");
      if (!process.env.ADMIN_PASSWORD) {
        return res.status(500).json({ error: "Falta configurar ADMIN_PASSWORD en Vercel." });
      }
      if (!authorized(req)) return res.status(401).json({ error: "Clave incorrecta." });
      const body = req.body || {};
      if (body.verify) return res.status(200).json({ ok: true });
      const articles = clean(body.articles);
      if (!articles) return res.status(400).json({ error: "Los datos del artículo no son válidos." });
      await put(FILE, JSON.stringify(articles), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método no permitido." });
  } catch (e) {
    return res.status(500).json({ error: "Error del servidor. Revisa que el almacenamiento Blob esté conectado." });
  }
}
