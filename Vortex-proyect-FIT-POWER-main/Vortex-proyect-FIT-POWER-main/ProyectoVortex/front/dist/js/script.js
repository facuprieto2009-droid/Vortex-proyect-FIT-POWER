document.addEventListener("DOMContentLoaded", function () {

    const dias = document.querySelectorAll(".badge.dia");
    dias.forEach(function (dia) {
        dia.addEventListener("click", function () {
            dias.forEach(d => d.classList.remove("activo"));
            dia.classList.add("activo");
            console.log("Día seleccionado:", dia.textContent.trim());
        });
    });
    if (dias.length > 0) dias[0].classList.add("activo");

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

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth" });
                const navbarCollapse = document.getElementById("navbarSupportedContent");
                if (navbarCollapse && navbarCollapse.classList.contains("show")) {
                    new bootstrap.Collapse(navbarCollapse).hide();
                }
            }
        });
    });

    const btnArriba = document.getElementById("btnArriba");
    if (btnArriba) {
        window.addEventListener("scroll", function () {
            btnArriba.style.display = window.scrollY > 400 ? "block" : "none";
        });
        btnArriba.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

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

});