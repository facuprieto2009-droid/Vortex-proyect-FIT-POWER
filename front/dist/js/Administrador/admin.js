// front/dist/js/admin.js
// Panel de Administrador: usuarios y entrenadores, pagos y puntos.

let rolesCache = [];
let usuarioEditandoId = null;
let productoEditandoId = null;
let recompensaEditandoId = null;

document.addEventListener('DOMContentLoaded', async function () {
    const usuario = await requiereSesion(['Administrador']);
    if (!usuario) return;

    await cargarRoles();
    await cargarUsuarios();
    await cargarPagos();
    await cargarPuntos();

    document.getElementById('filtroRol').addEventListener('change', e => cargarUsuarios(e.target.value));
    document.getElementById('tablaUsuarios').addEventListener('click', onClickTablaUsuarios);
    document.getElementById('formEditarUsuario').addEventListener('submit', guardarUsuario);
    document.getElementById('formCrearUsuario').addEventListener('submit', crearUsuario);

    document.getElementById('formFiltroPagos').addEventListener('submit', e => {
        e.preventDefault();
        cargarPagos(document.getElementById('filtroPersonaPagos').value || null);
    });
    document.getElementById('formCrearPago').addEventListener('submit', crearPago);
    document.getElementById('tablaPagos').addEventListener('click', onClickTablaPagos);

    document.getElementById('formFiltroPuntos').addEventListener('submit', e => {
        e.preventDefault();
        cargarPuntos(document.getElementById('filtroPersonaPuntos').value || null);
    });
    document.getElementById('formAgregarPuntos').addEventListener('submit', agregarPuntos);
    document.getElementById('tablaPuntos').addEventListener('click', onClickTablaPuntos);

    await cargarProductos();
    document.getElementById('filtroCategoriaProducto').addEventListener('change', e => cargarProductos(e.target.value));
    document.getElementById('tablaProductos').addEventListener('click', onClickTablaProductos);
    document.getElementById('formCrearProducto').addEventListener('submit', crearProducto);
    document.getElementById('formEditarProducto').addEventListener('submit', guardarProducto);

    await cargarRecompensas();
    document.getElementById('tablaRecompensas').addEventListener('click', onClickTablaRecompensas);
    document.getElementById('formCrearRecompensa').addEventListener('submit', crearRecompensa);
    document.getElementById('formEditarRecompensa').addEventListener('submit', guardarRecompensa);
});

// Convierte un <input type="file"> en un data URL base64 (o null si no hay archivo)
function archivoABase64(inputFile) {
    return new Promise((resolve, reject) => {
        const archivo = inputFile.files[0];
        if (!archivo) return resolve(null);
        const lector = new FileReader();
        lector.onload = () => resolve(lector.result);
        lector.onerror = () => reject(new Error('No se pudo leer la imagen'));
        lector.readAsDataURL(archivo);
    });
}

function avisar(contenedorId, res) {
    const el = document.getElementById(contenedorId);
    if (!el) return;
    el.textContent = res.message || (res.status === 'ok' ? 'Listo' : 'Ocurrió un error');
    el.className = 'small mt-2 ' + (res.status === 'ok' ? 'text-success' : 'text-danger');
}

/* ===================== USUARIOS / ENTRENADORES ===================== */

async function cargarRoles() {
    const res = await API.request('/roles', 'GET');
    if (res.status !== 'ok') return;
    rolesCache = res.roles;

    const filtro = document.getElementById('filtroRol');
    filtro.innerHTML = '<option value="">Todos los roles</option>' +
        rolesCache.map(r => `<option value="${r.nombre_rol}">${r.nombre_rol}</option>`).join('');

    const editSel = document.getElementById('editUsuarioRol');
    editSel.innerHTML = rolesCache.map(r => `<option value="${r.id_rol}">${r.nombre_rol}</option>`).join('');

    const crearSel = document.getElementById('nuevoUsuarioRol');
    if (crearSel) {
        crearSel.innerHTML = rolesCache.map(r => `<option value="${r.id_rol}">${r.nombre_rol}</option>`).join('');
    }
}


