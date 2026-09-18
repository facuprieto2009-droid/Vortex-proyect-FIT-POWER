// front/dist/js/admin.js
// Panel de Administrador: usuarios y entrenadores, pagos y puntos.

let rolesCache = [];
let usuarioEditandoId = null;

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
    document.getElementById('modalCrearUsuario').addEventListener('hidden.bs.modal', () => {
        document.getElementById('formCrearUsuario').reset();
        document.getElementById('crearUsuarioMsg').textContent = '';
    });

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
    document.getElementById('filtroCategoriaProductos').addEventListener('change', e => cargarProductos(e.target.value));
    document.getElementById('formCrearProducto').addEventListener('submit', crearProducto);
    document.getElementById('tablaProductos').addEventListener('click', onClickTablaProductos);
});

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

    const nuevoSel = document.getElementById('nuevoUsuarioRol');
    nuevoSel.innerHTML = rolesCache.map(r => `<option value="${r.id_rol}">${r.nombre_rol}</option>`).join('');
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

async function crearUsuario(e) {
    e.preventDefault();
    const datos = {
        nombre: document.getElementById('nuevoUsuarioNombre').value,
        email: document.getElementById('nuevoUsuarioEmail').value,
        password: document.getElementById('nuevoUsuarioPassword').value,
        especialidad: document.getElementById('nuevoUsuarioEspecialidad').value || null,
        id_rol: document.getElementById('nuevoUsuarioRol').value,
    };

    const res = await API.request('/admin/usuarios', 'POST', datos);
    avisar('crearUsuarioMsg', res);

    if (res.status === 'ok') {
        bootstrap.Modal.getInstance(document.getElementById('modalCrearUsuario')).hide();
        cargarUsuarios(document.getElementById('filtroRol').value);
    }
}

async function eliminarUsuario(idUser) {
    if (!confirm('¿Eliminar este usuario? Esto borra también sus pagos, puntos y actividad.')) return;
    const res = await API.request(`/admin/usuarios/${idUser}`, 'DELETE');
    if (res.status === 'ok') cargarUsuarios(document.getElementById('filtroRol').value);
    else alert(res.message || 'No se pudo eliminar');
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

// ===== CATÁLOGO DE PRODUCTOS =====

async function cargarProductos(categoria) {
    const query = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';
    const res = await API.request(`/productos${query}`);
    const tbody = document.querySelector('#tablaProductos tbody');
    tbody.innerHTML = '';

    if (res.status !== 'ok') {
        avisar('msgProductos', res);
        return;
    }

    res.productos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre}" style="width:50px;height:50px;object-fit:cover;border-radius:6px">` : '—'}</td>
            <td>${p.nombre}</td>
            <td>${p.categoria}</td>
            <td>${Number(p.precio).toFixed(2)} USD</td>
            <td><button class="btn btn-sm btn-outline-danger" data-id="${p.id_producto}" data-accion="eliminar">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

async function crearProducto(e) {
    e.preventDefault();
    const datos = {
        nombre: document.getElementById('nuevoProductoNombre').value,
        categoria: document.getElementById('nuevoProductoCategoria').value,
        precio: document.getElementById('nuevoProductoPrecio').value,
        imagen_url: document.getElementById('nuevoProductoImagen').value || null,
    };

    const res = await API.request('/admin/productos', 'POST', datos);
    avisar('msgProductos', res);

    if (res.status === 'ok') {
        document.getElementById('formCrearProducto').reset();
        cargarProductos(document.getElementById('filtroCategoriaProductos').value);
    }
}

function onClickTablaProductos(e) {
    const btn = e.target.closest('button[data-accion]');
    if (!btn) return;
    if (btn.dataset.accion === 'eliminar') {
        eliminarProducto(btn.dataset.id);
    }
}

async function eliminarProducto(idProducto) {
    if (!confirm('¿Eliminar este artículo del catálogo? También desaparecerá de la página pública.')) return;
    const res = await API.request(`/admin/productos/${idProducto}`, 'DELETE');
    avisar('msgProductos', res);
    if (res.status === 'ok') cargarProductos(document.getElementById('filtroCategoriaProductos').value);
}