<?php
namespace App\Controllers;

use App\Models\AsignacionModel;
use App\Models\ActividadModel;
use App\Models\RutinaModel;
use App\Utils\Auth;

class EntrenadorController {
    private $db;
    private $rolesPermitidos = ['Entrenador', 'Administrador'];

    public function __construct($db) {
        $this->db = $db;
    }

    private function cuerpo() {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    private function responder($data, $codigo = 200) {
        http_response_code($codigo);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }

    // ===== Validación de ejercicios =====

    // Devuelve [datosLimpios, null] o [null, 'mensaje de error'].
    // $parcial = true en PUT: solo se validan los campos que vengan en el body.
    private function validarEjercicio($body, $parcial = false) {
        $datos = [];

        if (!$parcial || array_key_exists('nombre', $body)) {
            $nombre = trim($body['nombre'] ?? '');
            if ($nombre === '') return [null, 'Falta el nombre del ejercicio'];
            if (mb_strlen($nombre) > 100) return [null, 'El nombre no puede superar 100 caracteres'];
            $datos['nombre'] = $nombre;
        }

        if (!$parcial || array_key_exists('grupo_muscular', $body)) {
            $grupo = trim($body['grupo_muscular'] ?? '');
            if ($grupo === '') return [null, 'Falta el grupo muscular'];
            if (mb_strlen($grupo) > 50) return [null, 'El grupo muscular no puede superar 50 caracteres'];
            $datos['grupo_muscular'] = $grupo;
        }

        if (!$parcial || array_key_exists('descripcion', $body)) {
            $desc = trim($body['descripcion'] ?? '');
            if (mb_strlen($desc) > 255) return [null, 'La descripción no puede superar 255 caracteres'];
            $datos['descripcion'] = $desc === '' ? null : $desc;
        }

        if (!$parcial || array_key_exists('calorias_por_unidad', $body)) {
            $cal = $body['calorias_por_unidad'] ?? 0;
            if ($cal === '' || $cal === null) $cal = 0;
            if (!is_numeric($cal) || (int) $cal < 0) return [null, 'Las calorías deben ser un número positivo'];
            $datos['calorias_por_unidad'] = (int) $cal;
        }

        if (!$parcial || array_key_exists('video_url', $body)) {
            $url = trim($body['video_url'] ?? '');
            if ($url === '') {
                $datos['video_url'] = null;
            } else {
                // Solo http(s): evita guardar cosas como "javascript:..." que luego se usan en un href/src
                $esoValido = filter_var($url, FILTER_VALIDATE_URL)
                    && in_array(strtolower(parse_url($url, PHP_URL_SCHEME) ?? ''), ['http', 'https'], true);
                if (!$esoValido) return [null, 'El enlace del video debe empezar con http:// o https://'];
                if (strlen($url) > 500) return [null, 'El enlace del video es demasiado largo (máx. 500 caracteres)'];
                $datos['video_url'] = $url;
            }
        }

        return [$datos, null];
    }

    // ===== Usuarios (clientes) del entrenador =====

    // GET /entrenadores/:id/clientes
    public function verClientes($idEntrenador) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new AsignacionModel($this->db);
        $clientes = $modelo->listarClientesDeEntrenador($idEntrenador);

        if ($clientes === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo obtener la lista de clientes'], 500);
        }
        $this->responder(['status' => 'ok', 'cantidad' => count($clientes), 'clientes' => $clientes]);
    }

    // POST /entrenadores/:id/clientes   body: { "id_cliente": 5 }
    public function asignarCliente($idEntrenador) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $body = $this->cuerpo();
        if (empty($body['id_cliente'])) {
            return $this->responder(['status' => 'error', 'message' => 'Falta id_cliente'], 400);
        }