async function cargarUsuarios(rol) {
    const query = rol ? `?rol=${encodeURIComponent(rol)}` : '';
    const res = await API.request(`/admin/usuarios${query}`, 'GET');
    const tbody = document.querySelector('#tablaUsuarios tbody');
    tbody.innerHTML = '';

    if (res.status !== 'ok' || res.usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary">Sin usuarios</td></tr>';
        return;
    }

    res.usuarios.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.id_persona}</td>
            <td>${u.nombre}</td>
            <td>${u.email}</td>
            <td><span class="badge verdeint text-dark">${u.nombre_rol}</span></td>
            <td>${u.especialidad || '-'}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-light" data-accion="editar" data-id="${u.id_user}">Editar</button>
                <button class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="${u.id_user}">Eliminar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

function onClickTablaUsuarios(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.dataset.accion === 'editar') {
        abrirEdicionUsuario(btn.dataset.id);
    } else if (btn.dataset.accion === 'eliminar') {
        eliminarUsuario(btn.dataset.id);
    }
}

async function abrirEdicionUsuario(idUser) {
    const res = await API.request(`/admin/usuarios/${idUser}`, 'GET');
    if (res.status !== 'ok') return;

    usuarioEditandoId = idUser;
    document.getElementById('editUsuarioNombre').value = res.usuario.nombre;
    document.getElementById('editUsuarioEmail').value = res.usuario.email;
    document.getElementById('editUsuarioEspecialidad').value = res.usuario.especialidad || '';
    document.getElementById('editUsuarioRol').value = rolesCache.find(r => r.nombre_rol === res.usuario.nombre_rol)?.id_rol || '';

    new bootstrap.Modal(document.getElementById('modalEditarUsuario')).show();
}

async function guardarUsuario(e) {
    e.preventDefault();
    if (!usuarioEditandoId) return;

    const datos = {
        nombre: document.getElementById('editUsuarioNombre').value,
        email: document.getElementById('editUsuarioEmail').value,
        especialidad: document.getElementById('editUsuarioEspecialidad').value || null,
        id_rol: document.getElementById('editUsuarioRol').value,
    };

    const res = await API.request(`/admin/usuarios/${usuarioEditandoId}`, 'PUT', datos);
    if (res.status === 'ok') {
        bootstrap.Modal.getInstance(document.getElementById('modalEditarUsuario')).hide();
        cargarUsuarios(document.getElementById('filtroRol').value);
    } else {
        alert(res.message || 'No se pudo guardar');
    }
}

async function eliminarUsuario(idUser) {
    if (!confirm('¿Eliminar este usuario? Esto borra también sus pagos, puntos y actividad.')) return;
    const res = await API.request(`/admin/usuarios/${idUser}`, 'DELETE');
    if (res.status === 'ok') cargarUsuarios(document.getElementById('filtroRol').value);
    else alert(res.message || 'No se pudo eliminar');
}

async function crearUsuario(e) {
    e.preventDefault();

    const datos = {
        nombre: document.getElementById('nuevoUsuarioNombre').value,
        email: document.getElementById('nuevoUsuarioEmail').value,
        password: document.getElementById('nuevoUsuarioPassword').value,
        id_rol: document.getElementById('nuevoUsuarioRol').value,
        especialidad: document.getElementById('nuevoUsuarioEspecialidad').value || null
    };

    const res = await API.request('/admin/usuarios', 'POST', datos);

    if (res.status === 'ok') {
        alert('Usuario creado correctamente');
        document.getElementById('formCrearUsuario').reset();
        bootstrap.Modal.getInstance(document.getElementById('modalCrearUsuario')).hide();
        cargarUsuarios(document.getElementById('filtroRol').value);
    } else {
        alert(res.message || 'No se pudo crear el usuario');
    }
}
/* ===================== PAGOS ===================== */

async function cargarPagos(idPersona) {
    const query = idPersona ? `?id_persona=${encodeURIComponent(idPersona)}` : '';
    const res = await API.request(`/admin/pagos${query}`, 'GET');
    const tbody = document.querySelector('#tablaPagos tbody');
    tbody.innerHTML = '';

    if (res.status !== 'ok' || res.pagos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">Sin pagos</td></tr>';
        return;
    }

    res.pagos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.id_persona}</td>
            <td>${p.email}</td>
            <td>$${p.monto}</td>
            <td>${p.fecha}</td>
            <td>${p.metodo_pago || '-'}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-light" data-accion="editar" data-id="${p.id_pago}" data-monto="${p.monto}">Editar monto</button>
                <button class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="${p.id_pago}">Eliminar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

