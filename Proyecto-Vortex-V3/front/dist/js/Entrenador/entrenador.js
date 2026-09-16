// front/dist/js/entrenador.js
// Panel de Entrenador: usuarios (clientes) asignados, sus ejercicios/peso y sus rutinas.

let idEntrenador = null;
let clienteActivo = null; // { id_persona, nombre }
let ejerciciosCache = [];
let rutinaDetalleActual = null; // id_rutinas cuyo detalle está abierto en el modal

document.addEventListener('DOMContentLoaded', async function () {
    const usuario = await requiereSesion(['Entrenador', 'Administrador']);
    if (!usuario) return;

    idEntrenador = usuario.id_persona;

    await cargarEjercicios();
    await cargarClientes();
    await cargarCatalogoRutinas();

    document.getElementById('formAsignarCliente').addEventListener('submit', asignarCliente);
    document.getElementById('formNuevaActividad').addEventListener('submit', crearActividad);
    document.getElementById('formCrearRutina').addEventListener('submit', crearRutina);
    document.getElementById('formAsignarRutinaExistente').addEventListener('submit', asignarRutinaExistente);
    document.getElementById('formAgregarEjercicioRutina').addEventListener('submit', agregarEjercicioARutina);

    // Delegación de eventos para botones dentro de tablas dinámicas
    document.getElementById('tablaClientes').addEventListener('click', onClickTablaClientes);
    document.getElementById('tablaActividad').addEventListener('click', onClickTablaActividad);
    document.getElementById('tablaRutinasCliente').addEventListener('click', onClickTablaRutinasCliente);
    document.getElementById('tablaEjerciciosRutina').addEventListener('click', onClickEjerciciosRutina);
});

/* ===================== CLIENTES ===================== */

async function cargarClientes() {
    const res = await API.request(`/entrenadores/${idEntrenador}/clientes`, 'GET');
    const tbody = document.querySelector('#tablaClientes tbody');
    const contador = document.getElementById('cantidadClientes');
    tbody.innerHTML = '';

    if (res.status !== 'ok') {
        contador.textContent = '0';
        return;
    }

    contador.textContent = res.cantidad;

    if (res.clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">Todavía no tenés clientes asignados</td></tr>';
        return;
    }

    res.clientes.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.nombre}</td>
            <td>${c.email}</td>
            <td>${c.fecha_asignacion}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-light" data-accion="ver" data-id="${c.id_persona}" data-nombre="${c.nombre}">Ver ficha</button>
                <button class="btn btn-sm btn-outline-danger" data-accion="quitar" data-id="${c.id_persona}">Quitar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

async function asignarCliente(e) {
    e.preventDefault();
    const idCliente = document.getElementById('inputIdCliente').value;
    const res = await API.request(`/entrenadores/${idEntrenador}/clientes`, 'POST', { id_cliente: idCliente });
    avisar('msgClientes', res);
    if (res.status === 'ok') {
        document.getElementById('formAsignarCliente').reset();
        cargarClientes();
    }
}

function onClickTablaClientes(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;

    if (btn.dataset.accion === 'ver') {
        seleccionarCliente(id, btn.dataset.nombre);
    } else if (btn.dataset.accion === 'quitar') {
        quitarCliente(id);
    }
}

async function quitarCliente(idCliente) {
    if (!confirm('¿Quitar este cliente de tu lista?')) return;
    const res = await API.request(`/entrenadores/${idEntrenador}/clientes/${idCliente}`, 'DELETE');
    avisar('msgClientes', res);
    if (res.status === 'ok') cargarClientes();
}

function seleccionarCliente(idCliente, nombre) {
    clienteActivo = { id_persona: idCliente, nombre };
    document.getElementById('fichaClienteNombre').textContent = nombre;
    document.getElementById('panelFicha').classList.remove('d-none');
    cargarActividad(idCliente);
    cargarRutinasCliente(idCliente);
    document.getElementById('panelFicha').scrollIntoView({ behavior: 'smooth' });
}

/* ===================== EJERCICIOS / ACTIVIDAD (incluye peso) ===================== */

