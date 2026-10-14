# HU-21 — Panel de métricas de uso global (admin)

**Feature:** hu-21-metricas-admin
**Locator:** odd/tasks/hu-21-metricas-admin.md
**Rama:** devLuis (commits work-unit convencionales, push es decisión del usuario)
**Estado:** en progreso
**HU completa:** docs/historias-de-usuario.md líneas 86–112

## Objetivo

Panel administrativo con métricas agregadas de uso de la plataforma: usuarios
activos, transacciones por período y recomendaciones generadas, con filtro por
rango de fechas que recalcula los indicadores sin recargar la página.

## Por qué

La HU-21 es la tercera de las 6 HUs de scope de sistema aprobadas por el
jurado. Permite al administrador evaluar adopción y detectar períodos de baja
actividad — es la base para el argumento de "plataforma operativa" de la tesis.

## Alcance autorizado (superficies de edición)

- caudo-back/src/metrics/
- caudo-back/src/app.module.ts
- CaudoFront/src/app/features/admin/
- CaudoFront/src/app/core/services/metrics.service.ts
- CaudoFront/src/app/core/models/
- odd/tasks/hu-21-metricas-admin.md

## Fuera de alcance

- HU-22 (monitoreo/auditoría) y posteriores
- render.yaml / docs de deploy — el endpoint queda bajo `/api` ya proxyado
- n8n, seed, flujos existentes de HU-19/HU-20 (solo lectura como referencia)

## Diseño bloqueado

1. **Backend — módulo `metrics`** (`caudo-back/src/metrics/`):
   - `GET /api/metrics?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`, admin-only
     (`JwtAuthGuard` + `RolesGuard` + `Roles('ADMIN')`, mismo patrón que
     users/rules de HU-19/HU-20).
   - Fechas validadas con regex `^\d{4}-\d{2}-\d{2}$` → 400 si inválidas;
     `desde > hasta` → 400. Defaults: `desde` = primer día del mes actual,
     `hasta` = hoy.
   - Respuesta:
     ```json
     {
       "desde": "...", "hasta": "...",
       "usuariosTotales": 0,
       "usuariosActivos": 0,
       "transacciones": { "total": 0, "ingresos": 0, "egresos": 0 },
       "recomendacionesGeneradas": 0,
       "transaccionesPorDia": [{ "fecha": "YYYY-MM-DD", "ingresos": 0, "egresos": 0 }]
     }
     ```
   - `usuariosActivos` = usuarios distintos con ≥1 transacción en el período.
   - Implementación con `find({ where: { fecha: Between(desde, hasta) } })` +
     agregación en JS (volúmenes de demo; facilita TDD con mocks de repo).
   - Registrar `MetricsModule` en `app.module.ts`.
2. **Frontend:**
   - `MetricsService` (HttpClient, params desde/hasta) + modelo tipado.
   - Componente `admin-metrics`: 4 cards de resumen, dos inputs `type="date"`
     (default = mes actual) que re-consultan al cambiarse, y gráfico de barras
     ingresos vs egresos por día con ng2-charts (mismo patrón que dashboard).
   - Ruta `metricas` en `admin.routes.ts` tras `adminGuard`; link en la nav de
     secciones admin compartida (la que agregó HU-20).
   - Fetch solo en browser (`isPlatformBrowser`) — lección SSR del deploy.
3. **TDD:** spec del service backend con resultado esperado claro → RED
   observado → implementar → GREEN. Frontend sin runner de unit tests: build
   es la verificación (mismo patrón HU-19/HU-20).

## Checklist de tareas

- [x] T1 — Task doc + espejo Engram (inline)
- [x] T2 — Módulo backend metrics con TDD RED→GREEN (delegado: writer)
- [x] T3 — Frontend admin-metrics: service, componente, ruta, nav (mismo writer)
- [x] T4 — Verificación final (tests backend completos + build backend + build
      frontend), commit work-unit, evidencia en este doc

## Criterios de aceptación

- CA1: al entrar al panel se ven los indicadores actualizados sin recargar.
- CA2: cambiar el rango de fechas recalcula las métricas solo con el período.
- Usuario no-admin redirigido por `adminGuard` (igual que resto del admin).
- `npm.cmd test` (caudo-back) verde ≥ 95 tests; `npm.cmd run build` backend y
  frontend OK.

## Verificación (comandos exactos)

```
cd caudo-back && npm.cmd test
cd caudo-back && npm.cmd run build
cd CaudoFront && npm.cmd run build
```

### Fallas ambientales conocidas

- Ninguna en la base actual (rama devLuis limpia en 88ff32b, tests 95/95).

## Progreso y evidencia

- 2026-10-14: T1 creado; diseño bloqueado desde el checkpoint de sesión #51.
- 2026-10-14: T2+T3 completados por writer delegado: backend `src/metrics/`
  (controller con validación regex + fecha real + defaults, service Between+JS,
  17 tests), frontend admin-metrics (cards + date range + barras ng2-charts,
  ruta y nav), `npm.cmd test` 112/112, `nest build` y build Angular OK.
- 2026-10-14: T4 — revisión del padre: fix de borde horario en
  `recomendacionesGeneradas` (CreateDateColumn es timestamp: el `Between`
  hasta medianoche UTC excluía todo el día `hasta`; ahora
  `And(MoreThanOrEqual(desde), LessThan(día-siguiente))`, TDD RED→GREEN).
  Suite final 112/112, builds backend y frontend OK.
- 2026-10-14: T4 commit work-unit `c9c43e5` en devLuis. Revisión nativa
  (RDD on, riesgo medium, lente review-reliability): START con consentimiento
  del usuario; STATUS con el binding devolvió `operation_timeout` (fase
  pre_native, mutation_outcome not_started) en dos intentos — el usuario
  decidió continuar sin reporte ni recibo nativo. La entrega sigue la política
  ordinary del repo; verificación propia: 112/112 + ambos builds.
- 2026-10-14: T2 — módulo `caudo-back/src/metrics/` (controller con guards
  HU-19/20 + validación de fechas, service con `Between` + agregación en JS,
  module con `forFeature`). Specs escritos primero; RED verificado con mutación
  (`usuariosActivos` → `transactions.length` rompió 2 tests) y luego GREEN.
  112/112 tests (95 base + 17 nuevos), `nest build` OK.
- 2026-10-14: T3 — `MetricsService` + `metrics.model.ts`, componente
  `admin-metrics` (4 cards, filtros `type="date"` que re-consultan sin
  recargar, bar chart ng2-charts ingresos vs egresos, fetch con guard
  `isPlatformBrowser`), ruta `metricas` tras `adminGuard`, link "Métricas"
  agregado a la nav admin compartida de las 3 páginas existentes.
  `npm.cmd run build` frontend OK (solo warnings de budget preexistentes).

## Ruta declarada por tarea (evidencia de delegación)

- T1 inline: doc mecánico ya entendido (sin investigación).
- T2+T3 delegadas a un writer: 2+ archivos no triviales → writer trigger.
- T4: spot check del padre (re-observar un comando reportado) + cierre.

## Estrategia de entrega

Push directo a `devLuis` (Render auto-despliega desde esa rama); no hay flujo
de PRs en este repo, así que no aplica slicing de cadena.
