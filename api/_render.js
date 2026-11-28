import { esc, normalizeSec, readMinutes } from "./_util.js";

const HEAD_ASSETS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">' +
  '<link rel="stylesheet" href="/styles.css">';

const HEADER =
  '<header class="top"><div class="wrap"><div><a class="brandlink" href="/"><p class="brand">Diario<span>Golero</span></p></a>' +
  '<p class="tag">Noticias y editoriales de fútbol</p></div></div></header>';

function fdate(t) {
  return new Date(t).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Santiago" });
}
function initials(n) {
  return String(n || "R").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "R";
}
function avatar(a) {
  return a.authorImg ? `<img class="av" src="${esc(a.authorImg)}" alt="">` : `<span class="av">${esc(initials(a.author))}</span>`;
}

export function renderNotFound() {
  return (
    '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex"><title>No encontrado · Diario Golero</title>' + HEAD_ASSETS + "</head><body>" + HEADER +
    '<main class="wrap"><div class="page"><h1 class="ptitle">Esta nota ya no está disponible</h1>' +
    '<p>Puede que la hayan retirado o que el enlace esté incompleto.</p><p><a class="btn" href="/">Ir a la portada</a></p></div></main></body></html>'
  );
}

export function renderArticle(a, others, origin) {
  const sec = normalizeSec(a.sec);
  const url = origin + "/a/" + encodeURIComponent(a.id);
  const text = a.lead || String(a.body).replace(/\s+/g, " ").slice(0, 160);
  const mins = readMinutes(a.body);
  const paras = String(a.body).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    .map((p) => "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>").join("");
  const enc = encodeURIComponent;
  const shareText = enc(a.title + " – Diario Golero");
  const img = a.image
    ? `<meta property="og:image" content="${esc(a.image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${esc(a.image)}">`
    : '<meta name="twitter:card" content="summary">';
  const more = others.map((o) =>
    `<a class="mc" href="/a/${esc(encodeURIComponent(o.id))}"><span class="chip sec" data-sec="${esc(normalizeSec(o.sec))}">${esc(normalizeSec(o.sec))}</span><strong>${esc(o.title)}</strong></a>`
  ).join("");
  return (
    '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' +
    `<title>${esc(a.title)} · Diario Golero</title><meta name="description" content="${esc(text)}">` +
    `<link rel="canonical" href="${esc(url)}"><meta property="og:site_name" content="Diario Golero"><meta property="og:type" content="article">` +
    `<meta property="og:title" content="${esc(a.title)}"><meta property="og:description" content="${esc(text)}"><meta property="og:url" content="${esc(url)}">` +
    img + HEAD_ASSETS + `</head><body data-id="${esc(a.id)}">` + HEADER +
    `<main class="wrap"><article class="reader page ${a.type === "ed" ? "ed" : "news"}">` +
    '<p class="crumb"><a href="/">← Volver a la portada</a></p>' +
    `<div class="meta"><span class="chip">${a.type === "ed" ? "Editorial" : "Noticia"}</span>` +
    (a.live ? '<span class="live">Último minuto</span>' : "") +
    `<span class="chip sec" data-sec="${esc(sec)}">${esc(sec)}</span><span>${esc(fdate(a.date))}</span><span>${mins} min de lectura</span></div>` +
    (a.image ? `<img class="hero" src="${esc(a.image)}" alt="${esc(a.title)}">` : "") +
    `<h1>${esc(a.title)}</h1>` + (a.lead ? `<p class="lead">${esc(a.lead)}</p>` : "") +
    `<div class="byline">${avatar(a)}<span>Por <b>${esc(a.author || "Redacción")}</b></span></div>` +
    `<div class="txt">${paras}</div>` +
    '<div class="share"><span>Compartir:</span>' +
    `<a href="https://wa.me/?text=${shareText}%20${enc(url)}" target="_blank" rel="noopener">WhatsApp</a>` +
    `<a href="https://twitter.com/intent/tweet?text=${shareText}&url=${enc(url)}" target="_blank" rel="noopener">X</a>` +
    `<a href="https://www.facebook.com/sharer/sharer.php?u=${enc(url)}" target="_blank" rel="noopener">Facebook</a>` +
    '<button type="button" id="copy">Copiar enlace</button><button type="button" id="native" hidden>Más opciones</button></div>' +
    "</article>" +
    (more ? `<section class="more"><h2 class="col-title">Más noticias</h2><div class="more-grid">${more}</div></section>` : "") +
    '</main><footer>Diario Golero</footer><script src="/common.js"></script><script src="/article.js"></script></body></html>'
  );
}
