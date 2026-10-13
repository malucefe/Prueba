# Historias de Usuario — Caudo (HU-19 a HU-24)

Historias nuevas aprobadas el 2026-10-11 para cerrar los gaps del Informe TDG:
el actor Administrador (líneas 304-309 del informe) sin HU asignada, y el objetivo
general de gestión/evaluación de obligaciones crediticias sin cobertura en sprints.

Numeración continúa el backlog existente (HU-01 a HU-18).

---

## HISTORIA DE USUARIO — HU-19

**Nombre:** Gestión de cuentas de usuarios
**Puntos de historia (story points):** 8
**Como (rol):** Administrador de la plataforma
**Quiero (funcionalidad):** crear, editar, suspender y reactivar cuentas de usuario desde un panel administrativo
**Para (beneficio):** mantener el control de quién accede a Caudo y poder restringir cuentas inactivas o comprometidas

### CRITERIOS DE ACEPTACIÓN

**Escenario 1 — Cuando:**
Registro un nuevo usuario desde el panel con nombre, correo y rol
**Espero:**
Que el sistema cree la cuenta con un estado activo y la liste inmediatamente

**Escenario 2 — Cuando:**
Edito los datos de un usuario existente
**Espero:**
Que los cambios se persistan y el usuario reciba el estado actualizado en su próximo inicio de sesión

**Escenario 3 — Cuando:**
Suspendo una cuenta
**Espero:**
Que el sistema invalide sus sesiones activas e impida el inicio de sesión con un mensaje informativo

**Escenario 4 — Cuando:**
Reactivo una cuenta suspendida
**Espero:**
Que el usuario pueda iniciar sesión nuevamente conservando sus datos

### DEFINICIÓN DE TERMINADO (DoD)

- ☐ Código revisado y aprobado por el equipo (code review)
- ☐ Prueba funcional ejecutada y aprobada (caso de prueba documentado)
- ☐ Evidencia visual integrada en el diario de sprint
- ☐ Criterios de aceptación verificados y marcados
- ☐ Sin deuda técnica conocida asociada a esta HU

---

## HISTORIA DE USUARIO — HU-20

**Nombre:** Gestión de catálogos globales
**Puntos de historia (story points):** 8
**Como (rol):** Administrador de la plataforma
**Quiero (funcionalidad):** administrar las categorías de transacciones y las reglas del motor de recomendaciones
**Para (beneficio):** mantener los catálogos actualizados sin intervenir la base de datos ni el flujo de n8n manualmente

### CRITERIOS DE ACEPTACIÓN

**Escenario 1 — Cuando:**
Agrego una nueva categoría de transacción
**Espero:**
Que aparezca disponible en el selector de registro de transacciones para todos los usuarios

**Escenario 2 — Cuando:**
Intento eliminar una categoría con transacciones asociadas
**Espero:**
Que el sistema impida la eliminación y sugiera desactivarla en su lugar

**Escenario 3 — Cuando:**
Modifico una regla del motor de recomendaciones
**Espero:**
Que la nueva regla se refleje en las próximas recomendaciones generadas por n8n

### DEFINICIÓN DE TERMINADO (DoD)

- ☐ Código revisado y aprobado por el equipo (code review)
- ☐ Prueba funcional ejecutada y aprobada (caso de prueba documentado)
- ☐ Evidencia visual integrada en el diario de sprint
- ☐ Criterios de aceptación verificados y marcados
- ☐ Sin deuda técnica conocida asociada a esta HU

---

## HISTORIA DE USUARIO — HU-21

**Nombre:** Panel de métricas de uso global
**Puntos de historia (story points):** 5
**Como (rol):** Administrador de la plataforma
**Quiero (funcionalidad):** visualizar métricas agregadas de uso: usuarios activos, transacciones por período y recomendaciones generadas
**Para (beneficio):** evaluar la adopción del sistema y detectar períodos de baja actividad

### CRITERIOS DE ACEPTACIÓN

**Escenario 1 — Cuando:**
Accedo al panel administrativo
**Espero:**
Ver los indicadores globales actualizados sin necesidad de recargar la página

**Escenario 2 — Cuando:**
Selecciono un rango de fechas
**Espero:**
Que las métricas se recalculen solo con los datos del período seleccionado

### DEFINICIÓN DE TERMINADO (DoD)

- ☐ Código revisado y aprobado por el equipo (code review)
- ☐ Prueba funcional ejecutada y aprobada (caso de prueba documentado)
- ☐ Evidencia visual integrada en el diario de sprint
- ☐ Criterios de aceptación verificados y marcados
- ☐ Sin deuda técnica conocida asociada a esta HU

