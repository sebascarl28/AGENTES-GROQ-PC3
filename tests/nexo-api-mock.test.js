"use strict";
/* Pruebas SIN Internet, SIN contraseña y SIN Supabase real. */
const test=require("node:test");
const assert=require("node:assert/strict");
const Module=require("node:module");
const rows=new Map(), calls=[];
const vista={conv:{cots:[]},tareas:[],traza:[],ultimoERP:null,seq:1};
const db={leerCatalogo:async()=>({productos:[{id_producto:"PRD-001",nombre:"UHT",presentacion:"Caja 12",precio_base_caja:"60"}],stock_lotes:[{fecha_corte:"2026-11-12",id_producto:"PRD-001",cajas:"240",estado_calidad:"LIBERADO",fecha_vencimiento:"2027-05-09"}]})};
const service={
 ejecutar:async(b)=>{calls.push(b);return {ok:true,vista,nuevos:b.op==="recibir"?[{rol:"cliente",texto:b.texto,seq:2},{rol:"agente",bloques:[{k:"p",t:"Cotización simulada"}],chips:[],seq:3}]:[]};},
 leer:async()=>({ok:true,existe:true,vista,nuevos:[]})
};
class Pool {
 async query(sql,args) {
  if (/^INSERT INTO nexo_sesiones/i.test(sql)) {if(!rows.has(args[0]))rows.set(args[0],{nombre:"",historial:[],contador:0});return {rows:[]};}
  if (/^SELECT nombre/i.test(sql))return {rows:[rows.get(args[0])]};
  if (/^UPDATE nexo_sesiones/i.test(sql)){rows.set(args[0],{nombre:args[1],historial:JSON.parse(args[2]),contador:args[3]});return {rows:[]};}
  throw Error("SQL inesperado: "+sql);
 }
 on(){}
}
const load=Module._load;
Module._load=function(r,parent,isMain){
 if(parent && parent.filename.endsWith("/api/asesor.js")) {
  if(r==="pg")return {Pool};
  if(r==="../lib/servicio")return service;
  if(r==="../lib/db")return db;
 }
 return load.call(this,r,parent,isMain);
};
const handler=require("../api/asesor");Module._load=load;
process.env.DATABASE_URL="postgresql://test@localhost/test";
process.env.GROQ_API_KEY="clave_ficticia_no_real";
const sid="pruebaSesion01234567890123";
const fecha="2026-11-12";
async function post(op,extra={}){
 let code=200,buf="";
 const req={method:"POST",body:{op,sesion:sid,fecha,cliente:"CLI-001",...extra}};
 const res={setHeader(){},set statusCode(n){code=n},get statusCode(){return code},end(x){buf=x}};
 await handler(req,res);return {status:code,...JSON.parse(buf)};
}
test("inicia sesión independiente de UI previa",async()=>{const r=await post("inicio");assert.equal(r.ok,true);assert.deepEqual(r.historial,[]);});
test("Groq responde libremente y persiste apodo",async()=>{
 const old=global.fetch;
 global.fetch=async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({modo:"charla",respuesta:"¡Hola, Oso Polar!",nombre:"Oso Polar"})}}]})});
 try{const r=await post("mensaje",{texto:"Hola, soy un oso polar"});assert.equal(r.modo,"charla");assert.equal(r.nombre,"Oso Polar");assert.equal(r.nuevos[0].texto,"¡Hola, Oso Polar!");assert.equal(rows.get(sid).historial.length,2);}finally{global.fetch=old;}
});
test("Pedido comercial usa el motor, sin saltarse controles",async()=>{
 const r=await post("mensaje",{texto:"Necesito 300 cajas de leche UHT para mañana"});
 assert.equal(r.modo,"comercial");assert.equal(calls.at(-1).op,"recibir");
 assert.equal(r.nuevos[0].bloques[0].t,"Cotización simulada");
});
test("Consulta stock muestra solo lote de demostración",async()=>{const r=await post("stock");assert.equal(r.datos.items[0].disponibles,240);assert.equal(r.datos.fecha_corte,fecha);});
test("No filtra secretos en respuesta de inicio",async()=>{const r=await post("inicio");assert.equal(JSON.stringify(r).includes(process.env.GROQ_API_KEY),false);});
