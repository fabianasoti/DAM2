// Iconos de la interfaz: dibujos sencillos de 24x24 trazados con líneas
// icono("cama") devuelve un elemento <svg> listo para usar

const ICONOS = {
  cama: '<path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5M7 11h.01"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  cuadricula: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.200 2.500 3.500 5.200"/>',
  llave: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3M14 9l2 2"/>',
  grafica: '<path d="M3 3v18h18M7 15l4-4 3 3 5-6"/>',
  escudo: '<path d="M12 3l8 3v6c0 4.500-3.200 8-8 9-4.800-1-8-4.500-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  herramienta: '<path d="M14.500 6.500a4 4 0 0 0 4.800 4.800L21 13l-8 8-3-3 8-8-1.500-1.500zM6 4l3 3-2 2-3-3z"/>',
  escoba: '<path d="M14 3l7 7M13 6l5 5-7 7H6l-3 3v-5l1-1 9-9z"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  cerrar: '<path d="M18 6 6 18M6 6l12 12"/>',
  descarga: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  subir: '<path d="M12 15V3M7 8l5-5 5 5M4 21h16"/>',
  lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  check: '<path d="m5 12 5 5 10-10"/>',
  entrar: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
  libro: '<path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3zM8 8h7M8 12h7"/>'
}

function icono(nombre) {
  const contenedor = document.createElement("span")
  contenedor.className = "ficha"
  // Los dibujos son texto fijo de este archivo (nunca datos del usuario)
  contenedor.innerHTML = '<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONOS[nombre] || "") + "</svg>"
  return contenedor
}
