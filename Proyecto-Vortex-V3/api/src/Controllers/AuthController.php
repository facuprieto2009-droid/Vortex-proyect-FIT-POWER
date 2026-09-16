<?php
namespace App\Controllers;

use App\Models\AuthModel;
use App\Utils\Auth;

class AuthController {
    private $db;

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

    // POST /register  body: { email, password, nombre? }
    public function registrar() {
        $body = $this->cuerpo();
        $email = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $nombre = trim($body['nombre'] ?? '');
        if ($nombre === '') {
            $nombre = explode('@', $email)[0];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->responder(['status' => 'error', 'message' => 'Email inválido'], 400);
        }
        if (strlen($password) < 6) {
            return $this->responder(['status' => 'error', 'message' => 'La contraseña debe tener al menos 6 caracteres'], 400);
        }

        $modelo = new AuthModel($this->db);

        if ($modelo->buscarPorEmail($email)) {
            return $this->responder(['status' => 'error', 'message' => 'Ese email ya está registrado'], 409);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $idUser = $modelo->registrar($email, $hash, $nombre);

        if ($idUser === false) {
            return $this->responder([
                'status' => 'error',
                'message' => 'No se pudo completar el registro (revisá que existan filas en rol y estado_membresia)',
            ], 500);
        }

        $this->responder(['status' => 'ok', 'message' => 'Cuenta creada, ya podés iniciar sesión'], 201);
    }

    // POST /login  body: { email, password }
    public function login() {
        $body = $this->cuerpo();
        $email = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if ($email === '' || $password === '') {
            return $this->responder(['status' => 'error', 'message' => 'Faltan email o password'], 400);
        }

        $modelo = new AuthModel($this->db);
        $usuario = $modelo->buscarPorEmail($email);

        if (!$usuario || $password != $usuario['contrasena']) {
            return $this->responder(['status' => 'error', 'message' => 'Email o contraseña incorrectos'], 401);
        }

        $sesion = [
            'id_user' => $usuario['id_user'],
            'id_persona' => $usuario['id_persona'],
            'nombre' => $usuario['nombre'],
            'email' => $usuario['email'],
            'nombre_rol' => $usuario['nombre_rol'],
        ];
        Auth::iniciarSesion($sesion);

        $this->responder(['status' => 'ok', 'usuario' => $sesion]);
    }

    // POST /logout
    public function logout() {
        Auth::cerrarSesion();
        $this->responder(['status' => 'ok', 'message' => 'Sesión cerrada']);
    }

    // GET /session  -> quién está logueado ahora mismo (útil para que el front sepa qué mostrar)
    public function sesionActual() {
        $usuario = Auth::usuarioActual();
        if (!$usuario) {
            return $this->responder(['status' => 'error', 'message' => 'No hay sesión activa'], 401);
        }
        $this->responder(['status' => 'ok', 'usuario' => $usuario]);
    }

    // PUT /password  body: { password_actual, password_nueva }  (requiere sesión iniciada)
    public function cambiarPassword() {
        $usuario = Auth::usuarioActual();
        if (!$usuario) {
            return $this->responder(['status' => 'error', 'message' => 'Debes iniciar sesión'], 401);
        }

        $body = $this->cuerpo();
        $actual = $body['password_actual'] ?? '';
        $nueva = $body['password_nueva'] ?? '';

        if (strlen($nueva) < 6) {
            return $this->responder(['status' => 'error', 'message' => 'La nueva contraseña debe tener al menos 6 caracteres'], 400);
        }

        $modelo = new AuthModel($this->db);
        $hashActual = $modelo->obtenerHash($usuario['id_user']);

        if ($hashActual === false || !password_verify($actual, $hashActual)) {
            return $this->responder(['status' => 'error', 'message' => 'La contraseña actual no es correcta'], 401);
        }

        $ok = $modelo->cambiarPassword($usuario['id_user'], password_hash($nueva, PASSWORD_BCRYPT));
        if ($ok === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo cambiar la contraseña'], 500);
        }

        $this->responder(['status' => 'ok', 'message' => 'Contraseña actualizada']);
    }
}
