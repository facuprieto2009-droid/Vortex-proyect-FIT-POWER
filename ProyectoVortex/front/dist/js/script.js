document.addEventListener("DOMContentLoaded", function () {

    /* ===== 1. SELECTOR DE DÍAS (Entrenamientos) ===== */
    const dias = document.querySelectorAll(".badge.dia");
    dias.forEach(function (dia) {
        dia.addEventListener("click", function () {
            dias.forEach(d => d.classList.remove("activo"));
            dia.classList.add("activo");
            // Acá se podría filtrar los entrenamientos según el día elegido
            console.log("Día seleccionado:", dia.textContent.trim());
        });
    });
    // Día "Lunes" activo por defecto
    if (dias.length > 0) dias[0].classList.add("activo");

    /* ===== 2. SELECCIONAR PLAN (Mensualidades) ===== */
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

    /* ===== 3. CARRUSEL DE ENTRENAMIENTOS (dots) ===== */
    const dots = document.querySelectorAll(".carousel-dots span");
    const track = document.getElementById("entrenoTrack");
    if (dots.length > 0 && track) {
        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                dots.forEach(d => d.classList.remove("activo"));
                dot.classList.add("activo");
                const cards = track.querySelectorAll(".entreno-card");
                if (cards[index]) {
                    cards[index].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                }
            });
        });
    }

    /* ===== 4. SCROLL SUAVE PARA LOS LINKS DEL MENÚ ===== */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth" });
                // cerrar el menú colapsado en mobile
                const navbarCollapse = document.getElementById("navbarSupportedContent");
                if (navbarCollapse && navbarCollapse.classList.contains("show")) {
                    new bootstrap.Collapse(navbarCollapse).hide();
                }
            }
        });
    });

    /* ===== 5. BOTÓN VOLVER ARRIBA ===== */
    const btnArriba = document.getElementById("btnArriba");
    if (btnArriba) {
        window.addEventListener("scroll", function () {
            btnArriba.style.display = window.scrollY > 400 ? "block" : "none";
        });
        btnArriba.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    /* ===== 6. BUSCADOR DEL NAVBAR ===== */
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

    /* ===== 7. CARRUSELES DE COACHES Y MENSUALIDADES (mobile) ===== */
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

    /* ===== 8. PRODUCTOS POR CATEGORIA (página Productos.html) ===== */
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

    /* ===== 9. LOGIN ===== */
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
            // Acá iría la validación real contra el backend
        });
    }

    /* ===== 10. REGISTRO ===== */
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
            // Acá iría el registro real contra el backend
        });
    }

});