// Script for dynamic functionality

// Example: Button click for course
const courseButton = document.getElementById('iniciar-curso');
if (courseButton) {
    courseButton.addEventListener('click', () => {
        alert('Iniciando curso para eximir multa.');
    });
}

// Example: Button click for paying driving license
const payButton = document.getElementById('pagar-pase');
if (payButton) {
    payButton.addEventListener('click', () => {
        alert('Redirigiendo al pago del pase de conducción.');
    });
}

// ==========================================================================
// Módulo de comparendos: registro, cálculo de descuentos por pronto pago
// (días hábiles) y notificaciones automáticas. Todo el estado vive en
// localStorage porque este proyecto es un mockup sin backend.
// ==========================================================================

const LIMITE_50 = 5;   // días hábiles desde la imposición para el 50% de descuento
const LIMITE_25 = 20;  // días hábiles desde la imposición para el 25% de descuento
const RESTANTE_ALERTA = 1; // días hábiles restantes a partir de los cuales se avisa el cierre de ventana

const STORAGE_KEY_COMPARENDOS = 'movilapp_comparendos';
const STORAGE_KEY_NOTIFICACIONES = 'movilapp_notificaciones';

// URL ilustrativa del canal oficial de pago. En un despliegue real debe
// apuntar al portal vigente del SIMIT o del organismo de tránsito competente,
// nunca a un intermediario particular (Ley 1386 de 2010).
const URL_PAGO_OFICIAL = 'https://www.simit.org.co/';

// --- Utilidades de fecha en días hábiles (no considera festivos) ---------

function esDiaHabil(fecha) {
  const dia = fecha.getDay();
  return dia !== 0 && dia !== 6;
}

function sumarDiasHabiles(fechaIso, dias) {
  const cursor = new Date(fechaIso + 'T00:00:00');
  let agregados = 0;
  while (agregados < dias) {
    cursor.setDate(cursor.getDate() + 1);
    if (esDiaHabil(cursor)) agregados++;
  }
  return cursor;
}

function restarDiasHabiles(fechaBase, dias) {
  const cursor = new Date(fechaBase);
  let restados = 0;
  while (restados < dias) {
    cursor.setDate(cursor.getDate() - 1);
    if (esDiaHabil(cursor)) restados++;
  }
  return cursor;
}

function contarDiasHabilesEntre(fechaIso, fechaFin) {
  const cursor = new Date(fechaIso + 'T00:00:00');
  const fin = new Date(fechaFin);
  fin.setHours(0, 0, 0, 0);
  let cuenta = 0;
  while (cursor < fin) {
    cursor.setDate(cursor.getDate() + 1);
    if (esDiaHabil(cursor)) cuenta++;
  }
  return cuenta;
}

function toISODate(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
}

function formatearFecha(fecha) {
  const d = (fecha instanceof Date) ? fecha : new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

// --- Persistencia ----------------------------------------------------------

function cargarComparendos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_COMPARENDOS)) || [];
  } catch (e) {
    return [];
  }
}

function guardarComparendos(lista) {
  localStorage.setItem(STORAGE_KEY_COMPARENDOS, JSON.stringify(lista));
}

function cargarNotificaciones() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_NOTIFICACIONES)) || [];
  } catch (e) {
    return [];
  }
}

function guardarNotificaciones(lista) {
  localStorage.setItem(STORAGE_KEY_NOTIFICACIONES, JSON.stringify(lista));
}

