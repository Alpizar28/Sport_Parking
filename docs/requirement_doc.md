# Requirements Doc — Sistema de Reservas Sport Parking (MVP)

## 1. Objetivo
Construir un sistema de reservas web **estable, simple y confiable** con:
- login obligatorio para clientes
- panel admin básico
- pago de depósito 50% con Yappy Botón de Pago
- prevención estricta de dobles reservas

---

## 2. Alcance del MVP

### INCLUIDO
- Registro/Login de clientes
- Reserva de recursos (2 canchas + mesas)
- Flujo de reserva por tipo
- HOLD con expiración automática
- Depósito 50% con Yappy (pago online)
- Panel admin: ver/gestionar reservas, bloquear horarios
- Notificación de confirmación en pantalla (y opcional WhatsApp/email si se decide)

### EXCLUIDO (no MVP)
- Pagos con tarjeta de crédito
- Guardado de métodos de pago
- Membresías / suscripciones
- Reportes avanzados
- Mapa interactivo de mesas
- Roles complejos (más allá de admin/cliente)
- Integraciones múltiples de canales (IG/Google) automáticas

---

## 3. Usuarios y roles

### Cliente (obligatorio login)
- Debe crear cuenta e iniciar sesión para reservar
- Solo puede ver y administrar sus propias reservas

### Admin (staff)
- Puede ver y administrar todas las reservas
- Puede bloquear horarios y ajustar recursos

---

## 4. Recursos reservables
- Cancha A
- Cancha B
- Mesas fila central 1 (capacidad fija)
- Mesas fila central 2 (capacidad fija)

Mesas:
- se reservan por cantidad
- no por posición exacta

---

## 5. Tipos de reserva (obligatorio)

### 5.1 Reserva de cancha
- Fecha
- Horario
- Cancha A o B
- Duración por bloques definidos por el sistema

### 5.2 Reserva de cumpleaños / evento
- Fecha
- Bloque horario fijo (recomendado)
- Cancha A o B
- Mesas fila 1 (cantidad)
- Mesas fila 2 (cantidad)

### 5.3 Reserva solo de mesas (opcional MVP)
- Fecha
- Bloque horario
- Mesas fila 1/2 (cantidad)

Los flujos deben estar separados.

---

## 6. Flujo de reserva (cliente)
1) Login / Registro
2) Tipo de reserva
3) Fecha
4) Horario
5) Recursos
6) Resumen + depósito 50%
7) Pago con Yappy
8) Confirmación

---

## 7. Estados y consistencia (crítico)

### Estados de horario
- AVAILABLE
- BUSY
- HOLD

### Estados de reserva
- HOLD (temporal)
- PAYMENT_PENDING
- CONFIRMED
- CANCELLED
- EXPIRED

Una reserva solo puede ser CONFIRMED si:
- el pago del depósito está confirmado por el sistema (webhook)

---

## 8. HOLD (regla crítica)
- Al iniciar la reserva se crea HOLD
- HOLD expira automáticamente (ej. 15 minutos)
- Si expira, se liberan recursos y la reserva pasa a EXPIRED
- El sistema debe impedir dobles reservas (validación backend)

---

## 9. Reglas de disponibilidad
- No se puede reservar el mismo recurso en el mismo rango de tiempo
- Mesas no pueden exceder capacidad por fila
- Un evento puede bloquear múltiples recursos (cancha + mesas)
- Validación en backend, siempre

---

## 10. Pagos (Yappy Botón de Pago)

### Reglas
- Depósito: 50% del total
- La app NO almacena datos de tarjeta ni datos sensibles
- Confirmación de pago debe ocurrir por webhook/confirmación server-side
- La reserva pasa a CONFIRMED solo con pago confirmado

### Casos de error
- Pago fallido -> reserva vuelve a disponible si HOLD expira
- Pago tardío después de expiración -> marcar para revisión admin o reintento (definir política)

---

## 11. Panel admin (MVP)
Debe permitir:
- Ver reservas por fecha y por recurso
- Ver estados (HOLD/PAYMENT_PENDING/CONFIRMED/etc.)
- Cancelar reservas
- Bloquear horarios manualmente
- Ajustar capacidad de mesas (si aplica)

No requiere:
- estadísticas, reportes, roles avanzados

---

## 12. Requisitos no funcionales
- Mobile-first
- UX rápida
- Mensajes claros
- Manejo robusto de errores
- Logs básicos de pagos y reservas

---

## 13. Seguridad
- Login obligatorio
- Acceso por rol (cliente/admin)
- No almacenar datos sensibles de pago
- Clientes solo ven sus reservas

---

## 14. Fuera de alcance explícito
Cualquier funcionalidad no descrita aquí se considera fuera del MVP.
