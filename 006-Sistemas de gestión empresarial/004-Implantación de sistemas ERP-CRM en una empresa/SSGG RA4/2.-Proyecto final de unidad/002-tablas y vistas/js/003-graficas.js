// Gráficas SVG hechas a mano (sin librerías): barras, líneas y anillo.
// Cada elemento lleva un <title>: al pasar el ratón por encima se ve su valor.

const Graficas = {
  colores: ["var(--blackthorn-berry)", "var(--foxglove-strong)", "var(--willow-leaf)", "var(--wild-honeysuckle)",
    "var(--cowslip-meadow)", "var(--dog-rose)"],
  ns: "http://www.w3.org/2000/svg",

  // Crea un elemento SVG con sus atributos
  nodo: function (etiqueta, atributos, texto) {
    const e = document.createElementNS(this.ns, etiqueta)
    for (const clave in (atributos || {})) { e.setAttribute(clave, atributos[clave]) }
    if (texto !== undefined) { e.textContent = texto }
    return e
  },

  lienzo: function (ancho, alto) {
    return this.nodo("svg", { viewBox: "0 0 " + ancho + " " + alto, role: "img" })
  },

  // Valor máximo "redondo" para el eje (por ejemplo 83 -> 100)
  maximoEje: function (valor) {
    if (valor <= 0) { return 1 }
    const potencia = Math.pow(10, Math.floor(Math.log10(valor)))
    const pasos = [1, 2, 2.5, 5, 10]
    for (const p of pasos) { if (valor <= p * potencia) { return p * potencia } }
    return 10 * potencia
  },

  // Líneas horizontales del fondo con su valor
  rejilla: function (svg, izq, der, arriba, abajo, maximo, formato) {
    for (let i = 0; i <= 4; i++) {
      const y = abajo - (abajo - arriba) * i / 4
      svg.append(this.nodo("line", { x1: izq, x2: der, y1: y, y2: y, stroke: "var(--silver-birch)", "stroke-width": 1 }))
      svg.append(this.nodo("text", { x: izq - 6, y: y + 4, "text-anchor": "end" }, formato(maximo * i / 4)))
    }
  },

  // Barras agrupadas. series: [{ nombre, valores, color }]
  barras: function (contenedor, etiquetas, series, formato, maximoFijo) {
    const ancho = 560, alto = 250, izq = 46, der = 548, arriba = 12, abajo = 206
    const svg = this.lienzo(ancho, alto)
    const maximo = maximoFijo || this.maximoEje(Math.max.apply(null, series.map(function (s) { return Math.max.apply(null, s.valores) })))
    this.rejilla(svg, izq, der, arriba, abajo, maximo, formato)

    const anchoGrupo = (der - izq) / etiquetas.length
    const anchoBarra = Math.min(26, (anchoGrupo - 6) / series.length)
    etiquetas.forEach((etiqueta, i) => {
      const inicio = izq + i * anchoGrupo + (anchoGrupo - anchoBarra * series.length) / 2
      series.forEach((serie, k) => {
        const valor = serie.valores[i]
        const altura = (abajo - arriba) * valor / maximo
        const barra = this.nodo("rect", {
          x: inicio + k * anchoBarra, y: abajo - altura, width: anchoBarra - 2, height: Math.max(altura, 0), rx: 3,
          style: "fill:" + (serie.color || this.colores[k])
        })
        barra.append(this.nodo("title", {}, etiqueta + " · " + serie.nombre + ": " + formato(valor)))
        svg.append(barra)
      })
      svg.append(this.nodo("text", { x: izq + i * anchoGrupo + anchoGrupo / 2, y: abajo + 16, "text-anchor": "middle" }, etiqueta))
    })
    contenedor.append(svg)
  },

  // Líneas con puntos. series: [{ nombre, valores, color }]
  lineas: function (contenedor, etiquetas, series, formato) {
    const ancho = 560, alto = 250, izq = 46, der = 548, arriba = 12, abajo = 206
    const svg = this.lienzo(ancho, alto)
    const maximo = this.maximoEje(Math.max.apply(null, series.map(function (s) { return Math.max.apply(null, s.valores) })))
    this.rejilla(svg, izq, der, arriba, abajo, maximo, formato)

    const paso = (der - izq) / etiquetas.length
    series.forEach((serie, k) => {
      const color = serie.color || this.colores[k]
      const puntos = serie.valores.map(function (v, i) {
        return [izq + paso * i + paso / 2, abajo - (abajo - arriba) * v / maximo]
      })
      svg.append(this.nodo("polyline", { points: puntos.map(function (p) { return p.join(",") }).join(" "), fill: "none", style: "stroke:" + color, "stroke-width": 2.5, "stroke-linejoin": "round" }))
      puntos.forEach((p, i) => {
        const punto = this.nodo("circle", { cx: p[0], cy: p[1], r: 4, style: "fill:" + color })
        punto.append(this.nodo("title", {}, etiquetas[i] + " · " + serie.nombre + ": " + formato(serie.valores[i])))
        svg.append(punto)
      })
    })
    etiquetas.forEach((etiqueta, i) => {
      svg.append(this.nodo("text", { x: izq + paso * i + paso / 2, y: abajo + 16, "text-anchor": "middle" }, etiqueta))
    })
    contenedor.append(svg)
  },

  // Anillo con leyenda a la derecha. datos: [{ etiqueta, valor }]
  anillo: function (contenedor, datos, formato) {
    const svg = this.lienzo(560, 220)
    const total = datos.reduce(function (suma, d) { return suma + d.valor }, 0)
    const cx = 110, cy = 110, radio = 90, interior = 56
    if (total <= 0) {
      svg.append(this.nodo("text", { x: 280, y: 110, "text-anchor": "middle" }, "Sin datos"))
      contenedor.append(svg)
      return
    }
    let angulo = -Math.PI / 2
    datos.forEach((d, i) => {
      const fraccion = d.valor / total
      const fin = angulo + fraccion * Math.PI * 2
      const punto = function (r, a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)] }
      const a = punto(radio, angulo), b = punto(radio, fin), c = punto(interior, fin), e = punto(interior, angulo)
      const grande = fraccion > 0.5 ? 1 : 0
      const trozo = this.nodo("path", {
        d: "M" + a.join(",") + " A" + radio + "," + radio + " 0 " + grande + " 1 " + b.join(",") + " L" + c.join(",") + " A" + interior + "," + interior + " 0 " + grande + " 0 " + e.join(",") + " Z",
        style: "fill:" + this.colores[i % this.colores.length], stroke: "#fff", "stroke-width": 2
      })
      trozo.append(this.nodo("title", {}, d.etiqueta + ": " + formato(d.valor) + " (" + (fraccion * 100).toFixed(1) + " %)"))
      svg.append(trozo)
      angulo = fin
    })
    svg.append(this.nodo("text", { x: cx, y: cy + 5, "text-anchor": "middle", style: "font-size:15px;font-weight:700;fill:var(--blackthorn-berry)" }, formato(total)))
    datos.forEach((d, i) => {
      const y = 50 + i * 28
      svg.append(this.nodo("rect", { x: 250, y: y - 10, width: 12, height: 12, rx: 3, style: "fill:" + this.colores[i % this.colores.length] }))
      svg.append(this.nodo("text", { x: 270, y: y, style: "font-size:12px" }, d.etiqueta + " · " + (d.valor / total * 100).toFixed(1) + " %"))
    })
    contenedor.append(svg)
  },

  // Leyenda de una gráfica de varias series
  leyenda: function (series) {
    return h("div", { class: "leyenda-grafica" }, series.map(function (s, k) {
      return h("span", {}, h("i", { style: "background:" + (s.color || Graficas.colores[k]) }), s.nombre)
    }))
  }
}
