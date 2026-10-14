// 1. MÓDULOS
fetch("api/superapi.php?ruta=modulos")
  .then(function(respuesta){ return respuesta.json(); })
  .then(function(datos){
    console.log("Modulos:", datos);
    let menu = document.querySelector("#modulos");
    
    // Si la API devuelve un array directo usa 'datos', si viene envuelto usa 'datos.modulos'
    let lista = Array.isArray(datos) ? datos : (datos.modulos || []);
    
    lista.forEach(function(dato){
      menu.innerHTML += '<a href="">' + dato + '</a>';
    });
  });

// 2. ENTIDADES (Cambiado respuesta.text() por respuesta.json())
fetch("api/superapi.php?ruta=entidades")
  .then(function(respuesta){ return respuesta.json(); }) // <-- CORREGIDO AQUÍ
  .then(function(datos){
    console.log("Entidades:", datos);
    let menu = document.querySelector("#entidades");
    
    // Si la API devuelve un array directo usa 'datos', si viene envuelto usa 'datos.entidades'
    let lista = Array.isArray(datos) ? datos : (datos.entidades || []);
    
    lista.forEach(function(dato){
      menu.innerHTML += '<a href="">' + dato + '</a>';
    });
  });

// 3. TABLA
fetch("api/superapi.php?ruta=tabla")
  .then(function(respuesta){ return respuesta.json(); })
  .then(function(datos){
    console.log("Tabla:", datos);
    let seccion = document.querySelector("section");
    
    // Comprobamos si existen datos dentro de datos.clientes
    if (datos && datos.clientes && datos.clientes.length > 0) {
      let cadenatabla = "<table><tr>";
      
      // Cabeceras
      Object.keys(datos.clientes[0]).forEach(function(clave){
        cadenatabla += "<th>" + clave + "</th>";
      });
      cadenatabla += "</tr>";
      
      // Filas
      datos.clientes.forEach(function(cliente){
        cadenatabla += "<tr>";
        Object.keys(cliente).forEach(function(clave){
          cadenatabla += "<td>" + cliente[clave] + "</td>";
        });
        cadenatabla += "</tr>";
      });
      
      cadenatabla += "</table>";
      seccion.innerHTML = cadenatabla;
    }
  });
