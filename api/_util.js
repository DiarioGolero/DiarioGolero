export const SECTIONS = ["LaLiga", "Copa del Rey", "UEFA Champions League", "UEFA Europa League", "Premier League", "Serie A", "Copa Libertadores", "Internacional", "Fichajes"];
export const LEGACY = { Liga: "LaLiga", Copa: "Copa del Rey", "Selección": "Internacional", Otros: "Internacional" };

export const str = (v, max) => String(v ?? "").slice(0, max);
export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function normalizeSec(s) {
  const v = LEGACY[s] || s;
  return SECTIONS.includes(v) ? v : "Internacional";
}

export function readMinutes(body) {
  const n = String(body || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(n / 200));
}

export function okImage(u) {
  try {
    const x = new URL(String(u || ""));
    const ok = x.protocol === "https:" && x.hostname.endsWith(".public.blob.vercel-storage.com") && x.pathname.startsWith("/diario-golero/img/");
    return ok ? x.href : "";
  } catch {
    return "";
  }
}

export function cleanArticles(input) {
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
      featured: a.featured === true,
      title,
      sec: normalizeSec(a.sec),
      author: str(a.author, 60).trim() || "Redacción",
      authorImg: okImage(a.authorImg),
      lead: str(a.lead, 220).trim(),
      body,
      image: okImage(a.image),
      date: Number.isFinite(a.date) ? a.date : Date.now(),
    });
  }
  return out;
}

const STATUS = ["Final", "En vivo", "Medio tiempo", "Por jugar", "Suspendido"];
const score = (v) => (Number.isInteger(v) && v >= 0 && v <= 99 ? v : null);

export function cleanResults(input) {
  if (!Array.isArray(input) || input.length > 12) return null;
  const out = [];
  for (const r of input) {
    if (!r || typeof r !== "object") return null;
    const home = str(r.home, 40).trim();
    const away = str(r.away, 40).trim();
    if (!home || !away) continue;
    out.push({
      comp: normalizeSec(r.comp),
      home,
      away,
      hs: score(r.hs),
      as: score(r.as),
      status: STATUS.includes(r.status) ? r.status : "Final",
    });
  }
  return out;
}

export function cleanNick(v) {
  const n = String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
  return n.length >= 2 && /^[\p{L}\p{N} ._-]+$/u.test(n) ? n : "";
}
export function cleanText(v) {
  return String(v ?? "").replace(/\r/g, "").replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/\n{3,}/g, "\n\n").trim().slice(0, 500);
}
export function hasLink(s) {
  return /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|cl|io|xyz|info|ly|me|co|es|ar|mx|tv|gg)\b)/i.test(String(s || ""));
}
const RESERVED = ["redaccion", "admin", "administrador", "diariogolero", "moderador", "moderacion", "golero"];
export function reservedNick(n) {
  const k = String(n).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[\s._-]/g, "");
  return RESERVED.includes(k);
}