---

## HISTORIA DE USUARIO — HU-22

**Nombre:** Monitoreo de auditoría, errores y ejecuciones del motor de recomendaciones
**Puntos de historia (story points):** 8
**Como (rol):** Administrador de la plataforma
**Quiero (funcionalidad):** consultar los logs de auditoría, los errores de la API y el estado de las ejecuciones del webhook de n8n
**Para (beneficio):** detectar y diagnosticar fallas del sistema antes de que impacten a los usuarios

### CRITERIOS DE ACEPTACIÓN

**Escenario 1 — Cuando:**
Ocurre un error en una petición de la API
**Espero:**
Que el evento quede registrado con fecha, endpoint y detalle, visible en el panel de monitoreo

**Escenario 2 — Cuando:**
Una ejecución del webhook de n8n falla o no responde
**Espero:**
Que el estado de la ejecución aparezca marcada como fallida con su causa en el panel

**Escenario 3 — Cuando:**
Busco en los logs por fecha o usuario
**Espero:**
Que el sistema me devuelva solo los eventos que coincidan con el filtro

### DEFINICIÓN DE TERMINADO (DoD)

- ☐ Código revisado y aprobado por el equipo (code review)
- ☐ Prueba funcional ejecutada y aprobada (caso de prueba documentado)
- ☐ Evidencia visual integrada en el diario de sprint
- ☐ Criterios de aceptación verificados y marcados
- ☐ Sin deuda técnica conocida asociada a esta HU

---

## HISTORIA DE USUARIO — HU-23

**Nombre:** Registro y seguimiento de obligaciones crediticias
**Puntos de historia (story points):** 8
**Como (rol):** Usuario de la plataforma
**Quiero (funcionalidad):** registrar mis créditos y obligaciones de pago (monto, cuota, fecha de vencimiento) y consultar su estado
**Para (beneficio):** tener visibilidad de mis compromisos financieros y su impacto en mi capacidad de ahorro

### CRITERIOS DE ACEPTACIÓN

**Escenario 1 — Cuando:**
Registro una obligación con sus datos y fecha de vencimiento
**Espero:**
Que el sistema la guarde con estado "al día" y la liste en mi panel

**Escenario 2 — Cuando:**
Llega la fecha de vencimiento sin registro de pago
**Espero:**
Que el sistema cambie el estado de la obligación a "vencida" y la refleje en el dashboard

**Escenario 3 — Cuando:**
Marco una cuota como pagada
**Espero:**
Que el saldo se actualice y la obligación vuelva a estado "al día"

### DEFINICIÓN DE TERMINADO (DoD)

- ☐ Código revisado y aprobado por el equipo (code review)
- ☐ Prueba funcional ejecutada y aprobada (caso de prueba documentado)
- ☐ Evidencia visual integrada en el diario de sprint
- ☐ Criterios de aceptación verificados y marcados
- ☐ Sin deuda técnica conocida asociada a esta HU

---

## HISTORIA DE USUARIO — HU-24

**Nombre:** Evaluación de comportamiento de pago para recomendaciones
**Puntos de historia (story points):** 5
**Como (rol):** Usuario de la plataforma
**Quiero (funcionalidad):** que el sistema evalúe mi historial de pagos y mis obligaciones vigentes para ajustar las recomendaciones financieras
**Para (beneficio):** recibir sugerencias que consideren mi situación crediticia real y no solo mis gastos

### CRITERIOS DE ACEPTACIÓN

**Escenario 1 — Cuando:**
Tengo obligaciones vencidas
**Espero:**
Que el motor de recomendaciones priorice sugerencias de reordenamiento de deuda sobre sugerencias de gasto

**Escenario 2 — Cuando:**
Mi historial de pagos es consistente durante los últimos meses
**Espero:**
Que el motor lo refleje como señal positiva en el resumen de salud financiera

### DEFINICIÓN DE TERMINADO (DoD)

- ☐ Código revisado y aprobado por el equipo (code review)
- ☐ Prueba funcional ejecutada y aprobada (caso de prueba documentado)
- ☐ Evidencia visual integrada en el diario de sprint
- ☐ Criterios de aceptación verificados y marcados
- ☐ Sin deuda técnica conocida asociada a esta HU

---

Nota. Elaboración propia (2026).

## Mapeo de cobertura

| Gap de la tesis | HU que lo cierra |
|---|---|
| Administrador sin user story (líneas 304-309) | HU-19, HU-20, HU-21, HU-22 |
| Objetivo general: gestión de obligaciones crediticias | HU-23 |
| Objetivo general: evaluación financiera | HU-24 |
