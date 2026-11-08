// front/dist/js/auth.js
// Login, registro, logout, cambio de contraseña, y el guard de sesión para los paneles.
// Rutas absolutas desde la raíz del sitio para que funcionen desde cualquier carpeta.

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
                return mostrarMensaje('authMsg', I18N.msg(res.message) || I18N.t('auth_login_error'), 'error');
            }

            // Redirige según el rol (rutas absolutas)
            const rol = res.usuario.nombre_rol;
            if (rol === 'Administrador') {
                window.location.href = '/front/dist/pages/vistas/VistaAdministradores.html';
            } else if (rol === 'Entrenador') {
                window.location.href = '/front/dist/pages/vistas/VistaEntrenadores.html';
            } else if (rol === 'Usuario' || rol === 'Cliente') {
                window.location.href = '/front/dist/pages/vistas/VistaUsuario.html';
            } else {
                window.location.href = '/front/index.html';
            }
        });
    }

    /* ===== REGISTRO ===== */
    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', async function (e) {
            e.preventDefault();
                        const nombre = document.getElementById('registroNombre').value.trim();
            const email = document.getElementById('registroEmail').value.trim();
            const password = document.getElementById('registroPass').value;
            const password2 = document.getElementById('registroPass2').value;

            if (password.length < 6) {
                return mostrarMensaje('authMsg', I18N.t('auth_pass_corta'), 'error');
            }
            if (password !== password2) {
                return mostrarMensaje('authMsg', I18N.t('auth_pass_no_coincide'), 'error');
            }

            const res = await API.request('/register', 'POST', { nombre, email, password });
            if (res.status !== 'ok') {
                return mostrarMensaje('authMsg', I18N.msg(res.message) || I18N.t('auth_registro_error'), 'error');
            }

            mostrarMensaje('authMsg', I18N.t('auth_cuenta_creada'), 'ok');
            setTimeout(() => window.location.href = '/front/dist/pages/login/Login.html', 1200);
        });
    }

    /* ===== LOGOUT (cualquier botón con id="btnLogout") ===== */
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async function () {
            await API.request('/logout', 'POST');
            window.location.href = '/front/index.html';
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
                msgEl.textContent = I18N.msg(res.message) || '';
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
    await I18N.ready; // el idioma tiene que estar cargado antes de dibujar nada
    const res = await API.request('/session', 'GET');

    if (res.status !== 'ok') {
        window.location.href = '/front/dist/pages/login/Login.html';
        return null;
    }

    if (rolesPermitidos && !rolesPermitidos.includes(res.usuario.nombre_rol)) {
        alert(I18N.t('auth_sin_permiso'));
        window.location.href = '/front/index.html';
        return null;
    }

    const nombreEl = document.getElementById('usuarioNombre');
    if (nombreEl) {
        const mostrarNombre = () => {
            nombreEl.textContent = res.usuario.nombre + ' (' + I18N.rol(res.usuario.nombre_rol) + ')';
        };
        mostrarNombre();
        document.addEventListener('languageChanged', mostrarNombre);
    }

    return res.usuario;
}