        $modelo = new AsignacionModel($this->db);
        $ok = $modelo->asignarCliente($idEntrenador, $body['id_cliente']);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo asignar el cliente'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Cliente asignado']);
    }

    // DELETE /entrenadores/:id/clientes/:idCliente
    public function quitarCliente($idEntrenador, $idCliente) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new AsignacionModel($this->db);
        $ok = $modelo->quitarCliente($idEntrenador, $idCliente);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo quitar el cliente'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Cliente desasignado']);
    }

    // ===== Ejercicios / actividad de un cliente (incluye peso levantado) =====

    // GET /clientes/:id/actividad
    public function verActividad($idCliente) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new ActividadModel($this->db);
        $registros = $modelo->listarPorCliente($idCliente);

        if ($registros === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo obtener la actividad'], 500);
        }
        $this->responder(['status' => 'ok', 'registros' => $registros]);
    }

    // POST /clientes/:id/actividad
    // body: { id_ejercicio, id_rutinas?, fecha?, series?, peso_kg?, calorias_quemadas?, puntos_ganados? }
    public function crearActividad($idCliente) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $body = $this->cuerpo();
        if (empty($body['id_ejercicio'])) {
            return $this->responder(['status' => 'error', 'message' => 'Falta id_ejercicio'], 400);
        }

        $modelo = new ActividadModel($this->db);
        $ok = $modelo->crear($idCliente, $body);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo registrar la actividad'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Actividad registrada'], 201);
    }

    // PUT /actividad/:id  body: cualquier subconjunto de series, peso_kg, fecha, id_ejercicio, id_rutinas, calorias_quemadas, puntos_ganados
    public function actualizarActividad($idRegistro) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $body = $this->cuerpo();
        $modelo = new ActividadModel($this->db);
        $ok = $modelo->actualizar($idRegistro, $body);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo actualizar el registro'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Registro actualizado']);
    }

    // DELETE /actividad/:id
    public function eliminarActividad($idRegistro) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new ActividadModel($this->db);
        $ok = $modelo->eliminar($idRegistro);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo eliminar el registro'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Registro eliminado']);
    }

    // ===== Rutinas (incluye días de la semana) =====

    // GET /clientes/:id/rutinas
    public function verRutinasDeCliente($idCliente) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new RutinaModel($this->db);
        $rutinas = $modelo->listarPorCliente($idCliente);

        if ($rutinas === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo obtener las rutinas'], 500);
        }
        $this->responder(['status' => 'ok', 'rutinas' => $rutinas]);
    }

    // GET /rutinas/:id
    public function verRutina($idRutina) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new RutinaModel($this->db);
        $rutina = $modelo->verDetalle($idRutina);

        if ($rutina === false) {
            return $this->responder(['status' => 'error', 'message' => 'Rutina no encontrada'], 404);
        }
        $this->responder(['status' => 'ok', 'rutina' => $rutina]);
    }

    // POST /rutinas  body: { nombre, dias_semana }
    public function crearRutina() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $body = $this->cuerpo();
        if (empty($body['nombre'])) {
            return $this->responder(['status' => 'error', 'message' => 'Falta nombre'], 400);
        }

        $modelo = new RutinaModel($this->db);
        $id = $modelo->crear($body['nombre'], $body['dias_semana'] ?? null);

        if ($id === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo crear la rutina'], 500);
        }
        $this->responder(['status' => 'ok', 'id_rutinas' => $id], 201);
    }

    // PUT /rutinas/:id  body: { nombre?, dias_semana? }
    public function actualizarRutina($idRutina) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $body = $this->cuerpo();
        $modelo = new RutinaModel($this->db);
        $ok = $modelo->actualizar($idRutina, $body);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo actualizar la rutina'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Rutina actualizada']);
    }

    // DELETE /rutinas/:id  -> borra la rutina (y por CASCADE sus ejercicios y asignaciones a clientes)
    public function eliminarRutina($idRutina) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new RutinaModel($this->db);
        $ok = $modelo->eliminar($idRutina);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo eliminar la rutina'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Rutina eliminada']);
    }

    // POST /clientes/:id/rutinas  body: { id_rutinas }
    public function asignarRutina($idCliente) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $body = $this->cuerpo();
        if (empty($body['id_rutinas'])) {
            return $this->responder(['status' => 'error', 'message' => 'Falta id_rutinas'], 400);
        }

        $modelo = new RutinaModel($this->db);
        $ok = $modelo->asignarACliente($idCliente, $body['id_rutinas']);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo asignar la rutina'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Rutina asignada']);
    }

    // DELETE /clientes/:id/rutinas/:idRutina
    public function quitarRutina($idCliente, $idRutina) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new RutinaModel($this->db);
        $ok = $modelo->quitarDeCliente($idCliente, $idRutina);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo quitar la rutina'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Rutina desasignada']);
    }

    // POST /rutinas/:id/ejercicios  body: { id_ejercicio }
    public function agregarEjercicioARutina($idRutina) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $body = $this->cuerpo();
        if (empty($body['id_ejercicio'])) {
            return $this->responder(['status' => 'error', 'message' => 'Falta id_ejercicio'], 400);
        }

        $modelo = new RutinaModel($this->db);
        $ok = $modelo->agregarEjercicio($idRutina, $body['id_ejercicio']);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo agregar el ejercicio'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Ejercicio agregado a la rutina']);
    }

    // DELETE /rutinas/:id/ejercicios/:idEjercicio
    public function quitarEjercicioDeRutina($idRutina, $idEjercicio) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new RutinaModel($this->db);
        $ok = $modelo->quitarEjercicio($idRutina, $idEjercicio);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo quitar el ejercicio'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Ejercicio quitado de la rutina']);
    }

    // GET /ejercicios  -> catálogo completo, para poblar selects en el front
    public function verEjercicios() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new RutinaModel($this->db);
        $ejercicios = $modelo->listarEjercicios();

        if ($ejercicios === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo obtener el catálogo de ejercicios'], 500);
        }
        $this->responder(['status' => 'ok', 'ejercicios' => $ejercicios]);
    }

    // GET /ejercicios/:id
    public function verEjercicio($idEjercicio) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new RutinaModel($this->db);
        $ejercicio = $modelo->verEjercicio($idEjercicio);

        if (!$ejercicio) {
            return $this->responder(['status' => 'error', 'message' => 'Ejercicio no encontrado'], 404);
        }
        $this->responder(['status' => 'ok', 'ejercicio' => $ejercicio]);
    }

    // POST /ejercicios  body: { nombre, grupo_muscular, descripcion?, calorias_por_unidad?, video_url? }
    public function crearEjercicio() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        [$datos, $error] = $this->validarEjercicio($this->cuerpo());
        if ($error) {
            return $this->responder(['status' => 'error', 'message' => $error], 400);
        }

        $modelo = new RutinaModel($this->db);
        $id = $modelo->crearEjercicio($datos);

        if ($id === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo crear el ejercicio'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Ejercicio creado', 'id_ejercicio' => $id], 201);
    }

    // PUT /ejercicios/:id  body: cualquier subconjunto de nombre, grupo_muscular, descripcion, calorias_por_unidad, video_url
    public function actualizarEjercicio($idEjercicio) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        [$datos, $error] = $this->validarEjercicio($this->cuerpo(), true);
        if ($error) {
            return $this->responder(['status' => 'error', 'message' => $error], 400);
        }

        $modelo = new RutinaModel($this->db);
        $ok = $modelo->actualizarEjercicio($idEjercicio, $datos);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo actualizar el ejercicio'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Ejercicio actualizado']);
    }

    // DELETE /ejercicios/:id
    // Se bloquea si algún cliente tiene registros con este ejercicio (borrarlo arrastraría su historial).
    public function eliminarEjercicio($idEjercicio) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new RutinaModel($this->db);

        $registros = $modelo->contarRegistrosDeEjercicio($idEjercicio);
        if ($registros === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo verificar el uso del ejercicio'], 500);
        }
        if ($registros > 0) {
            return $this->responder([
                'status' => 'error',
                'message' => "No se puede eliminar: hay $registros registro(s) de actividad de clientes con este ejercicio"
            ], 409);
        }

        $ok = $modelo->eliminarEjercicio($idEjercicio);
        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo eliminar el ejercicio'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Ejercicio eliminado']);
    }

    // GET /rutinas  -> catálogo completo de rutinas (para asignar una ya existente)
    public function verTodasLasRutinas() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new RutinaModel($this->db);
        $rutinas = $modelo->listarTodas();

        if ($rutinas === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo obtener las rutinas'], 500);
        }
        $this->responder(['status' => 'ok', 'rutinas' => $rutinas]);
    }
}