async function crearPago(e) {
    e.preventDefault();
    const datos = {
        id_persona: document.getElementById('nuevoPagoPersona').value,
        monto: document.getElementById('nuevoPagoMonto').value,
        metodo_pago: document.getElementById('nuevoPagoMetodo').value || null,
    };

    const res = await API.request('/admin/pagos', 'POST', datos);
    avisar('msgPagos', res);
    if (res.status === 'ok') {
        document.getElementById('formCrearPago').reset();
        cargarPagos(document.getElementById('filtroPersonaPagos').value || null);
    }
}

function onClickTablaPagos(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.dataset.accion === 'editar') {
        editarPago(btn.dataset.id, btn.dataset.monto);
    } else if (btn.dataset.accion === 'eliminar') {
        eliminarPago(btn.dataset.id);
    }
}

async function editarPago(idPago, montoActual) {
    const nuevoMonto = prompt('Nuevo monto:', montoActual);
    if (nuevoMonto === null) return;
    const res = await API.request(`/admin/pagos/${idPago}`, 'PUT', { monto: nuevoMonto });
    avisar('msgPagos', res);
    if (res.status === 'ok') cargarPagos(document.getElementById('filtroPersonaPagos').value || null);
}

async function eliminarPago(idPago) {
    if (!confirm('¿Eliminar este pago?')) return;
    const res = await API.request(`/admin/pagos/${idPago}`, 'DELETE');
    avisar('msgPagos', res);
    if (res.status === 'ok') cargarPagos(document.getElementById('filtroPersonaPagos').value || null);
}

/* ===================== PUNTOS ===================== */

async function cargarPuntos(idPersona) {
    const query = idPersona ? `?id_persona=${encodeURIComponent(idPersona)}` : '';
    const res = await API.request(`/admin/puntos${query}`, 'GET');
    const tbody = document.querySelector('#tablaPuntos tbody');
    tbody.innerHTML = '';

    if (res.status !== 'ok' || res.puntos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">Sin puntos registrados</td></tr>';
        return;
    }

    res.puntos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.id_persona}</td>
            <td>${p.email}</td>
            <td>${p.cantidad}</td>
            <td>${p.origen}</td>
            <td>${p.fecha}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-light" data-accion="editar" data-id="${p.id_punto}" data-cantidad="${p.cantidad}">Editar</button>
                <button class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="${p.id_punto}">Eliminar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

async function agregarPuntos(e) {
    e.preventDefault();
    const datos = {
        id_persona: document.getElementById('nuevoPuntoPersona').value,
        cantidad: document.getElementById('nuevoPuntoCantidad').value,
        descripcion: document.getElementById('nuevoPuntoDescripcion').value || null,
    };

    const res = await API.request('/admin/puntos', 'POST', datos);
    avisar('msgPuntos', res);
    if (res.status === 'ok') {
        document.getElementById('formAgregarPuntos').reset();
        cargarPuntos(document.getElementById('filtroPersonaPuntos').value || null);
    }
}

function onClickTablaPuntos(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.dataset.accion === 'editar') {
        editarPuntos(btn.dataset.id, btn.dataset.cantidad);
    } else if (btn.dataset.accion === 'eliminar') {
        eliminarPuntos(btn.dataset.id);
    }
}

async function editarPuntos(idPunto, cantidadActual) {
    const nuevaCantidad = prompt('Nueva cantidad:', cantidadActual);
    if (nuevaCantidad === null) return;
    const res = await API.request(`/admin/puntos/${idPunto}`, 'PUT', { cantidad: nuevaCantidad });
    avisar('msgPuntos', res);
    if (res.status === 'ok') cargarPuntos(document.getElementById('filtroPersonaPuntos').value || null);
}

async function eliminarPuntos(idPunto) {
    if (!confirm('¿Eliminar este movimiento de puntos?')) return;
    const res = await API.request(`/admin/puntos/${idPunto}`, 'DELETE');
    avisar('msgPuntos', res);
    if (res.status === 'ok') cargarPuntos(document.getElementById('filtroPersonaPuntos').value || null);
}

/* ===================== PRODUCTOS ===================== */

