// front/dist/js/Catalogo.js
// Llena la grilla de productos y abre un modal de compra (email, contraseña, método de pago).

document.addEventListener('DOMContentLoaded', async function () {
    const contenedor = document.getElementById('listaProductos');
    if (!contenedor) return;

    await I18N.ready;

    asegurarModalCompra();

    const seccion = document.getElementById('productos');
    const categoria = seccion ? seccion.dataset.categoria : null;
    const query = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';

    const res = await API.request(`/productos${query}`, 'GET');

    if (res.status !== 'ok' || !res.productos || res.productos.length === 0) {
        contenedor.innerHTML = `<p class="text-secondary jost" data-i18n="sin_productos">${I18N.t('sin_productos')}</p>`;
        return;
    }

    contenedor.innerHTML = res.productos.map(p => `
        <div class="producto-card">
            <div class="producto-img-wrap">
                <img src="${escaparAttr(p.imagen_url) || '../../../assets/imagenes/Fondo.png'}" alt="${escaparAttr(p.nombre)}">
            </div>
            <div class="producto-info">
                <h3 class="producto-nombre">${escaparHtml(p.nombre)}</h3>
                <p class="producto-marca">FitPower</p>
                <p class="producto-precio"><span data-i18n="precio_prefijo">${I18N.t('precio_prefijo')}</span> ${Number(p.precio).toFixed(0)}</p>
            </div>
            <button class="btn-comprar" type="button"
                    data-nombre="${escaparAttr(p.nombre)}"
                    data-precio="${Number(p.precio).toFixed(0)}"
                    data-i18n="btn_comprar">${I18N.t('btn_comprar')}</button>
        </div>
    `).join('');

    contenedor.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-comprar');
        if (!btn) return;
        abrirModalCompra(btn.dataset.nombre || 'Producto', btn.dataset.precio || '');
    });
});

function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

function escaparAttr(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function asegurarModalCompra() {
    if (document.getElementById('modalCompraProducto')) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
    <div class="modal fade" id="modalCompraProducto" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content negroint jost text-white">
                <div class="modal-header border-secondary">
                    <h5 class="modal-title bebas" id="modalCompraTitulo">Comprar producto</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <p class="mb-3">
                        <span>Producto:</span>
                        <strong id="compraProductoNombre" style="color:#2BFF52;">—</strong>
                        <span id="compraProductoPrecio" class="text-secondary ms-1"></span>
                    </p>
                    <form id="formCompraProducto" novalidate>
                        <div class="mb-3">
                            <label for="compraEmail" class="form-label">Email</label>
                            <input type="email" class="form-control" id="compraEmail" required
                                   placeholder="tu@email.com" autocomplete="email">
                        </div>
                        <div class="mb-3">
                            <label for="compraPass" class="form-label">Contraseña</label>
                            <input type="password" class="form-control" id="compraPass" required minlength="6"
                                   placeholder="Mínimo 6 caracteres" autocomplete="current-password">
                        </div>
                        <div class="mb-3">
                            <label for="compraPago" class="form-label">Método de pago</label>
                            <select class="form-select" id="compraPago" required>
                                <option value="">Elegí un método</option>
                                <option value="tarjeta">Tarjeta de crédito / débito</option>
                                <option value="transferencia">Transferencia bancaria</option>
                                <option value="mercadopago">Mercado Pago</option>
                                <option value="efectivo">Efectivo en el gimnasio</option>
                            </select>
                        </div>
                        <div id="msgCompraProducto" class="small mb-2" role="alert"></div>
                        <button type="submit" class="btn verdeint text-dark w-100 fw-bold">
                            Confirmar compra
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>`;
    document.body.appendChild(wrapper.firstElementChild);

    document.getElementById('formCompraProducto').addEventListener('submit', onSubmitCompra);
}

function abrirModalCompra(nombre, precio) {
    asegurarModalCompra();
    document.getElementById('compraProductoNombre').textContent = nombre;
    document.getElementById('compraProductoPrecio').textContent = precio
        ? `($ ${precio})`
        : '';

    const form = document.getElementById('formCompraProducto');
    form.reset();
    const msg = document.getElementById('msgCompraProducto');
    msg.textContent = '';
    msg.className = 'small mb-2';
    form.querySelector('button[type=submit]').disabled = false;

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCompraProducto')).show();
}

async function onSubmitCompra(e) {
    e.preventDefault();
    const email = document.getElementById('compraEmail').value.trim();
    const pass = document.getElementById('compraPass').value;
    const metodo = document.getElementById('compraPago').value;
    const msg = document.getElementById('msgCompraProducto');
    const nombre = document.getElementById('compraProductoNombre').textContent;
    const precio = document.getElementById('compraProductoPrecio').textContent;

    function avisar(texto, ok) {
        msg.textContent = texto;
        msg.className = 'small mb-2 ' + (ok ? 'text-success' : 'text-danger');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return avisar('Ingresá un email válido.', false);
    }
    if (pass.length < 6) {
        return avisar('La contraseña debe tener al menos 6 caracteres.', false);
    }
    if (!metodo) {
        return avisar('Elegí un método de pago.', false);
    }

    const metodosLabel = {
        tarjeta: 'Tarjeta de crédito / débito',
        transferencia: 'Transferencia bancaria',
        mercadopago: 'Mercado Pago',
        efectivo: 'Efectivo en el gimnasio'
    };

    avisar(
        '¡Pedido recibido! ' + nombre + ' ' + precio +
        ' — pago: ' + (metodosLabel[metodo] || metodo) +
        '. Te contactamos al email para coordinar la entrega.',
        true
    );

    const btn = e.target.querySelector('button[type=submit]') || e.submitter;
    if (btn) btn.disabled = true;

    setTimeout(function () {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalCompraProducto'));
        if (modal) modal.hide();
        if (btn) btn.disabled = false;
    }, 2200);
}