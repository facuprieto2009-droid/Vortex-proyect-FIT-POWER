// front/dist/js/Usuario/user.js
// Vista del socio: sus datos personales, su entrenador y las rutinas que tiene asignadas.

// Los 5 días que el entrenador puede elegir (mismos nombres que guarda en rutinas.dias_semana)
// (los valores se quedan en español porque así se guardan; lo que se muestra se traduce)
const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
const CLAVE_DIA = { Lunes: 'dia_lun', Martes: 'dia_mar', Miercoles: 'dia_mie', Jueves: 'dia_jue', Viernes: 'dia_vie' };
const nombreDia = (d) => I18N.t(CLAVE_DIA[d]);
// Date.getDay(): 0 = domingo ... 6 = sábado  (claves diaj_0 ... diaj_6: nombre para usar dentro de una frase)

// Valores que guarda la base -> clave de traducción
const CLAVE_SEXO = {
    'Femenino': 'user_sexo_f',
    'Masculino': 'user_sexo_m',
    'Otro': 'user_sexo_o',
    'Prefiero no decirlo': 'user_sexo_n',
};

let perfil = null;
let formularioOriginal = {}; // valores con los que se abrió el modal de editar datos
let entrenador = null;
let solicitudPendiente = null;
let misRutinas = [];
let diaElegido = 'Lunes';
let diaHoy = null; // null si hoy es sábado o domingo
let indiceHoy = 0;
let rutinasCargadas = false;
let mensajeError = null; // mensaje de la API si falló la carga de rutinas

document.addEventListener('DOMContentLoaded', async function () {
    const usuario = await requiereSesion(['Usuario', 'Cliente', 'Entrenador', 'Administrador']);
    if (!usuario) return;

    await I18N.ready; // los textos tienen que estar antes de dibujar nada

    const hoy = new Date();
    indiceHoy = hoy.getDay();
    diaHoy = (indiceHoy >= 1 && indiceHoy <= 5) ? DIAS[indiceHoy - 1] : null;
    diaElegido = diaHoy || 'Lunes';

    // Al cambiar de idioma se vuelve a dibujar todo lo que se arma desde acá
    document.addEventListener('languageChanged', () => {
        renderPerfil();
        renderEntrenador();
        mostrarTextoHoy();
        if (rutinasCargadas) render();
        else mostrarErrorCarga();
    });

    document.getElementById('selectorDias').addEventListener('click', (e) => {
        const btn = e.target.closest('.dia-tab');
        if (!btn) return;
        diaElegido = btn.dataset.dia;
        render();
    });

    // Ver video de un ejercicio (modal)
    document.getElementById('rutinasDelDia').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-ver-video');
        if (!btn) return;
        abrirVideoEjercicio(btn.dataset.nombre, btn.dataset.descripcion, btn.dataset.video);
    });
    // Al cerrar el modal de video se vacía el contenedor para que el video deje de reproducirse
    document.getElementById('modalVerVideo').addEventListener('hidden.bs.modal', () => {
        document.getElementById('contenedorVideo').innerHTML = '';
    });

    // Formularios
    document.getElementById('formEditarPerfil').addEventListener('submit', guardarPerfil);
    document.getElementById('formCambioEntrenador').addEventListener('submit', pedirCambioEntrenador);
    // Cada vez que se abre el modal, los campos se llenan con lo que hay guardado
    document.getElementById('modalEditarPerfil').addEventListener('show.bs.modal', llenarFormularioPerfil);

    mostrarTextoHoy();

    // Las tres llamadas no dependen entre sí, así que van juntas
    await Promise.all([cargarPerfil(), cargarEntrenador(), cargarRutinas()]);
});

/* ===================== CARGA DE DATOS ===================== */

async function cargarPerfil() {
    const res = await API.request('/mi-perfil', 'GET');
    if (res.status !== 'ok') {
        document.getElementById('perfilDatos').innerHTML =
            `<div class="alert alert-danger mb-0">${esc(I18N.msg(res.message) || I18N.t('user_error_perfil'))}</div>`;
        return;
    }
    perfil = res.perfil;
    renderPerfil();
}

async function cargarEntrenador() {
    const res = await API.request('/mi-entrenador', 'GET');
    if (res.status !== 'ok') {
        document.getElementById('bloqueEntrenador').innerHTML =
            `<div class="alert alert-danger mb-0">${esc(I18N.msg(res.message) || I18N.t('user_error_entrenador'))}</div>`;
        return;
    }
    entrenador = res.entrenador;
    solicitudPendiente = res.solicitud_pendiente;
    renderEntrenador();
}