async function cargarProductos(categoria) {
    const query = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';
    const res = await API.request(`/admin/productos${query}`, 'GET');
    const tbody = document.querySelector('#tablaProductos tbody');
    tbody.innerHTML = '';

    if (res.status !== 'ok' || res.productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary">Sin productos</td></tr>';
        return;
    }

    res.productos.forEach(p => {
        const tr = document.createElement('tr');
        const imgTag = p.imagen_url
            ? `<img src="${p.imagen_url}" alt="${p.nombre}" style="width:48px;height:48px;object-fit:cover" class="rounded">`
            : '<span class="text-secondary small">Sin imagen</span>';
        tr.innerHTML = `
            <td>${imgTag}</td>
            <td>${p.nombre}</td>
            <td><span class="badge verdeint text-dark">${p.categoria}</span></td>
            <td>$${Number(p.precio).toFixed(2)}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-light" data-accion="editar" data-id="${p.id_producto}">Editar</button>
                <button class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="${p.id_producto}">Eliminar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

async function crearProducto(e) {
    e.preventDefault();

    let imagenBase64;
    try {
        imagenBase64 = await archivoABase64(document.getElementById('nuevoProductoImagen'));
    } catch (err) {
        avisar('msgProductos', { status: 'error', message: err.message });
        return;
    }

    const datos = {
        nombre: document.getElementById('nuevoProductoNombre').value,
        categoria: document.getElementById('nuevoProductoCategoria').value,
        precio: document.getElementById('nuevoProductoPrecio').value,
        imagen: imagenBase64,
    };

    const res = await API.request('/admin/productos', 'POST', datos);
    avisar('msgProductos', res);
    if (res.status === 'ok') {
        document.getElementById('formCrearProducto').reset();
        bootstrap.Modal.getInstance(document.getElementById('modalCrearProducto')).hide();
        cargarProductos(document.getElementById('filtroCategoriaProducto').value || null);
    }
}

function onClickTablaProductos(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.dataset.accion === 'editar') {
        abrirEdicionProducto(btn.dataset.id);
    } else if (btn.dataset.accion === 'eliminar') {
        eliminarProducto(btn.dataset.id);
    }
}

async function abrirEdicionProducto(idProducto) {
    const res = await API.request(`/admin/productos/${idProducto}`, 'GET');
    if (res.status !== 'ok') return;

    productoEditandoId = idProducto;
    document.getElementById('editProductoNombre').value = res.producto.nombre;
    document.getElementById('editProductoCategoria').value = res.producto.categoria;
    document.getElementById('editProductoPrecio').value = res.producto.precio;
    document.getElementById('editProductoImagen').value = '';

    const imgActual = document.getElementById('editProductoImagenActual');
    if (res.producto.imagen_url) {
        imgActual.src = res.producto.imagen_url;
        imgActual.style.display = 'block';
    } else {
        imgActual.style.display = 'none';
    }

    new bootstrap.Modal(document.getElementById('modalEditarProducto')).show();
}

async function guardarProducto(e) {
    e.preventDefault();
    if (!productoEditandoId) return;

    let imagenBase64;
    try {
        imagenBase64 = await archivoABase64(document.getElementById('editProductoImagen'));
    } catch (err) {
        avisar('msgProductos', { status: 'error', message: err.message });
        return;
    }

    const datos = {
        nombre: document.getElementById('editProductoNombre').value,
        categoria: document.getElementById('editProductoCategoria').value,
        precio: document.getElementById('editProductoPrecio').value,
    };
    if (imagenBase64) datos.imagen = imagenBase64; // solo la mandamos si el admin eligió una nueva

    const res = await API.request(`/admin/productos/${productoEditandoId}`, 'PUT', datos);
    avisar('msgProductos', res);
    if (res.status === 'ok') {
        bootstrap.Modal.getInstance(document.getElementById('modalEditarProducto')).hide();
        cargarProductos(document.getElementById('filtroCategoriaProducto').value || null);
    }
}

async function eliminarProducto(idProducto) {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    const res = await API.request(`/admin/productos/${idProducto}`, 'DELETE');
    avisar('msgProductos', res);
    if (res.status === 'ok') cargarProductos(document.getElementById('filtroCategoriaProducto').value || null);
}

/* ===================== CATÁLOGO DE PUNTOS (RECOMPENSAS) ===================== */
// Igual que Productos, pero el valor es en puntos y no hay categoría.

function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

async function cargarRecompensas() {
    const res = await API.request('/admin/recompensas', 'GET');
    const tbody = document.querySelector('#tablaRecompensas tbody');
    tbody.innerHTML = '';

    if (res.status !== 'ok' || res.recompensas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">Sin ítems de puntos</td></tr>';
        return;
    }

    res.recompensas.forEach(r => {
        const tr = document.createElement('tr');
        const imgTag = r.imagen_url
            ? `<img src="${escaparHtml(r.imagen_url)}" alt="${escaparHtml(r.nombre)}" style="width:48px;height:48px;object-fit:cover" class="rounded">`
            : '<span class="text-secondary small">Sin imagen</span>';
        tr.innerHTML = `
            <td>${imgTag}</td>
            <td>${escaparHtml(r.nombre)}</td>
            <td><span class="badge verdeint text-dark">${Number(r.puntos).toLocaleString('es-UY')} pts</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-light" data-accion="editar" data-id="${r.id_recompensa}">Editar</button>
                <button class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="${r.id_recompensa}">Eliminar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

async function crearRecompensa(e) {
    e.preventDefault();

    let imagenBase64;
    try {
        imagenBase64 = await archivoABase64(document.getElementById('nuevaRecompensaImagen'));
    } catch (err) {
        avisar('msgRecompensas', { status: 'error', message: err.message });
        return;
    }

    const datos = {
        nombre: document.getElementById('nuevaRecompensaNombre').value,
        puntos: document.getElementById('nuevaRecompensaPuntos').value,
        imagen: imagenBase64,
    };

    const res = await API.request('/admin/recompensas', 'POST', datos);
    avisar('msgRecompensas', res);
    if (res.status === 'ok') {
        document.getElementById('formCrearRecompensa').reset();
        bootstrap.Modal.getInstance(document.getElementById('modalCrearRecompensa')).hide();
        cargarRecompensas();
    }
}

function onClickTablaRecompensas(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.dataset.accion === 'editar') {
        abrirEdicionRecompensa(btn.dataset.id);
    } else if (btn.dataset.accion === 'eliminar') {
        eliminarRecompensa(btn.dataset.id);
    }
}

async function abrirEdicionRecompensa(idRecompensa) {
    const res = await API.request(`/admin/recompensas/${idRecompensa}`, 'GET');
    if (res.status !== 'ok') return;

    recompensaEditandoId = idRecompensa;
    document.getElementById('editRecompensaNombre').value = res.recompensa.nombre;
    document.getElementById('editRecompensaPuntos').value = res.recompensa.puntos;
    document.getElementById('editRecompensaImagen').value = '';

    const imgActual = document.getElementById('editRecompensaImagenActual');
    if (res.recompensa.imagen_url) {
        imgActual.src = res.recompensa.imagen_url;
        imgActual.style.display = 'block';
    } else {
        imgActual.style.display = 'none';
    }

    new bootstrap.Modal(document.getElementById('modalEditarRecompensa')).show();
}

async function guardarRecompensa(e) {
    e.preventDefault();
    if (!recompensaEditandoId) return;

    let imagenBase64;
    try {
        imagenBase64 = await archivoABase64(document.getElementById('editRecompensaImagen'));
    } catch (err) {
        avisar('msgRecompensas', { status: 'error', message: err.message });
        return;
    }

    const datos = {
        nombre: document.getElementById('editRecompensaNombre').value,
        puntos: document.getElementById('editRecompensaPuntos').value,
    };
    if (imagenBase64) datos.imagen = imagenBase64; // solo si el admin eligió una nueva

    const res = await API.request(`/admin/recompensas/${recompensaEditandoId}`, 'PUT', datos);
    avisar('msgRecompensas', res);
    if (res.status === 'ok') {
        bootstrap.Modal.getInstance(document.getElementById('modalEditarRecompensa')).hide();
        cargarRecompensas();
    }
}

async function eliminarRecompensa(idRecompensa) {
    if (!confirm('¿Eliminar este ítem del catálogo de puntos? Esta acción no se puede deshacer.')) return;
    const res = await API.request(`/admin/recompensas/${idRecompensa}`, 'DELETE');
    avisar('msgRecompensas', res);
    if (res.status === 'ok') cargarRecompensas();
}