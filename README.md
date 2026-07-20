# Pecedex

Tu bitácora personal de fauna marina avistada — una Pokédex marina tropical, mobile-first.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Prisma 7** + **SQLite** (local) / **Neon PostgreSQL** (producción)
- **Vercel Blob** (fotos y modelos 3D en producción)
- **MapLibre GL JS** + **OpenFreeMap** (mapa gratuito)
- **Zustand** + **TanStack Query**
- Despliegue en **Vercel**

## Requisitos

- Node.js 20+

## Inicio rápido (local)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env

# 3. Crear tablas y datos de prueba (SQLite local, sin Docker)
npm run db:push
npm run db:seed

# 4. Contraseña admin (escribe el hash en .env)
npm run auth:hash -- tu-contraseña --write-env

# 5. Arrancar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el móvil o emulador.

Para entrar al panel: pestaña **Añadir** → contraseña configurada en el paso 4.

Para identificación automática por foto, añade `GEMINI_API_KEY` en `.env` (gratis en [Google AI Studio](https://aistudio.google.com/apikey)) y reinicia el servidor.

En la ficha de un pez (con sesión admin) puedes gestionar el modelo 3D:

1. **Buscar modelos gratis** (Sketchfab + catálogo + reutilizar especie) → pasas entre opciones y confirmas
2. Subir un `.glb` manual

Al **guardar un pez nuevo**, tras el alta aparece un **paso opcional** de modelo 3D (buscar ahora / ahora no). Sin modelo, se muestra la foto fija.

En el móvil puedes **Añadir a la pantalla de inicio** (PWA instalable vía `manifest` + iconos). No hay service worker offline todavía.

## Despliegue en Vercel

### 1. Neon (PostgreSQL)

1. Crea un proyecto en [neon.tech](https://neon.tech) (plan gratis).
2. Copia la connection string (`postgresql://…?sslmode=require`).

### 2. Proyecto Vercel

1. Importa el repo `pecedex` en [vercel.com](https://vercel.com).
2. Añade un **Blob Store** al proyecto (Storage → Blob) — crea `BLOB_READ_WRITE_TOKEN`.
3. Configura estas variables de entorno:

| Variable | Valor |
|----------|--------|
| `DATABASE_URL` | Connection string de Neon |
| `BLOB_READ_WRITE_TOKEN` | Token del Blob Store |
| `ADMIN_PASSWORD_HASH` | Salida de `npm run auth:hash -- tu-pass` |
| `GEMINI_API_KEY` | Clave de Google AI Studio |
| `GOOGLE_MAPS_API_KEY` | Clave de Google Maps (Places + Geocoding) |
| `SKETCHFAB_API_TOKEN` | Token de Sketchfab (opcional) |

4. Deploy. El `npm run build` sincroniza Prisma a PostgreSQL, hace `db push` y construye Next.js.

Local sigue usando SQLite (`file:./dev.db`) y archivos en `public/uploads`. En Vercel, con `BLOB_READ_WRITE_TOKEN` y `DATABASE_URL` postgres, usa Neon + Blob automáticamente.

> **Nota:** en el plan Hobby de Vercel el cuerpo de las Server Actions ronda ~4.5 MB. Fotos grandes o `.glb` pesados pueden fallar al subir; comprime un poco antes o usa un plan superior.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (Prisma + Next) |
| `npm run db:push` | Sincronizar schema con la BD |
| `npm run db:seed` | Cargar peces de ejemplo |
| `npm run db:studio` | Explorador visual de la BD |
| `npm run auth:hash -- <pass>` | Genera `ADMIN_PASSWORD_HASH` |
| `npm run auth:hash -- <pass> --write-env` | Lo escribe en `.env` |

## Base de datos

En local usamos **SQLite** (`dev.db`), sin Docker ni Postgres instalado.

En Vercel, `DATABASE_URL` apunta a **Neon** y el script `sync-prisma-provider` cambia el provider de Prisma a `postgresql` en el build.

## Fases

- [x] **Fase 0** — Fundamentos, tema tropical, layout móvil, Prisma
- [x] **Fase 1** — Galería con ordenación y ficha de detalle (parcial)
- [x] **Fase 2** — Rotador 3D (foto) en ficha + sway CSS en galería
- [x] **Fase 3** — Mapa MapLibre con clusters y contadores por ubicación
- [x] **Fase 4** — Spiderfy con miniaturas y navegación a ficha
- [x] **Fase 5** — Auth admin (contraseña + sesión httpOnly)
- [x] **Fase 6** — Alta con identificación por foto (Gemini) + Google Places
- [x] **Fase 7** — Modelos 3D (catálogo curado + subida .glb, fallback foto)
- [x] **Fase 8** — PWA (manifest + iconos), SEO, skeletons y estados vacíos
- [x] **Fase 9** — Buscar modelos 3D gratis (selector de candidatos + confirmación)
- [x] **Fase 10** — Recuerdos + listo para Vercel (Neon + Blob)