function sembrarDatosIniciales() {
  if (localStorage.getItem(STORAGE_KEY_COMPARENDOS)) return;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const semillas = [
    {
      id: 'seed-1',
      descripcion: 'Exceso de velocidad',
      ciudad: 'Facatativá',
      valorTotal: 442000,
      fecha: toISODate(restarDiasHabiles(hoy, 2)),
      leyes: ['Ley 769 de 2002 - Código Nacional de Tránsito, Artículo 131: Exceso de velocidad.']
    },
    {
      id: 'seed-2',
      descripcion: 'Semáforo en rojo',
      ciudad: 'Bogotá',
      valorTotal: 660000,
      fecha: toISODate(restarDiasHabiles(hoy, 4)),
      leyes: ['Ley 769 de 2002 - Código Nacional de Tránsito, Artículo 131: Desobedecer señales de tránsito.']
    },
    {
      id: 'seed-3',
      descripcion: 'Parqueo en zona prohibida',
      ciudad: 'Madrid',
      valorTotal: 221000,
      fecha: toISODate(restarDiasHabiles(hoy, 12)),
      leyes: ['Ley 769 de 2002 - Código Nacional de Tránsito, Artículo 124: Estacionamiento prohibido.']
    },
    {
      id: 'seed-4',
      descripcion: 'Adelantar en zona de doble línea',
      ciudad: 'Bogotá',
      valorTotal: 884000,
      fecha: toISODate(restarDiasHabiles(hoy, 25)),
      leyes: ['Ley 769 de 2002 - Código Nacional de Tránsito, Artículo 131: Adelantamiento indebido.']
    }
  ];
  guardarComparendos(semillas);
}

// --- Cálculo de escenarios ---------------------------------------------

function calcularEstadoComparendo(comparendo) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const transcurridos = contarDiasHabilesEntre(comparendo.fecha, hoy);
  const fechaCierre50 = sumarDiasHabiles(comparendo.fecha, LIMITE_50);
  const fechaCierre25 = sumarDiasHabiles(comparendo.fecha, LIMITE_25);

  let estado, restantes;
  if (transcurridos <= LIMITE_50) {
    estado = '50';
    restantes = LIMITE_50 - transcurridos;
  } else if (transcurridos <= LIMITE_25) {
    estado = '25';
    restantes = LIMITE_25 - transcurridos;
  } else {
    estado = 'vencido';
    restantes = 0;
  }

  return {
    transcurridos,
    estado,
    restantes,
    fechaCierre50,
    fechaCierre25,
    valorPago50: comparendo.valorTotal * 0.5,
    valorPago25: comparendo.valorTotal * 0.75,
    valorPagoTotal: comparendo.valorTotal
  };
}

// --- Notificaciones ------------------------------------------------------

function agregarNotificacion(comparendoId, mensaje, clave) {
  const notificaciones = cargarNotificaciones();
  if (clave && notificaciones.some(n => n.clave === clave)) return;
  const nueva = {
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    comparendoId,
    mensaje,
    fecha: new Date().toISOString(),
    leida: false,
    clave: clave || null
  };
  notificaciones.unshift(nueva);
  guardarNotificaciones(notificaciones);
  mostrarToast(mensaje);
}

function generarNotificacionesPorVencer() {
  const comparendos = cargarComparendos();
  comparendos.forEach(c => {
    const info = calcularEstadoComparendo(c);
    if (info.estado !== 'vencido' && info.restantes <= RESTANTE_ALERTA) {
      const porcentaje = info.estado === '50' ? '50%' : '25%';
      const clave = `cierre-${c.id}-${info.estado}`;
      const texto = info.restantes === 0
        ? `¡Atención! Hoy es el último día hábil para pagar "${c.descripcion}" con ${porcentaje} de descuento.`
        : `¡Atención! La ventana del ${porcentaje} de descuento para "${c.descripcion}" vence en ${info.restantes} día(s) hábil(es).`;
      agregarNotificacion(c.id, texto, clave);
    }
  });
}

function mostrarToast(mensaje) {
  const toastEl = document.getElementById('toastNotificacion');
  if (!toastEl || typeof bootstrap === 'undefined') return;
  document.getElementById('toastNotificacionMensaje').textContent = mensaje;
  const toast = new bootstrap.Toast(toastEl, { delay: 6000 });
  toast.show();
}

