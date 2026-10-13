# HU-20 — Gestión de catálogos globales (admin)

**Feature:** hu-20-catalogos-globales
**Objetivo:** Implementar HU-20 de docs/historias-de-usuario.md: el Administrador gestiona categorías de transacciones y reglas del motor de recomendaciones desde el panel admin.
**Autorización:** usuario aprobó HU-20 (2026-10-11); orden acordado: HU-19 → HU-20.
**Ruta:** delegated direct (1 writer) — trigger: módulo backend nuevo + CRUD categorías + workflow n8n + UI admin.

## Estado del exploration (2026-10-11)

- `Category` ya es tabla (id, nombre, tipo ingreso|egreso, icono, FK a transactions sin onDelete). Seed: 14 egreso + 6 ingreso con emojis (seed.service.ts:34-71, guard count()).
- API de categorías read-only: solo `GET /categories?tipo=`; service tiene create (solo seed) sin update/delete; sin DTOs.
- Frontend ya puebla el select desde `categoryService.getAll(tipo)` (no hardcodeado).
- Reglas del motor: 100% hardcodeadas en el nodo Code de `n8n/workflow.json` (`Motor de reglas`, jsCode) — regla1 categoría >30% ingreso mensual; regla2 egresos/ingresos >0.8; regla3 sin egreso "ahorro"; regla4 ≥3 movimientos repetidos (varianza ≤20% o stddev ≤5 días). Templates en strings inline. Duplicado en 4 archivos de workflow.
- Backend recommendations = storage; n8n habla con backend solo por `/api/internal/*` con `ApiKeyGuard`.
- Sin tabla de reglas/config. `synchronize:true` fuera de prod (sin migraciones).
- Panel admin existe (`features/admin/admin.routes.ts` con AdminUsersComponent + adminGuard).

## Decisiones de diseño (bloqueadas)

1. **Categorías:**
   - Columna `activo` boolean NOT NULL default true en `Category`.
   - Endpoints admin (`@Roles(Role.ADMIN)`): `POST /categories` (nombre, tipo, icono?), `PATCH /categories/:id` (nombre?, icono?, activo?), `DELETE /categories/:id` → **409 si tiene transacciones asociadas** (CA esc.2 — sugerir desactivar), 404 id desconocido.
   - `GET /categories` para usuarios normales solo devuelve `activo=true`; admin con `?includeInactive=true` ve todas (con flag).
2. **Reglas (nueva entidad `RecommendationRule`):**
   - Campos: `key` unique (regla1..regla4), `nombre`, `parametros` jsonb (umbrales), `plantilla` text, `activa` bool default true.
   - Seed idempotente (guard count()) con los valores actuales del nodo Code (30, 0.8, 20, 5 días + templates copiados textualmente).
   - Admin: `GET /rules` (admin), `PATCH /rules/:id` (parametros?, plantilla?, activa?) — catálogo fijo de 4 reglas: editar y activar/desactivar, NO crear/eliminar.
   - Nuevo módulo `rules` con controller/service/entity/DTO.
3. **Puente n8n:** nuevo `GET /api/internal/rules` con `ApiKeyGuard` (mismo patrón que transactions/income). En `n8n/workflow.json`: nodo HTTP nuevo "Consultar reglas" antes del Code; el Code node usa umbrales/templates dinámicos con **fallback a los defaults embebidos** si el fetch falla (resiliencia — el ADR acepta caída de n8n, no del motor).
   - Archivo canónico: `n8n/workflow.json` (el importado en la instancia local). Los duplicados (workflow-v2/...) NO se tocan; se documenta en el task doc.
4. **Frontend admin:**
   - `features/admin` gana sección "Catálogos": (a) tabla de categorías (nombre, tipo, icono, estado, acciones: editar / activar-desactivar / eliminar con confirmación y manejo del 409 mostrando "desactivar en su lugar"), (b) tabla de reglas (nombre, umbrales resumidos, plantilla, activa, editar en modal).
   - `category.service.ts` existente se extiende con métodos admin; nuevo `rule.service.ts`. Rutas admin hijas detrás de `adminGuard`. UI en español, OnPush + signals, Observables en services (patrón repo).
5. **GET /categories para usuarios** debe seguir trayendo solo activas (selector del form de transacciones no cambia visualmente salvo que queden inactivas).

## Checklist

- [x] T1 — Backend categorías: entity activo + DTOs + endpoints admin (POST/PATCH/DELETE con 409) + filtro activo en GET
- [x] T2 — Backend reglas: entidad + módulo rules + seed con defaults del workflow + endpoint internal/rules
- [x] T3 — TDD backend: specs RED→GREEN de categories.service, rules.service, internal rules endpoint; build nest
- [x] T4 — n8n: workflow.json con nodo Consultar reglas + Code dinámico con fallback
- [x] T5 — Frontend: sección Catálogos en admin (categorías + reglas), services, rutas
- [x] T6 — Verificación: backend npm test + build; frontend build; revisión sintáctica del workflow.json (n8n local puede no estar corriendo)

