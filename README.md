# Diario Golero: cómo publicarlo en Vercel

## Qué contiene
- `public/index.html`: la portada que ve el público.
- `public/admin.html`: la sala de redacción (con clave). Se abre en `tu-dominio.vercel.app/admin`.
- `api/articles.js`: guarda y entrega los artículos (almacenamiento Vercel Blob).
- `vercel.json`, `package.json`: configuración.

## Pasos
1. Sube esta carpeta a un repositorio de GitHub, o usa `vercel` desde la terminal dentro de la carpeta.
2. En vercel.com: **Add New → Project** e importa el repositorio. No cambies nada y pulsa **Deploy**.
3. En el proyecto, ve a **Storage → Create → Blob**. Crea el almacén y conéctalo al proyecto. Vercel agrega solo la variable `BLOB_READ_WRITE_TOKEN`.
4. En **Settings → Environment Variables** agrega `ADMIN_PASSWORD` con la clave que quieras para entrar a la redacción.
5. Haz un nuevo deploy (**Deployments → ⋯ → Redeploy**) para que tome las variables.
6. Entra a `/admin`, escribe tu clave y publica el primer artículo.

## Notas
- Hasta que publiques algo, la portada se ve vacía.
- Los borradores se guardan en el navegador desde el que escribes. Solo lo publicado queda en el servidor.
- Si cambias `ADMIN_PASSWORD`, vuelve a hacer deploy.