async function cargarRutinas() {
    const res = await API.request('/mis-rutinas', 'GET');
    if (res.status !== 'ok') {
        mensajeError = res.message;
        mostrarErrorCarga();
        return;
    }
    misRutinas = res.rutinas;
    rutinasCargadas = true;
    render();
}

/* ===================== PERFIL ===================== */

function renderPerfil() {
    if (!perfil) return;

    document.getElementById('perfilNombre').textContent = perfil.nombre || '';
    document.getElementById('perfilAvatar').textContent = iniciales(perfil.nombre);

    const chips = [];
    if (perfil.nombre_rol) {
        chips.push(`<span class="chip-fp">${esc(I18N.rol(perfil.nombre_rol))}</span>`);
    }
    if (perfil.estado_membresia) {
        const clase = perfil.estado_membresia === 'Activa' ? 'chip-fp chip-ok' : 'chip-fp chip-aviso';
        chips.push(`<span class="${clase}">${esc(traducirMembresia(perfil.estado_membresia))}</span>`);
    }
    // Chip con los puntos del usuario
    const pts = Number(perfil.puntos_totales ?? 0);
    chips.push(`<span class="chip-fp chip-puntos">${esc(I18N.t('user_chip_puntos', { n: pts.toLocaleString(I18N.locale) }))}</span>`);
    document.getElementById('perfilChips').innerHTML = chips.join('');

    document.getElementById('perfilDatos').innerHTML = [
        datoCarneSalud(),
        dato('user_dato_peso', perfil.peso_kg === null ? null : I18N.t('user_valor_kg', { n: numero(perfil.peso_kg) })),
        dato('user_dato_altura', perfil.altura_cm === null ? null : I18N.t('user_valor_cm', { n: perfil.altura_cm })),
        dato('user_dato_edad', perfil.edad === null ? null : I18N.t('user_valor_anios', { n: perfil.edad })),
        dato('user_dato_documento', perfil.documento),
        dato('user_dato_sexo', traducirSexo(perfil.sexo)),
        dato('user_dato_puntos', I18N.t('user_valor_pts', { n: pts.toLocaleString(I18N.locale) }), null, 'dato-puntos'),
    ].join('');
}

// Una tarjeta de dato. Si el valor está vacío muestra "Sin cargar" en gris.
function dato(claveEtiqueta, valor, extra, claseValor) {
    const vacio = valor === null || valor === undefined || valor === '';
    const clase = vacio ? 'dato-vacio' : (claseValor || '');
    return `<div class="dato-card">
                <p class="dato-label">${esc(I18N.t(claveEtiqueta))}</p>
                <p class="dato-valor ${clase}">${esc(vacio ? I18N.t('user_sin_cargar') : valor)}</p>
                ${extra ? `<p class="dato-extra">${esc(extra)}</p>` : ''}
            </div>`;
}

function datoCarneSalud() {
    const vigente = perfil.carne_salud_vigente;
    if (vigente === null || vigente === undefined) return dato('user_dato_carne', null);

    const texto = I18N.t(vigente ? 'user_carne_vigente' : 'user_carne_vencido');
    const fecha = formatearFecha(perfil.carne_salud_vencimiento);
    const extra = fecha ? I18N.t('user_vence', { fecha }) : '';
    return dato('user_dato_carne', texto, extra, vigente ? 'estado-ok' : 'estado-mal');
}

function llenarFormularioPerfil() {
    if (!perfil) return;

    valoresFormulario().forEach(([id, valor]) => {
        document.getElementById(id).value = valor;
    });
    // Nos guardamos lo que quedó cargado para después mandar solo lo que el socio cambie
    formularioOriginal = Object.fromEntries(valoresFormulario());
    document.getElementById('msgPerfil').textContent = '';
}

// Qué valor le corresponde a cada campo del formulario según el perfil guardado.
// Ojo: <input type="date"> solo acepta AAAA-MM-DD, y fecha_nacimiento es texto libre en la base.
function valoresFormulario() {
    return [
        ['perfilDocumento', perfil.documento || ''],
        ['perfilNacimiento', soloFechaISO(perfil.fecha_nacimiento)],
        ['perfilSexo', perfil.sexo || ''],
        ['perfilPeso', perfil.peso_kg === null ? '' : String(perfil.peso_kg)],
        ['perfilAltura', perfil.altura_cm === null ? '' : String(perfil.altura_cm)],
        ['perfilCarne', soloFechaISO(perfil.carne_salud_vencimiento)],
    ];
}

