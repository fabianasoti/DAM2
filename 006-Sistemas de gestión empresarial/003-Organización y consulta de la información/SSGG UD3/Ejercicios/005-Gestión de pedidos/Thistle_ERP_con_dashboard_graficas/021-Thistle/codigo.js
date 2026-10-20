let tablaActual = "";
let clavePrimaria = "";

fetch("data/config.php")
.then(respuesta => respuesta.json())
.then(datos => {
  document.querySelector("h1").textContent = datos.nombre;
  document.documentElement.style.setProperty('--color_corporativo', datos.color);
});

fetch("api/superapi.php?ruta=modulos")
.then(respuesta => respuesta.json())
.then(datos => {
  let menu = document.querySelector("#modulos");
  datos.forEach(dato => {
    let enlace = document.createElement("a");
    enlace.href = "#";
    enlace.textContent = dato;
    enlace.onclick = evento => { evento.preventDefault(); if(dato.toLowerCase().includes("report")) abrirReporting(); else abrirDashboard(); };
    menu.appendChild(enlace);
  });
  const reportingLink=document.createElement("a");
  reportingLink.href="#"; reportingLink.textContent="Reporting";
  reportingLink.onclick=evento=>{evento.preventDefault();abrirReporting();};
  menu.appendChild(reportingLink);
});

fetch("api/superapi.php?ruta=entidades")
.then(respuesta => respuesta.json())
.then(datos => {
  let menu = document.querySelector("#entidades");
  datos.forEach(dato => {
    let enlace = document.createElement("a");
    enlace.href = "#";
    enlace.textContent = dato;
    enlace.onclick = function(evento){
      evento.preventDefault();
      document.querySelectorAll("#entidades a").forEach(a => a.classList.remove("activo"));
      enlace.classList.add("activo");
      cargarTabla(dato);
    };
    menu.appendChild(enlace);
  });
});

function cargarTabla(tabla){
  tablaActual = tabla;
  fetch("api/superapi.php?ruta=tabla&tabla="+encodeURIComponent(tabla))
  .then(respuesta => respuesta.json())
  .then(datos => {
    clavePrimaria = datos.clavePrimaria;
    pintarTabla(datos);
  });
}

function pintarTabla(datos){
  let seccion = document.querySelector("section");
  let html = '<div class="barra"><div><small>ENTIDAD</small><h2>'+escapar(tablaActual)+'</h2></div><button onclick="nuevoRegistro()">+ Nuevo registro</button></div>';

  if(datos.columnas.length == 0){ seccion.innerHTML = html + '<p>No hay columnas.</p>'; return; }

  html += '<div class="tabla-contenedor"><table><thead><tr>';
  datos.columnas.forEach(columna => html += '<th>'+escapar(columna.name)+'</th>');
  html += '<th class="acciones">Acciones</th></tr></thead><tbody>';

  datos.registros.forEach(registro => {
    html += '<tr>';
    datos.columnas.forEach(columna => html += '<td>'+escapar(registro[columna.name] ?? '')+'</td>');
    let id = registro[datos.clavePrimaria];
    html += '<td class="acciones"><button class="editar" onclick=\'editarRegistro('+JSON.stringify(JSON.stringify(registro))+')\'>Editar</button> ';
    html += '<button class="eliminar" onclick=\'eliminarRegistro('+JSON.stringify(id)+')\'>Eliminar</button></td></tr>';
  });
  html += '</tbody></table></div>';
  if(datos.registros.length == 0) html += '<p class="vacio">Todavía no hay registros.</p>';
  seccion.innerHTML = html;
}

function nuevoRegistro(){ cargarFormulario(null); }
function editarRegistro(registroJSON){ cargarFormulario(JSON.parse(registroJSON)); }

function cargarFormulario(registro){
  fetch("api/superapi.php?ruta=estructura&tabla="+encodeURIComponent(tablaActual))
  .then(respuesta => respuesta.json())
  .then(datos => {
    let editando = registro !== null;
    let html = '<div class="barra"><div><small>'+ (editando?'EDITAR':'CREAR') +'</small><h2>'+escapar(tablaActual)+'</h2></div><button class="secundario" onclick="cargarTabla(tablaActual)">← Volver</button></div>';
    html += '<form id="formulario">';
    datos.columnas.forEach(columna => {
      if(columna.pk) return;
      let valor = editando ? (registro[columna.name] ?? '') : '';
      html += '<label>'+escapar(columna.name)+'<input name="'+escaparAtributo(columna.name)+'" value="'+escaparAtributo(valor)+'"></label>';
    });
    html += '<button type="submit">'+(editando?'Guardar cambios':'Crear registro')+'</button></form>';
    document.querySelector("section").innerHTML = html;
    document.querySelector("#formulario").onsubmit = function(evento){
      evento.preventDefault();
      guardarRegistro(new FormData(this), editando ? registro[datos.clavePrimaria] : null);
    };
  });
}

function guardarRegistro(formData,id){
  let datos = Object.fromEntries(formData.entries());
  fetch("api/superapi.php?ruta="+(id===null?'crear':'actualizar'),{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({tabla:tablaActual,id:id,datos:datos})
  }).then(r => r.json()).then(respuesta => {
    if(!respuesta.ok) return alert(respuesta.error || "Error");
    cargarTabla(tablaActual);
  });
}

