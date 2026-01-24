# API Contract — Sistema de Reservas Sport Parking (MVP)

Este documento define el **contrato API** entre:
- Cliente Web (frontend)
- Backend (Next.js Route Handlers)
- Supabase (Auth + DB)
- Yappy Botón de Pago (pagos + webhooks)

**Objetivo:** consistencia, evitar dobles reservas, y confirmar reservas **solo** con pago confirmado.

---

## 0. Convenciones globales

### 0.1 Base URL
- Producción: `https://<tu-dominio>`
- API: `https://<tu-dominio>/api`

### 0.2 Formato
- `Content-Type: application/json`
- Fechas y horas en ISO-8601 **UTC**:
  - Ej: `"2026-01-23T20:00:00Z"`

### 0.3 Autenticación
- Cliente (usuario final): **Supabase Auth**
  - El frontend incluye el `access_token` (JWT) en:
    - `Authorization: Bearer <token>`
- Admin: mismo mecanismo, pero backend valida rol `ADMIN`.

> Nota: El backend puede validar el JWT con Supabase y aplicar reglas adicionales.  
> La DB debe tener **RLS** para reforzar seguridad.

### 0.4 Idempotencia
Todos los endpoints mutables (crear hold, crear pago, cancelar, etc.) aceptan:
- Header opcional: `Idempotency-Key: <uuid|string-unique>`

El backend debe evitar duplicados si recibe la misma key en una ventana de tiempo razonable (ej. 24h) para el mismo usuario.

### 0.5 Respuesta de error estándar
En caso de error, el backend retorna:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Mensaje legible",
    "details": { "optional": "..." }
  }
}
1. Modelo de datos (conceptual)
1.1 Enums
ReservationType

FIELD

EVENT

TABLES_ONLY

ReservationStatus

HOLD

PAYMENT_PENDING

CONFIRMED

CANCELLED

EXPIRED

ResourceType

FIELD

TABLE_ROW

PaymentProvider

YAPPY

PaymentStatus

PENDING

PAID

FAILED

REFUNDED

2. Reglas de negocio críticas
2.1 HOLD
Al iniciar una reserva se crea un registro HOLD.

hold_expires_at = now + HOLD_MINUTES (recomendado 15).

Un HOLD bloquea disponibilidad temporalmente.

Si expira sin pago confirmado:

reserva -> EXPIRED

recursos se liberan

2.2 Confirmación
Una reserva solo puede pasar a CONFIRMED si:

existe un pago PAID asociado (depósito 50%)

confirmado por webhook válido de Yappy

2.3 Recursos
Recursos reservables:

Cancha A (FIELD)

Cancha B (FIELD)

Mesas fila 1 (TABLE_ROW, capacity N)

Mesas fila 2 (TABLE_ROW, capacity N)

Mesas se reservan por cantidad, no por posición exacta.

2.4 Conflictos
No se permite doble reserva del mismo recurso en el mismo rango de tiempo.

Para mesas: suma de cantidades reservadas en el rango <= capacity.

3. Endpoints — Cliente (autenticado)
3.1 Obtener disponibilidad
GET /api/availability

Devuelve disponibilidad por fecha para recursos y tipos de reserva.

Auth: requerido (cliente logueado)
Query params:

date (required): YYYY-MM-DD

type (optional): FIELD|EVENT|TABLES_ONLY

tz (optional): IANA timezone (ej. America/Panama) — si se omite, backend asume una por defecto del proyecto.

Response 200

{
  "date": "2026-01-23",
  "tz": "America/Panama",
  "resources": [
    {
      "resource_id": "field_a",
      "type": "FIELD",
      "name": "Cancha A",
      "slots": [
        { "start": "2026-01-23T18:00:00Z", "end": "2026-01-23T19:00:00Z", "status": "AVAILABLE" },
        { "start": "2026-01-23T19:00:00Z", "end": "2026-01-23T20:00:00Z", "status": "BUSY" },
        { "start": "2026-01-23T20:00:00Z", "end": "2026-01-23T21:00:00Z", "status": "HOLD" }
      ]
    },
    {
      "resource_id": "tables_row_1",
      "type": "TABLE_ROW",
      "name": "Mesas Fila 1",
      "capacity": 8,
      "availability": [
        { "start": "2026-01-23T18:00:00Z", "end": "2026-01-23T21:00:00Z", "available_qty": 5 }
      ]
    }
  ],
  "rules": {
    "hold_minutes": 15,
    "event_blocks": [
      { "label": "2 horas", "duration_minutes": 120 },
      { "label": "3 horas", "duration_minutes": 180 }
    ],
    "field_durations": [60, 90, 120]
  }
}
Errores

400 INVALID_DATE

401 UNAUTHORIZED

3.2 Crear reserva en HOLD
POST /api/reservations/hold

Crea una reserva en estado HOLD y bloquea recursos temporalmente.