async function guardarPerfil(e) {
    e.preventDefault();

    const campos = {
        documento: 'perfilDocumento',
        fecha_nacimiento: 'perfilNacimiento',
        sexo: 'perfilSexo',
        peso_kg: 'perfilPeso',
        altura_cm: 'perfilAltura',
        carne_salud_vencimiento: 'perfilCarne',
    };

    // Solo mandamos lo que cambió. Si una fecha guardada no tiene formato AAAA-MM-DD,
    // el campo aparece vacío: al no tocarlo, no se manda y no se borra lo que había.
    const datos = {};
    for (const [campo, id] of Object.entries(campos)) {
        const valor = document.getElementById(id).value.trim();
        if (valor !== (formularioOriginal[id] ?? '')) datos[campo] = valor;
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarPerfil'));
    if (Object.keys(datos).length === 0) return modal.hide(); // no cambió nada

    const res = await API.request('/mi-perfil', 'PUT', datos);
    avisar('msgPerfil', res);

    if (res.status === 'ok') {
        await cargarPerfil();
        modal.hide();
    }
}

/* ===================== ENTRENADOR ===================== */

function renderEntrenador() {
    const contenedor = document.getElementById('bloqueEntrenador');
    if (!contenedor) return;

    if (!entrenador) {
        contenedor.innerHTML = `<div class="entrenador-card entrenador-vacio">
                                    <p class="mb-0 text-secondary">${esc(I18N.t('user_sin_entrenador'))}</p>
                                </div>`;
        return;
    }

    const desde = formatearFecha(entrenador.fecha_asignacion);
    const accion = solicitudPendiente
        ? `<p class="aviso-pendiente mb-0">${esc(I18N.t('user_cambio_pendiente', { fecha: formatearFecha(solicitudPendiente.fecha) }))}</p>`
        : `<button type="button" class="btn btn-sm btn-outline-light"
                   data-bs-toggle="modal" data-bs-target="#modalCambioEntrenador">${esc(I18N.t('user_pedir_cambio'))}</button>`;

    contenedor.innerHTML = `
        <div class="entrenador-card">
            <div class="entrenador-avatar" aria-hidden="true">${esc(iniciales(entrenador.nombre))}</div>
            <div class="entrenador-info">
                <h3 class="entrenador-nombre bebas">${esc(entrenador.nombre)}</h3>
                ${entrenador.especialidad
                    ? `<p class="entrenador-dato">${esc(I18N.t('user_especialidad', { esp: entrenador.especialidad }))}</p>`
                    : ''}
                ${desde ? `<p class="entrenador-dato text-secondary">${esc(I18N.t('user_entrenador_desde', { fecha: desde }))}</p>` : ''}
            </div>
            <div class="entrenador-accion">${accion}</div>
        </div>`;
}

async function pedirCambioEntrenador(e) {
    e.preventDefault();

    const motivo = document.getElementById('motivoCambio').value.trim();
    const res = await API.request('/mi-entrenador/cambio', 'POST', { motivo });
    avisar('msgCambio', res);

    if (res.status === 'ok') {
        document.getElementById('formCambioEntrenador').reset();
        await cargarEntrenador();
        bootstrap.Modal.getInstance(document.getElementById('modalCambioEntrenador')).hide();
    }
}

/* ===================== RUTINAS ===================== */

function mostrarTextoHoy() {
    const dia = I18N.t('diaj_' + indiceHoy);
    document.getElementById('textoHoy').textContent = I18N.t(diaHoy ? 'user_hoy_es' : 'user_hoy_finde', { dia });
}

function mostrarErrorCarga() {
    if (mensajeError === null) return;
    document.getElementById('rutinasDelDia').innerHTML =
        `<div class="alert alert-danger">${esc(I18N.msg(mensajeError) || I18N.t('user_error_rutinas'))}</div>`;
}

// "Lunes, Miercoles" / "Lun,Mie" -> ['lun', 'mie'] (primeras 3 letras, sin tildes)
function diasDeRutina(texto) {
    return String(texto || '').split(',')
        .map(d => d.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 3))
        .filter(Boolean);
}

function rutinasDelDia(dia) {
    const clave = dia.toLowerCase().slice(0, 3);
    return misRutinas.filter(r => diasDeRutina(r.dias_semana).includes(clave));
}

