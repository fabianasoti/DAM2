// Filtros de imagen.
// Cada filtro recibe el array de píxeles (R,G,B,A,R,G,B,A,...) y lo modifica.
// No usa nada de la página (DOM), así más adelante lo podrá usar un worker.

function grises(pixeles){
  for(let i = 0; i < pixeles.length; i += 4){
    let gris =
      pixeles[i]   * 0.299 +
      pixeles[i+1] * 0.587 +
      pixeles[i+2] * 0.114

    pixeles[i]   = gris
    pixeles[i+1] = gris
    pixeles[i+2] = gris
  }
}

function sepia(pixeles){
  for(let i = 0; i < pixeles.length; i += 4){
    let r = pixeles[i]
    let g = pixeles[i+1]
    let b = pixeles[i+2]

    pixeles[i]   = r * 0.393 + g * 0.769 + b * 0.189
    pixeles[i+1] = r * 0.349 + g * 0.686 + b * 0.168
    pixeles[i+2] = r * 0.272 + g * 0.534 + b * 0.131
  }
}

function negativo(pixeles){
  for(let i = 0; i < pixeles.length; i += 4){
    pixeles[i]   = 255 - pixeles[i]
    pixeles[i+1] = 255 - pixeles[i+1]
    pixeles[i+2] = 255 - pixeles[i+2]
  }
}

function brillo(pixeles){
  let cantidad = 50
  for(let i = 0; i < pixeles.length; i += 4){
    pixeles[i]   += cantidad
    pixeles[i+1] += cantidad
    pixeles[i+2] += cantidad
  }
}

// Lista de filtros disponibles: nombre -> función
const filtros = {
  grises: grises,
  sepia: sepia,
  negativo: negativo,
  brillo: brillo
}

// Aplica el filtro que se pida por nombre
function aplicarFiltro(nombre, pixeles){
  filtros[nombre](pixeles)
}
