// front/dist/js/catalogo.js
// Carga los productos de la categoría de esta página (data-categoria en <section id="productos">)
// y los pinta como tarjetas, en vez de tenerlos escritos a mano en el HTML.

document.addEventListener('DOMContentLoaded', cargarCatalogoPublico);

async function cargarCatalogoPublico() {
    const seccion = document.getElementById('productos');
    const contenedor = document.getElementById('listaProductos');
    if (!seccion || !contenedor) return;

    const categoria = seccion.dataset.categoria;
    const res = await API.request(`/productos?categoria=${encodeURIComponent(categoria)}`);

    if (res.status !== 'ok') {
        contenedor.innerHTML = `<p class="jost text-white-50">No se pudo cargar el catálogo en este momento.</p>`;
        return;
    }

    if (res.productos.length === 0) {
        contenedor.innerHTML = `<p class="jost text-white-50">Todavía no hay artículos cargados en esta categoría.</p>`;
        return;
    }

    contenedor.innerHTML = res.productos.map(p => `
        <div class="producto-card">
            ${p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre}">` : ''}
            <h3 class="bebas">${p.nombre}</h3>
            <p class="precio-producto">PRECIO: ${Number(p.precio).toFixed(0)} USD</p>
        </div>
    `).join('');
}