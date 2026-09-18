<?php
namespace App\Controllers;

use App\Models\UsuarioModel;
use App\Models\PagoModel;
use App\Models\PuntoModel;
use App\Utils\Auth;

class AdminController {
    private $db;
    private $rolesPermitidos = ['Administrador'];

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

    // ===== Usuarios y entrenadores =====

    // GET /admin/usuarios?rol=Entrenador
    public function verUsuarios() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $rol = $_GET['rol'] ?? null;
        $modelo = new UsuarioModel($this->db);
        $usuarios = $modelo->listar($rol);

        if ($usuarios === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo obtener la lista de usuarios'], 500);
        }
        $this->responder(['status' => 'ok', 'usuarios' => $usuarios]);
    }

    // GET /admin/usuarios/:id
    public function verUsuario($idUser) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new UsuarioModel($this->db);
        $usuario = $modelo->ver($idUser);

        if ($usuario === false) {
            return $this->responder(['status' => 'error', 'message' => 'Usuario no encontrado'], 404);
        }
        $this->responder(['status' => 'ok', 'usuario' => $usuario]);
    }

    // POST /admin/usuarios  body: { nombre, email, password, id_rol, especialidad?, fecha_nacimiento?, id_tipo_membresia? }
    public function crearUsuario() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $body = $this->cuerpo();

        $nombre = trim($body['nombre'] ?? '');
        $email = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $idRol = $body['id_rol'] ?? null;

        if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || !$idRol) {
            return $this->responder(['status' => 'error', 'message' => 'Faltan datos: nombre, email válido e id_rol son obligatorios'], 400);
        }
        if (strlen($password) < 6) {
            return $this->responder(['status' => 'error', 'message' => 'La contraseña debe tener al menos 6 caracteres'], 400);
        }

        $modelo = new UsuarioModel($this->db);

        // Evitar emails duplicados (persona.email es UNIQUE en la BD, pero validamos antes para dar un mensaje claro)
        $existente = $modelo->listar();
        if ($existente !== false) {
            foreach ($existente as $u) {
                if (strcasecmp($u['email'], $email) === 0) {
                    return $this->responder(['status' => 'error', 'message' => 'Ese email ya está registrado'], 409);
                }
            }
        }

        $idUser = $modelo->crear([
            'nombre' => $nombre,
            'email' => $email,
            'password' => $password,
            'id_rol' => $idRol,
            'especialidad' => $body['especialidad'] ?? null,
            'fecha_nacimiento' => $body['fecha_nacimiento'] ?? null,
            'id_tipo_membresia' => $body['id_tipo_membresia'] ?? null,
        ]);

        if ($idUser === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo crear el usuario'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Usuario creado', 'id_user' => $idUser], 201);
    }

    // PUT /admin/usuarios/:id  body: { nombre?, id_rol?, email?, fecha_nacimiento?, especialidad?, id_tipo_membresia? }
    public function actualizarUsuario($idUser) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $body = $this->cuerpo();
        $modelo = new UsuarioModel($this->db);

        $actual = $modelo->ver($idUser);
        if ($actual === false) {
            return $this->responder(['status' => 'error', 'message' => 'Usuario no encontrado'], 404);
        }

        $ok = $modelo->actualizar($idUser, $actual['id_persona'], $body);
        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo actualizar el usuario'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Usuario actualizado']);
    }

    // DELETE /admin/usuarios/:id
    public function eliminarUsuario($idUser) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new UsuarioModel($this->db);
        $ok = $modelo->eliminar($idUser);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo eliminar el usuario'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Usuario eliminado']);
    }

    // GET /roles  -> lista de roles, para poblar el select del panel de admin
    public function verRoles() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new UsuarioModel($this->db);
        $roles = $modelo->listarRoles();

        if ($roles === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo obtener los roles'], 500);
        }
        $this->responder(['status' => 'ok', 'roles' => $roles]);
    }

    // ===== Pagos =====

    // GET /admin/pagos?id_persona=5
    public function verPagos() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $idPersona = $_GET['id_persona'] ?? null;
        $modelo = new PagoModel($this->db);
        $pagos = $modelo->listar($idPersona);

        if ($pagos === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo obtener los pagos'], 500);
        }
        $this->responder(['status' => 'ok', 'pagos' => $pagos]);
    }

    // POST /admin/pagos  body: { id_persona, monto, id_membresia?, fecha?, metodo_pago? }
    public function crearPago() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $body = $this->cuerpo();
        if (empty($body['id_persona']) || !isset($body['monto'])) {
            return $this->responder(['status' => 'error', 'message' => 'Faltan id_persona o monto'], 400);
        }

        $modelo = new PagoModel($this->db);
        $id = $modelo->crear($body);

        if ($id === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo registrar el pago'], 500);
        }
        $this->responder(['status' => 'ok', 'id_pago' => $id], 201);
    }

    // PUT /admin/pagos/:id  body: { monto?, id_membresia?, fecha?, metodo_pago? }
    public function actualizarPago($idPago) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $body = $this->cuerpo();
        $modelo = new PagoModel($this->db);
        $ok = $modelo->actualizar($idPago, $body);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo actualizar el pago'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Pago actualizado']);
    }

    // DELETE /admin/pagos/:id
    public function eliminarPago($idPago) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new PagoModel($this->db);
        $ok = $modelo->eliminar($idPago);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo eliminar el pago'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Pago eliminado']);
    }

    // ===== Puntos =====

    // GET /admin/puntos?id_persona=5
    public function verPuntos() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $idPersona = $_GET['id_persona'] ?? null;
        $modelo = new PuntoModel($this->db);
        $puntos = $modelo->listar($idPersona);

        if ($puntos === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo obtener los puntos'], 500);
        }
        $this->responder(['status' => 'ok', 'puntos' => $puntos]);
    }

    // POST /admin/puntos  body: { id_persona, cantidad, descripcion? }  (cantidad negativa = descuento)
    public function agregarPuntos() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $body = $this->cuerpo();
        if (empty($body['id_persona']) || !isset($body['cantidad'])) {
            return $this->responder(['status' => 'error', 'message' => 'Faltan id_persona o cantidad'], 400);
        }

        $modelo = new PuntoModel($this->db);
        $id = $modelo->agregarManual($body['id_persona'], $body['cantidad'], $body['descripcion'] ?? null);

        if ($id === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo agregar los puntos'], 500);
        }
        $this->responder(['status' => 'ok', 'id_punto' => $id], 201);
    }

    // PUT /admin/puntos/:id  body: { cantidad?, descripcion? }
    public function actualizarPuntos($idPunto) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $body = $this->cuerpo();
        $modelo = new PuntoModel($this->db);
        $ok = $modelo->actualizar($idPunto, $body);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo actualizar los puntos'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Puntos actualizados']);
    }

    // DELETE /admin/puntos/:id
    public function eliminarPuntos($idPunto) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new PuntoModel($this->db);
        $ok = $modelo->eliminar($idPunto);

        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo eliminar los puntos'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Puntos eliminados']);
    }
}