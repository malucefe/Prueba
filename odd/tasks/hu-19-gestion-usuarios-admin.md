# HU-19 — Gestión de cuentas de usuarios (panel admin)

**Feature:** hu-19-gestion-usuarios-admin
**Objetivo:** Implementar HU-19 de docs/historias-de-usuario.md: el Administrador crea, edita, suspende y reactiva cuentas desde un panel admin. Backend NestJS + frontend Angular.
**Autorización:** usuario aprobó HU-19 (2026-10-11) y pidió implementación (deploy después).
**Ruta:** delegated direct (1 writer) — trigger: 2+ módulos no triviales (backend users/auth + frontend admin UI).

## Estado del exploration (2026-10-11)

- Backend: `Role` enum + `@Roles`/`RolesGuard` per-route ya existen; solo `GET /users` admin.
- `User` entity sin flag de estado (no existe isActive/suspend).
- `JwtAuthGuard` per-route, sin global APP_GUARD; strategy devuelve `{userId,email,role}` sin lookup DB.
- ValidationPipe global whitelist/forbidNonWhitelisted activo (main.ts:25-34).
- Jest configurado (npm test en caudo-back); specs de servicios existen como patrón; no hay users spec.
- Frontend: standalone + lazy routes + RxJS services (api.service genérico), signals solo para estado local de componentes. `User` model sin `role`; navbar hardcodeada sin links admin; no existe guard de rol ni carpeta features/admin.
- Vitest (ng test) con solo app.spec.

## Decisiones de diseño (bloqueadas, decididas por el orquestador)

1. **Estado de cuenta:** columna `is_active` boolean NOT NULL default true en `User`. Suspender = is_active=false. Sin columna `status` enum (simplicidad; la tesis solo pide suspender/reactivar).
2. **Invalidar sesiones activas (CA esc.3):** como JWT es stateless, la strategy pasa a hacer lookup del usuario y rechaza 401 si is_active=false; además login bloqueado para inactivos. (Blacklist Redis queda como futuro trabajo de la tesis.)
3. **Endpoints nuevos (admin-only, @Roles(Role.ADMIN)):**
   - `POST /api/users` — crear (nombre, email, password) → 201
   - `PATCH /api/users/:id` — editar (nombre?, email?, role?)
   - `PATCH /api/users/:id/suspend` — suspender (idempotente)
   - `PATCH /api/users/:id/reactivate` — reactivar (idempotente)
   - Protecciones: no auto-suspenderse, no editar/degradar el propio rol.
4. **DTOs:** CreateUserDto (nombre, email, password), UpdateUserDto (parcial). Reutilizar registro para hash de password.
5. **Frontend:** model User + `role`; `adminGuard` (functional, CanActivateFn) verifica role==='admin'; feature `features/admin` con listado + crear/editar/suspend/reactivate; navbar muestra link "Admin" solo para admin.
6. **Sin commits** por decisión del usuario (identidad git sin configurar). Se implementa y verifica; el commit queda pendiente de decisión.

## Checklist

- [x] T1 — Backend: entity is_active + DTOs + endpoints admin CRUD + suspender/reactivar + strategy con check is_active + login block
- [x] T2 — Backend tests: RED→GREEN specs de users.service (create/update/suspend/reactivate) y bloqueo login/sesiones para inactivos
- [x] T3 — Frontend: model role, adminGuard, user.service, feature admin (CRUD UI), navbar con link condicional
- [x] T4 — Verificación: backend npm test + build; frontend build; smoke manual con servicios locales (opcional si no levantan)

## Criterios de aceptación

- HU-19 escenarios 1-4 de docs/historias-de-usuario.md cumplidos.
- DoD: code review pendiente, prueba funcional ejecutada (tests), evidencia, CAs verificados, sin deuda técnica conocida.

## Progreso

- 2026-10-11: feature creada; exploration completa; writer lanzado (pendiente).
- 2026-10-11: **HU-19 implementada (T1-T4 completos).**
  - **Backend (TDD RED→GREEN):** `User.isActive` (`is_active` boolean NOT NULL default true), `CreateUserDto`/`UpdateUserDto`, `POST /users`, `PATCH /users/:id`, `PATCH /users/:id/suspend`, `PATCH /users/:id/reactivate` (todos `JwtAuthGuard + RolesGuard + @Roles(ADMIN)`), auto-protección (no auto-suspenderse, no cambiar el propio rol), 404 en id desconocido, `JwtStrategy.validate()` hace lookup en DB y devuelve 401 si `isActive=false`, `AuthService.login()` rechaza inactivos con mensaje "Tu cuenta está suspendida. Contacta al administrador."
  - **Tests:** `npm test` en caudo-back = **63/63 pasan, 9 suites**. RED observado antes de implementar: 4 suites fallando, 35 tests (métodos/decorators inexistentes). Specs nuevos: users.service.spec.ts, users.controller.spec.ts (metadata de guards/roles vía `Reflect.getMetadata` sobre `descriptor.value`), jwt.strategy.spec.ts; extensión de auth.service.spec.ts.
  - **Frontend:** model `User` con `role`/`isActive`, `adminGuard`, `user.service.ts`, `features/admin/admin-users` (tabla + crear + editar modal + suspender/reactivar), link "Admin" en navbar solo para `role==='admin'`, ruta lazy `/admin` con `[authGuard, adminGuard]`.
  - **Desviaciones documentadas:**
    1. `CreateUserDto` incluye `role?` opcional (default `user`) además de (nombre, email, password): necesario para cumplir Esc.1 "con nombre, correo y rol" bajo `forbidNonWhitelisted`.
    2. `User.role`/`isActive` en el model frontend son **opcionales**: `features/profile/profile.ts` (fuera de superficies permitidas) inicializa `user: User` sin esos campos.
    3. `seed.service.ts` no se tocó: el default true de la columna cubre Esc.1.
  - **Blocker pre-existente (no de HU-19):** `npm run build` del frontend (SSR) falla al prerenderizar `/profile` porque `ProfileComponent` dispara `GET /api/users/profile` durante SSR y el backend no está corriendo. Verificado con build baseline (copia sin cambios de HU-19): mismo fallo. Con la ruta `/profile` removida temporalmente, el build completa ("Application bundle generation complete", 9 rutas prerenderizadas + /admin = 10 en la build completa). `ng test` (app.spec) también falla en baseline (NG0201 ActivatedRoute) — pre-existente.
