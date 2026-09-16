<?php
namespace App\Utils;

class Auth {
    private static function asegurarSesion() {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
    }

    // Devuelve el usuario logueado (array) o null si no hay sesión activa
    public static function usuarioActual() {
        self::asegurarSesion();
        return $_SESSION['usuario'] ?? null;
    }

    public static function iniciarSesion($usuario) {
        self::asegurarSesion();
        session_regenerate_id(true); // evita fijación de sesión
        $_SESSION['usuario'] = $usuario;
    }

    public static function cerrarSesion() {
        self::asegurarSesion();
        $_SESSION = [];
        session_destroy();
    }

    // Corta la petición con 401/403 si no corresponde. Devuelve true si puede seguir.
    public static function requiereRol(array $rolesPermitidos) {
        $usuario = self::usuarioActual();

        if (!$usuario) {
            http_response_code(401);
            echo json_encode(['status' => 'error', 'message' => 'Debes iniciar sesión'], JSON_UNESCAPED_UNICODE);
            return false;
        }

        if (!in_array($usuario['nombre_rol'], $rolesPermitidos, true)) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'No tienes permiso para esta acción'], JSON_UNESCAPED_UNICODE);
            return false;
        }

        return true;
    }
}
