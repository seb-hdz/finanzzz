# SEO en Finanzzz — referencia para agentes

Este documento describe la implementación actual de metadatos (títulos, descripciones, canónicas, Open Graph, robots) y las restricciones del proyecto. Sirve como base para **planificar mejoras de SEO** sin contradecir el modelo static export + `basePath`.

---

## Restricciones del proyecto

| Restricción | Implicación para SEO |
|-------------|----------------------|
| **`output: "export"`** en `next.config.ts` | No hay servidor Node en runtime. La metadata se **congela en el build** por ruta estática. No hay metadata por request, usuario ni cookies. |
| **`basePath` / `assetPrefix` `/finanzzz` en producción** | URLs públicas incluyen el prefijo (p. ej. `…/finanzzz/sources`). `metadataBase` y URLs absolutas deben alinearse con eso (ver `src/lib/app-base-path.ts`). |
| **Páginas con `"use client"`** | `page.tsx` cliente **no puede** exportar `metadata`. La metadata por ruta vive en **`layout.tsx`** del segmento (servidor). |

---

## Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `src/lib/site-metadata.ts` | Origen único de lógica compartida: `metadataBase`, plantilla de título, helpers de URL canónica, `sectionMetadata()`, OG/Twitter compartidos. |
| `src/app/layout.tsx` | Metadata global: `title.default` + `title.template`, descripción por defecto, `alternates` inicio, Open Graph/Twitter inicio, icons, PWA apple meta. |
| `src/app/<segment>/layout.tsx` | Una por sección indexable: llama a `sectionMetadata(título, descripción, pathname)`. |
| `src/app/sync-shared/layout.tsx` | Igual que otras secciones **más** `robots: { index: false, follow: true }` (no indexar; mantener OG para previews). |

Rutas con layout de sección actual: `expenses`, `sources`, `tags`, `reports`, `settings`, `sync-shared`. La **home** (`/`) solo usa el layout raíz.

---

## Variable de entorno

- **`NEXT_PUBLIC_SITE_URL`** (opcional pero **recomendada en CI/producción**): origen público **sin** barra final, p. ej. `https://usuario.github.io`.  
  - Si falta, el build usa `http://localhost:3000` → canónicas e imagen OG en HTML exportado apuntan a localhost; **los crawlers en producción no verán URLs correctas** hasta que el build use la URL real.

La construcción de `metadataBase` concatena `siteOrigin` + `appBasePath` (`/finanzzz` en prod) en `site-metadata.ts`.

---

## Títulos

- **Plantilla global:** `Finanzzz | %s` (`siteTitleTemplate` en `site-metadata.ts`; debe coincidir con `layout.tsx` raíz).
- **Home:** título completo en `homeDocumentTitle` (p. ej. `Finanzzz | Registra y controla tus gastos`) vía `title.default` en el layout raíz; **no** pasa por la plantilla `%s`.
- **Secciones:** cada layout pasa el **segmento** (p. ej. `"Gastos"`, `"Fuentes"`) → documento `<title>Finanzzz | Gastos</title>`, etc.

**Mejora futura posible:** revisar consistencia con etiquetas de UI (`nav-config.tsx`) y longitud de títulos para SERP.

---

## Descripciones

- **Default:** `defaultSiteDescription` en `site-metadata.ts` (meta description + OG/Twitter descripción en home).
- **Por ruta:** el segundo argumento de `sectionMetadata()` en cada `src/app/<segment>/layout.tsx`.

**Mejora futura posible:** textos únicos más orientados a intención de búsqueda; evitar duplicar demasiado el default; medir longitud (~150–160 caracteres como guía).

---

## URLs canónicas e idioma

- **`absolutePageUrl(pathname)`:** resuelve URL absoluta usando `metadataBase` y el path de app (`/`, `/expenses`, …).
- **`canonicalAlternates(pathname)`:** usado en raíz; produce `link rel="canonical"` y `link rel="alternate" hreflang="es"` con la misma URL (sitio **solo español**).
- **Secciones:** `sectionMetadata()` define el mismo par canónico + `hreflang` es por página.

