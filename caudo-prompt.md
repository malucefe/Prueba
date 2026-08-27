# 🧾 Prompt: Aplicación Web de Finanzas Personales con IA — *Caudo*

---

## ROL Y CONTEXTO

Eres un arquitecto de software senior y experto en desarrollo full-stack. Tu tarea es diseñar e implementar **Caudo**, una aplicación web de finanzas personales con inteligencia artificial orientada al consumidor colombiano. La aplicación debe permitir registrar ingresos y gastos, identificar patrones de comportamiento financiero y ofrecer recomendaciones personalizadas de forma asíncrona.

---

## STACK TECNOLÓGICO OBLIGATORIO

| Capa | Tecnología |
|---|---|
| Frontend | Angular (última versión estable) |
| Backend | NestJS |
| Base de datos | PostgreSQL |
| Orquestador IA / Automatización | n8n |
| Autenticación | JWT (JSON Web Tokens) |
| Archivos adjuntos | Fotos y PDF (carga desde el frontend) |

---

## MÓDULOS A IMPLEMENTAR

### 1. Gestión de Usuarios
- Registro, login y gestión de perfil
- Autenticación y autorización con JWT
- Guards de rutas en Angular y guards/decorators en NestJS

### 2. Módulo de Finanzas
- Registro manual de transacciones (ingresos y egresos)
- Campos requeridos: fecha, monto, categoría, descripción
- Carga de archivos adjuntos (foto de recibo o PDF de extracto)
- CRUD completo de transacciones

### 3. Motor de Inteligencia (n8n)
- Flujos de trabajo que se disparan cuando se registran nuevas transacciones
- Identificación de patrones de gasto por categoría y periodo
- Generación de recomendaciones financieras asíncronas basadas en reglas de lógica financiera
- Las recomendaciones se almacenan en PostgreSQL y se consumen desde el frontend vía polling o WebSocket

### 4. Dashboard y Visualización
- Gastos por categoría (gráfico de torta / barras)
- Balance mensual (ingresos vs egresos)
- Cumplimiento de metas financieras
- Panel de recomendaciones generadas por IA

---

## ARQUITECTURA ESPERADA

```
[Angular Frontend]
      │
      ▼ HTTP / REST + JWT
[NestJS Backend API]
      │
      ├──▶ [PostgreSQL] — datos de usuarios, transacciones, metas, recomendaciones
      │
      └──▶ [n8n Webhook] — recibe eventos de nuevas transacciones
                │
                └──▶ Procesa patrones → escribe recomendaciones → notifica al backend
```

- Arquitectura de **capas** en NestJS: módulos, controladores, servicios, repositorios
- Frontend Angular con **arquitectura de features** (módulo por dominio: auth, finanzas, dashboard, perfil)
- n8n actúa como **núcleo de lógica inteligente**, desacoplado del backend principal

---

## MODELO DE DATOS (esquema base en PostgreSQL)

Define al menos las siguientes entidades con sus relaciones:

- `users` — id, nombre, email, password_hash, created_at
- `transactions` — id, user_id, tipo (ingreso/egreso), monto, categoría, descripción, fecha, archivo_url
- `categories` — id, nombre, tipo (ingreso/egreso), icono
- `goals` — id, user_id, nombre, monto_objetivo, monto_actual, fecha_limite
- `recommendations` — id, user_id, contenido, tipo, leída, created_at

---

## FLUJO DE n8n A IMPLEMENTAR

Diseña un flujo en n8n que:

1. Se active mediante un **Webhook** que el backend llama al crear una transacción
2. Consulte las últimas N transacciones del usuario desde PostgreSQL
3. Evalúe reglas como:
   - Gasto en una categoría > X% del ingreso mensual → recomendar reducción
   - Sin ahorro registrado en el mes → recomendar meta de ahorro
   - Gasto recurrente identificado → alertar sobre suscripciones
4. Escriba la recomendación resultante en la tabla `recommendations`
5. Opcionalmente, notifique al backend vía HTTP para activar un evento en tiempo real

---

## PLAN DE PRUEBAS

- **Pruebas funcionales (caja negra):** validar cada endpoint del backend (registro, login, CRUD transacciones, carga de archivos, consulta de recomendaciones)
- **Pruebas de usabilidad:** validar los flujos principales del usuario en el frontend (registro → primera transacción → ver dashboard → leer recomendación)
- **Herramientas sugeridas:** Postman/Insomnia para API, Cypress o Playwright para E2E en Angular

---

## ENTREGABLES ESPERADOS

1. Código fuente completo y funcional (Angular + NestJS + configuración n8n exportada)
2. Scripts SQL de creación de base de datos y datos semilla (seed)
3. Manual técnico: instalación local paso a paso (Docker Compose recomendado)
4. Manual de usuario final con capturas de pantalla
5. Entorno de pre-producción operativo (local con Docker Compose o deployment en VPS)

---

## RESTRICCIONES Y CONSIDERACIONES

- El contexto del usuario objetivo es el **consumidor colombiano**: considerar categorías relevantes como transporte (TransMilenio, gasolina), alimentación, arriendo, servicios públicos, entretenimiento
- Todos los montos deben manejarse en **pesos colombianos (COP)**
- El sistema debe funcionar correctamente **sin conexión a modelos de LLM externos** en su versión base (la IA se basa en reglas dentro de n8n); la integración con LLM puede ser una mejora futura opcional
- El diseño del frontend debe ser **mobile-friendly** (responsive), pensado para uso desde celular
