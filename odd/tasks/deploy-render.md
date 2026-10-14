# Deploy Render (free tier) — arreglos previos obligatorios

**Feature:** deploy-render
**Objetivo:** Primer deploy funcional de los 4 servicios en Render free (backend NestJS, frontend Angular SSR, n8n, Postgres) + arreglos de código que todo deploy requiere.
**Autorización:** usuario eligió Render free (2026-10-13). Estrategia: Render para tener URL esta semana; Azure for Students como hogar de 12 meses en paralelo (decisión pendiente del usuario).
**Ruta:** delegated direct (1 writer).

## Arquitectura objetivo en Render

4 recursos (free): `caudo-backend` (web service, Node), `caudo-frontend` (web service, Node SSR), `caudo-n8n` (web service, Docker image n8nio/n8n), `caudo-db` (Postgres free). `render.yaml` en la raíz codifica el blueprint. COLD START ~60s tras inactividad (aceptado; mitigación: ping de warmup, documentar).

## Decisiones de diseño (bloqueadas)

1. **DB_URL**: Render provee `DATABASE_URL`. `app.module.ts` lo parsea (regex postgres://) y prioriza sobre DB_HOST/DB_PORT/... (fallback local intacto). Esto además mata el mismatch DB_DATABASE/DB_NAME.
2. **Schema en prod**: `synchronize` pasa a leer env `DB_SYNC` (default: `NODE_ENV !== 'production'` = comportamiento actual). En Render se setea `DB_SYNC=true` (demo efímera; documentado como tradeoff — sin migraciones todavía).
3. **Seed**: gate `SEED_ENABLED` (default true en dev; en Render true para la demo). Contraseñas desde env `SEED_ADMIN_PASSWORD`/`SEED_USER_PASSWORD` con defaults actuales solo cuando NODE_ENV !== 'production'; en producción SIN default (si SEED_ENABLED=true y no hay password → log de warning y se omite users seed).
4. **CORS**: `ALLOWED_ORIGINS` env (coma-separada), default `http://localhost:4200`. `credentials: true` se mantiene.
5. **Proxy /api en el frontend SSR**: `server.ts` gana middleware Express que proxya `/api/*` a `BACKEND_URL` (env; default `http://localhost:3000`) con Node http nativo (SIN dependencias nuevas). Así `environment.prod.ts` (`/api`) funciona tal cual y no hay CORS frontend→backend (same-origin).
6. **SSR browser-only**: profile.ts, dashboard.ts, goals-list.ts — los fetches de ngOnInit pasan a ejecutarse solo en browser (`isPlatformBrowser` en ngOnInit; estado inicial loading/empty). La hidratación existente se encarga del resto. Sin afterNextRender/TransferState (solución simple y suficiente).
7. **n8n workflow URLs**: las 4 URLs `http://backend:3000/...` pasan a `={{ ($env.BACKEND_URL || 'http://backend:3000') + '/api/internal/...' }}` — compatible Docker (default) y Render (BACKEND_URL=https://caudo-backend.onrender.com). Requiere N8N_BLOCK_ENV_ACCESS_IN_NODE=false (ya en compose; documentar para Render).
8. **render.yaml** (nuevo, raíz): blueprint con los 4 servicios, builds (`npm install && npm run build` / start correspondientes), env vars (secretos con `sync: false`), NODE_VERSION=22, health checks.
9. **docs/deploy-render.md** (nuevo): pasos exactos — crear cuenta, Blueprint desde repo, servicios, env vars, importar workflow en n8n (BACKEND_URL + N8N_API_KEY + N8N_ENCRYPTION_KEY), warmup, limitaciones free tier.

## Checklist

- [x] T1 — Backend: DATABASE_URL, DB_SYNC, CORS ALLOWED_ORIGINS, seed gate + env passwords
- [x] T2 — Frontend: proxy /api en server.ts (sin deps) + guards browser-only en profile/dashboard/goals-list
- [x] T3 — n8n: URLs con $env.BACKEND_URL fallback docker
- [x] T4 — render.yaml + docs/deploy-render.md
- [x] T5 — Verificación: backend npm test + build; frontend build DEBE pasar ahora incluso con backend caído (prueba del fix SSR); workflow.json parse; sin dependencias nuevas

## Criterios de aceptación

- Build de frontend prod completa con backend apagado (antes fallaba por fetch en SSR).
- Comportamiento local sin cambios (defaults actuales).
- render.yaml válido y suficiente para provisionar los 4 servicios vía Blueprint.

## Progreso

- 2026-10-13: feature creada; exploration completa (8 gaps mapeados); writer pendiente.
- 2026-10-13: T1–T5 implementados y verificados (95 tests backend verdes; builds backend/frontend OK;
  build frontend OK incluso con backend inalcanzable — `BACKEND_URL=http://localhost:39999` → exit 0 con
  12 rutas prerenderizadas; workflow.json parsea; sin dependencias nuevas).
  Notas de implementación: (a) `render.yaml` usa la sintaxis oficial `fromDatabase: {name, property}`
  (el esquema actual de Render no acepta `fromDatabase: <string>` ni `fromDatabaseApi`); (b) se agregaron
  `SEED_ADMIN_PASSWORD`/`SEED_USER_PASSWORD` como `sync: false` en caudo-backend (sin ellas el seed de
  usuarios se omite en producción y la demo quedaría sin usuarios), `BACKEND_URL` en caudo-n8n (la
  necesita el workflow) y `N8N_EDITOR_BASE_URL`; (c) `n8n/Dockerfile` mapea `N8N_PORT=$PORT` porque Render
  inyecta un puerto aleatorio y n8n escucha en 5678 por defecto; (d) `DATABASE_URL` con `sslmode=require`
  activa TLS (`rejectUnauthorized: false`, certificados autofirmados de Render); sin `sslmode` la conexión
  interna de Render permite texto plano, así que el fallback local no cambia; (e) `AppController` (GET /api)
  existía con su spec pero NUNCA estaba montado en `AppModule` → `healthCheckPath: /api` habría dado 404
  eterno en Render; se montó en `controllers` (única ruta nueva: /api → "Hello World!"); (f) queda un fetch
  de build en `transaction-form.ts` (categorías, fuera de superficies permitidas) que falla en 502 durante
  el prerender pero NO rompe el build (verificado: exit 0 con backend inalcanzable).
  Verificación final: 95 tests backend verdes; `nest build` OK; `ng build` OK (12 rutas prerenderizadas);
  proxy /api probado E2E contra el backend real (GET /api → 200 "Hello World!", POST login → 400 del
  backend, SSR / y estáticos → 200); workflow.json parsea; render.yaml parseado con js-yaml (transitivo,
  sin deps nuevas) + chequeo estructural contra el esquema oficial; git status = solo superficies permitidas;
  servidores dev restaurados (:3000 y :4200, estaban caídos al momento de verificar).
