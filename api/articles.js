import { authorized, readJson, writeJson } from "./_lib.js";
import { cleanArticles, normalizeSec } from "./_util.js";

const FILE = "diario-golero/articles.json";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");
      const data = await readJson(FILE, []);
      return res.status(200).json(Array.isArray(data) ? data.map((a) => ({ ...a, sec: normalizeSec(a.sec) })) : []);
    }
    if (req.method === "POST") {
      res.setHeader("Cache-Control", "no-store");
      if (!process.env.ADMIN_PASSWORD) {
        return res.status(500).json({ error: "Falta configurar ADMIN_PASSWORD en Vercel." });
      }
      if (!authorized(req)) return res.status(401).json({ error: "Clave incorrecta." });
      const body = req.body || {};
      if (body.verify) return res.status(200).json({ ok: true });
      const articles = cleanArticles(body.articles);
      if (!articles) return res.status(400).json({ error: "Los datos del artículo no son válidos." });
      await writeJson(FILE, articles);
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método no permitido." });
  } catch (e) {
    return res.status(500).json({ error: "Error del servidor: " + String((e && e.message) || e).slice(0, 300) });
  }
}
