# Nexo — Asesor Comercial Inteligente (Gloria PC3)

## Qué es

Una **nueva interfaz** y un **agente conversacional** para el caso académico GE703 / PC3 de Leche Gloria. La pantalla se ve totalmente diferente del simulador original, pero las **cotizaciones, controles C0–C4, aprobaciones, reservas y pedidos simulados** siguen ejecutándose en `lib/servicio.js`, `lib/core.js` y `lib/motor.js` del repositorio existente.

- Respuesta libre y nombre recordado: Groq (`api/asesor.js`).
- Estado de conversación y apodo: tabla adicional `nexo_sesiones` en Supabase.
- Cotizaciones, ERP y trazabilidad: el motor original (NO se salta ningún control).
- Interfaz nueva: `public/asesor.html`, `public/nexo.css`, `public/nexo.js`.
- No se usa la API de Groq para inventar stock, autorizar descuentos ni crear pedidos.
- Todo es **sintético y académico**: no es un sitio oficial de Gloria ni conecta a SAP real.

## 1. Crear rama para no romper main

En [GitHub — AGENTES-GROQ-PC3](https://github.com/sebascarl28/AGENTES-GROQ-PC3):

1. Arriba a la izquierda, donde dice `main`, haz clic.
2. Escribe `asesor-inteligente`.
3. Crea la rama desde `main` (Create branch...).
4. Verifica que arriba diga `asesor-inteligente`, **no** `main`.

## 2. Subir los archivos

Descomprime el ZIP. Sube el **contenido** de la carpeta, conservando estas rutas **exactas** en la raíz de tu repositorio:

```
api/asesor.js                     ← NUEVO
lib/nexo-utils.js                 ← NUEVO
public/asesor.html               ← NUEVO
public/nexo.css                  ← NUEVO
public/nexo.js                   ← NUEVO
supabase/asesor_setup.sql        ← NUEVO
GUIA_PARA_SUBIR_A_GITHUB.md      ← NUEVO
PRUEBAS_PC3_NEXO.md              ← NUEVO
tests/nexo-utils.test.js         ← NUEVO (opcional)
tests/nexo-api-mock.test.js      ← NUEVO (opcional)
```

**No borres ni reemplaces** los archivos antiguos (`public/index.html`, `lib/core.js`, `lib/db.js`, etc.).

**Desde la web de GitHub:** estando en tu rama, usa `Add file → Upload files` y arrastra los archivos/carpetas descomprimidos (no subas el ZIP cerrado). Revisa que los nombres queden en las rutas correctas antes de `Commit changes`. Si GitHub no conserva las carpetas al arrastrar, usa `Add file → Create new file`, escribe la ruta completa (ejemplo `api/asesor.js`) y pega el contenido del archivo descargado. Repite con los cinco archivos funcionales y el SQL.

Mensaje de commit recomendado: `feat: nuevo asesor Nexo con Groq y casos PC3`.

## 3. Cargar SOLO el complemento SQL en Supabase

1. Abre tu proyecto `agente-gloria-pc3` en Supabase.
2. Entra a `SQL Editor → New query`.
3. Pega **solo** `supabase/asesor_setup.sql`, y pulsa `Run`.
4. Confirma que en el resultado aparecen **PRD-001, 240 cajas, 60 de reposición, 2026-11-19**.

**Advertencia:** NO vuelvas a ejecutar `supabase/schema.sql`, porque ese archivo original contiene `DROP TABLE` y borraría sesiones y datos de la demostración previa. El nuevo SQL es complementario e idempotente en sus inserciones. **Aviso:** agrega una foto de stock nueva para el 12/11/2026 en la tabla compartida `stock_lotes`; por eso, aunque la versión vieja siga publicada, si la pruebas con esa fecha podrá consultar la foto nueva de UHT (240 en lugar de 250). Si necesitas aislamiento total de datos, usa un proyecto Supabase separado para la nueva versión.

## 4. Vercel: variables y preview

Ya tienes el proyecto Vercel conectado al GitHub. Cuando haces commit en la rama `asesor-inteligente`, Vercel suele crear un **Preview Deployment** para ella.

Verifica en `Project → Settings → Environment Variables` que también estén habilitadas para **Preview**:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Tu conexión privada Supabase Transaction Pooler (contraseña URL-encoded) |
| `GROQ_API_KEY` | Tu API key privada de Groq |
| `GROQ_MODEL` | `openai/gpt-oss-120b` |

No pegues estas claves en GitHub. Si cambias la configuración, vuelve a desplegar la rama.

Abre el enlace del despliegue Preview y añade **`/asesor.html`** al final. Ejemplo **NO real**: `https://tu-preview.vercel.app/asesor.html`.

En producción, cuando integres la rama (opcional), estará disponible en `https://agentes-groq-pc3.vercel.app/asesor.html`. La pantalla original sigue en `/`.

## 5. Probar

Primero escribe `Hola, soy un oso polar`. Nexo debe responder libremente y recordar el apodo en esta sesión; al recargar la página debe conservar la conversación.

Después usa los botones **Pruebas PC3** (derecha). Cada botón reinicia la sesión comercial:

1. **Pedido normal**: 100 cajas UHT, cotización aceptable, confirma con el botón.
2. **Falta stock**: 300 cajas UHT, 240 liberadas el 12/11/2026 + 60 con orden **OP-UHT-1911** y reposición **19/11/2026**; acepta o rechaza la entrega fraccionada.
3. **Descuento 8 %**: crea aprobación pendiente; entra a `Aprobaciones`, aprueba o rechaza manualmente y vuelve al chat.

Las fechas son **fijas de demostración**; el selector de fecha del panel comienza en `2026-11-12`. Si la cambias, la foto de stock seleccionada puede variar.

Usa `Trazabilidad` y `Descargar bitácora CSV` para tus evidencias.

## 6. Si algo falla

| Síntoma | Qué revisar |
|---|---|
| `Error ... nexo_sesiones does not exist` | No ejecutaste `asesor_setup.sql` en el mismo proyecto Supabase |
| Error 500 al iniciar | En Vercel Logs, revisa `DATABASE_URL` y si variables están en Preview |
| Groq no responde | Revisa `GROQ_API_KEY` en Preview, cuota gratuita, Logs. El sistema puede usar reglas si Groq falla; eso **no** equivale a confirmar que actuó la IA. |
| Falta un archivo /404 | Confirma que existe `public/asesor.html` y `api/asesor.js` en **esa rama** |
| Escenario 300/240/60 no aparece | Verifica `asesor_setup.sql` y la **fecha** `2026-11-12`. Revisa `Trazabilidad → C4`. |
| Aparece la pantalla antigua | Visita la nueva ruta **`/asesor.html`**, no la raíz `/` |
| No se ve la nueva interfaz | Confirma que subiste también `public/nexo.css` y `public/nexo.js` |

## 7. Qué se reutiliza

Conserva en el repositorio original: `api/op.js`, `api/estado.js`, `api/clientes.js`, `api/bitacora.js`, `lib/core.js`, `lib/motor.js`, `lib/servicio.js`, `lib/db.js`, `lib/llm.js`, `package.json` y `vercel.json`.

El nuevo backend necesita la dependencia `pg`, que **ya está** en el `package.json` actual. No tienes que instalar LangChain.

## 8. Limitaciones y ética

- No es acceso a SAP real; simula ERP (C0–C4), CRM y Planeamiento (PP-PI).
- Stock y reservas se calculan por sesión con fotos sintéticas; no representa inventario global multiusuario ni promete disponibilidad real.
- La fecha de reposición de 60 cajas es **sintética**, no un dato verificado de Leche Gloria.
- Las decisiones de Jefatura se registran al pulsar Aprobar/Rechazar en la demo; no hay autenticación de directivos reales.
- Es un demo público: usa solo datos inventados, no datos reales de clientes o secretos personales. Groq recibe los textos que el usuario escribe.
- No afirmes que Groq aprobó un crédito o negoció por sí mismo: la autoridad sigue en el motor y en el humano.
- La conversación social guarda un historial limitado en la base. Revisa límites y evita spam porque las cuotas de Groq son finitas.

## Comprobación rápida opcional en tu PC

Con Node.js 20+, en la raíz del repositorio:

```bash
node --check api/asesor.js
node --check lib/nexo-utils.js
node --check public/nexo.js
node --test tests/*.test.js
```
