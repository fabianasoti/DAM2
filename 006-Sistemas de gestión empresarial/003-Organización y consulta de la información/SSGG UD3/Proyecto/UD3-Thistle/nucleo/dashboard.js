class ThistleDashboard {
  constructor(contenedor = 'section') {
    this.contenedor = document.querySelector(contenedor);
  }

  async render() {
    const zona = this.contenedor;
    zona.innerHTML = '<div class="vacio">Cargando dashboard…</div>';

    try {
      // 1. Cargar todas las entidades
      const nombres = await fetch('api/superapi.php?ruta=entidades').then(r => r.json());
      const entidades = await Promise.all(nombres.map(async n => {
        const r = await fetch('api/superapi.php?ruta=tabla&tabla=' + encodeURIComponent(n));
        return r.json();
      }));

      // 2. Utilidades y cálculos (deben ir ANTES de pintar el HTML)
      const total = entidades.reduce((a, e) => a + e.registros.length, 0);
      const reg = n => entidades.find(e => e.tabla === n)?.registros ?? [];
      const frec = (n, col) => ThistleGraficas.frecuencia(reg(n), col);

      const hab = reg('habitaciones');
      const ocupadas = hab.filter(h => h.estado === 'ocupada').length;
      const ocup = Math.round(ocupadas / (hab.length || 1) * 100);

      const porEstado = frec('habitaciones', 'estado');
      const porTipo = frec('habitaciones', 'tipo');
      const porPrioridad = frec('mantenimiento', 'prioridad');

      // 3. Estructura HTML con KPIs reales
      zona.innerHTML = `
        <div class="barra">
          <div><small>VISIÓN GENERAL</small><h2>Dashboard</h2></div>
        </div>
        <div class="dashboard-kpis">
          <div><small>Ocupación</small><strong>${ocup}%</strong><span>${ocupadas} de ${hab.length} habitaciones</span></div>
          <div><small>Reservas</small><strong>${reg('reservas').length}</strong><span>registradas</span></div>
          <div><small>Incidencias de mantenimiento</small><strong>${reg('mantenimiento').length}</strong><span>abiertas en total</span></div>
          <div><small>Registros reales</small><strong>${total}</strong><span>${entidades.length} entidades</span></div>
        </div>
        <div class="dashboard-grid">
          <div class="grafica-card" id="dg1"></div>
          <div class="grafica-card" id="dg2"></div>
          <div class="grafica-card" id="dg3"></div>
          <div class="grafica-card" id="dg4"></div>
        </div>`;

      // 4. Gráficas (el HTML ya existe, así que los contenedores #dg* se encuentran)
      ThistleGraficas.crear('#dg1', 'anillo', porEstado.map(x => x[0]), porEstado.map(x => x[1]), 'Habitaciones por estado');
      ThistleGraficas.crear('#dg2', 'tarta', porTipo.map(x => x[0]), porTipo.map(x => x[1]), 'Habitaciones por tipo');
      ThistleGraficas.crear('#dg3', 'barras', entidades.map(e => e.tabla), entidades.map(e => e.registros.length), 'Registros por entidad');
      ThistleGraficas.crear('#dg4', 'horizontal', porPrioridad.map(x => x[0]), porPrioridad.map(x => x[1]), 'Incidencias por prioridad');
    } catch (e) {
      zona.textContent = 'No se pudo cargar el dashboard: ' + e.message;
    }
  }
}