Auth: requerido (cliente logueado)
Headers:

Idempotency-Key (recomendado)

Request body

{
  "type": "FIELD",
  "start": "2026-01-23T20:00:00Z",
  "end": "2026-01-23T21:00:00Z",
  "resources": [
    { "resource_id": "field_a", "quantity": 1 }
  ],
  "customer_note": "Opcional: observaciones"
}
Para EVENT:

{
  "type": "EVENT",
  "start": "2026-01-23T20:00:00Z",
  "end": "2026-01-23T23:00:00Z",
  "resources": [
    { "resource_id": "field_b", "quantity": 1 },
    { "resource_id": "tables_row_1", "quantity": 4 },
    { "resource_id": "tables_row_2", "quantity": 2 }
  ]
}
Response 201

{
  "reservation": {
    "id": "res_123",
    "user_id": "user_abc",
    "type": "FIELD",
    "status": "HOLD",
    "start": "2026-01-23T20:00:00Z",
    "end": "2026-01-23T21:00:00Z",
    "hold_expires_at": "2026-01-23T20:15:00Z",
    "total_amount": 40.00,
    "deposit_amount": 20.00,
    "resources": [
      { "resource_id": "field_a", "quantity": 1 }
    ]
  }
}
Errores

400 INVALID_RANGE (end <= start)

400 INVALID_TYPE

400 INVALID_RESOURCE

400 INVALID_QUANTITY

401 UNAUTHORIZED

409 NOT_AVAILABLE (conflicto de disponibilidad)

422 RULE_VIOLATION (ej. duración no permitida)

Reglas

La validación de disponibilidad ocurre server-side y debe ser atómica (transacción).

Si el hold ya existe por idempotencia, devolver el mismo reservation.

3.3 Obtener mi reserva por ID
GET /api/reservations/{reservation_id}

Auth: requerido (cliente logueado)
Response 200

{
  "reservation": {
    "id": "res_123",
    "type": "FIELD",
    "status": "PAYMENT_PENDING",
    "start": "2026-01-23T20:00:00Z",
    "end": "2026-01-23T21:00:00Z",
    "hold_expires_at": "2026-01-23T20:15:00Z",
    "total_amount": 40.00,
    "deposit_amount": 20.00,
    "resources": [
      { "resource_id": "field_a", "quantity": 1 }
    ],
    "payment": {
      "provider": "YAPPY",
      "status": "PENDING"
    }
  }
}
Errores

401 UNAUTHORIZED

403 FORBIDDEN (si intenta leer reserva de otro usuario)

404 NOT_FOUND

3.4 Listar mis reservas
GET /api/reservations/me

Auth: requerido
Query params (opcionales):

from: ISO

to: ISO

status: ReservationStatus

Response 200

{
  "reservations": [
    { "id": "res_123", "type": "FIELD", "status": "CONFIRMED", "start": "...", "end": "..." }
  ]
}
3.5 Iniciar pago con Yappy (crear orden/checkout)
POST /api/payments/yappy/create

Crea el intento de pago del depósito para una reserva en HOLD o PAYMENT_PENDING.

Auth: requerido
Headers:

Idempotency-Key (recomendado)

Request

{
  "reservation_id": "res_123"
}
Response 201

{
  "payment": {
    "id": "pay_456",
    "provider": "YAPPY",
    "status": "PENDING",
    "amount": 20.00
  },
  "checkout": {
    "redirect_url": "https://<yappy-checkout-url>",
    "expires_at": "2026-01-23T20:15:00Z"
  }
}
Errores

401 UNAUTHORIZED

403 FORBIDDEN

404 RESERVATION_NOT_FOUND

409 RESERVATION_EXPIRED

409 RESERVATION_NOT_HOLD (si no está en estado permitido)

409 PAYMENT_ALREADY_PAID

422 YAPPY_NOT_CONFIGURED (si faltan credenciales)

502 PAYMENT_PROVIDER_ERROR

Reglas

Si la reserva está HOLD, el backend puede pasarla a PAYMENT_PENDING.

El redirect_url debe expirar no después del hold_expires_at.

Reintentos con misma idempotency-key deben devolver el mismo checkout si sigue vigente.

4. Endpoints — Admin (autenticado y autorizado)
4.1 Listar reservas por fecha
GET /api/admin/reservations

Auth: requerido (rol ADMIN)
Query:

date (required): YYYY-MM-DD

resource_id (optional)

status (optional)

Response 200

{
  "date": "2026-01-23",
  "reservations": [
    {
      "id": "res_123",
      "user_id": "user_abc",
      "type": "EVENT",
      "status": "CONFIRMED",
      "start": "...",
      "end": "...",
      "resources": [
        { "resource_id": "field_a", "quantity": 1 },
        { "resource_id": "tables_row_1", "quantity": 4 }
      ],
      "payment_status": "PAID"
    }
  ]
}
Errores

401 UNAUTHORIZED