function renderNotificaciones() {
  const lista = document.getElementById('listaNotificaciones');
  if (!lista) return;
  const sinNotif = document.getElementById('sinNotificaciones');
  const badge = document.getElementById('badgeNotificaciones');
  const notificaciones = cargarNotificaciones();

  lista.innerHTML = '';
  if (notificaciones.length === 0) {
    sinNotif.classList.remove('d-none');
  } else {
    sinNotif.classList.add('d-none');
    notificaciones.slice(0, 20).forEach(n => {
      const li = document.createElement('li');
      li.className = 'px-3 py-2 border-bottom small' + (n.leida ? ' text-muted' : ' fw-bold');
      li.innerHTML = `<div>${n.mensaje}</div><div class="text-muted" style="font-size:0.75rem;">${new Date(n.fecha).toLocaleString('es-CO')}</div>`;
      lista.appendChild(li);
    });
  }

  const noLeidas = notificaciones.filter(n => !n.leida).length;
  if (noLeidas > 0) {
    badge.textContent = noLeidas;
    badge.classList.remove('d-none');
  } else {
    badge.classList.add('d-none');
  }
}

function marcarNotificacionesLeidas() {
  const notificaciones = cargarNotificaciones().map(n => ({ ...n, leida: true }));
  guardarNotificaciones(notificaciones);
  renderNotificaciones();
}

// --- Render de tabla -------------------------------------------------------

function badgeEstado(info) {
  if (info.estado === '50') {
    return `<span class="badge bg-success">50% vigente · ${info.restantes} día(s) hábil(es)</span>`;
  }
  if (info.estado === '25') {
    return `<span class="badge bg-warning text-dark">25% vigente · ${info.restantes} día(s) hábil(es)</span>`;
  }
  return `<span class="badge bg-secondary">Vencido · valor total</span>`;
}

