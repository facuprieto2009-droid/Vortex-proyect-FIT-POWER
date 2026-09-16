// front/dist/js/auth.js
// Login, registro, logout, cambio de contraseña, y el guard de sesión para los paneles.

document.addEventListener('DOMContentLoaded', function () {

    function mostrarMensaje(contenedorId, texto, tipo) {
        const el = document.getElementById(contenedorId);
        if (!el) return;
        el.textContent = texto;
        el.className = 'alert mt-3 ' + (tipo === 'error' ? 'alert-danger' : 'alert-success');
        el.classList.remove('d-none');
    }

    /* ===== LOGIN ===== */
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPass').value;

            const res = await API.request('/login', 'POST', { email, password });

            if (res.status !== 'ok') {
                return mostrarMensaje('authMsg', res.message || 'No se pudo iniciar sesión', 'error');
            }

            // Redirige según el rol
            const rol = res.usuario.nombre_rol;
            if (rol === 'Administrador') {
                window.location.href = 'VistaAdministradores.html';
            } else if (rol === 'Entrenador') {
                window.location.href = 'VistaEntrenadores.html';
            } else {
                window.location.href = '../../index.html';
            }
        });
    }

    /* ===== REGISTRO ===== */
    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const email = document.getElementById('registroEmail').value.trim();
            const password = document.getElementById('registroPass').value;

            const res = await API.request('/register', 'POST', { email, password });

            if (res.status !== 'ok') {
                return mostrarMensaje('authMsg', res.message || 'No se pudo completar el registro', 'error');
            }

            mostrarMensaje('authMsg', 'Cuenta creada. Ya podés iniciar sesión.', 'ok');
            setTimeout(() => window.location.href = 'Login.html', 1200);
        });
    }

    /* ===== LOGOUT (cualquier botón con id="btnLogout") ===== */
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async function () {
            await API.request('/logout', 'POST');
            window.location.href = '../../index.html';
        });
    }

    /* ===== CAMBIAR CONTRASEÑA (formulario con id="cambiarPassForm") ===== */
    const cambiarPassForm = document.getElementById('cambiarPassForm');
    if (cambiarPassForm) {
        cambiarPassForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const password_actual = document.getElementById('passActual').value;
            const password_nueva = document.getElementById('passNueva').value;

            const res = await API.request('/password', 'PUT', { password_actual, password_nueva });

            const msgEl = document.getElementById('cambiarPassMsg');
            if (msgEl) {
                msgEl.textContent = res.message || '';
                msgEl.className = 'small mt-2 ' + (res.status === 'ok' ? 'text-success' : 'text-danger');
            }
            if (res.status === 'ok') cambiarPassForm.reset();
        });
    }
});

// Protege una página: exige sesión y, opcionalmente, uno de los roles dados.
// Uso: requiereSesion(['Administrador']) al inicio del script de cada panel.
// Devuelve el usuario logueado (o null si tuvo que redirigir).
async function requiereSesion(rolesPermitidos) {
    const res = await API.request('/session', 'GET');

    if (res.status !== 'ok') {
        window.location.href = 'Login.html';
        return null;
    }

    if (rolesPermitidos && !rolesPermitidos.includes(res.usuario.nombre_rol)) {
        alert('No tenés permiso para ver esta página.');
        window.location.href = '../../index.html';
        return null;
    }

    const nombreEl = document.getElementById('usuarioNombre');
    if (nombreEl) nombreEl.textContent = res.usuario.nombre + ' (' + res.usuario.nombre_rol + ')';

    return res.usuario;
}
