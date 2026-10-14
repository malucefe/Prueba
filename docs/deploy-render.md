# Deploy en Render (free tier)

Guía paso a paso para desplegar los 4 servicios de Caudo en Render usando el
Blueprint de la raíz (`render.yaml`): `caudo-db` (Postgres), `caudo-backend`
(NestJS), `caudo-frontend` (Angular SSR) y `caudo-n8n` (n8n en Docker).

> **Los servicios de desarrollo local NO cambian**: sin las nuevas variables de
> entorno, backend y frontend se comportan exactamente igual que antes
> (`DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME`, seed con defaults
> `Admin1234!`/`User1234!`, CORS `http://localhost:4200`, proxy de `/api` hacia
> `http://localhost:3000`, n8n en Docker con `http://backend:3000`).

## 1. Subir la rama

```bash
git add render.yaml n8n/Dockerfile docs/deploy-render.md
git commit -m "feat(deploy): blueprint de Render y docs de despliegue"
git push origin devLuis
```

Render despliega desde la rama del Blueprint (aquí `devLuis`); no hace falta
cambiar la rama por defecto del repositorio.

## 2. Crear la cuenta y el Blueprint

1. Crea la cuenta en <https://dashboard.render.com> (con GitHub; no pide tarjeta).
2. En el dashboard: **New → Blueprint**.
3. Selecciona el repositorio de Caudo y autoriza el acceso.
4. Render detecta `render.yaml` en la raíz y muestra la vista previa con los
   4 recursos: `caudo-db` (Postgres free), `caudo-backend`, `caudo-frontend`
   y `caudo-n8n`.
5. **Revisa el Blueprint** antes de aprobar: verifica `rootDir`, los
   `buildCommand`/`startCommand` y las env vars con valor fijo.

## 3. Secretos (`sync: false`)

Durante la creación, Render te pide un valor por cada env var marcada con
`sync: false`. Genera valores aleatorios, por ejemplo:

```bash
openssl rand -hex 32
```

| Env var | Servicio(s) | Notas |
| --- | --- | --- |
| `JWT_SECRET` | caudo-backend | Firma de los JWT. |
| `N8N_API_KEY` | caudo-backend **y** caudo-n8n | **Debe ser el MISMO valor en ambos**: el workflow la usa (`$env.N8N_API_KEY`) para llamar `/api/internal/*` y el backend la valida. |
| `N8N_ENCRYPTION_KEY` | caudo-backend **y** caudo-n8n | **Mismo valor en ambos** (n8n la usa para cifrar credenciales). |
| `SEED_ADMIN_PASSWORD` | caudo-backend | Contraseña del usuario `admin@caudo.dev` en producción. Déjalo vacío si NO quieres el seed de usuarios (solo categorías y reglas). |
| `SEED_USER_PASSWORD` | caudo-backend | Contraseña del usuario `user@caudo.dev`. |

> **Ojo**: Render solo pide estos valores en la creación inicial del Blueprint.
> Secretos nuevos agregados después hay que cargarlos a mano en
> *Environment* de cada servicio.

Con los secretos cargados, aprueba el Blueprint. Render crea los 4 recursos y
ejecuta los primeros builds (tarda unos minutos). Estado esperado:

- `caudo-db`: *Available*.
- `caudo-backend`: *Live*, health check en `/api`.
- `caudo-frontend`: *Live*, health check en `/`.
- `caudo-n8n`: *Live* (levanta con el Dockerfile `n8n/Dockerfile`, que adapta
  `N8N_PORT` al puerto que Render inyecta).

## 4. Importar y activar el workflow en n8n

1. Abre `https://caudo-n8n.onrender.com` (primer arranque: crea el usuario
   propietario de la instancia).
2. **Workflows → Import from File** y selecciona `n8n/workflow.json` del repo.
3. Verifica que el workflow use las variables de entorno del Blueprint:
   - `BACKEND_URL` → `https://caudo-backend.onrender.com` (ya definida en
     `render.yaml`; con fallback a `http://backend:3000` para Docker local).
   - `N8N_API_KEY` → la misma que tiene `caudo-backend`.
   - `N8N_ENCRYPTION_KEY` → la de la instancia (definida en `render.yaml`).
   - Estas variables solo son legibles en expresiones porque el servicio define
     `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`.
4. **Activa el workflow** (toggle arriba a la derecha). Sin activarlo el
   webhook `POST /webhook/new-transaction` responde 404.
5. Prueba de punta a punta: crea una transacción en el frontend
   (`https://caudo-frontend.onrender.com`) y revisa que el webhook llegue en
   n8n y que se genere la recomendación.

## 5. Warmup (free tier se duerme)

- Los servicios free se **apagan a los 15 minutos sin tráfico** y el próximo
  request tarda **~60 segundos** en despertarlos (cold start).
- Para demos, mantén despiertos los servicios con pings periódicos desde
  <https://cron-job.org> (o similar), por ejemplo cada 10 minutos:
  - `https://caudo-frontend.onrender.com/`
  - `https://caudo-backend.onrender.com/api`
  - `https://caudo-n8n.onrender.com/healthz/readiness`
- Considera también los **750 horas/mes** de instancia free por workspace:
  con 3 servicios web encendidos 24/7 se pasan de la cuota y Render los
  suspende hasta el inicio del mes. Para una demo corta, apaga los que no
  uses o limita los pings a horario laboral.

## 6. Limitaciones del free tier

- **Postgres free expira a los 30 días** desde su creación; después hay 14 días
  de gracia para subirlo a un plan de pago y luego Render **borra la base con
  todos sus datos**. Haz `pg_dump` periódico si te importa el contenido
  (los datos de demo se regeneran con el seed igualmente).
- **512 MB de RAM y 0.1 CPU** por servicio: n8n es el más justito; si el
  contenedor se queda sin memoria, reducir el número de ejecuciones retenidas
  en n8n o subir de plan.
- Un **solo Postgres free por workspace**.
- Sin SSH, sin discos persistentes y sin escalado horizontal.
- `DB_SYNC=true` sincroniza el schema en cada arranque (demo efímera). Es un
  tradeoff aceptado: **todavía no hay migraciones**; no usar con datos reales.
- Los archivos subidos (`/uploads`) viven en el contenedor: se pierden en cada
  redeploy del backend.

## 7. Verificación rápida post-deploy

```bash
curl -s https://caudo-backend.onrender.com/api          # Hello World
curl -s https://caudo-frontend.onrender.com/            # HTML del SSR
curl -s -X POST https://caudo-n8n.onrender.com/webhook/new-transaction \
  -H 'Content-Type: application/json' \
  -d '{"userId":"..."}'                                  # workflow activo
```

Si el frontend devuelve 502 en `/api/*`, el backend está dormido o
`BACKEND_URL` no coincide con la URL real de `caudo-backend`.
