<?php
namespace App\Controllers;

use App\Models\PuntoModel;
use App\Models\RutinaModel;
use App\Models\PerfilModel;
use App\Utils\Auth;

class UsuarioController {
    private $db;
    // Todos estos roles tienen vista de socio (un entrenador también entrena)
    private $rolesPermitidos = ['Usuario', 'Cliente', 'Entrenador', 'Administrador'];

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

    // GET /mis-rutinas
    // Devuelve SOLO las rutinas de la persona logueada (el id sale de la sesión, no de la URL),
    // así un usuario no puede pedir las rutinas de otro.
    public function misRutinas() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;

        $usuario = Auth::usuarioActual();
        $modelo = new RutinaModel($this->db);
        $rutinas = $modelo->listarConEjerciciosPorCliente($usuario['id_persona']);

        if ($rutinas === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudieron obtener tus rutinas'], 500);
        }
        $this->responder(['status' => 'ok', 'rutinas' => $rutinas]);
    }

    // GET /mi-perfil
    // Datos personales del socio logueado. Igual que arriba: el id sale de la sesión.
    public function miPerfil() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;

        $usuario = Auth::usuarioActual();
        $modelo = new PerfilModel($this->db);
        $perfil = $modelo->ver($usuario['id_persona']);

        if ($perfil === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudieron obtener tus datos'], 500);
        }
        $this->responder(['status' => 'ok', 'perfil' => $perfil]);
    }

    // PUT /mi-perfil  body: { documento?, fecha_nacimiento?, sexo?, peso_kg?, altura_cm?, carne_salud_vencimiento? }
    // Solo datos propios: el email, el rol y la membresía los cambia el administrador.
    public function actualizarMiPerfil() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;

        $usuario = Auth::usuarioActual();
        $body = $this->cuerpo();
        $datos = [];

        // Documento: lo guardamos como texto para no perder ceros a la izquierda
        if (array_key_exists('documento', $body)) {
            $documento = trim((string) $body['documento']);
            if ($documento !== '' && !preg_match('/^[0-9A-Za-z.\- ]{1,20}$/', $documento)) {
                return $this->responder(['status' => 'error', 'message' => 'El documento no es válido'], 400);
            }
            $datos['documento'] = $documento === '' ? null : $documento;
        }

        if (array_key_exists('sexo', $body)) {
            $sexo = trim((string) $body['sexo']);
            if ($sexo !== '' && !in_array($sexo, PerfilModel::$sexosValidos, true)) {
                return $this->responder(['status' => 'error', 'message' => 'El sexo no es válido'], 400);
            }
            $datos['sexo'] = $sexo === '' ? null : $sexo;
        }

        if (array_key_exists('peso_kg', $body)) {
            $peso = $body['peso_kg'];
            if ($peso === '' || $peso === null) {
                $datos['peso_kg'] = null;
            } elseif (!is_numeric($peso) || $peso < 20 || $peso > 400) {
                return $this->responder(['status' => 'error', 'message' => 'El peso debe estar entre 20 y 400 kg'], 400);
            } else {
                $datos['peso_kg'] = round((float) $peso, 2);
            }
        }

        if (array_key_exists('altura_cm', $body)) {
            $altura = $body['altura_cm'];
            if ($altura === '' || $altura === null) {
                $datos['altura_cm'] = null;
            } elseif (!is_numeric($altura) || $altura < 80 || $altura > 260) {
                return $this->responder(['status' => 'error', 'message' => 'La altura debe estar entre 80 y 260 cm'], 400);
            } else {
                $datos['altura_cm'] = (int) $altura;
            }
        }

        foreach (['fecha_nacimiento', 'carne_salud_vencimiento'] as $campoFecha) {
            if (!array_key_exists($campoFecha, $body)) continue;
            $fecha = trim((string) $body[$campoFecha]);
            if ($fecha === '') {
                // fecha_nacimiento es NOT NULL en la base, así que ahí guardamos texto vacío
                $datos[$campoFecha] = $campoFecha === 'fecha_nacimiento' ? '' : null;
                continue;
            }
            if (!self::fechaValida($fecha)) {
                return $this->responder(['status' => 'error', 'message' => 'La fecha debe tener el formato AAAA-MM-DD'], 400);
            }
            $datos[$campoFecha] = $fecha;
        }

        if (empty($datos)) {
            return $this->responder(['status' => 'error', 'message' => 'No hay datos para guardar'], 400);
        }

        $modelo = new PerfilModel($this->db);
        $ok = $modelo->actualizar($usuario['id_persona'], $datos);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudieron guardar tus datos'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Datos actualizados']);
    }

    // GET /mi-entrenador
    // Entrenador asignado + la solicitud de cambio pendiente, si tiene una.
    public function miEntrenador() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;

        $usuario = Auth::usuarioActual();
        $modelo = new PerfilModel($this->db);

        $entrenador = $modelo->entrenadorDe($usuario['id_persona']);
        if ($entrenador === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo obtener tu entrenador'], 500);
        }

        $solicitud = $modelo->solicitudPendiente($usuario['id_persona']);
        if ($solicitud === false) $solicitud = null; // la tabla puede no existir todavía

        $this->responder(['status' => 'ok', 'entrenador' => $entrenador, 'solicitud_pendiente' => $solicitud]);
    }

    // POST /mi-entrenador/cambio  body: { motivo }
    // Guarda el pedido como 'pendiente'. No cambia el entrenador: eso lo hace el administrador.
    public function pedirCambioEntrenador() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;

        $usuario = Auth::usuarioActual();
        $body = $this->cuerpo();
        $motivo = trim((string) ($body['motivo'] ?? ''));

        if (mb_strlen($motivo) < 10) {
            return $this->responder(['status' => 'error', 'message' => 'Contanos el motivo con un poco más de detalle (mínimo 10 caracteres)'], 400);
        }
        if (mb_strlen($motivo) > 1000) {
            return $this->responder(['status' => 'error', 'message' => 'El motivo es demasiado largo (máximo 1000 caracteres)'], 400);
        }

        $modelo = new PerfilModel($this->db);

        // Una sola solicitud abierta por socio
        $pendiente = $modelo->solicitudPendiente($usuario['id_persona']);
        if ($pendiente) {
            return $this->responder(['status' => 'error', 'message' => 'Ya tenés una solicitud pendiente'], 409);
        }

        $entrenador = $modelo->entrenadorDe($usuario['id_persona']);
        $idEntrenadorActual = is_array($entrenador) ? $entrenador['id_persona'] : null;

        $id = $modelo->crearSolicitud($usuario['id_persona'], $idEntrenadorActual, $motivo);
        if ($id === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo enviar la solicitud'], 500);
        }

        $this->responder(['status' => 'ok', 'message' => 'Solicitud enviada', 'id_solicitud' => $id], 201);
    }

    // Acepta solo AAAA-MM-DD y que sea una fecha que exista de verdad
    private static function fechaValida($fecha) {
        $d = \DateTime::createFromFormat('Y-m-d', $fecha);
        return $d && $d->format('Y-m-d') === $fecha;
    }

        public function misPuntos() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;

        $usuario = Auth::usuarioActual();
        $modelo = new PuntoModel($this->db);
        $total = $modelo->totalDe($usuario['id_persona']);

        if ($total === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudieron obtener tus puntos'], 500);
        }
        $this->responder(['status' => 'ok', 'puntos' => $total]);
    }
}