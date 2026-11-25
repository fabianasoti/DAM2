// Medición del TIEMPO DE CÁLCULO por fotograma con Node (sin dibujar nada).
// Usa la misma función moverHormigas que el proyecto, cargada desde su archivo.
// Uso: node medir-node.js <ruta a proyecto/js/hormigas.js>
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads")
const fs = require("fs")
const vm = require("vm")

const ruta = isMainThread ? process.argv[2] : workerData.ruta
const lib = vm.runInThisContext(
  fs.readFileSync(ruta, "utf8") + "\n;({ moverHormigas, CAMPOS })"
)
const { moverHormigas, CAMPOS } = lib
const ANCHO = 1000
const ALTO = 600

// ---------- Código del worker ----------
if (!isMainThread) {
  let datos
  parentPort.on("message", function (m) {
    if (m.tipo === "iniciar") datos = m.datos
    if (m.tipo === "calcular") {
      moverHormigas(datos, 0, datos.length / CAMPOS, m.carga, ANCHO, ALTO)
      parentPort.postMessage({ tipo: "listo", datos: datos })
    }
  })
  return
}

// ---------- Código del hilo principal ----------
function crearHormigas(n) {
  const todas = new Float32Array(n * CAMPOS)
  for (let i = 0; i < n; i++) {
    todas[i * CAMPOS] = Math.random() * ANCHO
    todas[i * CAMPOS + 1] = Math.random() * ALTO
    todas[i * CAMPOS + 2] = Math.random() * Math.PI * 2
    todas[i * CAMPOS + 3] = 1 + Math.random() * 1.5
  }
  return todas
}

// Mide cuánto tarda un fotograma (en ms) con "numWorkers" workers (0 = hilo principal)
async function medirConfiguracion(n, carga, numWorkers, fotogramas) {
  const todas = crearHormigas(n)
  const workers = []
  let pendientes = 0
  let alTerminar = null

  const base = Math.floor(n / Math.max(numWorkers, 1))
  const resto = n % Math.max(numWorkers, 1)
  let desde = 0
  for (let w = 0; w < numWorkers; w++) {
    const cantidad = base + (w < resto ? 1 : 0)
    const worker = new Worker(__filename, { workerData: { ruta } })
    worker.desde = desde
    worker.postMessage({
      tipo: "iniciar",
      datos: todas.slice(desde * CAMPOS, (desde + cantidad) * CAMPOS)
    })
    worker.on("message", function (m) {
      todas.set(m.datos, worker.desde * CAMPOS)
      pendientes--
      if (pendientes === 0) alTerminar()
    })
    workers.push(worker)
    desde += cantidad
  }

  async function unFotograma() {
    if (numWorkers === 0) {
      moverHormigas(todas, 0, n, carga, ANCHO, ALTO)
      return
    }
    await new Promise(function (resolver) {
      alTerminar = resolver
      pendientes = workers.length
      workers.forEach(function (w) { w.postMessage({ tipo: "calcular", carga: carga }) })
    })
  }

  // Calentamiento (10 fotogramas) y medición
  for (let i = 0; i < 10; i++) await unFotograma()
  const tiempos = []
  for (let i = 0; i < fotogramas; i++) {
    const t = process.hrtime.bigint()
    await unFotograma()
    tiempos.push(Number(process.hrtime.bigint() - t) / 1e6)
  }
  for (const w of workers) await w.terminate()

  tiempos.sort(function (a, b) { return a - b })
  const media = tiempos.reduce(function (a, b) { return a + b }, 0) / tiempos.length
  return { media: media, mediana: tiempos[Math.floor(tiempos.length / 2)] }
}

async function principal() {
  const casos = [
    { n: 1000, carga: 0 },
    { n: 1000, carga: 1000 },
    { n: 1000, carga: 5000 },
    { n: 3000, carga: 5000 }
  ]
  const configuraciones = [0, 1, 2, 4, 8]

  console.log("hormigas;carga;workers;ms_media;ms_mediana;fps_maximos_teoricos")
  for (const caso of casos) {
    for (const w of configuraciones) {
      const r = await medirConfiguracion(caso.n, caso.carga, w, 60)
      console.log(
        caso.n + ";" + caso.carga + ";" + w + ";" +
        r.media.toFixed(2) + ";" + r.mediana.toFixed(2) + ";" + (1000 / r.media).toFixed(1)
      )
    }
  }
}

principal()
