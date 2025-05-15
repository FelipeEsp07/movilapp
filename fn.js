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

const multasData = {
  1: {
    descripcion: "Exceso de velocidad",
    fecha: "2025-04-20",
    monto: "$150.000",
    ciudad: "Facatativá",
    leyes: [
      "Ley 769 - Código Nacional de Tránsito, Artículo 131: Exceso de velocidad.",
      "Ley 1801 - Código Nacional de Policía, Artículo 131: Conductas contrarias a la seguridad vial."
    ],
    detalle: "El infractor excedió el límite máximo permitido en zona urbana, poniendo en riesgo la seguridad de peatones y otros conductores."
  },
  2: {
    descripcion: "Parqueo en zona prohibida",
    fecha: "2025-03-15",
    monto: "$120.000",
    ciudad: "Madrid",
    leyes: [
      "Ley 769 - Código Nacional de Tránsito, Artículo 124: Estacionamiento prohibido.",
      "Ley 1801 - Código Nacional de Policía, Artículo 136: Infracciones de tránsito."
    ],
    detalle: "El vehículo fue estacionado en una zona destinada para emergencia y acceso vehicular restringido."
  }
};

const detalleModal = document.getElementById('detalleModal');

detalleModal.addEventListener('show.bs.modal', event => {
  const button = event.relatedTarget;
  const multaId = button.getAttribute('data-multa');
  const multa = multasData[multaId];

  document.getElementById('multaDescripcion').textContent = multa.descripcion;
  document.getElementById('multaFecha').textContent = multa.fecha;
  document.getElementById('multaMonto').textContent = multa.monto;
  document.getElementById('multaCiudad').textContent = multa.ciudad;

  const leyesList = document.getElementById('multaLeyes');
  leyesList.innerHTML = '';
  multa.leyes.forEach(ley => {
    const li = document.createElement('li');
    li.textContent = ley;
    leyesList.appendChild(li);
  });

  document.getElementById('multaDetalle').textContent = multa.detalle;
});