**HTML:** `<html lang="es">` está en el layout raíz.

**Mejora futura posible:** si algún día hay más idiomas, reemplazar el objeto fijo `languages: { es }` por alternates por locale; valor `x-default` si aplica.

---

## Open Graph y Twitter

- **Imagen:** `public/icons/icon-512.png`, URL **absoluta** derivada de `siteOrigin` + `basePath` (misma idea que OG en redes).
- **Compartido:** `sharedOpenGraph` / `sharedTwitter` (`type: website`, `locale: es_ES`, `siteName`, card grande en Twitter).
- **Por página:** título y descripción alineados al `<title>` / meta description; **`og:url`** = URL canónica de esa ruta.

**Límites del static export:** no hay generación dinámica de imagen OG por petición (p. ej. `@vercel/og` en edge) sin otro servicio. Mejoras típicas: PNG/JPG **1200×630** dedicado en `public/`, actualizar referencia en `site-metadata.ts`.

**Ruta `sync-shared`:** a pesar de `noindex`, el HTML **sigue incluyendo** meta Open Graph / Twitter (útil si alguien comparte el enlace).

---

## Robots (`/sync-shared`)

- `robots: { index: false, follow: true }` → no indexar en buscadores; seguir enlaces si se desea transferir señal (ajustar a `follow: false` solo si hay razón de política).

---

## Añadir una ruta nueva (checklist)

1. Crear `src/app/<nueva-ruta>/page.tsx` (puede ser cliente).
2. Añadir `src/app/<nueva-ruta>/layout.tsx` con:
   ```ts
   export const metadata = sectionMetadata("Título corto", "Descripción única.", "/nueva-ruta");
   ```
3. Actualizar navegación (`src/components/layout/nav-config.tsx`) y, si aplica, **service worker** (`public/sw.js` — `APP_PATHS` / precache).
4. Confirmar que el **pathname** pasado a `sectionMetadata` coincide con la ruta real (incluye coherencia con `basePath` vía `absolutePageUrl`).

Si la ruta **no** debe indexarse pero sí compartirse en redes: patrón de `sync-shared/layout.tsx` (`sectionMetadata` + `robots`).

---

## Ideas de roadmap SEO (para planes futuros)

Priorizar según objetivo (marca vs. adquisición orgánica; este producto es en gran parte **app local-first**, así que parte del SEO es **ficha correcta al compartir** más que ranking masivo).

1. **Build / CI:** exigir `NEXT_PUBLIC_SITE_URL` en el job que genera el sitio público; documentar en README o en secrets del hosting.
2. **Imagen OG dedicada** (ratio recomendado por plataformas) y texto legible en miniatura.
3. **`robots.txt` / sitemap** estáticos en `public/` si el hosting no los genera (export estático puede servir archivos fijos).
4. **JSON-LD** (`WebApplication`, `SoftwareApplication`) en layout o página estática — validar que no rompa export.
5. **Auditoría de contenido:** H1 por página, jerarquía de encabezados, textos alternativos en imágenes relevantes.
6. **Core Web Vitals / performance:** ya alineado con buenas prácticas de Next/React; revisar skill `vercel-react-best-practices` del repo si se toca bundle.
7. **Evitar indexar URLs con solo query** si en el futuro hay páginas sensibles a `?` — hoy `sync-shared` usa query en cliente; la URL base sigue siendo `/sync-shared` con noindex.

---

## Resumen rápido

- **Fuente de verdad compartida:** `src/lib/site-metadata.ts`.
- **URLs absolutas correctas en prod:** `NEXT_PUBLIC_SITE_URL` en build.
- **Nuevas secciones indexables:** `layout.tsx` + `sectionMetadata(..., pathname)`.
- **Excepción conocida:** `/sync-shared` = noindex + OG presente.

Cualquier cambio en plantilla de título debe actualizar **`siteTitleTemplate`** y la plantilla en `layout.tsx` raíz a la vez.
