# Pecedex

Tu bitácora personal de peces avistados — una Pokédex marina tropical, mobile-first.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Prisma 7** + **SQLite** (local) / Neon PostgreSQL (producción)
- **MapLibre GL JS** + **OpenFreeMap** (mapa gratuito)
- **Zustand** + **TanStack Query** (preparado para fases siguientes)
- Despliegue previsto en **Vercel**

## Requisitos

- Node.js 20+

## Inicio rápido

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

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run db:push` | Sincronizar schema con la BD |
| `npm run db:seed` | Cargar peces de ejemplo |
| `npm run db:studio` | Explorador visual de la BD |
| `npm run auth:hash -- <pass>` | Genera `ADMIN_PASSWORD_HASH` |
| `npm run auth:hash -- <pass> --write-env` | Lo escribe en `.env` |

## Base de datos

En local usamos **SQLite** (`dev.db`), sin Docker ni Postgres instalado.

Cuando despliegues en Vercel, cambia `DATABASE_URL` a una base **Neon** (PostgreSQL) y vuelve a poner `provider = "postgresql"` en el schema.

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
