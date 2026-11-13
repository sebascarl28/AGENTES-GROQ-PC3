/* NEXO: interfaz nueva e independiente. No expone GROQ_API_KEY ni DATABASE_URL. */
(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const client = $("#cliente"), date = $("#fecha"), messages = $("#mensajes");
  const form = $("#form"), input = $("#texto"), sendButton = $("#enviar");
  const panel = $("#panel");
  const st = { sesion: getSession(), historial: [], vista: null, nombre: "", busy: false, panel: "summary", online: false, stock: null };
  const DEMO_DATE = "2026-11-12";

  function getSession() {
    const key = "nexo_sesion_pc3";
    let id = null;
    try {id = localStorage.getItem(key);} catch (_) {}
    if (!id || !/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
      id = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID().replace(/-/g, "") : "nexo" + String(Date.now()) + "xxxxxxxxxxxxxxxx";
      try {localStorage.setItem(key, id);} catch (_) {}
    }
    return id;
  }
  function node(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = String(text);
    return e;
  }
  const append = (parent, ...items) => {for (const i of items) if(i) parent.appendChild(i);return parent;};
  function para(text, cls="") { return node("p", cls, text); }
  const soles = n => "S/ " + (Number(n)||0).toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2});
  function time(ts) { return new Date(ts || Date.now()).toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"}); }
  function shortDate(d) {if(!d) return "—";return String(d).slice(8,10)+"/"+String(d).slice(5,7)+"/"+String(d).slice(0,4);}
  function setBusy(v) { st.busy=v;sendButton.disabled=v;input.disabled=v;$("#typing").hidden=!v; }
  function showStatus(ok,text) {st.online=ok;$("#onlineState").textContent=text;}
  function setView(v) {if(v){st.vista=v;renderPanel();const n=(v.tareas||[]).filter(t=>t.estado==="PENDIENTE").length;$("#sideBadge").textContent=n;$("#tabBadge").textContent=n;}}
  function btn(label,onClick,cls="") {const b=node("button",cls,label);b.type="button";b.addEventListener("click",onClick);return b;}

  function renderBlock(b) {
    if(!b || !b.k) return null;
    if(b.k==="p") return b.t ? para(b.t):null;
    if(b.k==="espera") return node("div","info-pill",(b.rol||"Pendiente")+" · "+(b.texto||"Revisión humana"));
    if(b.k==="cot") {
      const div=node("div","quote-card"),head=node("div","quote-head");
      append(head,node("span",null,b.etiqueta||"Cotización"),node("span",null,(b.desc||0)+" % desc."));append(div,head);
      const items=node("div","quote-items");
      for(const l of b.lineas||[]) {const r=node("div","quote-item");append(r,node("span",null,l.nombre+" · "+l.cajas+" cajas"),node("b",null,soles(l.subtotal)));items.appendChild(r);}
      const total=node("div","quote-total");append(total,node("span",null,"Total con IGV"),node("span",null,soles(b.totales?.total)));
      append(div,items,total,para("Vigencia: "+shortDate(b.vigencia)+" · Entrega solicitada: "+shortDate(b.entrega),"panel-sub"));return div;
    }
    if(b.k==="entregas") {
      const d=node("div","timeline");for(const item of b.items||[]) {
        const row=node("div","timeline-item");append(row,node("strong",null,item.cajas+" cajas · "+item.fecha));
        for(const detalle of item.detalle||[])append(row,node("small",null,detalle));d.appendChild(row);
      }return d;
    }
    if(b.k==="pedido") {
      const d=node("div","quote-card");append(d,node("strong",null,"✓ Pedido simulado "+b.id),para("Cotización "+b.cotizacion+" · "+b.cajas+" cajas"),para("Total: "+soles(b.total)));
      for (const it of b.entregas||[])append(d,para(it.cajas+" cajas · "+it.fecha,"panel-sub"));return d;
    }
    if(b.k==="catalogo") {
      const grid=node("div","catalogue-list");for(const item of b.items||[]){const card=node("div","catalogue-item");
        append(card,node("b",null,item.nombre),node("small",null,item.presentacion),node("strong",null,soles(item.precio)+" por caja"));
        if(item.nota)append(card,node("small",null,item.nota));grid.appendChild(card);
      }return grid;
    }
    return null;
  }
  function bubbleMessage(m) {
    const rol=m.rol==="usuario"?"user":m.rol==="interno"?"internal":"agent";
    const row=node("div","message-row "+rol);
    if(rol==="agent") append(row,node("span","msg-avatar","N"));
    const bubble=node("div","bubble");
    if(m.texto)bubble.appendChild(para(m.texto));
    for(const bl of m.bloques||[])append(bubble,renderBlock(bl));
    if (m.chips && m.chips.length) {
      const bar=node("div","actions-row");
      for(const chip of m.chips) append(bar,btn(chip.t,()=>act(chip.t,chip.a)));
      bubble.appendChild(bar);
    }
    bubble.appendChild(node("small","time",time(m.ts)));
    append(row,bubble);return row;
  }
  function greeting() {
    const root=node("div","empty-greeting");
    append(root,node("div","greet-ornament","✳"),node("h3",null,"¡Hola! Soy Nexo."),
      para("Puedes hablarme con naturalidad, incluso contarme cómo te llamas. Si necesitas productos de Gloria, reviso las condiciones de nuestro ERP simulado y te ayudo a cotizar."));
    const starters=node("div","starter-list");
    append(starters,btn("👋 Hola, soy Oso Polar",()=>send("Hola, soy Oso Polar")),
      btn("🛒 Quiero cotizar",()=>{input.value="Quiero 100 cajas de leche UHT entera para mañana";input.focus();}),
      btn("📦 Muéstrame el caso 300/240/60",()=>scenario("stock")));
    root.appendChild(starters);return root;
  }
  function renderChat() {
    messages.replaceChildren();
    if(!st.historial.length) messages.appendChild(greeting());
    else for(const m of st.historial)messages.appendChild(bubbleMessage(m));
    messages.scrollTop=messages.scrollHeight;
  }
  function setPanel(t) {
    st.panel=t;
    document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===t));
    document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.nav===t || (t==="summary" && b.dataset.nav==="chat")));
    renderPanel();
  }
  function panelEmpty(txt){panel.appendChild(node("div","panel-empty",txt));}
  function renderPanel(){
    panel.replaceChildren();const view=st.vista||{},conv=view.conv||{},quotes=conv.cots||[],tasks=view.tareas||[];
    if(st.panel==="summary") {
      append(panel,node("p","panel-heading","Estado de tu solicitud"));
      const p=tasks.filter(t=>t.estado==="PENDIENTE");
      if(conv.pedido) panel.appendChild(node("div","status-card","✓ Pedido registrado: "+conv.pedido));
      else if(p.length)panel.appendChild(node("div","info-pill","Tienes "+p.length+" aprobación(es) pendiente(s). Revisa la bandeja."));
      else if(quotes.length)panel.appendChild(node("div","status-card","Cotizaciones creadas: "+quotes.length));
      else panelEmpty("Cuando cotices, verás aquí el estado de tus solicitudes, entregas y verificaciones.");
      if(view.ultimoERP){const d=node("div","status-card");append(d,node("strong",null,"Último control del ERP simulado"),node("small",null,view.ultimoERP.etiqueta+" · "+view.ultimoERP.respuesta));panel.appendChild(d);}
      return;
    }
    if(st.panel==="inbox") {
      append(panel,node("p","panel-heading","Decisiones que requieren una persona"),para("La aprobación de descuentos o crédito la simula un responsable humano. El agente no puede saltar este paso.","panel-sub"));
      const pending=tasks.filter(t=>t.estado==="PENDIENTE");if(!pending.length)return panelEmpty("No hay solicitudes pendientes. Prueba el escenario 3 de descuento del 8 %. ");
      for(const t of pending){const d=node("div","status-card");append(d,node("strong",null,t.titulo||t.tipo),node("small",null,(t.rol||"")+" · "+(t.id||"")),node("small",null,t.detalle||""));
        const label=node("small",null,"Monto o porcentaje máximo que autoriza la persona:");const inp=node("input");inp.type="number";inp.step="0.5";
        inp.min="0";inp.max=t.tipo==="DESCUENTO"?"10":"1000000";inp.value= t.tipo==="DESCUENTO"?(t.solicitado||8):t.tipo==="CREDITO"?Math.ceil(t.total||0):"10000";
        append(d,label,inp);
        append(d,btn("Aprobar",()=>resolve(t,true,inp.value)),btn("Rechazar",()=>resolve(t,false),"danger"));panel.appendChild(d);
      }return;
    }
    if(st.panel==="trace") {
      append(panel,node("p","panel-heading","Evidencia y trazabilidad"));
      const e=view.ultimoERP;if(e){append(panel,para("ERP simulado: "+e.etiqueta+" · "+e.respuesta,"panel-sub"));
        for(const c of e.controles||[]){const x=node("div","evidence-ctl"+(c.resultado==="CUMPLE"?"":" fail"));append(x,node("b",null,c.id+" · "+c.nombre+" — "+c.resultado),para(c.detalle||""));panel.appendChild(x);}}
      const tr=(view.traza||[]).slice(-20).reverse();if(!tr.length)return panelEmpty("Cada interpretación, validación, escalamiento y decisión humana aparecerá aquí.");
      for(const t of tr){const row=node("div","trace-line");append(row,node("small",null,time(t.ts)+" · "+t.actor),para(t.texto||""));if(t.detalle)append(row,node("small",null,t.detalle));panel.appendChild(row);}return;
    }
    if(st.panel==="quotes"){
      append(panel,node("p","panel-heading","Tus cotizaciones"));if(!quotes.length)return panelEmpty("Aún no hay cotizaciones en esta sesión.");
      for(const q of quotes.slice().reverse()){const d=node("div","status-card");append(d,node("strong",null,q.etiqueta),node("small",null,"Estado: "+q.estado+" · "+q.desc+" % desc."));if(q.cot?.totales)append(d,node("span","tag",soles(q.cot.totales.total)));panel.appendChild(d);}return;
    }
    if(st.panel==="stock"){
      append(panel,node("p","panel-heading","Inventario de referencia"));
      if(!st.stock)return panelEmpty("Pulsa Consultar stock para ver los lotes de demostración.");
      append(panel,para("Foto de lotes: "+shortDate(st.stock.fecha_corte)+". Es una referencia: el ERP revalida calidad, reservas y fecha al cotizar.","panel-sub"));
      for (const item of st.stock.items||[]){const c=node("div","status-card");append(c,node("strong",null,item.nombre),node("small",null,item.codigo+" · "+item.presentacion),node("span","tag",item.disponibles+" cajas liberadas en esta foto"));panel.appendChild(c);}return;
    }
  }
  async function request(op,fields={}) {
    const ctl=new AbortController();const tm=setTimeout(()=>ctl.abort(),29000);
    try {const r=await fetch("/api/asesor",{method:"POST",signal:ctl.signal,headers:{"Content-Type":"application/json"},
      body:JSON.stringify({op,sesion:st.sesion,cliente:client.value,fecha:date.value,...fields})});
      const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.error||"Servidor no disponible");return j;
    }finally{clearTimeout(tm);}
  }
  function consume(j){if(j.nombre!==undefined)st.nombre=j.nombre;if(j.nuevos)st.historial.push(...j.nuevos);setView(j.vista);renderChat();}
  async function send(text,actInfo=null){if(st.busy)return;const t=String(text||"").trim();if(!t)return;
    st.historial.push({rol:"usuario",texto:t,ts:Date.now()});renderChat();input.value="";setBusy(true);
    try{const j=await request(actInfo?"accion":"mensaje",{texto:t,accion:actInfo});consume(j);showStatus(true,"Asesor conectado");}
    catch(e){st.historial.push({rol:"asesor",texto:"No pude completar la consulta: "+e.message+". Prueba nuevamente o revisa los Logs en Vercel.",ts:Date.now()});renderChat();showStatus(false,"Revisar conexión");}
    finally{setBusy(false);input.focus();}
  }
  const act=(text,action)=>send(text,action);
  async function resolve(task,approve,value){if(st.busy)return;setBusy(true);
    try{const j=await request("resolver",{tarea:task.id,dec:{aprobar:approve,valor:approve?Number(value):null,motivo:(approve?"Aprobado":"Rechazado")+" por responsable humano (demo académica)"}});consume(j);setPanel("inbox");}
    catch(e){alert("No se pudo resolver: "+e.message);}finally{setBusy(false);}
  }
  async function reset(){if(st.busy)return;setBusy(true);try{const j=await request("reiniciar");st.historial=[];st.nombre="";st.stock=null;setView(j.vista);setPanel("summary");renderChat();}
    catch(e){alert("No se pudo reiniciar: "+e.message);}finally{setBusy(false);}
  }
  async function scenario(kind){if(st.busy)return;const ex={
    normal:"Quiero 100 cajas de leche UHT Gloria entera para mañana",
    stock:"Necesito 300 cajas de leche UHT Gloria entera para mañana",
    discount:"Necesito 150 cajas de leche UHT Gloria entera con 8 % de descuento para mañana"};
    if(!ex[kind])return;date.value=DEMO_DATE;client.value="CLI-001";await reset();await send(ex[kind]);setPanel(kind==="discount"?"inbox":"trace");
  }
  async function stock(){if(st.busy)return;setBusy(true);try{const j=await request("stock");st.stock=j.datos;setView(j.vista);setPanel("stock");}catch(e){alert(e.message);}finally{setBusy(false);}}
  async function start(){setBusy(true);try{const j=await request("inicio");st.historial=j.historial||[];st.nombre=j.nombre||"";setView(j.vista);renderChat();showStatus(true,"Asesor conectado");}
    catch(e){showStatus(false,"Sin conexión");st.historial=[];renderChat();panelEmpty("Error de instalación: "+e.message);}
    finally{setBusy(false);}
  }
  form.addEventListener("submit",e=>{e.preventDefault();send(input.value);});
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input.value);}});
  input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,105)+"px";});
  $("#reset").addEventListener("click",()=>{if(confirm("¿Reiniciar conversación y gestión comercial de esta sesión?"))reset();});
  document.querySelectorAll(".scenario").forEach(b=>b.addEventListener("click",()=>scenario(b.dataset.scenario)));
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setPanel(b.dataset.tab)));
  document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>{const n=b.dataset.nav;if(n==="chat") {setPanel("summary");input.focus();}else if(n==="stock")stock();else setPanel(n);}));
  document.querySelectorAll(".quick").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.quick;
    if(k==="catalogo")act("Ver catálogo",{k:"catalogo"});
    else if(k==="cotizar"){input.value="Quiero cotizar 100 cajas de leche UHT Gloria entera para mañana";input.focus();}
    else if(k==="stock")stock(); else if(k==="quotes")setPanel("quotes");
  }));
  client.addEventListener("change",()=>{if(confirm("Cambiar la cuenta reiniciará esta demostración. ¿Continuar?"))reset();else client.value="CLI-001";});
  date.addEventListener("change",()=>{if(date.value!==DEMO_DATE){st.stock=null;renderPanel();}});
  $("#downloadCsv").addEventListener("click",async()=>{
    try{const r=await fetch("/api/bitacora?sesion="+encodeURIComponent(st.sesion));if(!r.ok)throw new Error("HTTP "+r.status);
      const blob=await r.blob();const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="NEXO_Bitacora_PC3.csv";a.click();setTimeout(()=>URL.revokeObjectURL(u),3000);
    }catch(e){alert("No se pudo obtener CSV: "+e.message);}
  });
  renderChat();renderPanel();start();
})();