function render() {
    // Botones de día, con la cantidad de rutinas de cada uno
    document.getElementById('selectorDias').innerHTML = DIAS.map(d => {
        const cantidad = rutinasDelDia(d).length;
        const clases = 'btn dia-tab' + (d === diaElegido ? ' active' : '') + (d === diaHoy ? ' hoy' : '');
        return `<button type="button" class="${clases}" data-dia="${d}" data-hoy="${esc(I18N.t('user_hoy'))}" role="tab" aria-selected="${d === diaElegido}">
                    ${nombreDia(d)} <span class="badge rounded-pill">${cantidad}</span>
                </button>`;
    }).join('');

    document.getElementById('tituloDia').textContent = nombreDia(diaElegido);

    const contenedor = document.getElementById('rutinasDelDia');
    const rutinas = rutinasDelDia(diaElegido);

    if (misRutinas.length === 0) {
        contenedor.innerHTML = `<p class="text-secondary">${esc(I18N.t('user_sin_rutinas'))}</p>`;
        return;
    }
    if (rutinas.length === 0) {
        // diaj_N = nombre del día para usar dentro de una frase (en español va en minúscula)
        const dia = I18N.t('diaj_' + (DIAS.indexOf(diaElegido) + 1));
        contenedor.innerHTML = `<p class="text-secondary">${esc(I18N.t('user_descanso', { dia }))}</p>`;
        return;
    }

    contenedor.innerHTML = rutinas.map(r => `
        <div class="rutina-card mb-3">
            <div class="rutina-cabecera">
                <strong class="bebas fs-4">${esc(r.nombre)}</strong>
                <span class="text-secondary small">${esc(I18N.t('user_dias_label', { dias: I18N.dias(r.dias_semana) || '-' }))}</span>
            </div>
            <ul class="rutina-ejercicios">
                ${r.ejercicios.length === 0
                    ? `<li class="ejercicio-item text-secondary">${esc(I18N.t('user_rutina_vacia'))}</li>`
                    : r.ejercicios.map(ej => `
                <li class="ejercicio-item">
                    <div>
                        <div class="ejercicio-nombre">${esc(ej.nombre)} <span class="badge verdeint text-dark ms-1">${esc(ej.grupo_muscular)}</span></div>
                        ${ej.descripcion ? `<div class="small text-secondary">${esc(ej.descripcion)}</div>` : ''}
                    </div>
                    ${urlSegura(ej.video_url) ? `<button type="button" class="btn btn-sm btn-outline-light btn-ver-video"
                        data-nombre="${esc(ej.nombre)}"
                        data-descripcion="${esc(ej.descripcion || '')}"
                        data-video="${esc(ej.video_url)}">${esc(I18N.t('btn_ver_video'))}</button>` : ''}
                </li>`).join('')}
            </ul>
        </div>`).join('');
}

/* ===================== AYUDAS ===================== */

function avisar(contenedorId, res) {
    const el = document.getElementById(contenedorId);
    if (!el) return;
    el.textContent = I18N.msg(res.message) || (res.status === 'ok' ? I18N.t('user_listo') : I18N.t('admin_err_guardar'));
    el.className = 'small mt-2 ' + (res.status === 'ok' ? 'text-success' : 'text-danger');
}

// "Juan Pedro Vázquez" -> "JP"
function iniciales(nombre) {
    const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    return (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase();
}

function traducirSexo(valor) {
    if (!valor) return null;
    const clave = CLAVE_SEXO[valor];
    return clave ? I18N.t(clave) : valor;
}

function traducirMembresia(estado) {
    const clave = 'memb_' + String(estado || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return I18N.has(clave) ? I18N.t(clave) : estado;
}

function numero(valor) {
    return Number(valor).toLocaleString(I18N.locale, { maximumFractionDigits: 2 });
}

// "2026-05-10" (o "2026-05-10 00:00:00") -> "10/05/2026" en el idioma actual.
// Se arma la fecha a mano para que no se corra un día por la zona horaria.
function formatearFecha(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    if (!m) return '';
    const fecha = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return fecha.toLocaleDateString(I18N.locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Devuelve AAAA-MM-DD si el texto empieza así, o '' (para los <input type="date">)
function soloFechaISO(texto) {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(texto || ''));
    return m ? m[1] : '';
}

// Solo permitimos enlaces http/https en los botones de video
function urlSegura(texto) {
    try {
        const u = new URL(texto);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Escapa texto antes de meterlo en innerHTML
function esc(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ===================== VIDEO DEL EJERCICIO ===================== */

function abrirVideoEjercicio(nombre, descripcion, videoUrl) {
    if (!videoUrl) return;
    document.getElementById('videoEjercicioNombre').textContent = nombre || '';
    document.getElementById('videoEjercicioDescripcion').textContent = descripcion || '';
    montarVideo(document.getElementById('contenedorVideo'), videoUrl);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalVerVideo')).show();
}

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
        const aviso = document.createElement('p');
        aviso.className = 'mb-0';
        aviso.textContent = I18N.t('user_video_no_embed') + ' ';
        const enlace = document.createElement('a');
        enlace.href = urlTexto;
        enlace.target = '_blank';
        enlace.rel = 'noopener noreferrer';
        enlace.textContent = I18N.t('user_video_abrir');
        aviso.appendChild(enlace);
        contenedor.appendChild(aviso);
    }
}