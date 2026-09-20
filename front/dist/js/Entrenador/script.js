document.addEventListener("DOMContentLoaded", function () {

    /* ===== 1. SELECCIONAR PLAN (Mensualidades) ===== */
    const botonesSuscribir = document.querySelectorAll(".btn-suscribir");
    botonesSuscribir.forEach(function (btn) {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".plan-card").forEach(card => card.classList.remove("seleccionado"));
            const card = btn.closest(".plan-card");
            card.classList.add("seleccionado");
            const nombrePlan = card.querySelector(".precio").textContent.trim();
            alert("¡Elegiste el plan de " + nombrePlan + " al mes! En breve te contactamos para activar tu suscripción.");
        });
    });

    /* ===== 2. CAMBIO DE IMÁGENES/MÁQUINAS POR PUNTOS (DOTS) ===== */
    const gruposMaquinas = [
        // Grupo 0 (Primer botón)
        [
            { nombre: "Banco Plano", img: "dist/assets/imagenes/Barra.png" },
            { nombre: "Maquina Jalon Al Pecho", img: "dist/assets/imagenes/Maquina_B.png" },
            { nombre: "Eliptica", img: "dist/assets/imagenes/Eliptica.png" }
        ],
        // Grupo 1 (Segundo botón) - Ajusta las imágenes y nombres según prefieras
        [
            { nombre: "Mancuera Rusa", img: "dist/assets/imagenes/MancuernaRusa.png" },
            { nombre: "Discos", img: "dist/assets/imagenes/Discos.png" },
            { nombre: "Barras", img: "dist/assets/imagenes/Barras.png" }
        ],
        // Grupo 2 (Tercer botón) - Ajusta las imágenes y nombres según prefieras
        [
            { nombre: "Maquina de extención de piernas", img: "dist/assets/imagenes/Maquina_sis.png" },
            { nombre: "Cinta de correr curva", img: "dist/assets/imagenes/MaquinaDeCorrerCurva.png" },
            { nombre: "Caminadora", img: "dist/assets/imagenes/Caminadora.jpg" }
        ]
    ];

    function cargarGrupoMaquinas(indiceGrupo) {
        const track = document.getElementById("entrenoTrack");
        if (!track) return;

        track.innerHTML = "";
        const tarjetas = gruposMaquinas[indiceGrupo] || gruposMaquinas[0];

        tarjetas.forEach(item => {
            const card = document.createElement("div");
            card.className = "col entreno-card card text-bg-dark";
            card.innerHTML = `
                <img src="${item.img}" class="card-img" alt="${item.nombre}">
                <div class="card-img-overlay">
                    <h5 class="card-title bebas">${item.nombre}</h5>
                    ${item.detalle ? `<p class="card-text jost">${item.detalle}</p>` : ""}
                </div>
            `;
            track.appendChild(card);
        });
    }

    const dots = document.querySelectorAll(".carousel-dots span");
    if (dots.length > 0) {
        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                // Activa visualmente el punto tocado (pasa a verde)
                dots.forEach(d => d.classList.remove("activo"));
                dot.classList.add("activo");

                // Carga el grupo de máquinas correspondiente
                cargarGrupoMaquinas(index);
            });
        });

        // Carga inicial del primer grupo al entrar a la página
        cargarGrupoMaquinas(0);
    }

    /* ===== 3. SCROLL SUAVE PARA LOS LINKS DEL MENÚ ===== */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth" });
                // Cerrar el menú colapsado en mobile
                const navbarCollapse = document.getElementById("navbarSupportedContent");
                if (navbarCollapse && navbarCollapse.classList.contains("show")) {
                    new bootstrap.Collapse(navbarCollapse).hide();
                }
            }
        });
    });

    /* ===== 4. BOTÓN VOLVER ARRIBA ===== */
    const btnArriba = document.getElementById("btnArriba");
    if (btnArriba) {
        window.addEventListener("scroll", function () {
            btnArriba.style.display = window.scrollY > 400 ? "block" : "none";
        });
        btnArriba.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    /* ===== 5. BUSCADOR DEL NAVBAR ===== */
    const formBuscar = document.getElementById("formBuscar");
    if (formBuscar) {
        formBuscar.addEventListener("submit", function (e) {
            e.preventDefault();
            const valor = document.getElementById("inputBuscar").value.trim();
            if (valor) {
                alert("Buscando: " + valor);
            }
        });
    }

    /* ===== 6. CARRUSELES DE COACHES Y MENSUALIDADES (mobile) ===== */
    function crearCarrusel(trackId, prevId, nextId, indiceInicial) {
        const carruselTrack = document.getElementById(trackId);
        if (!carruselTrack) return;
        const items = Array.from(carruselTrack.children);
        let activo = indiceInicial || 0;

        function render() {
            const n = items.length;
            items.forEach(function (item, i) {
                item.classList.remove("carousel-activo", "carousel-lateral-izq", "carousel-lateral-der");
                if (i === activo) {
                    item.style.order = 1;
                    item.classList.add("carousel-activo");
                } else if (i === (activo - 1 + n) % n) {
                    item.style.order = 0;
                    item.classList.add("carousel-lateral-izq");
                } else if (i === (activo + 1) % n) {
                    item.style.order = 2;
                    item.classList.add("carousel-lateral-der");
                } else {
                    item.style.order = 3;
                }
            });
        }

        const prevBtn = document.getElementById(prevId);
        const nextBtn = document.getElementById(nextId);
        if (prevBtn) prevBtn.addEventListener("click", function () {
            activo = (activo - 1 + items.length) % items.length;
            render();
        });
        if (nextBtn) nextBtn.addEventListener("click", function () {
            activo = (activo + 1) % items.length;
            render();
        });

        // Tocar una tarjeta lateral (en mobile) también la vuelve activa
        items.forEach(function (item, i) {
            item.addEventListener("click", function () {
                if (window.innerWidth <= 768) {
                    activo = i;
                    render();
                }
            });
        });

        render();
    }

    crearCarrusel("coachesTrack", "coachPrev", "coachNext", 1);
    crearCarrusel("planesTrack", "planPrev", "planNext", 1);

    /* ===== 7. PRODUCTOS POR CATEGORIA (página Productos.html) ===== */
    const productosGrid = document.getElementById("productosGrid");
    if (productosGrid) {
        const catalogoProductos = {
            maquinas: {
                nombre: "MAQUINAS",
                items: [
                    { nombre: "CAMINADORA", precio: 780, img: "../../front/dist/assets/imagenes/producto-caminadora.png" },
                    { nombre: "ELÍPTICA", precio: 318, img: "../../front/dist/assets/imagenes/producto-eliptica.png" },
                    { nombre: "BANCO DE PECHO", precio: 299, img: "../../front/dist/assets/imagenes/producto-banco.png" },
                    { nombre: "BARRA DOMINADA", precio: 165, img: "../../front/dist/assets/imagenes/producto-barra.png" }
                ]
            },
            pesas: {
                nombre: "PESAS",
                items: [
                    { nombre: "KETTLEBELL 12KG", precio: 45, img: "../../front/dist/assets/imagenes/producto-kettlebell.png" },
                    { nombre: "MANCUERNAS 10KG (PAR)", precio: 60, img: "../../front/dist/assets/imagenes/producto-mancuernas.png" },
                    { nombre: "DISCOS OLÍMPICOS 20KG", precio: 90, img: "../../front/dist/assets/imagenes/producto-discos.png" },
                    { nombre: "BARRA OLÍMPICA", precio: 120, img: "../../front/dist/assets/imagenes/producto-barra-olimpica.png" }
                ]
            },
            suplementos: {
                nombre: "SUPLEMENTOS",
                items: [
                    { nombre: "WHEY PROTEIN 2LB", precio: 35, img: "../../front/dist/assets/imagenes/producto-whey.png" },
                    { nombre: "CREATINA 300G", precio: 22, img: "../../front/dist/assets/imagenes/producto-creatina.png" },
                    { nombre: "PRE-ENTRENO", precio: 28, img: "../../front/dist/assets/imagenes/producto-preentreno.png" },
                    { nombre: "MULTIVITAMÍNICO", precio: 18, img: "../../front/dist/assets/imagenes/producto-multivitaminico.png" }
                ]
            }
        };

        const params = new URLSearchParams(window.location.search);
        const categoria = params.get("categoria") || "maquinas";
        const datosCategoria = catalogoProductos[categoria] || catalogoProductos.maquinas;

        const tituloCategoria = document.getElementById("tituloCategoria");
        if (tituloCategoria) tituloCategoria.textContent = datosCategoria.nombre;

        datosCategoria.items.forEach(function (producto) {
            const card = document.createElement("div");
            card.className = "producto-card";
            card.innerHTML = `
                <img src="${producto.img}" alt="${producto.nombre}">
                <h3 class="bebas">${producto.nombre}</h3>
                <p class="precio-producto">PRECIO: ${producto.precio} USD</p>
            `;
            productosGrid.appendChild(card);
        });
    }

    /* ===== 8. LOGIN ===== */
    const fakeCaptcha = document.getElementById("fakeCaptcha");
    if (fakeCaptcha) {
        fakeCaptcha.addEventListener("click", function () {
            fakeCaptcha.classList.toggle("marcado");
        });
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const pass = document.getElementById("loginPass").value.trim();

            if (!email || !pass) {
                alert("Completá el email y la contraseña para continuar.");
                return;
            }
            if (!fakeCaptcha.classList.contains("marcado")) {
                alert("Confirmá que no sos un robot.");
                return;
            }
            alert("¡Bienvenido de nuevo! Iniciando sesión...");
        });
    }

    /* ===== 9. REGISTRO ===== */
    const registroForm = document.getElementById("registroForm");
    if (registroForm) {
        registroForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const email = document.getElementById("registroEmail").value.trim();
            const pass = document.getElementById("registroPass").value.trim();

            if (!email || !pass) {
                alert("Completá el email y la contraseña para registrarte.");
                return;
            }
            if (pass.length < 6) {
                alert("La contraseña debe tener al menos 6 caracteres.");
                return;
            }
            alert("¡Cuenta creada con éxito! Ya podés iniciar sesión.");
        });
    }

});