// Worker del esclavo: analiza un paquete de ventas
// Suma el dinero por tienda y las unidades por producto

self.onmessage = function (evento) {
  const filas = evento.data.datos
  const carga = Number(evento.data.carga) || 0

  const ingresos = {}   // céntimos por tienda
  const unidades = {}   // unidades por producto
  let importeTotal = 0

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i]
    const cantidad = parseInt(fila.unidades)
    const importe = cantidad * parseInt(fila.precio_centimos)

    ingresos[fila.tienda] = (ingresos[fila.tienda] || 0) + importe
    unidades[fila.producto] = (unidades[fila.producto] || 0) + cantidad
    importeTotal += importe
  }

  // Carga artificial: simula un análisis más pesado para poder ver el reparto
  // Se divide en 10 bloques solo para poder avisar del progreso
  let acumulador = 0.5
  const porBloque = Math.ceil(carga / 10)
  for (let bloque = 0; bloque < 10; bloque++) {
    for (let i = 0; i < porBloque; i++) {
      acumulador = Math.sin(acumulador + i * 0.001) + 1.5
    }
    self.postMessage({ tipo: "progreso", valor: (bloque + 1) * 10 })
  }

  self.postMessage({
    tipo: "resultado",
    resultado: {
      ingresos: ingresos,
      unidades: unidades,
      importe_total: importeTotal,
      comprobacion: acumulador
    }
  })
}
