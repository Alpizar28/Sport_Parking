# Tech Stack — Sistema de Reservas Sport Parking (MVP)

## 1. Objetivo
Implementar un sistema de reservas web con:
- login obligatorio para clientes
- control estricto de disponibilidad (sin dobles reservas)
- depósito del 50% usando Yappy Botón de Pago
- panel administrativo básico
- alta confiabilidad y simplicidad operativa

---

## 2. Stack propuesto (visión general)

### App Web (Frontend + Admin)
- Next.js (App Router)
- Tailwind CSS
- Componentes UI simples, sin animaciones pesadas

### Backend
- Next.js Route Handlers (API interna)
- Toda la lógica crítica vive en backend (no en cliente)

### Autenticación
- Supabase Auth
  - Clientes: registro / login obligatorio
  - Admin: login con rol ADMIN

### Base de datos
- Supabase Postgres
- Row Level Security (RLS) habilitado

### Pagos
- Yappy Comercial — Botón de Pago
- Integración por backend + webhooks
- No se almacenan datos sensibles de pago

---

## 3. Uso del MCP de Supabase (importante)

El **MCP de Supabase** se utiliza **únicamente para acelerar tareas estructurales**, no para lógica de negocio crítica.

### El MCP SÍ se usa para:
- Generación de esquemas SQL:
  - tablas
  - enums
  - índices
- Definición inicial de entidades:
  - resources
  - reservations
  - reservation_resources
  - payments
- Configuración base de Supabase Auth
- Creación de políticas RLS iniciales:
  - clientes solo acceden a sus propios datos
  - admin con acceso total

### El MCP NO se usa para:
- Cálculo de disponibilidad
- Prevención de solapamientos
- Lógica de HOLD y expiración
- Manejo de estados críticos de reservas
- Integración de pagos
- Procesamiento de webhooks de Yappy

Toda esa lógica se implementa manualmente en el backend
para garantizar consistencia y evitar errores operativos.

---

## 4. Arquitectura resultante

Supabase MCP
├─ Schema SQL (tablas, enums, índices)
├─ Auth base (usuarios y roles)
├─ RLS base
│
▼
Next.js Backend (Route Handlers)
├─ create-reservation (HOLD)
├─ check-availability
├─ start-yappy-payment
├─ yappy-webhook
├─ expire-holds (cron / scheduled job)
├─ admin actions


---

## 5. Seguridad y claves

- Frontend usa Supabase **anon key**
- Backend usa Supabase **service role key** (solo server-side)
- RLS siempre activo
- Webhooks nunca pasan por el cliente
- Ningún dato sensible de pago se guarda en la base

---

## 6. Modelo de datos mínimo (MVP)

### resources
- id
- type: FIELD | TABLE_ROW
- name
- capacity (solo para mesas)

### reservations
- id
- user_id
- type: FIELD | EVENT | TABLES_ONLY
- start_time
- end_time
- status: HOLD | PAYMENT_PENDING | CONFIRMED | CANCELLED | EXPIRED
- hold_expires_at
- total_amount
- deposit_amount

### reservation_resources
- reservation_id
- resource_id
- quantity (para mesas)

### payments
- id
- reservation_id
- provider: YAPPY
- provider_transaction_id
- amount
- status: PENDING | PAID | FAILED | REFUNDED
- created_at
- paid_at

---

## 7. Estados y lógica crítica

- Al iniciar una reserva → status = HOLD + hold_expires_at = now + 15 min
- Al iniciar pago → status = PAYMENT_PENDING
- Al recibir webhook válido de Yappy → status = CONFIRMED
- Si el HOLD expira sin pago confirmado → status = EXPIRED y se liberan recursos

Toda validación de disponibilidad ocurre en backend.

---

## 8. Panel Admin (MVP)

Implementado dentro de la misma app Next.js:
- vista por fecha / recurso
- ver estados de reservas
- cancelar reservas
- bloquear horarios
- acceso restringido a rol ADMIN

---

## 9. Hosting recomendado
- Next.js: Vercel (u otro similar)
- Supabase: Postgres + Auth + RLS gestionado

---

## 10. Fuera de alcance (MVP)
- Tarjetas de crédito
- Guardado de métodos de pago
- Reportes avanzados
- Roles complejos
- Mapas interactivos de mesas