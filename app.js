const $ = id => document.getElementById(id);
const categories = ["Alimentación","Transporte","Vivienda","Servicios","Salud","Educación","Salario","Ventas","Servicios profesionales","Materiales e insumos","Marketing","Impuestos","Deuda","Ahorro","Transferencia","Otros"];
const accounts = ["Efectivo","BBVA","Banorte","Tarjeta de crédito","Cuenta del negocio SCT","Ahorro"];
let movements = [];
let pendingMovement = null;
let installPrompt = null;
const money = n => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(n);
const today = new Date();
$("date").value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
function fillSelect(el, values, selected) {
  el.innerHTML = values.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  if(selected && values.includes(selected)) el.value=selected;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
fillSelect($("category"),categories,"Otros");
fillSelect($("account"),accounts,"BBVA");
fillSelect($("destination"),accounts,"Efectivo");
function currentScope(){return $("scope").value;}
function visibleMovements(){const s=currentScope();return movements.filter(m=>s==="all"||m.scope===s);}
function render(){
  const list=visibleMovements();
  const income=list.filter(m=>m.type==="Ingreso").reduce((a,m)=>a+m.amount,0);
  const expense=list.filter(m=>m.type==="Gasto").reduce((a,m)=>a+m.amount,0);
  $("incomeTotal").textContent=money(income);$("expenseTotal").textContent=money(expense);$("netTotal").textContent=money(income-expense);
  $("movementList").innerHTML=list.slice(0,30).map(m=>{
    const sign=m.type==="Ingreso"?"+":m.type==="Gasto"?"−":"↔";
    const cls=m.type==="Ingreso"?"positive":m.type==="Gasto"?"negative":"";
    const icon=m.type==="Ingreso"?"↙":m.type==="Gasto"?"↗":"⇄";
    return `<div class="movement"><div class="movement-icon">${icon}</div><div class="movement-main"><strong>${escapeHtml(m.description||m.category)}</strong><small>${escapeHtml(m.scope==="personal"?"Personal":"Negocio SCT")} · ${escapeHtml(m.category)} · ${escapeHtml(m.account)} · ${escapeHtml(m.date)}</small></div><div class="movement-amount ${cls}">${sign==="↔"?"":sign}${money(m.amount)}</div></div>`;
  }).join("");
  $("emptyState").classList.toggle("hidden",list.length>0);
}
function classify(text){
  const s=text.toLowerCase();
  const moneyMatch=text.match(/(?:\$\s*)?\d[\d,]*(?:\.\d{1,2})?/);
  if(!moneyMatch) return {error:"No encontré un importe. Ejemplo: Gasté 185 en gasolina con BBVA."};
  const amount=Number(moneyMatch[0].replace(/\$/g,"").replace(/,/g,""));
  if(!Number.isFinite(amount)||amount<=0) return {error:"El importe debe ser mayor que cero."};
  let type=/\b(recib[ií]|ingres[ée]|n[oó]mina|sueldo|salario|cobr[eé]|me pagaron|venta por)\b/.test(s)?"Ingreso":/\b(transfer[ií]|transferencia|traspas[eé])\b/.test(s)?"Transferencia":"Gasto";
  if(/pagu[eé].*(tarjeta|cr[eé]dito)|abono a tarjeta/.test(s)) type="Pago de tarjeta";
  let category="Otros";
  const rules=[
    [/gasolina|combustible|uber|taxi|transporte|estacionamiento/,"Transporte"],
    [/supermercado|despensa|comida|restaurante|caf[eé]|tacos/,"Alimentación"],
    [/renta|hipoteca/,"Vivienda"],[/luz|agua|internet|tel[eé]fono|electricidad/,"Servicios"],
    [/farmacia|medicina|doctor|m[eé]dico/,"Salud"],[/n[oó]mina|sueldo|salario/,"Salario"],
    [/cliente|cobr[eé]|venta|servicio.*sct/,"Ventas"],[/proveedor|material|insumo/,"Materiales e insumos"],
    [/impuesto|sat|iva|isr/,"Impuestos"],[/curso|escuela|libro/,"Educación"],
    [/transfer/,"Transferencia"],[/tarjeta/,"Tarjeta de crédito"]
  ];
  for(const [re,c] of rules){if(re.test(s)){category=c;break;}}
  if(type==="Transferencia") category="Transferencia";
  let account=accounts.find(a=>s.includes(a.toLowerCase()))||"BBVA";
  let scope=/\bsct\b|negocio|cliente|proveedor|factura|servicio profesional/.test(s)?"business":"personal";
  return {scope,type,amount,category,account,date:$("date").value,description:text.trim(),destination:accounts.find(a=>a!==account)||"Efectivo"};
}
function updateDestination(){ $("destinationWrap").classList.toggle("hidden",$("type").value!=="Transferencia"); }
$("type").addEventListener("change",updateDestination);
$("scope").addEventListener("change",render);
$("interpretBtn").addEventListener("click",()=>{
  const parsed=classify($("naturalText").value.trim());
  if(parsed.error){showError(parsed.error);return;}
  $("scopeForm").value=parsed.scope;$("type").value=parsed.type==="Pago de tarjeta"?"Gasto":parsed.type;
  $("amount").value=parsed.amount;fillSelect($("category"),categories,parsed.category);fillSelect($("account"),accounts,parsed.account);
  $("date").value=parsed.date;$("description").value=parsed.description;fillSelect($("destination"),accounts,parsed.destination);
  updateDestination();showError("");buildConfirmation();
});
function showError(msg){$("formError").textContent=msg;}
$("movementForm").addEventListener("submit",e=>{
  e.preventDefault();
  const amount=Number($("amount").value);
  if(!Number.isFinite(amount)||amount<=0){showError("Introduce un importe mayor que cero.");return;}
  if($("type").value==="Transferencia"&&$("account").value===$("destination").value){showError("El origen y destino deben ser cuentas distintas.");return;}
  showError("");
  pendingMovement={scope:$("scopeForm").value,type:$("type").value,amount,category:$("category").value,account:$("account").value,destination:$("destination").value,date:$("date").value,description:$("description").value.trim()};
  buildConfirmation();
});
function buildConfirmation(){
  if(!pendingMovement){
    pendingMovement={scope:$("scopeForm").value,type:$("type").value,amount:Number($("amount").value),category:$("category").value,account:$("account").value,destination:$("destination").value,date:$("date").value,description:$("description").value.trim()};
  }
  const m=pendingMovement;
  const rows=[["Ámbito",m.scope==="personal"?"Finanzas personales":"Negocio SCT"],["Tipo",m.type],["Importe",money(m.amount)],["Categoría",m.category],["Cuenta origen",m.account],...(m.type==="Transferencia"?[["Cuenta destino",m.destination]]:[]),["Fecha",m.date],["Descripción",m.description||"Sin descripción"]];
  $("confirmationDetails").innerHTML=rows.map(([k,v])=>`<div class="detail"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join("");
  $("confirmPanel").classList.remove("hidden");$("confirmPanel").scrollIntoView({behavior:"smooth",block:"center"});
}
$("cancelConfirm").addEventListener("click",()=>{$("confirmPanel").classList.add("hidden");pendingMovement=null;});
$("saveConfirm").addEventListener("click",async()=>{
  if(!pendingMovement||!pendingMovement.amount||pendingMovement.amount<=0)return;
  const m={...pendingMovement,id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),createdAt:new Date().toISOString()};
  try{await dbSave(m);movements.unshift(m);render();$("confirmPanel").classList.add("hidden");pendingMovement=null;$("naturalText").value="";$("movementForm").reset();$("scopeForm").value=currentScope()==="business"?"business":"personal";$("date").value=todayISO();updateDestination();showToast("Movimiento guardado en este dispositivo.");}
  catch(err){showError("No se pudo guardar en este dispositivo. Exporta o revisa la configuración del navegador.");}
});
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open("mi-control-financiero",1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("movements"))db.createObjectStore("movements",{keyPath:"id"});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function dbSave(m){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction("movements","readwrite");tx.objectStore("movements").put(m);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
async function loadDB(){try{const db=await openDB();movements=await new Promise((resolve,reject)=>{const req=db.transaction("movements","readonly").objectStore("movements").getAll();req.onsuccess=()=>resolve(req.result.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));req.onerror=()=>reject(req.error);});db.close();render();}catch(e){showToast("Este navegador no permite almacenamiento local. Prueba en un navegador actualizado.");}}
function showToast(msg){const el=document.createElement("div");el.className="toast";el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3200);}
$("exportBtn").addEventListener("click",()=>{
 const rows=[["id","fecha","ambito","tipo","importe_mxn","categoria","cuenta","destino","descripcion"],...visibleMovements().map(m=>[m.id,m.date,m.scope,m.type,m.amount,m.category,m.account,m.destination||"",m.description||""])];
 const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="movimientos-financieros.csv";a.click();URL.revokeObjectURL(url);
});
$("clearBtn").addEventListener("click",async()=>{
 if(!confirm("¿Borrar permanentemente todos los movimientos de prueba de este navegador? Exporta antes si necesitas conservarlos."))return;
 const db=await openDB();await new Promise((resolve,reject)=>{const tx=db.transaction("movements","readwrite");tx.objectStore("movements").clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();movements=[];render();showToast("Se borraron los datos de prueba.");
});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("installBtn").classList.remove("hidden");});
$("installBtn").addEventListener("click",async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("installBtn").classList.add("hidden");});
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
updateDestination();loadDB();