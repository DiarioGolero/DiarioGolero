import { authorized, readJson, writeJson } from "./_lib.js";
import { cleanResults } from "./_util.js";

const FILE = "diario-golero/results.json";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30");
      const data = await readJson(FILE, []);
      return res.status(200).json(Array.isArray(data) ? data : []);
    }
    if (req.method === "POST") {
      res.setHeader("Cache-Control", "no-store");
      if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ error: "Falta configurar ADMIN_PASSWORD en Vercel." });
      if (!authorized(req)) return res.status(401).json({ error: "Clave incorrecta." });
      const items = cleanResults((req.body || {}).items);
      if (!items) return res.status(400).json({ error: "Los resultados no son válidos (máximo 12 partidos)." });
      await writeJson(FILE, items);
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método no permitido." });
  } catch (e) {
    return res.status(500).json({ error: "Error del servidor: " + String((e && e.message) || e).slice(0, 300) });
  }
}
