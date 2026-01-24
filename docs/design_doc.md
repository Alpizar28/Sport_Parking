# Design Doc — Sistema de Reservas Sport Parking (MVP)

## 1. Propósito del diseño
Diseñar la interfaz de un **sistema de reservas web funcional, rápido y confiable** para un complejo deportivo.
La UI debe priorizar **claridad operativa, facilidad de uso y estabilidad**, no marketing.

Este documento define **cómo se ve y cómo se usa** el sistema (UX/UI), no la implementación.

---

## 2. Principios de diseño (obligatorios)
- Funcionalidad > estética
- Claridad > animaciones
- Estados visibles > adornos
- Flujos cortos (máx. 6 pantallas, incluyendo login)
- Feedback inmediato ante errores
- “No falla nunca”: diseño simple, sin dependencias visuales frágiles

Si una decisión visual no mejora claridad o confiabilidad, se descarta.

---

## 3. Personalidad visual
- Deportiva
- Profesional
- Sólida
- Directa

No es: infantil, caricaturesca, experimental, “startup marketing”.

---

## 4. Público objetivo
- Jóvenes y equipos que reservan cancha
- Padres que reservan cumpleaños infantiles
- Academias deportivas
- Empresas

Uso principal desde **móvil**, sin excluir desktop.

---

## 5. Recursos físicos (modelo visual)
Recursos reservables:
- Cancha A
- Cancha B
- Mesas fila central 1 (cantidad limitada)
- Mesas fila central 2 (cantidad limitada)

Mesas:
- recursos compartidos
- se reservan por cantidad
- no se asignan por posición exacta

---

## 6. Tipos de reserva (UI)
La UI debe separar flujos:
1) Reserva de cancha  
2) Reserva de cumpleaños / evento  
3) Reserva solo de mesas (opcional)

No usar un formulario único genérico.

---

## 7. Flujo de pantallas (UX)

### Pantalla 0 — Acceso (obligatorio)
- Login / Registro (cliente)
- Debe ser rápido y claro
- Después del login, volver al flujo donde estaba

---

### Pantalla 1 — Tipo de reserva
Opciones:
- Cancha
- Cumpleaños / Evento
- Mesas

Una decisión por pantalla.

---

### Pantalla 2 — Fecha
Selector simple (hoy y próximos días visibles).

---

### Pantalla 3 — Horario
Bloques claros con estados:
- Disponible
- Ocupado
- En proceso (hold)

Color solo para estado.

---

### Pantalla 4 — Recursos
Según tipo:
**Cancha**
- Cancha A o B

**Evento**
- Cancha A o B
- Mesas fila 1 (contador)
- Mesas fila 2 (contador)

No mapas, no drag & drop.

---

### Pantalla 5 — Resumen y depósito
- Resumen claro (fecha, hora, recursos)
- Precio total
- Depósito (50%)
- CTA: “Pagar depósito con Yappy”

---

### Pantalla 6 — Resultado
- Confirmación (reserva confirmada) o error (pago fallido/expiró)
- Mensaje claro y acción siguiente

---

## 8. Lineamientos visuales (UI)
- Sobrio y profesional
- Componentes grandes y claros
- Cards rectangulares
- Botones grandes (táctil)
- Tipografía legible y fuerte

Color (conceptual):
- Verde: disponible / confirmado
- Amarillo: CTA principal
- Gris: ocupado / deshabilitado
Fondo neutro (claro o oscuro suave). No saturar con verde.

---

## 9. Componentes clave
- Login / registro
- Cards de selección
- Selector de fecha
- Selector de horarios por bloques
- Contadores numéricos (mesas)
- Resumen de reserva
- Estados explícitos (texto + color)

---

## 10. Accesibilidad y mobile-first
- Mobile-first real
- Texto legible sin zoom
- Inputs fáciles de tocar
- Mensajes de error claros (qué pasó y qué hacer)

---

## 11. Sistema de diseño
Construir UI con tokens (sin hardcode):
- color.background/surface/text/success/warning/muted
- spacing.sm/md/lg
- radius.sm/md/lg
- font.heading/body

---

## 12. Qué NO debe hacer el diseño
- No animaciones innecesarias
- No diseño marketing
- No mapas interactivos de mesas
- No copys largos
- No flows ambiguos (cada pantalla debe decidir una cosa)

---

## 13. Resultado esperado
Debe sentirse como:
> “Un sistema serio que funciona todos los días sin fallar.”
