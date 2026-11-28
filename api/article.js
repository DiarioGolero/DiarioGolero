import { readJson } from "./_lib.js";
import { renderArticle, renderNotFound } from "./_render.js";
import { normalizeSec } from "./_util.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  try {
    const id = String(req.query.id || "");
    const data = await readJson("diario-golero/articles.json", []);
    const all = (Array.isArray(data) ? data : []).map((a) => ({ ...a, sec: normalizeSec(a.sec) }));
    const a = all.find((x) => x.id === id);
    if (!a) return res.status(404).send(renderNotFound());
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const others = all
      .filter((x) => x.id !== id)
      .sort((p, q) => Number(q.sec === a.sec) - Number(p.sec === a.sec) || q.date - p.date)
      .slice(0, 3);
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    return res.status(200).send(renderArticle(a, others, "https://" + host));
  } catch (e) {
    return res.status(500).send("<!DOCTYPE html><meta charset=utf-8><p>No se pudo cargar la nota. Inténtalo de nuevo en unos segundos.</p>");
  }
}
