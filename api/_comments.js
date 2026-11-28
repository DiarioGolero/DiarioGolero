import { createHash } from "node:crypto";
import { cleanNick, cleanText, hasLink, reservedNick } from "./_util.js";

const FILE = "diario-golero/comments.json";
const ARTICLES = "diario-golero/articles.json";
const MAX_PER_ARTICLE = 300;
const ID = /^[A-Za-z0-9-]{1,40}$/;

const pub = (c) => ({ cid: c.cid, nick: c.nick, text: c.text, date: c.date });
const asObj = (d) => (d && typeof d === "object" && !Array.isArray(d) ? d : {});
const asList = (d) => (Array.isArray(d) ? d : []);

function ipHash(req) {
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || (req.socket && req.socket.remoteAddress) || "";
  return createHash("sha256").update(ip + "|" + (process.env.ADMIN_PASSWORD || "golero")).digest("hex").slice(0, 16);
}

export function makeHandler({ authorized, readJson, writeJson }) {
  return async function handler(req, res) {
    try {
      if (req.method === "GET") {
        const q = req.query || {};
        const data = asObj(await readJson(FILE, {}));
        if (q.all) {
          res.setHeader("Cache-Control", "no-store");
          if (!authorized(req)) return res.status(401).json({ error: "Clave incorrecta." });
          const flat = [];
          for (const [aid, list] of Object.entries(data)) {
            for (const c of asList(list)) flat.push({ aid, cid: c.cid, nick: c.nick, text: c.text, date: c.date, reports: c.reports || 0 });
          }
          return res.status(200).json(flat);
        }
        if (q.id) {
          res.setHeader("Cache-Control", "public, s-maxage=5, stale-while-revalidate=15");
          if (!ID.test(String(q.id))) return res.status(200).json([]);
          return res.status(200).json(asList(data[q.id]).slice().reverse().map(pub));
        }
        res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
        const counts = {};
        for (const [aid, list] of Object.entries(data)) if (asList(list).length) counts[aid] = list.length;
        return res.status(200).json(counts);
      }

      if (req.method === "POST") {
        res.setHeader("Cache-Control", "no-store");
        const b = req.body || {};
        const action = String(b.action || "add");
        const id = String(b.id || "");
        if (!ID.test(id)) return res.status(400).json({ error: "Artículo no válido." });

        if (action === "delete" || action === "dismiss") {
          if (!authorized(req)) return res.status(401).json({ error: "Clave incorrecta." });
          const data = asObj(await readJson(FILE, {}));
          const list = asList(data[id]);
          if (action === "delete") {
            const rest = list.filter((c) => c.cid !== b.cid);
            if (rest.length) data[id] = rest; else delete data[id];
          } else {
            list.forEach((c) => { if (c.cid === b.cid) { c.reports = 0; c.rb = []; } });
          }
          await writeJson(FILE, data);
          return res.status(200).json({ ok: true });
        }

        if (action === "report") {
          const data = asObj(await readJson(FILE, {}));
          const c = asList(data[id]).find((x) => x.cid === b.cid);
          if (!c) return res.status(404).json({ error: "El comentario ya no existe." });
          const ip = ipHash(req);
          c.rb = asList(c.rb);
          if (!c.rb.includes(ip) && c.rb.length < 50) {
            c.rb.push(ip);
            c.reports = (c.reports || 0) + 1;
            await writeJson(FILE, data);
          }
          return res.status(200).json({ ok: true });
        }

        if (action !== "add") return res.status(400).json({ error: "Acción no válida." });
        if (String(b.website || "").trim()) return res.status(200).json({ ok: true });
        if ((Number(b.elapsed) || 0) < 2500) return res.status(429).json({ error: "Espera unos segundos antes de publicar." });
        const nick = cleanNick(b.nick);
        if (!nick) return res.status(400).json({ error: "El nickname debe tener entre 2 y 24 letras, números o espacios." });
        if (reservedNick(nick)) return res.status(400).json({ error: "Ese nickname no está disponible. Elige otro." });
        const text = cleanText(b.text);
        if (text.length < 2) return res.status(400).json({ error: "Escribe tu comentario." });
        if (hasLink(text) || hasLink(nick)) return res.status(400).json({ error: "No se permiten enlaces en los comentarios." });
        const articles = await readJson(ARTICLES, []);
        if (!Array.isArray(articles) || !articles.some((a) => a && a.id === id)) return res.status(404).json({ error: "La nota no existe." });

        const data = asObj(await readJson(FILE, {}));
        const ip = ipHash(req), now = Date.now();
        let recent = 0, last = 0;
        for (const list of Object.values(data)) {
          for (const c of asList(list)) {
            if (c.ip !== ip) continue;
            if (c.date > now - 3600e3) recent++;
            if (c.date > last) last = c.date;
          }
        }
        if (now - last < 30000) return res.status(429).json({ error: "Espera 30 segundos entre comentarios." });
        if (recent >= 8) return res.status(429).json({ error: "Has comentado mucho en poco tiempo. Inténtalo más tarde." });
        const c = { cid: "c" + now.toString(36) + Math.random().toString(36).slice(2, 6), nick, text, date: now, ip, reports: 0, rb: [] };
        data[id] = asList(data[id]).concat(c).slice(-MAX_PER_ARTICLE);
        await writeJson(FILE, data);
        return res.status(200).json({ ok: true, comment: pub(c) });
      }

      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Método no permitido." });
    } catch (e) {
      return res.status(500).json({ error: "Error del servidor." });
    }
  };
}
