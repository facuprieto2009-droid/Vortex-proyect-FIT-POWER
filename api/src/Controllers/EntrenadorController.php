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