403 FORBIDDEN

4.2 Cancelar reserva
POST /api/admin/reservations/{reservation_id}/cancel

Auth: ADMIN
Request

{
  "reason": "Motivo opcional"
}
Response 200

{
  "reservation": {
    "id": "res_123",
    "status": "CANCELLED"
  }
}
Errores

401 UNAUTHORIZED

403 FORBIDDEN

404 NOT_FOUND

409 INVALID_STATE_TRANSITION

Reglas

Si está CONFIRMED y ya pagó, la política de reembolso queda fuera del MVP (o marcar para manejo manual).

4.3 Bloquear horarios (admin blocks)
POST /api/admin/blocks

Crea un bloqueo administrativo para mantenimiento/torneo, etc.

Auth: ADMIN
Request

{
  "start": "2026-01-23T22:00:00Z",
  "end": "2026-01-24T02:00:00Z",
  "resources": [
    { "resource_id": "field_b", "quantity": 1 }
  ],
  "note": "Torneo"
}
Response 201

{
  "block": {
    "id": "blk_1",
    "start": "...",
    "end": "...",
    "resources": [{ "resource_id": "field_b", "quantity": 1 }]
  }
}
Errores

401 UNAUTHORIZED

403 FORBIDDEN

409 NOT_AVAILABLE (si choca con reservas confirmadas; política: no permitir o requerir cancelación previa)

5. Webhooks — Yappy
5.1 Webhook receptor
POST /api/webhooks/yappy

Auth: no (es externo), pero debe validarse:

firma / secret / token (según especificación de Yappy)

idempotencia por provider_event_id o provider_transaction_id

Request (conceptual)

El payload real depende de Yappy. El backend debe mapearlo a:

provider_transaction_id

amount

status

reservation_id (ideal: en metadata o referencia)

event_id (si existe)

Response 200

{ "ok": true }
Errores

400 INVALID_SIGNATURE

400 INVALID_PAYLOAD

404 RESERVATION_NOT_FOUND

409 AMOUNT_MISMATCH

409 RESERVATION_EXPIRED

409 ALREADY_PROCESSED (evento duplicado)

500 INTERNAL_ERROR (reintento del proveedor esperado)

Reglas críticas del webhook

Validar firma/secret antes de tocar DB.

Ser idempotente: el mismo evento no debe confirmar 2 veces.

Confirmar que:

amount == deposit_amount

currency (si aplica) coincide

Transición:

PAYMENT_PENDING/HOLD -> CONFIRMED solo si pago es PAID

Si llega pago después de hold_expires_at:

Marcar para revisión admin o aplicar política definida (MVP recomendado: marcar conflicto y no auto-confirmar).

6. Cron / Jobs (backend)
6.1 Expirar holds
Job interno (no endpoint público): corre cada 1–5 minutos

encuentra reservas HOLD o PAYMENT_PENDING con hold_expires_at < now

set status = EXPIRED (si no tienen pago PAID)

libera disponibilidad (por estado)

Nota: La disponibilidad se deriva de reservas + blocks en DB, por lo que “liberar” suele ser solo cambiar status.

7. Estados permitidos (máquina de estados)
7.1 Reservation transitions
HOLD -> PAYMENT_PENDING (al iniciar pago)

HOLD -> EXPIRED (job)

PAYMENT_PENDING -> CONFIRMED (webhook pago PAID)

PAYMENT_PENDING -> EXPIRED (job)

CONFIRMED -> CANCELLED (admin)

HOLD|PAYMENT_PENDING -> CANCELLED (admin, opcional)

Transiciones inválidas deben devolver:

409 INVALID_STATE_TRANSITION

8. Códigos de error (catálogo mínimo)
UNAUTHORIZED (401)

FORBIDDEN (403)

NOT_FOUND (404)

INVALID_DATE (400)

INVALID_RANGE (400)

INVALID_TYPE (400)

INVALID_RESOURCE (400)

INVALID_QUANTITY (400)

RULE_VIOLATION (422)

NOT_AVAILABLE (409)

RESERVATION_EXPIRED (409)

RESERVATION_NOT_HOLD (409)

PAYMENT_ALREADY_PAID (409)

PAYMENT_PROVIDER_ERROR (502)

INVALID_SIGNATURE (400)

AMOUNT_MISMATCH (409)

ALREADY_PROCESSED (409)

9. Logging y auditoría (mínimo recomendado)
Backend debe registrar:

creación de HOLD

conflictos de disponibilidad (NOT_AVAILABLE)

creación de pago (checkout)

eventos de webhook (con resultado)

expiraciones automáticas de HOLD

10. Notas de implementación (no negociables)
Validación de disponibilidad y creación de HOLD deben ser atómicas (transacción).

Webhook debe ser idempotente y seguro.

UI nunca asume pago confirmado hasta que backend indique CONFIRMED.

Cliente siempre autenticado para reservar (login obligatorio).