async function cargarEjercicios() {
    const res = await API.request('/ejercicios', 'GET');
    if (res.status !== 'ok') return;
    ejerciciosCache = res.ejercicios;

    const selects = [document.getElementById('actividadEjercicio'), document.getElementById('rutinaEjercicioSelect')];
    selects.forEach(sel => {
        if (!sel) return;
        sel.innerHTML = ejerciciosCache.map(ej => `<option value="${ej.id_ejercicio}">${ej.nombre} (${ej.grupo_muscular})</option>`).join('');
    });
}

async function cargarActividad(idCliente) {
    const res = await API.request(`/clientes/${idCliente}/actividad`, 'GET');
    const tbody = document.querySelector('#tablaActividad tbody');
    tbody.innerHTML = '';

    if (res.status !== 'ok' || res.registros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">Sin actividad registrada</td></tr>';
        return;
    }

    res.registros.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.ejercicio}</td>
            <td>${r.fecha}</td>
            <td>${r.series}</td>
            <td>${r.peso_kg ?? '-'} kg</td>
            <td>${r.calorias_quemadas}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-light" data-accion="editar" data-id="${r.id_registro}" data-peso="${r.peso_kg ?? ''}" data-series="${r.series}">Editar</button>
                <button class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="${r.id_registro}">Borrar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

async function crearActividad(e) {
    e.preventDefault();
    if (!clienteActivo) return;

    const datos = {
        id_ejercicio: document.getElementById('actividadEjercicio').value,
        fecha: document.getElementById('actividadFecha').value || undefined,
        series: document.getElementById('actividadSeries').value || 1,
        peso_kg: document.getElementById('actividadPeso').value || null,
    };

    const res = await API.request(`/clientes/${clienteActivo.id_persona}/actividad`, 'POST', datos);
    avisar('msgActividad', res);
    if (res.status === 'ok') {
        document.getElementById('formNuevaActividad').reset();
        cargarActividad(clienteActivo.id_persona);
    }
}

function onClickTablaActividad(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.dataset.accion === 'eliminar') {
        eliminarActividad(btn.dataset.id);
    } else if (btn.dataset.accion === 'editar') {
        editarActividad(btn.dataset.id, btn.dataset.peso, btn.dataset.series);
    }
}

async function editarActividad(idRegistro, pesoActual, seriesActual) {
    const nuevoPeso = prompt('Peso levantado (kg):', pesoActual);
    if (nuevoPeso === null) return;
    const nuevasSeries = prompt('Series:', seriesActual);
    if (nuevasSeries === null) return;

    const res = await API.request(`/actividad/${idRegistro}`, 'PUT', { peso_kg: nuevoPeso, series: nuevasSeries });
    avisar('msgActividad', res);
    if (res.status === 'ok' && clienteActivo) cargarActividad(clienteActivo.id_persona);
}

async function eliminarActividad(idRegistro) {
    if (!confirm('¿Eliminar este registro?')) return;
    const res = await API.request(`/actividad/${idRegistro}`, 'DELETE');
    avisar('msgActividad', res);
    if (res.status === 'ok' && clienteActivo) cargarActividad(clienteActivo.id_persona);
}

/* ===================== RUTINAS ===================== */

async function cargarCatalogoRutinas() {
    const res = await API.request('/rutinas', 'GET');
    const sel = document.getElementById('rutinaExistenteSelect');
    if (res.status !== 'ok' || !sel) return;
    sel.innerHTML = res.rutinas.map(r => `<option value="${r.id_rutinas}">${r.nombre} (${r.dias_semana || 'sin días'})</option>`).join('');
}

async function cargarRutinasCliente(idCliente) {
    const res = await API.request(`/clientes/${idCliente}/rutinas`, 'GET');
    const tbody = document.querySelector('#tablaRutinasCliente tbody');
    tbody.innerHTML = '';

    if (res.status !== 'ok' || res.rutinas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-secondary">Sin rutinas asignadas</td></tr>';
        return;
    }

    res.rutinas.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.nombre}</td>
            <td>${r.dias_semana || '-'}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-light" data-accion="detalle" data-id="${r.id_rutinas}">Ver ejercicios</button>
                <button class="btn btn-sm btn-outline-danger" data-accion="quitar" data-id="${r.id_rutinas}">Quitar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

