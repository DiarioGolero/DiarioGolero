# Diario Golero: proyecto para Vercel

## Estructura
- `public/index.html`, `app.js`: portada pública (mosaico, cinta de resultados, «Lo más leído»).
- `public/article.js`: comportamiento de la página de cada artículo.
- `public/admin.html`, `admin.js`: sala de redacción (`/admin`, con clave).
- `public/common.js`, `styles.css`: piezas compartidas y diseño.
- `api/articles.js`: guarda y entrega los artículos.
- `api/article.js` + `api/_render.js`: página propia de cada artículo (`/a/ID`), con vista previa para WhatsApp y redes.
- `api/results.js`: resultados de partidos (escudos, marcador y noticia vinculada) que se ven como tarjetas arriba de la portada.
- `api/views.js`: contador de lecturas para «Lo más leído».
- `api/comments.js` + `api/_comments.js`: comentarios sin registro (nickname + texto), con moderación desde la redacción.
- `api/upload.js`: subida de imágenes.
- `api/_lib.js`, `api/_util.js`: utilidades internas.
- `vercel.json`, `package.json`: configuración.

## Variables necesarias en Vercel
- `ADMIN_PASSWORD`: la clave de la redacción.
- `BLOB_READ_WRITE_TOKEN`: llave del almacén Blob (debe ser público).

## Notas
- Los borradores se guardan en el navegador desde el que escribes.
- El contador de lecturas cuenta una visita por navegador cada 6 horas.
- Si dos personas publican exactamente al mismo tiempo, gana la última.
