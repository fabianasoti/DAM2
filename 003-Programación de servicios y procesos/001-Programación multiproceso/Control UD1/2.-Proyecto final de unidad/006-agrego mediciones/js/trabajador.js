// Worker: filtra una foto sin bloquear la página.
// Carga los filtros (filtros.js no usa la página, por eso se puede cargar aquí)
importScripts("filtros.js")

// Se ejecuta cada vez que la página me envía una foto con postMessage
onmessage = function(mensaje){

  let datos = mensaje.data

  // Los píxeles llegan como un bloque de memoria; lo convierto en array de píxeles
  let original = new Uint8ClampedArray(datos.pixeles)
  let resultado

  // Repito el filtro las veces pedidas, siempre partiendo de la foto original
  for(let i = 0; i < datos.repeticiones; i++){
    resultado = new Uint8ClampedArray(original)
    aplicarFiltro(datos.filtro, resultado)
  }

  // Devuelvo la foto filtrada a la página.
  // El segundo parámetro "transfiere" la memoria en vez de copiarla (más rápido).
  postMessage({
    indice: datos.indice,
    pixeles: resultado.buffer,
    ancho: datos.ancho,
    alto: datos.alto
  }, [resultado.buffer])
}
