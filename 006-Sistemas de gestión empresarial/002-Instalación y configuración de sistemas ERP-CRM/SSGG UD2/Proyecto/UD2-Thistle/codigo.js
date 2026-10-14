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
  datos.forEach(dato => menu.innerHTML += '<a href="#">'+escapar(dato)+'</a>');
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
      let nombreCol = columna.name.toLowerCase();
      
      // 1. Añadimos textos de ayuda y descripciones contextuales según el campo
      let ayuda = '';
      if(nombreCol.includes('email')) ayuda = '<small style="color:#666; font-weight:normal;">Ej: usuario@email.com</small>';
      else if(nombreCol.includes('telefono')) ayuda = '<small style="color:#666; font-weight:normal;">Ej: +34600000000</small>';
      else if(nombreCol.includes('numero') || nombreCol.includes('precio')) ayuda = '<small style="color:#666; font-weight:normal;">Debe ser un valor único y válido</small>';

      html += '<label>'+escapar(columna.name) + ' ' + ayuda;

      // 2. Si es la columna 'estado' (en habitaciones u otras tablas), creamos un desplegable elegante con la primera letra en mayúscula
      if(nombreCol === 'estado') {
        html += `<select name="'+escaparAtributo(columna.name)+'" required>
                    <option value="Disponible" ${valor === 'Disponible' ? 'selected' : ''}>Disponible</option>
                    <option value="Ocupada" ${valor === 'Ocupada' ? 'selected' : ''}>Ocupada</option>
                    <option value="Limpieza" ${valor === 'Limpieza' ? 'selected' : ''}>Limpieza</option>
                    <option value="Mantenimiento" ${valor === 'Mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
                 </select>`;
      } else {
        // Input normal con placeholder descriptivo
        let placeholder = 'Introduce ' + columna.name + '...';
        html += '<input name="'+escaparAtributo(columna.name)+'" value="'+escaparAtributo(valor)+'" placeholder="'+placeholder+'" required>';
      }

      html += '</label>';
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
    if(!respuesta.ok) {
      // 3. Capturamos errores comunes como el de clave duplicada y mostramos un mensaje amigable
      let mensajeError = respuesta.error || "Error al guardar el registro.";
      if(mensajeError.includes("UNIQUE constraint failed")) {
        alert("⚠️ Error: Ya existe un registro con ese identificador o número (clave duplicada). Por favor, comprueba los datos.");
      } else {
        alert("⚠️ " + mensajeError);
      }
      return;
    }
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