function renderTablaComparendos() {
  const tbody = document.getElementById('cuerpoTablaComparendos');
  if (!tbody) return;
  const comparendos = cargarComparendos();

  tbody.innerHTML = '';
  comparendos.forEach(c => {
    const info = calcularEstadoComparendo(c);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.descripcion}</td>
      <td>${formatearFecha(c.fecha)}</td>
      <td>${c.ciudad}</td>
      <td>${formatearMoneda(c.valorTotal)}</td>
      <td>${badgeEstado(info)}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-warning text-white animated-btn me-2" data-bs-toggle="modal" data-bs-target="#detalleModal" data-multa="${c.id}">
          <i class="fas fa-chart-bar me-1"></i>Ver comparativo
        </button>
        <button class="btn btn-sm btn-success text-white animated-btn" onclick="pagarComparendo('${c.id}')">
          <i class="fas fa-credit-card me-1"></i>Pagar
        </button>
      </td>`;
    tbody.appendChild(tr);
  });
}

// --- Modal de comparativo ----------------------------------------------

function llenarModalComparendo(id) {
  const c = cargarComparendos().find(x => String(x.id) === String(id));
  if (!c) return;
  const info = calcularEstadoComparendo(c);

  document.getElementById('multaDescripcion').textContent = c.descripcion;
  document.getElementById('multaFecha').textContent = formatearFecha(c.fecha);
  document.getElementById('multaCiudad').textContent = c.ciudad;
  document.getElementById('multaValorTotal').textContent = formatearMoneda(c.valorTotal);

  document.getElementById('valorDescuento50').textContent = formatearMoneda(info.valorPago50);
  document.getElementById('ahorroDescuento50').textContent = formatearMoneda(c.valorTotal - info.valorPago50);
  document.getElementById('plazoDescuento50').textContent = `Válido hasta el ${formatearFecha(info.fechaCierre50)}`;

  document.getElementById('valorDescuento25').textContent = formatearMoneda(info.valorPago25);
  document.getElementById('ahorroDescuento25').textContent = formatearMoneda(c.valorTotal - info.valorPago25);
  document.getElementById('plazoDescuento25').textContent = `Válido hasta el ${formatearFecha(info.fechaCierre25)}`;

  document.getElementById('valorTotalPago').textContent = formatearMoneda(info.valorPagoTotal);
  document.getElementById('perdidaValorTotal').textContent = formatearMoneda(c.valorTotal - info.valorPago50);

  ['cardDescuento50', 'cardDescuento25', 'cardValorTotal'].forEach(cid => {
    document.getElementById(cid).classList.remove('border-4', 'shadow');
  });
  const alerta = document.getElementById('alertaEstado');
  if (info.estado === '50') {
    document.getElementById('cardDescuento50').classList.add('border-4', 'shadow');
    alerta.className = 'alert alert-success';
    alerta.innerHTML = `<i class="fas fa-clock me-1"></i>Puedes pagar con <strong>50% de descuento</strong>. Te quedan <strong>${info.restantes} día(s) hábil(es)</strong> (hasta el ${formatearFecha(info.fechaCierre50)}).`;
  } else if (info.estado === '25') {
    document.getElementById('cardDescuento25').classList.add('border-4', 'shadow');
    alerta.className = 'alert alert-warning';
    alerta.innerHTML = `<i class="fas fa-clock me-1"></i>La ventana del 50% venció. Puedes pagar con <strong>25% de descuento</strong>. Te quedan <strong>${info.restantes} día(s) hábil(es)</strong> (hasta el ${formatearFecha(info.fechaCierre25)}).`;
  } else {
    document.getElementById('cardValorTotal').classList.add('border-4', 'shadow');
    alerta.className = 'alert alert-danger';
    alerta.innerHTML = `<i class="fas fa-exclamation-triangle me-1"></i>Las ventanas de descuento vencieron. Debes pagar el <strong>valor total</strong>.`;
  }

  const leyesList = document.getElementById('multaLeyes');
  const seccionLeyes = document.getElementById('seccionLeyes');
  if (c.leyes && c.leyes.length) {
    seccionLeyes.classList.remove('d-none');
    leyesList.innerHTML = '';
    c.leyes.forEach(ley => {
      const li = document.createElement('li');
      li.textContent = ley;
      leyesList.appendChild(li);
    });
  } else {
    seccionLeyes.classList.add('d-none');
  }

  document.getElementById('btnPagarModal').setAttribute('data-multa', c.id);
}

// --- Pago (redirección al canal oficial) --------------------------------

function pagarComparendo(id) {
  const c = cargarComparendos().find(x => String(x.id) === String(id));
  if (!c) return;
  const info = calcularEstadoComparendo(c);

  let valorAPagar, detalle;
  if (info.estado === '50') {
    valorAPagar = info.valorPago50;
    detalle = `con 50% de descuento`;
  } else if (info.estado === '25') {
    valorAPagar = info.valorPago25;
    detalle = `con 25% de descuento`;
  } else {
    valorAPagar = info.valorPagoTotal;
    detalle = `sin descuento (ventanas vencidas)`;
  }

  const mensaje =
    `Serás redirigido al canal oficial de pago (SIMIT / organismo de tránsito).\n\n` +
    `Valor a pagar ${detalle}: ${formatearMoneda(valorAPagar)}.\n\n` +
    `MovilApp no solicita ni almacena datos financieros; el pago se realiza directamente en el portal oficial.\n\n¿Continuar?`;

  if (confirm(mensaje)) {
    window.open(URL_PAGO_OFICIAL, '_blank', 'noopener');
  }
}

// --- Inicialización (solo aplica en multas.html) --------------------------

document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('cuerpoTablaComparendos');
  if (!tbody) return;

  sembrarDatosIniciales();

  document.getElementById('btnNotificaciones').addEventListener('click', () => {
    setTimeout(marcarNotificacionesLeidas, 800);
  });

  const detalleModal = document.getElementById('detalleModal');
  detalleModal.addEventListener('show.bs.modal', event => {
    const boton = event.relatedTarget;
    llenarModalComparendo(boton.getAttribute('data-multa'));
  });

  document.getElementById('btnPagarModal').addEventListener('click', function () {
    pagarComparendo(this.getAttribute('data-multa'));
  });

  generarNotificacionesPorVencer();
  renderTablaComparendos();
  renderNotificaciones();
});
