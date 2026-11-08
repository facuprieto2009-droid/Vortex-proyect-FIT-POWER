// front/dist/js/entrenador.js
// Panel de Entrenador: usuarios (clientes) asignados, sus ejercicios/peso y sus rutinas.

let idEntrenador = null;
let clienteActivo = null; // { id_persona, nombre }
let ejerciciosCache = [];
let rutinaDetalleActual = null; // id_rutinas cuyo detalle está abierto en el modal
let rutinaEditandoId = null;    // id_rutinas que se está editando en el modal
let ejercicioEditandoId = null; // id_ejercicio que se está editando en el modal
let rutinaAsignandoId = null;   // id_rutinas que se está asignando a clientes
let clientesCache = [];         // clientes a cargo del entrenador (para el modal de asignar)

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
    document.getElementById('formCrearEjercicio').addEventListener('submit', crearEjercicio);
    document.getElementById('formEditarEjercicio').addEventListener('submit', guardarEjercicio);
    document.getElementById('tablaEjercicios').addEventListener('click', onClickTablaEjercicios);
    // Al cerrar el modal de video se vacía el contenedor para que el video deje de reproducirse
    document.getElementById('modalVerVideo').addEventListener('hidden.bs.modal', () => {
        document.getElementById('contenedorVideo').innerHTML = '';
    });
    document.getElementById('formEditarRutina').addEventListener('submit', guardarRutina);
    document.getElementById('formAsignarRutinaClientes').addEventListener('submit', asignarRutinaAClientes);
    document.getElementById('tablaRutinas').addEventListener('click', onClickTablaRutinas);
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
    clientesCache = res.clientes;

    if (res.clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">Todavía no tenés clientes asignados</td></tr>';
        return;
    }

    res.clientes.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${esc(c.nombre)}</td>
            <td>${esc(c.email)}</td>
            <td>${c.fecha_asignacion}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-light" data-accion="ver" data-id="${c.id_persona}" data-nombre="${esc(c.nombre)}">Ver ficha</button>
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

    const selects = [document.getElementById('actividadEjercicio'), document.getElementById('rutinaEjercicioSelect'), document.getElementById('rutinaEjerciciosNuevos')];
    selects.forEach(sel => {
        if (!sel) return;
        sel.innerHTML = ejerciciosCache.map(ej => `<option value="${ej.id_ejercicio}">${esc(ej.nombre)} (${esc(ej.grupo_muscular)})</option>`).join('');
    });

    renderTablaEjercicios();
}