async function crearRutina(e) {
    e.preventDefault();
    const nombre = document.getElementById('rutinaNombre').value;
    const dias = document.getElementById('rutinaDias').value;

    const res = await API.request('/rutinas', 'POST', { nombre, dias_semana: dias });
    avisar('msgRutinas', res);
    if (res.status === 'ok') {
        document.getElementById('formCrearRutina').reset();
        cargarCatalogoRutinas();
    }
}

async function asignarRutinaExistente(e) {
    e.preventDefault();
    if (!clienteActivo) return;
    const idRutina = document.getElementById('rutinaExistenteSelect').value;

    const res = await API.request(`/clientes/${clienteActivo.id_persona}/rutinas`, 'POST', { id_rutinas: idRutina });
    avisar('msgRutinas', res);
    if (res.status === 'ok') cargarRutinasCliente(clienteActivo.id_persona);
}

function onClickTablaRutinasCliente(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.dataset.accion === 'detalle') {
        verDetalleRutina(btn.dataset.id);
    } else if (btn.dataset.accion === 'quitar') {
        quitarRutinaDeCliente(btn.dataset.id);
    }
}

async function quitarRutinaDeCliente(idRutina) {
    if (!clienteActivo || !confirm('¿Quitar esta rutina del cliente?')) return;
    const res = await API.request(`/clientes/${clienteActivo.id_persona}/rutinas/${idRutina}`, 'DELETE');
    avisar('msgRutinas', res);
    if (res.status === 'ok') cargarRutinasCliente(clienteActivo.id_persona);
}

async function verDetalleRutina(idRutina) {
    const res = await API.request(`/rutinas/${idRutina}`, 'GET');
    if (res.status !== 'ok') return;

    rutinaDetalleActual = idRutina;
    document.getElementById('detalleRutinaNombre').textContent = res.rutina.nombre + ' — ' + (res.rutina.dias_semana || 'sin días asignados');
    renderEjerciciosRutina(res.rutina.ejercicios);

    const modal = new bootstrap.Modal(document.getElementById('modalDetalleRutina'));
    modal.show();
}

function renderEjerciciosRutina(ejercicios) {
    const tbody = document.querySelector('#tablaEjerciciosRutina tbody');
    tbody.innerHTML = '';

    if (!ejercicios || ejercicios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-secondary">Esta rutina no tiene ejercicios todavía</td></tr>';
        return;
    }

    ejercicios.forEach(ej => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ej.nombre}</td>
            <td>${ej.grupo_muscular}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-danger" data-id="${ej.id_ejercicio}">Quitar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

async function agregarEjercicioARutina(e) {
    e.preventDefault();
    if (!rutinaDetalleActual) return;
    const idEjercicio = document.getElementById('rutinaEjercicioSelect').value;

    const res = await API.request(`/rutinas/${rutinaDetalleActual}/ejercicios`, 'POST', { id_ejercicio: idEjercicio });
    if (res.status === 'ok') verDetalleRutina(rutinaDetalleActual);
}

function onClickEjerciciosRutina(e) {
    const btn = e.target.closest('button');
    if (!btn || !rutinaDetalleActual) return;
    quitarEjercicioDeRutina(btn.dataset.id);
}

async function quitarEjercicioDeRutina(idEjercicio) {
    const res = await API.request(`/rutinas/${rutinaDetalleActual}/ejercicios/${idEjercicio}`, 'DELETE');
    if (res.status === 'ok') verDetalleRutina(rutinaDetalleActual);
}

/* ===================== UTILIDAD ===================== */

function avisar(contenedorId, res) {
    const el = document.getElementById(contenedorId);
    if (!el) return;
    el.textContent = res.message || (res.status === 'ok' ? 'Listo' : 'Ocurrió un error');
    el.className = 'small mt-2 ' + (res.status === 'ok' ? 'text-success' : 'text-danger');
}
