"use strict";

const SESION_RE = /^[A-Za-z0-9_-]{16,64}$/;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_HISTORIAL = 60;

function limpiarTexto(v, max = 500) {
  return String(v == null ? "" : v).trim().slice(0, max);
}
function limpiarNombre(v) {
  return limpiarTexto(v, 42).replace(/[\p{C}<>]/gu, "").trim();
}
function fechaValida(v) { return FECHA_RE.test(v || "") && !Number.isNaN(Date.parse(v + "T00:00:00Z")); }
function pareceComercial(t) {
  return /\b(caja(?:s)?|leche(?:s)?|yogur(?:t)?|compr(?:ar|o|a)|pedido|cotiza(?:r|ci[oó]n)|stock|inventario|descuento|precio(?:s)?|entrega(?:s)?|cr[eé]dito|cat[aá]logo|confirmo|confirmar|acepto|aprobaci[oó]n|factura|planeamiento|reposici[oó]n)\b/i.test(t);
}
function nombreDeMensaje(t) {
  const m = String(t || "").match(/\b(?:soy|me llamo|ll[aá]mame)\s+([^,.!?]{2,36})/i);
  return m ? limpiarNombre(m[1].replace(/^(?:un|una|el|la)\s+/i,"")) : "";
}
function normalizarClasificacion(v) {
  const tipo = v && v.modo === "comercial" ? "comercial" : "charla";
  return { modo: tipo, respuesta: limpiarTexto(v && v.respuesta, 700), nombre: limpiarNombre(v && v.nombre) };
}
function recortarHistorial(h) {
  return (Array.isArray(h) ? h : []).filter(x => x && typeof x === "object").slice(-MAX_HISTORIAL);
}
function filtrarAgente(nuevos) {
  return (Array.isArray(nuevos) ? nuevos : []).filter(m => m && m.rol === "agente").map(m => ({
    rol: "asesor", texto: "", bloques: Array.isArray(m.bloques) ? m.bloques : [],
    chips: Array.isArray(m.chips) ? m.chips : [], ts: m.ts || Date.now()
  }));
}
module.exports = { SESION_RE, limpiarTexto, limpiarNombre, fechaValida, pareceComercial, nombreDeMensaje, normalizarClasificacion, recortarHistorial, filtrarAgente };