function renderTablaEjercicios() {
    const tbody = document.querySelector('#tablaEjercicios tbody');
    tbody.innerHTML = '';

    if (ejerciciosCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">Sin ejercicios</td></tr>';
        return;
    }

    ejerciciosCache.forEach(ej => {
        const tr = document.createElement('tr');
        const videoTag = ej.video_url
            ? `<button class="btn btn-sm btn-outline-light" data-accion="video" data-id="${ej.id_ejercicio}">▶ Ver video</button>`
            : '<span class="text-secondary small">Sin video</span>';
        tr.innerHTML = `
            <td>${esc(ej.nombre)}</td>
            <td>${esc(ej.grupo_muscular)}</td>
            <td>${videoTag}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-light" data-accion="editar" data-id="${ej.id_ejercicio}">Editar</button>
                <button class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="${ej.id_ejercicio}">Eliminar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

function onClickTablaEjercicios(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;

    switch (btn.dataset.accion) {
        case 'video':    verVideoEjercicio(id); break;
        case 'editar':   abrirEdicionEjercicio(id); break;
        case 'eliminar': eliminarEjercicio(id); break;
    }
}

function datosFormularioEjercicio(prefijo) {
    return {
        nombre: document.getElementById(`${prefijo}EjercicioNombre`).value,
        grupo_muscular: document.getElementById(`${prefijo}EjercicioGrupo`).value,
        descripcion: document.getElementById(`${prefijo}EjercicioDescripcion`).value,
        calorias_por_unidad: document.getElementById(`${prefijo}EjercicioCalorias`).value || 0,
        video_url: document.getElementById(`${prefijo}EjercicioVideo`).value,
    };
}

async function crearEjercicio(e) {
    e.preventDefault();

    const res = await API.request('/ejercicios', 'POST', datosFormularioEjercicio('nuevo'));
    if (res.status !== 'ok') {
        avisar('msgCrearEjercicio', res); // el error se muestra dentro del modal, sin cerrarlo
        return;
    }

    avisar('msgEjercicios', res);
    document.getElementById('formCrearEjercicio').reset();
    document.getElementById('msgCrearEjercicio').textContent = '';
    bootstrap.Modal.getInstance(document.getElementById('modalCrearEjercicio')).hide();
    cargarEjercicios();
}

async function abrirEdicionEjercicio(idEjercicio) {
    const res = await API.request(`/ejercicios/${idEjercicio}`, 'GET');
    if (res.status !== 'ok') {
        avisar('msgEjercicios', res);
        return;
    }

    ejercicioEditandoId = idEjercicio;
    const ej = res.ejercicio;
    document.getElementById('editEjercicioNombre').value = ej.nombre;
    document.getElementById('editEjercicioGrupo').value = ej.grupo_muscular;
    document.getElementById('editEjercicioDescripcion').value = ej.descripcion || '';
    document.getElementById('editEjercicioCalorias').value = ej.calorias_por_unidad;
    document.getElementById('editEjercicioVideo').value = ej.video_url || '';
    document.getElementById('msgEditarEjercicio').textContent = '';

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarEjercicio')).show();
}

async function guardarEjercicio(e) {
    e.preventDefault();
    if (!ejercicioEditandoId) return;

    const res = await API.request(`/ejercicios/${ejercicioEditandoId}`, 'PUT', datosFormularioEjercicio('edit'));
    if (res.status !== 'ok') {
        avisar('msgEditarEjercicio', res);
        return;
    }

    avisar('msgEjercicios', res);
    bootstrap.Modal.getInstance(document.getElementById('modalEditarEjercicio')).hide();
    await cargarEjercicios();
    cargarCatalogoRutinas(); // por si el nombre cambió y se muestra en algún lado
}

async function eliminarEjercicio(idEjercicio) {
    if (!confirm('¿Eliminar este ejercicio? También se va a quitar de todas las rutinas que lo incluyan. Esta acción no se puede deshacer.')) return;
    const res = await API.request(`/ejercicios/${idEjercicio}`, 'DELETE');
    avisar('msgEjercicios', res);
    if (res.status === 'ok') {
        await cargarEjercicios();
        cargarCatalogoRutinas(); // actualiza el contador de ejercicios por rutina
    }
}

/* ===================== VIDEO DEL EJERCICIO ===================== */

// Convierte el enlace guardado en algo reproducible dentro de la página.
// Devuelve { tipo: 'iframe' | 'video', src } o null si no se reconoce el formato.
function videoReproducible(urlTexto) {
    let url;
    try { url = new URL(urlTexto); } catch (_) { return null; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    const host = url.hostname.replace(/^www\./, '');
    const idYoutube = /^[A-Za-z0-9_-]{11}$/;

    if (host === 'youtu.be') {
        const id = url.pathname.slice(1);
        if (idYoutube.test(id)) return { tipo: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
        const partes = url.pathname.split('/').filter(Boolean);
        const id = url.searchParams.get('v') || ((partes[0] === 'shorts' || partes[0] === 'embed') ? partes[1] : null);
        if (id && idYoutube.test(id)) return { tipo: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
        const m = url.pathname.match(/\/(\d+)(?:\/|$)/);
        if (m) return { tipo: 'iframe', src: `https://player.vimeo.com/video/${m[1]}` };
    }
    if (/\.(mp4|webm|ogg|ogv)$/i.test(url.pathname)) {
        return { tipo: 'video', src: url.href };
    }
    return null;
}

// Arma el reproductor con createElement (no innerHTML) para no meter la URL como texto HTML.
function montarVideo(contenedor, urlTexto) {
    contenedor.innerHTML = '';
    const v = videoReproducible(urlTexto);

    if (v && v.tipo === 'iframe') {
        const marco = document.createElement('div');
        marco.className = 'ratio ratio-16x9';
        const iframe = document.createElement('iframe');
        iframe.src = v.src;
        iframe.title = 'Video del ejercicio';
        iframe.allow = 'fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        marco.appendChild(iframe);
        contenedor.appendChild(marco);
    } else if (v && v.tipo === 'video') {
        const video = document.createElement('video');
        video.className = 'w-100 rounded';
        video.controls = true;
        video.preload = 'metadata';
        video.src = v.src;
        contenedor.appendChild(video);
    } else {
        // Formato no reconocido: dejamos un enlace para abrirlo en otra pestaña
        const aviso = document.createElement('p');
        aviso.className = 'mb-0';
        aviso.textContent = 'No se puede mostrar este video aquí. ';
        const enlace = document.createElement('a');
        enlace.href = urlTexto;
        enlace.target = '_blank';
        enlace.rel = 'noopener noreferrer';
        enlace.textContent = 'Abrir en una pestaña nueva';
        aviso.appendChild(enlace);
        contenedor.appendChild(aviso);
    }
}

function verVideoEjercicio(idEjercicio) {
    const ej = ejerciciosCache.find(x => String(x.id_ejercicio) === String(idEjercicio));
    if (!ej || !ej.video_url) return;

    document.getElementById('videoEjercicioNombre').textContent = ej.nombre;
    document.getElementById('videoEjercicioDescripcion').textContent = ej.descripcion || '';
    montarVideo(document.getElementById('contenedorVideo'), ej.video_url);

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalVerVideo')).show();
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
            <td>${esc(r.ejercicio)}</td>
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
    const tbody = document.querySelector('#tablaRutinas tbody');
    tbody.innerHTML = '';

    if (res.status !== 'ok' || res.rutinas.length === 0) {
        if (sel) sel.innerHTML = '';
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">Sin rutinas</td></tr>';
        return;
    }

    // Select de la ficha del cliente ("asignar rutina existente")
    if (sel) {
        sel.innerHTML = res.rutinas.map(r => `<option value="${r.id_rutinas}">${esc(r.nombre)} (${esc(r.dias_semana) || 'sin días'})</option>`).join('');
    }

    res.rutinas.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${esc(r.nombre)}</td>
            <td>${esc(r.dias_semana) || '-'}</td>
            <td><span class="badge verdeint text-dark">${r.cantidad_ejercicios}</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-light" data-accion="ejercicios" data-id="${r.id_rutinas}">Ejercicios</button>
                <button class="btn btn-sm verdeint text-dark" data-accion="asignar" data-id="${r.id_rutinas}" data-nombre="${esc(r.nombre)}">Asignar a clientes</button>
                <button class="btn btn-sm btn-outline-light" data-accion="editar" data-id="${r.id_rutinas}">Editar</button>
                <button class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="${r.id_rutinas}">Eliminar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

function onClickTablaRutinas(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;

    switch (btn.dataset.accion) {
        case 'ejercicios': verDetalleRutina(id); break;
        case 'asignar':    abrirAsignarRutina(id, btn.dataset.nombre); break;
        case 'editar':     abrirEdicionRutina(id); break;
        case 'eliminar':   eliminarRutina(id); break;
    }
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
            <td>${esc(r.nombre)}</td>
            <td>${esc(r.dias_semana) || '-'}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-light" data-accion="detalle" data-id="${r.id_rutinas}">Ver ejercicios</button>
                <button class="btn btn-sm btn-outline-danger" data-accion="quitar" data-id="${r.id_rutinas}">Quitar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

// ---- Selector de días (botones Lunes..Viernes) ----
// Guarda en dias_semana el texto "Lunes, Miercoles, Viernes" (siempre en orden de la semana).
function leerDias(idContenedor) {
    return Array.from(document.querySelectorAll(`#${idContenedor} .dia-btn.activo`))
        .map(b => b.dataset.dia)
        .join(', ');
}

// Marca los botones según un texto guardado; acepta "Lun,Mie" o "Lunes, Miercoles".
function marcarDias(idContenedor, texto) {
    const guardados = String(texto || '').split(',')
        .map(d => d.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 3))
        .filter(Boolean);
    document.querySelectorAll(`#${idContenedor} .dia-btn`).forEach(b => {
        const activo = guardados.includes(b.dataset.dia.toLowerCase().slice(0, 3));
        b.classList.toggle('activo', activo);
        b.setAttribute('aria-pressed', activo);
        if (activo) {
            b.classList.remove('btn-outline-secondary');
            b.classList.add('btn-success');
        } else {
            b.classList.remove('btn-success');
            b.classList.add('btn-outline-secondary');
        }
    });
}


document.addEventListener('click', (e) => {
    const btn = e.target.closest('.dia-btn');
    if (!btn || !btn.closest('.dias-botones')) return;
    const activo = btn.classList.toggle('activo');
    btn.setAttribute('aria-pressed', activo);
    // Refuerzo visual con clases de Bootstrap
    if (activo) {
        btn.classList.remove('btn-outline-secondary');
        btn.classList.add('btn-success');
    } else {
        btn.classList.remove('btn-success');
        btn.classList.add('btn-outline-secondary');
    }
});

async function crearRutina(e) {
    e.preventDefault();
    const nombre = document.getElementById('rutinaNombre').value;
    const dias = leerDias('rutinaDias');
    const selectEjercicios = document.getElementById('rutinaEjerciciosNuevos');
    const idsEjercicios = Array.from(selectEjercicios.selectedOptions).map(opt => opt.value);

    const res = await API.request('/rutinas', 'POST', { nombre, dias_semana: dias });
    if (res.status !== 'ok') {
        avisar('msgCrearRutina', res);
        return;
    }

    // La rutina se crea primero (sin ejercicios); acá la vinculamos con cada ejercicio elegido.
    let vinculados = 0;
    for (const idEjercicio of idsEjercicios) {
        const r = await API.request(`/rutinas/${res.id_rutinas}/ejercicios`, 'POST', { id_ejercicio: idEjercicio });
        if (r.status === 'ok') vinculados++;
    }

    avisar('msgCatalogoRutinas', {
        status: 'ok',
        message: `Rutina creada con ${vinculados} ejercicio(s) vinculado(s)`,
    });

    document.getElementById('formCrearRutina').reset();
    marcarDias('rutinaDias', '');
    document.getElementById('msgCrearRutina').textContent = '';
    bootstrap.Modal.getInstance(document.getElementById('modalCrearRutina')).hide();
    cargarCatalogoRutinas();
}

async function abrirEdicionRutina(idRutina) {
    const res = await API.request(`/rutinas/${idRutina}`, 'GET');
    if (res.status !== 'ok') return;

    rutinaEditandoId = idRutina;
    document.getElementById('editRutinaNombre').value = res.rutina.nombre;
    marcarDias('editRutinaDias', res.rutina.dias_semana);
    document.getElementById('msgEditarRutina').textContent = '';

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarRutina')).show();
}

async function guardarRutina(e) {
    e.preventDefault();
    if (!rutinaEditandoId) return;

    const datos = {
        nombre: document.getElementById('editRutinaNombre').value,
        dias_semana: leerDias('editRutinaDias'),
    };

    const res = await API.request(`/rutinas/${rutinaEditandoId}`, 'PUT', datos);
    avisar('msgCatalogoRutinas', res);
    if (res.status === 'ok') {
        bootstrap.Modal.getInstance(document.getElementById('modalEditarRutina')).hide();
        cargarCatalogoRutinas();
        if (clienteActivo) cargarRutinasCliente(clienteActivo.id_persona); // por si el nombre/días cambiaron
    }
}

async function eliminarRutina(idRutina) {
    if (!confirm('¿Eliminar esta rutina? También se va a quitar de todos los clientes que la tengan asignada. Esta acción no se puede deshacer.')) return;
    const res = await API.request(`/rutinas/${idRutina}`, 'DELETE');
    avisar('msgCatalogoRutinas', res);
    if (res.status === 'ok') {
        cargarCatalogoRutinas();
        if (clienteActivo) cargarRutinasCliente(clienteActivo.id_persona);
    }
}

/* ===================== ASIGNAR RUTINA (con sus ejercicios) A MIS CLIENTES ===================== */

async function abrirAsignarRutina(idRutina, nombre) {
    rutinaAsignandoId = idRutina;
    document.getElementById('asignarRutinaNombre').textContent = nombre;
    document.getElementById('msgAsignarRutina').textContent = '';

    const lista = document.getElementById('listaClientesAsignar');

    if (clientesCache.length === 0) {
        lista.innerHTML = '<p class="text-secondary small mb-0">Todavía no tenés clientes asignados.</p>';
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAsignarRutina')).show();
        return;
    }

    // Marcamos como "ya asignada" a los clientes que ya tienen esta rutina
    const yaTienen = await Promise.all(clientesCache.map(async c => {
        const r = await API.request(`/clientes/${c.id_persona}/rutinas`, 'GET');
        return r.status === 'ok' && r.rutinas.some(x => String(x.id_rutinas) === String(idRutina));
    }));

    lista.innerHTML = clientesCache.map((c, i) => `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" id="asignarCli${c.id_persona}" value="${c.id_persona}" ${yaTienen[i] ? 'checked disabled' : ''}>
            <label class="form-check-label" for="asignarCli${c.id_persona}">
                ${esc(c.nombre)} <span class="text-secondary small">${esc(c.email)}</span>
                ${yaTienen[i] ? '<span class="badge bg-secondary ms-1">ya la tiene</span>' : ''}
            </label>
        </div>`).join('');

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAsignarRutina')).show();
}

async function asignarRutinaAClientes(e) {
    e.preventDefault();
    if (!rutinaAsignandoId) return;

    const ids = Array.from(document.querySelectorAll('#listaClientesAsignar input:checked:not(:disabled)')).map(c => c.value);
    if (ids.length === 0) {
        avisar('msgAsignarRutina', { status: 'error', message: 'Elegí al menos un cliente' });
        return;
    }

    let ok = 0;
    for (const idCliente of ids) {
        const res = await API.request(`/clientes/${idCliente}/rutinas`, 'POST', { id_rutinas: rutinaAsignandoId });
        if (res.status === 'ok') ok++;
    }

    if (ok === ids.length) {
        avisar('msgCatalogoRutinas', { status: 'ok', message: `Rutina asignada a ${ok} cliente(s)` });
        bootstrap.Modal.getInstance(document.getElementById('modalAsignarRutina')).hide();
    } else {
        avisar('msgAsignarRutina', { status: 'error', message: `Se asignó a ${ok} de ${ids.length} clientes` });
    }

    // Si la ficha abierta es de uno de los clientes, la refrescamos
    if (clienteActivo && ids.includes(String(clienteActivo.id_persona))) {
        cargarRutinasCliente(clienteActivo.id_persona);
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

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDetalleRutina')).show();
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
            <td>${esc(ej.nombre)}</td>
            <td>${esc(ej.grupo_muscular)}</td>
            <td class="text-end">
                ${ej.video_url ? `<a class="btn btn-sm btn-outline-light" href="${esc(ej.video_url)}" target="_blank" rel="noopener noreferrer">▶ Video</a>` : ''}
                <button class="btn btn-sm btn-outline-danger" data-accion="quitar" data-id="${ej.id_ejercicio}">Quitar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

async function agregarEjercicioARutina(e) {
    e.preventDefault();
    if (!rutinaDetalleActual) return;
    const idEjercicio = document.getElementById('rutinaEjercicioSelect').value;

    const res = await API.request(`/rutinas/${rutinaDetalleActual}/ejercicios`, 'POST', { id_ejercicio: idEjercicio });
    if (res.status === 'ok') {
        verDetalleRutina(rutinaDetalleActual);
        cargarCatalogoRutinas(); // actualiza el contador de ejercicios
    }
}

function onClickEjerciciosRutina(e) {
    const btn = e.target.closest('button');
    if (!btn || !rutinaDetalleActual) return;
    if (btn.dataset.accion === 'quitar') quitarEjercicioDeRutina(btn.dataset.id);
}

async function quitarEjercicioDeRutina(idEjercicio) {
    const res = await API.request(`/rutinas/${rutinaDetalleActual}/ejercicios/${idEjercicio}`, 'DELETE');
    if (res.status === 'ok') {
        verDetalleRutina(rutinaDetalleActual);
        cargarCatalogoRutinas(); // actualiza el contador de ejercicios
    }
}

/* ===================== UTILIDAD ===================== */

function avisar(contenedorId, res) {
    const el = document.getElementById(contenedorId);
    if (!el) return;
    el.textContent = res.message || (res.status === 'ok' ? 'Listo' : 'Ocurrió un error');
    el.className = 'small mt-2 ' + (res.status === 'ok' ? 'text-success' : 'text-danger');
}

// Escapa texto antes de meterlo en innerHTML (evita romper el HTML o inyectar código)
function esc(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}