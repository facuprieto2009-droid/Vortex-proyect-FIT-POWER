// front/dist/js/api.js
// El mensajero: el HTML nunca habla con PHP directo. Pasa por acá.

const API = {
    // En Docker: http://localhost:8080/api
    urlBase: '/api',

    async request(endpoint, method = 'GET', data = null) {
        const url = this.urlBase + endpoint;

        const opciones = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        // GET no lleva body. POST/PUT sí.
        if (data) {
            opciones.body = JSON.stringify(data);
        }

        try {
            const respuesta = await fetch(url, opciones);
            const json = await respuesta.json();
            return json;
        } catch (error) {
            console.error('Error de conexión con la API:', error);
            return { status: 'error', message: 'No se pudo conectar con la API' };
        }
    }
};
