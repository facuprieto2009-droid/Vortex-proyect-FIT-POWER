// front/dist/js/i18n.js
// Sistema de traducción ES / EN.
//
// CÓMO FUNCIONA
//  - Los textos viven en js/i18n/es.json y js/i18n/en.json (misma clave en los dos).
//  - En el HTML se marca el elemento con data-i18n="clave" y el script reemplaza su texto.
//    Variantes para atributos:  data-i18n-placeholder | data-i18n-title | data-i18n-aria-label | data-i18n-alt
//    Para textos con variables:  data-i18n="coach_edad" data-i18n-params='{"n":39}'   ->  "39 años" / "39 years old"
//  - En JS se usa I18N.t('clave', { variable: valor }).
//  - Este script tiene que cargarse ANTES que los demás scripts de la página (justo después de Bootstrap).
//    Los scripts que dibujan contenido hacen `await I18N.ready` antes de usar I18N.t().
//  - Al cambiar de idioma se dispara el evento 'languageChanged' en document.

const I18N = (() => {
    const SOPORTADOS = ['es', 'en'];
    const POR_DEFECTO = 'es';
    const LOCALES = { es: 'es-UY', en: 'en-US' };

    // La ruta de los JSON se calcula desde donde está este archivo, así funciona en cualquier carpeta.
    const base = document.currentScript ? document.currentScript.src : location.href;
    const urlIdioma = (lang) => new URL(`i18n/${lang}.json`, base).href;

    function leerIdiomaGuardado() {
        try {
            const guardado = localStorage.getItem('lang');
            if (SOPORTADOS.includes(guardado)) return guardado;
        } catch (_) { /* localStorage bloqueado: seguimos con el idioma por defecto */ }
        return POR_DEFECTO;
    }

    function guardarIdioma(lang) {
        try { localStorage.setItem('lang', lang); } catch (_) { /* sin localStorage no se recuerda la elección */ }
    }

    async function cargarJson(lang) {
        try {
            const res = await fetch(urlIdioma(lang));
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (error) {
            console.error(`[i18n] No se pudo cargar el idioma "${lang}":`, error);
            return {};
        }
    }

    // "Miércoles" / "Mie" / "mié" -> "mie"
    function clave3(texto) {
        return String(texto || '').trim().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .slice(0, 3);
    }

    const api = {
        lang: leerIdiomaGuardado(),
        dict: {},        // idioma actual
        respaldo: {},    // español: se usa si a la clave le falta la traducción

        get locale() { return LOCALES[this.lang] || LOCALES[POR_DEFECTO]; },

        has(clave) {
            return clave in this.dict || clave in this.respaldo;
        },

        // Traduce una clave. {variable} se reemplaza con params.variable. Si no existe, devuelve la clave.
        t(clave, params) {
            let texto = this.dict[clave] ?? this.respaldo[clave] ?? clave;
            if (params) {
                texto = texto.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m));
            }
            return texto;
        },

        // Traduce los elementos marcados con data-i18n* dentro de `raiz` (por defecto, toda la página).
        apply(raiz = document) {
            raiz.querySelectorAll('[data-i18n]').forEach(el => {
                let params;
                if (el.dataset.i18nParams) {
                    try { params = JSON.parse(el.dataset.i18nParams); } catch (_) { /* params inválidos: se ignoran */ }
                }
                el.textContent = this.t(el.dataset.i18n, params);
            });
            const atributos = [
                ['data-i18n-placeholder', 'placeholder'],
                ['data-i18n-title', 'title'],
                ['data-i18n-aria-label', 'aria-label'],
                ['data-i18n-alt', 'alt'],
            ];
            atributos.forEach(([dataAttr, attr]) => {
                raiz.querySelectorAll(`[${dataAttr}]`).forEach(el => {
                    el.setAttribute(attr, this.t(el.getAttribute(dataAttr)));
                });
            });
            document.documentElement.lang = this.lang;
            this.actualizarSelector();
        },

        // Marca el botón del idioma activo (botones con data-idioma="es" / "en").
        actualizarSelector() {
            document.querySelectorAll('[data-idioma]').forEach(btn => {
                const activo = btn.dataset.idioma === this.lang;
                btn.classList.toggle('activo', activo);
                btn.setAttribute('aria-pressed', String(activo));
            });
        },

        async setLanguage(lang) {
            if (!SOPORTADOS.includes(lang)) return;
            this.dict = lang === POR_DEFECTO ? this.respaldo : await cargarJson(lang);
            this.lang = lang;
            guardarIdioma(lang);
            this.apply();
            // Para que el código que dibuja contenido (tablas, catálogos...) se vuelva a dibujar.
            document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
        },

        toggleLanguage() {
            return this.setLanguage(this.lang === 'es' ? 'en' : 'es');
        },

        /* ---------- Ayudas para traducir datos que vienen de la base ---------- */

        // Mensajes que devuelve la API (están en español). Si no hay traducción, se muestra el original.
        msg(texto) {
            if (!texto || this.lang === 'es') return texto;
            const clave = 'api:' + texto;
            if (clave in this.dict) return this.dict[clave];

            let m = texto.match(/^Categoría inválida\. Debe ser: (.+)$/);
            if (m) return this.t('api_categoria_invalida', { lista: m[1] });
            m = texto.match(/^No se puede eliminar: hay (\d+) registro/);
            if (m) return this.t('api_ejercicio_en_uso', { n: m[1] });
            return texto;
        },

        // "Lunes, Miercoles" (como se guarda en la base) -> "Monday, Wednesday"
        dias(texto) {
            if (!texto) return '';
            return String(texto).split(',').map(d => {
                const clave = 'dia_' + clave3(d);
                return this.has(clave) ? this.t(clave) : d.trim();
            }).join(', ');
        },

        // Nombre de rol que viene de la base ("Administrador", "Entrenador"...)
        rol(nombre) {
            const clave = 'rol_' + String(nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return this.has(clave) ? this.t(clave) : nombre;
        },

        // Categoría de producto que viene de la base ("Pesas", "Suplementos", "BarrasProteicas")
        categoria(valor) {
            const clave = 'cat_' + String(valor || '').toLowerCase();
            return this.has(clave) ? this.t(clave) : valor;
        },

        // <tr> de "no hay datos" que se retraduce solo al cambiar de idioma
        emptyRow(columnas, clave) {
            return `<tr><td colspan="${columnas}" class="text-center text-secondary" data-i18n="${clave}">${this.t(clave)}</td></tr>`;
        },
    };

    // Carga los diccionarios (español siempre, como respaldo) y se resuelve cuando están listos.
    api.ready = (async () => {
        api.respaldo = await cargarJson(POR_DEFECTO);
        api.dict = api.lang === POR_DEFECTO ? api.respaldo : await cargarJson(api.lang);
    })();

    return api;
})();

// Traduce la página cuando el DOM y los diccionarios están listos.
document.addEventListener('DOMContentLoaded', async () => {
    await I18N.ready;
    I18N.apply();
});

// Botones del selector de idioma: <button data-idioma="es">ES</button> <button data-idioma="en">EN</button>
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-idioma]');
    if (btn) I18N.setLanguage(btn.dataset.idioma);
});