function eliminarRegistro(id){
  if(!confirm("¿Eliminar este registro?")) return;
  fetch("api/superapi.php?ruta=eliminar",{
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({tabla:tablaActual,id:id})
  }).then(r => r.json()).then(respuesta => {
    if(!respuesta.ok) return alert(respuesta.error || "Error");
    cargarTabla(tablaActual);
  });
}

function escapar(valor){ let d=document.createElement('div'); d.textContent=String(valor); return d.innerHTML; }
function escaparAtributo(valor){ return escapar(valor).replaceAll('"','&quot;'); }


function abrirDashboard(){
  tablaActual = "";
  document.querySelectorAll("#entidades a").forEach(a=>a.classList.remove("activo"));
  const seccion=document.querySelector("section");
  seccion.innerHTML = `
    <div class="barra"><div><small>RESUMEN GENERAL</small><h2>Dashboard</h2></div><span class="demo-tag">Datos de muestra</span></div>
    <p class="muted">Indicadores ilustrativos para previsualizar el ERP. No representan datos reales.</p>
    <div class="metricas">
      <article class="metrica"><span>Clientes activos</span><strong>248</strong><small class="positivo">↑ 12,4% este mes</small></article>
      <article class="metrica"><span>Ventas del mes</span><strong>18.640 €</strong><small class="positivo">↑ 8,2% vs. mes anterior</small></article>
      <article class="metrica"><span>Pedidos pendientes</span><strong>17</strong><small class="neutro">6 requieren revisión</small></article>
      <article class="metrica"><span>Productos en catálogo</span><strong>136</strong><small class="neutro">12 categorías</small></article>
    </div>
    <div class="dashboard-grid">
      <article class="panel-grafica"><h3>Actividad mensual</h3><p class="muted">Ventas y pedidos ficticios · últimos 6 meses</p><div id="dash-ventas"></div></article>
      <article class="panel-grafica"><h3>Clientes por segmento</h3><p class="muted">Distribución de ejemplo</p><div id="dash-clientes"></div></article>
      <article class="panel-grafica"><h3>Estado de pedidos</h3><p class="muted">Situación simulada</p><div id="dash-pedidos"></div></article>
      <article class="panel-grafica"><h3>Frecuencia de actividad</h3><p class="muted">Acciones registradas por día (datos inventados)</p><div id="dash-actividad"></div></article>
    </div>`;
  dibujarBarras(document.querySelector("#dash-ventas"), [
    {label:"May",value:62},{label:"Jun",value:78},{label:"Jul",value:71},{label:"Ago",value:90},{label:"Sep",value:84},{label:"Oct",value:100}
  ], "Índice de ventas");
  dibujarBarras(document.querySelector("#dash-clientes"), [
    {label:"PYME",value:118},{label:"Autónomos",value:74},{label:"Empresa",value:56}
  ], "Clientes");
  dibujarBarras(document.querySelector("#dash-pedidos"), [
    {label:"Entregados",value:76},{label:"En curso",value:17},{label:"Pendientes",value:7}
  ], "Pedidos");
  dibujarBarras(document.querySelector("#dash-actividad"), [
    {label:"Lun",value:35},{label:"Mar",value:48},{label:"Mié",value:41},{label:"Jue",value:57},{label:"Vie",value:63},{label:"Sáb",value:22},{label:"Dom",value:12}
  ], "Acciones");
}
function abrirReporting(){
  if(!window.DarkorangeReporting){ document.querySelector("section").innerHTML="<h2>Reporting</h2><p>No se ha podido cargar el módulo de informes.</p>"; return; }
  new DarkorangeReporting({contenedor:"section"}).render();
}
function dibujarBarras(contenedor, datos, etiqueta){
  if(!contenedor) return;
  if(!datos.length){contenedor.innerHTML='<p class="muted">Sin datos para representar.</p>';return;}
  const ancho=Math.max(320, datos.length*72), alto=210, margen={t:20,r:12,b:42,l:32};
  const max=Math.max(1,...datos.map(d=>Number(d.value)||0));
  const zonaW=ancho-margen.l-margen.r, zonaH=alto-margen.t-margen.b;
  const paso=zonaW/datos.length, bw=Math.min(38,paso*.62);
  let svg=`<svg class="grafica-svg" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${escapar(etiqueta)}">`;
  for(let i=0;i<4;i++){const y=margen.t+zonaH*i/3;svg+=`<line x1="${margen.l}" y1="${y}" x2="${ancho-margen.r}" y2="${y}" stroke="#e7eaf0"/>`;}
  datos.forEach((d,i)=>{const v=Number(d.value)||0,h=v/max*(zonaH-5),x=margen.l+i*paso+(paso-bw)/2,y=margen.t+zonaH-h;
    svg+=`<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="5" fill="var(--color_grafica, #6478e8)"><title>${escapar(d.label)}: ${v}</title></rect><text x="${x+bw/2}" y="${y-6}" text-anchor="middle" font-size="11" fill="#51576a">${v}</text><text x="${x+bw/2}" y="${alto-18}" text-anchor="middle" font-size="11" fill="#687084">${escapar(String(d.label).slice(0,10))}</text>`;
  });
  svg+="</svg>";contenedor.innerHTML=svg;
}
document.addEventListener("DOMContentLoaded", abrirDashboard);
