// Incremental 001: una foto, un filtro, sin paralelismo.

const entrada = document.querySelector("#entrada")
const selectorFiltro = document.querySelector("#filtro")
const botonAplicar = document.querySelector("#aplicar")
const estado = document.querySelector("#estado")

const lienzoOriginal = document.querySelector("#original")
const lienzoResultado = document.querySelector("#resultado")
const contextoOriginal = lienzoOriginal.getContext("2d")
const contextoResultado = lienzoResultado.getContext("2d")


// 1. Cuando elijo una foto, la dibujo en el lienzo original
entrada.onchange = function(){

  let archivo = entrada.files[0]
  if(!archivo){ return }

  let imagen = new Image()
  imagen.src = URL.createObjectURL(archivo)

  imagen.onload = function(){
    lienzoOriginal.width = imagen.width
    lienzoOriginal.height = imagen.height
    contextoOriginal.drawImage(imagen,0,0)

    // El resultado empieza siendo igual que el original
    lienzoResultado.width = imagen.width
    lienzoResultado.height = imagen.height
    contextoResultado.drawImage(imagen,0,0)

    botonAplicar.disabled = false
    estado.textContent = archivo.name + " (" + imagen.width + " x " + imagen.height + ")"
  }
}


// 2. Cuando pulso el botón, aplico el filtro elegido
botonAplicar.onclick = function(){

  let inicio = performance.now()

  // Cojo los píxeles del original
  let imagenDatos = contextoOriginal.getImageData(0,0,lienzoOriginal.width,lienzoOriginal.height)

  // Los modifico con el filtro
  aplicarFiltro(selectorFiltro.value, imagenDatos.data)

  // Pinto el resultado
  contextoResultado.putImageData(imagenDatos,0,0)

  let tiempo = performance.now() - inicio
  estado.textContent = "Filtro " + selectorFiltro.value + " aplicado en " + tiempo.toFixed(1) + " ms"
}