## Criterios de aceptación

- HU-20 escenarios 1-3 de docs/historias-de-usuario.md cumplidos.
- DoD: code review pendiente, prueba funcional (tests), evidencia, CAs verificados, sin deuda técnica.

## Progreso

- 2026-10-11: feature creada; exploration completa; writer pendiente.
- 2026-10-11: **HU-20 implementada (writer completo).**
  - **TDD:** specs RED primero observados (`Cannot find module './rules.service'`, `service.update/remove is not a function` ×5, `controller.getActiveRules is not a function`); luego GREEN.
  - **T1 categorías:** columna `activo` (boolean NOT NULL default true); DTOs Create/Update con class-validator; service con `findAll/findByType(includeInactive)`, `update` (404) y `remove` (404 desconocido; **409 con mensaje que sugiere desactivarla** si `transactions.count({categoriaId}) > 0` — se inyecta repo de Transaction en categories.module); controller: GET filtra activas y exige rol ADMIN para `?includeInactive=true` (403 si no), POST/PATCH/DELETE con `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.ADMIN)`.
  - **T2 reglas:** módulo `src/rules/` (entity RecommendationRule jsonb `parametros` + `plantilla` text + `activa`; service findAll/findActive/update 404; controller GET/PATCH admin-only; DTO UpdateRuleDto). `GET /api/internal/rules` en internal.controller con ApiKeyGuard existente (InternalService.getActiveRules). Seed idempotente en seed.service.ts con **DataSource global** (seed.module.ts NO está en superficies permitidas y no importa RulesModule — el repo global de TypeORM evita tocarlo); valores/plantillas copiados textualmente del nodo Code (30%, 0.8, 10%, varianza 0.2 / stddev 5 días / mín. 3 movimientos).
  - **T3 specs nuevos:** `categories.service.spec.ts` (10 tests), `rules/rules.service.spec.ts` (6), `rules/rules.controller.spec.ts` (6, guards/roles pinning — añadido porque el build falló por `Get` sin importar en rules.controller y ningún spec instanciaba ese controller), `internal/internal.controller.spec.ts` (6: guard metadata + delegación + comportamiento ApiKeyGuard con ConfigService mockeado). Backend final: **13 suites / 89 tests verdes**, `nest build` limpio.
  - **T4 n8n:** solo `n8n/workflow.json`. Nodo HTTP "Consultar reglas" (GET internal/rules, X-API-Key, `onError: continueRegularOutput`) entre "Consultar ingresos del mes" y "Motor de reglas"; jsCode del Code node reescrito: `REGLAS_DEFAULT` (valores actuales como fallback), fetch con try/catch + filtro de items sin `key`, `getRule` (regla desactivada ⇒ no se ejecuta), merge de parámetros con defaults, `render()` con `Function` para plantillas `${...}` (try/catch ⇒ si el sandbox bloquea `Function` se usa la plantilla cruda). Validado: `JSON.parse` OK. **Falta re-importar el workflow manualmente en la instancia n8n local.**
  - **T5 frontend:** `category.model.ts` +`activo` y request types; `rule.model.ts` + `rule.service.ts`; `category.service.ts` con getAllForAdmin/create/update/remove; `admin.routes.ts` hijos `categorias` y `reglas` tras adminGuard; `AdminCategoriesComponent` (tabla + create + modal editar + toggle activo + eliminar con confirm y toast con el mensaje 409 del servidor) y `AdminRulesComponent` (tabla con umbrales resumidos + modal parametros/plantilla/activa); nav de secciones añadida a admin-users (import RouterModule, HU-19 intacto); ambos nuevos con SSR-skip (isPlatformBrowser) como admin-users.
  - **T6 verificación:** backend test/build ✅; workflow.json sintácticamente OK; frontend build: bundle compila y **las 12 rutas prerenderizan (incluidas /admin, /admin/categorias, /admin/reglas sin errores)**; falla pre-existente `/profile` (AbortError con backend caído) + en algunas corridas `/goals` y/o `/dashboard` con `Terminating worker thread` de piscina — **collateral del teardown** provocado por el aborto de /profile (probado en worktree HEAD: mismas rutas hacen fetch SSR incondicional y solo /profile falla con 9 rutas; el conteo de rutas cambia el scheduling del pool). Componentes tocados: ninguno (goals-list/profile intactos; dashboard modificado por HU-19, no por HU-20).
  - Seed de categorías del seed original pasa por `findAll()` que ahora filtra `activo=true` — comportamiento correcto (seed solo corre con DB vacía).
