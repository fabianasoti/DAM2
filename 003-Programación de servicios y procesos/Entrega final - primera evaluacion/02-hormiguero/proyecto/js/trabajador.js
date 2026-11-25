// Worker: se encarga de calcular el movimiento de SU grupo de hormigas
// importScripts carga otro archivo dentro del worker (aquí, la lógica común)
importScripts("hormigas.js")

let datos
let ancho
let alto

onmessage = function (evento) {
  const mensaje = evento.data

  // Primer mensaje: me llega mi grupo de hormigas
  if (mensaje.tipo === "iniciar") {
    datos = mensaje.datos
    ancho = mensaje.ancho
    alto = mensaje.alto
  }

  // Mensajes siguientes: calcula un fotograma y devuelve las posiciones nuevas
  if (mensaje.tipo === "calcular") {
    moverHormigas(datos, 0, datos.length / CAMPOS, mensaje.carga, ancho, alto)
    postMessage({ tipo: "listo", datos: datos })
  }
}
