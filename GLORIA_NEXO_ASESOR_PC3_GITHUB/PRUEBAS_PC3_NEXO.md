# Guion de demostración (GE703 PC3) — Nexo

## Antes de exponer

- [ ] Despliegue Preview de la rama `asesor-inteligente` funcionando.
- [ ] SQL complementario aplicado en Supabase; foto UHT de 12/11/2026 = 240 liberadas + 60 programadas 19/11/2026.
- [ ] Environment Variables `GROQ_API_KEY`, `GROQ_MODEL`, `DATABASE_URL` activadas para Preview.
- [ ] Fecha en pantalla 12/11/2026, cliente La Alameda (`CLI-001`).
- [ ] Reiniciar entre escenarios para no contaminar el estado de stock/reservas de la sesión anterior.

## Caso cero: demostrar conversación natural (30 s)

Usuario: `Hola, soy Oso Polar. ¿Cómo estás?`

Esperado: respuesta cálida de Nexo y apodo recordado. En la demo, aclara que Groq genera conversación y el ERP **no participa** en saludos o bromas. No es necesario entrenar un modelo.

## Caso 1: operación normal (1 minuto)

Pulsa **01 Pedido normal**.

Mensaje de prueba: `Quiero 100 cajas de leche UHT Gloria entera para mañana`.

Esperado:
1. Groq extrae producto PRD-001, 100 cajas, fecha solicitada 13/11/2026.
2. CRM genera cotización con precio y total IGV desde datos sintéticos.
3. ERP simulado evalúa C0 (trazabilidad), C1 (cliente), C2 (descuento/margen), C3 (crédito), C4 (disponibilidad).
4. Usuario pulsa **Confirmo**; se crea un ID de pedido **simulado** y reserva **en sesión**.
5. Evidencia: cotización, estado del ERP, traza y bitácora.

## Caso 2: excepción de inventario 300/240/60 (2 minutos)

Pulsa **02 Faltante de inventario**.

Mensaje de prueba: `Necesito 300 cajas de leche UHT Gloria entera para mañana`.

Esperado:
1. ERP verifica que hay 240 cajas liberadas por Calidad de PRD-001, foto de stock 12/11/2026.
2. Detecta faltante de 60 (C4 NO_CUMPLE). No inventa disponibilidad.
3. Consulta reposición **sintética** `OP-UHT-1911`, 60 cajas para 19/11/2026.
4. El sistema devuelve **PROMESA_ALTERNATIVA**: 240 cajas para 13/11 y 60 para 19/11. Sin aceptación **no** hay pedido.
5. Usuario pulsa **Acepto la entrega en dos momentos** (o prueba rechazo).
6. Tras aceptar, genera pedido simulado y deja trazabilidad de reserva y compromiso de reposición.

Aclaración importante al profesor: fecha y cantidades fueron definidas como **supuestos de prueba**, no vienen de SAP de Gloria. La simulación de Planeamiento usa datos de la tabla `stock_lotes`; en una implementación real PP-PI sería la fuente de la fecha.

## Caso 3: excepción que requiere persona (1.5 minutos)

Pulsa **03 Aprobación humana**.

Mensaje de prueba: `Necesito 150 cajas de leche UHT Gloria entera con 8 % de descuento para mañana`.

Esperado:
1. El agente puede proponer hasta 5 % por su propia facultad; 8 % requiere Jefatura.
2. Crea solicitud en **Bandeja**: descuento 8 %, pendiente.
3. Persona operadora elige Aprobar 8 % o Rechazar y queda evidencia.
4. El agente reemite una cotización aprobada si la decisión y los márgenes cumplen las reglas.
5. El usuario puede confirmar el pedido; se revalidan los controles en el ERP.

## Frase de cierre

> Nexo usa Groq para interpretar el lenguaje libre y conversar naturalmente, pero no le cedemos decisiones comerciales críticas. El ERP simulado valida los controles C0–C4 y toda excepción fuera de facultad se escala a una persona. El sistema conserva traza y bitácora para justificar cada decisión.
