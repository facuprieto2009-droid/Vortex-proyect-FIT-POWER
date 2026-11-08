// front/dist/js/Puntos.js
// Canje con email + contraseña (sin sesión previa). Revisa puntos de la cuenta.

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

let recompensasCache = [];
let canjeActual = { id: null, nombre: '', costo: 0 };

document.addEventListener('DOMContentLoaded', async function () {
    const contenedor = document.getElementById('listaProductos');
    if (!contenedor) return;

    await I18N.ready;
    asegurarModalCanje();

    const res = await API.request('/recompensas', 'GET');

    if (res.status !== 'ok' || !res.recompensas || res.recompensas.length === 0) {
        contenedor.innerHTML = `<p class="text-secondary jost" data-i18n="puntos_sin_items">${I18N.t('puntos_sin_items')}</p>`;
        return;
    }

    recompensasCache = res.recompensas;

    const dibujar = () => {
        contenedor.innerHTML = recompensasCache.map(r => {
            const costo = Number(r.puntos) || 0;
            return `
        <div class="producto-card">
            <div class="producto-img-wrap">
                <img src="${escaparAttr(r.imagen_url) || '../assets/imagenes/Fondo.png'}" alt="${escaparAttr(r.nombre)}">
            </div>
            <div class="producto-info">
                <h3 class="producto-nombre">${escaparHtml(r.nombre)}</h3>
                <p class="producto-marca">FitPower</p>
                <p class="producto-precio">${I18N.t('puntos_valor', { n: costo.toLocaleString(I18N.locale) })}</p>
            </div>
            <button class="btn-comprar" type="button"
                    data-id="${escaparAttr(r.id_recompensa)}"
                    data-nombre="${escaparAttr(r.nombre)}"
                    data-puntos="${costo}"
                    data-i18n="btn_canjear">${I18N.t('btn_canjear')}</button>
        </div>`;
        }).join('');
    };

    dibujar();
    document.addEventListener('languageChanged', dibujar);

    contenedor.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn-comprar');
        if (!btn) return;
        abrirModalCanje(btn.dataset.id, btn.dataset.nombre, Number(btn.dataset.puntos) || 0);
    });
});

function asegurarModalCanje() {
    if (document.getElementById('modalCanjePuntos')) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
    <div class="modal fade" id="modalCanjePuntos" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content negroint jost text-white">
                <div class="modal-header border-secondary">
                    <h5 class="modal-title bebas">Canjear con puntos</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <p class="mb-3">
                        <span>Recompensa:</span>
                        <strong id="canjeNombre" style="color:#2BFF52;">—</strong>
                        <span class="text-secondary ms-1" id="canjeCostoLabel"></span>
                    </p>
                    <form id="formCanjePuntos" novalidate>
                        <div class="mb-3">
                            <label for="canjeEmail" class="form-label">Email</label>
                            <input type="email" class="form-control" id="canjeEmail" required
                                   placeholder="tu@email.com" autocomplete="email">
                        </div>
                        <div class="mb-3">
                            <label for="canjePass" class="form-label">Contraseña</label>
                            <input type="password" class="form-control" id="canjePass" required minlength="6"
                                   placeholder="Tu contraseña" autocomplete="current-password">
                        </div>
                        <div id="msgCanjePuntos" class="small mb-2" role="alert"></div>
                        <button type="submit" class="btn verdeint text-dark w-100 fw-bold">
                            Confirmar canje
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>`;
    document.body.appendChild(wrapper.firstElementChild);

    document.getElementById('formCanjePuntos').addEventListener('submit', onSubmitCanje);
}

function abrirModalCanje(id, nombre, costo) {
    asegurarModalCanje();
    canjeActual = { id, nombre, costo };

    document.getElementById('canjeNombre').textContent = nombre;
    document.getElementById('canjeCostoLabel').textContent = `(${Number(costo).toLocaleString()} pts)`;

    const form = document.getElementById('formCanjePuntos');
    form.reset();
    const msg = document.getElementById('msgCanjePuntos');
    msg.textContent = '';
    msg.className = 'small mb-2';
    form.querySelector('button[type=submit]').disabled = false;

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCanjePuntos')).show();
}

async function onSubmitCanje(e) {
    e.preventDefault();
    const email = document.getElementById('canjeEmail').value.trim();
    const password = document.getElementById('canjePass').value;
    const msg = document.getElementById('msgCanjePuntos');
    const btn = e.target.querySelector('button[type=submit]') || e.submitter;

    function avisar(texto, ok) {
        msg.textContent = texto;
        msg.className = 'small mb-2 ' + (ok ? 'text-success' : 'text-danger');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return avisar('Ingresá un email válido.', false);
    }
    if (password.length < 6) {
        return avisar('La contraseña debe tener al menos 6 caracteres.', false);
    }
    if (!canjeActual.id) {
        return avisar('No se eligió ninguna recompensa.', false);
    }

    if (btn) btn.disabled = true;
    msg.textContent = 'Procesando...';
    msg.className = 'small mb-2 text-secondary';

    const res = await API.request(`/recompensas/${canjeActual.id}/canjear`, 'POST', {
        email: email,
        password: password
    });

    if (res.status === 'ok') {
        avisar(
            '¡Canje realizado con éxito! Canjeaste "' + (res.recompensa || canjeActual.nombre) +
            '". Te quedan ' + Number(res.puntos_restantes || 0).toLocaleString() + ' pts.',
            true
        );
        setTimeout(function () {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalCanjePuntos'));
            if (modal) modal.hide();
            if (btn) btn.disabled = false;
        }, 2200);
        return;
    }

    if (res.message && /falta de puntos|suficientes/i.test(res.message)) {
        avisar('No se pudo realizar el canje por falta de puntos.', false);
    } else {
        avisar(res.message || 'No se pudo completar el canje.', false);
    }
    if (btn) btn.disabled = false;
}