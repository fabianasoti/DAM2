// Lógica de las hormigas.
// Este archivo lo usan los dos: el hilo principal (sin workers) y cada worker,
// así la comparación es justa: el cálculo es exactamente el mismo.

// Cada hormiga ocupa 4 números seguidos en el array: x, y, ángulo y velocidad
const CAMPOS = 4

// Mueve las hormigas desde la posición "desde" hasta "hasta" (sin incluir esta)
// "carga" es cuánto tiene que pensar cada hormiga en cada fotograma
function moverHormigas(datos, desde, hasta, carga, ancho, alto) {
  for (let i = desde; i < hasta; i++) {
    const p = i * CAMPOS
    let x = datos[p]
    let y = datos[p + 1]
    let angulo = datos[p + 2]
    const velocidad = datos[p + 3]

    // La hormiga "piensa el camino": cuanta más carga, más cuentas tiene que hacer
    let suma = 0
    for (let k = 0; k < carga; k++) {
      suma += Math.sin(angulo + k * 0.37)
    }
    // El resultado de la cuenta influye un poco en el giro (así no es trabajo inútil)
    const giro = carga > 0 ? suma / carga : 0

    // Gira un poquito al azar y avanza
    angulo += (Math.random() - 0.5) * 0.4 + giro * 0.05
    x += Math.cos(angulo) * velocidad
    y += Math.sin(angulo) * velocidad

    // Rebota en las paredes
    if (x < 0) { x = 0; angulo = Math.PI - angulo }
    if (x > ancho) { x = ancho; angulo = Math.PI - angulo }
    if (y < 0) { y = 0; angulo = -angulo }
    if (y > alto) { y = alto; angulo = -angulo }

    datos[p] = x
    datos[p + 1] = y
    datos[p + 2] = angulo
  }
}
