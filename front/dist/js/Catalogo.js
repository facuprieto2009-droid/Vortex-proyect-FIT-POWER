// front/dist/js/Catalogo.js
// Llena la grilla de productos de Pesas.html / Suplementos.html / BarrasProteicas.html

document.addEventListener('DOMContentLoaded', async function () {
    const contenedor = document.getElementById('listaProductos');
    if (!contenedor) return;

    const seccion = document.getElementById('productos');
    const categoria = seccion ? seccion.dataset.categoria : null;
    const query = categoria ? `?categoria=${encodeURIComponent(categoria)}` : '';

    const res = await API.request(`/productos${query}`, 'GET');

    if (res.status !== 'ok' || !res.productos || res.productos.length === 0) {
        contenedor.innerHTML = '<p class="text-secondary jost">Todavía no hay productos cargados en esta categoría.</p>';
        return;
    }

    contenedor.innerHTML = res.productos.map(p => `
        <div class="producto-card">
            <div class="producto-img-wrap">
                <img src="${p.imagen_url || '../../assets/imagenes/Fondo.png'}" alt="${p.nombre}">
            </div>
            <div class="producto-info">
                <h3 class="producto-nombre">${p.nombre}</h3>
                <p class="producto-marca">FitPower</p>
                <p class="producto-precio">US$ ${Number(p.precio).toFixed(0)}</p>
            </div>
            <button class="btn-comprar" type="button">COMPRAR</button>
        </div>
    `).join('');
});