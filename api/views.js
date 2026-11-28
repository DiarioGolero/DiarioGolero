import { readJson, writeJson } from "./_lib.js";

const VIEWS = "diario-golero/views.json";
const ARTICLES = "diario-golero/articles.json";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
      const v = await readJson(VIEWS, {});
      return res.status(200).json(v && typeof v === "object" && !Array.isArray(v) ? v : {});
    }
    if (req.method === "POST") {
      res.setHeader("Cache-Control", "no-store");
      const id = String((req.body || {}).id || "");
      if (!/^[A-Za-z0-9-]{1,40}$/.test(id)) return res.status(400).json({ error: "Artículo no válido." });
      const articles = await readJson(ARTICLES, []);
      if (!Array.isArray(articles) || !articles.some((a) => a && a.id === id)) {
        return res.status(404).json({ error: "El artículo no existe." });
      }
      let v = await readJson(VIEWS, {});
      if (!v || typeof v !== "object" || Array.isArray(v)) v = {};
      v[id] = (Number(v[id]) || 0) + 1;
      await writeJson(VIEWS, v);
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método no permitido." });
  } catch (e) {
    return res.status(500).json({ error: "Error del servidor." });
  }
}
