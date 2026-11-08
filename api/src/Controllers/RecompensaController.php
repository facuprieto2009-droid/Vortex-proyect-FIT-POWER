<?php
namespace App\Controllers;

use App\Models\RecompensaModel;
use App\Models\PuntoModel;
use App\Models\AuthModel;

class RecompensaController {
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

    public function verPublicas() {
        $modelo = new RecompensaModel($this->db);
        $recompensas = $modelo->listar();

        if ($recompensas === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo obtener el catálogo de puntos'], 500);
        }
        $this->responder(['status' => 'ok', 'recompensas' => $recompensas]);
    }

    // POST /recompensas/:id/canjear  body: { email, password }
    public function canjear($idRecompensa) {
        $body = $this->cuerpo();
        $email = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if ($email === '' || $password === '') {
            return $this->responder(['status' => 'error', 'message' => 'Faltan email o contraseña'], 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->responder(['status' => 'error', 'message' => 'Email inválido'], 400);
        }

        $authModelo = new AuthModel($this->db);
        $usuario = $authModelo->buscarPorEmail($email);

        if (!$usuario || !password_verify($password, $usuario['contrasena'])) {
            return $this->responder(['status' => 'error', 'message' => 'Email o contraseña incorrectos'], 401);
        }

        $modeloRec = new RecompensaModel($this->db);
        $recompensa = $modeloRec->ver($idRecompensa);

        if ($recompensa === false || !$recompensa) {
            return $this->responder(['status' => 'error', 'message' => 'Recompensa no encontrada'], 404);
        }

        $costo = (int) $recompensa['puntos'];
        if ($costo <= 0) {
            return $this->responder(['status' => 'error', 'message' => 'Esta recompensa no tiene un costo válido'], 400);
        }

        $modeloPuntos = new PuntoModel($this->db);
        $resultado = $modeloPuntos->canjear(
            $usuario['id_persona'],
            $costo,
            'Canje: ' . $recompensa['nombre']
        );

        if ($resultado === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo completar el canje'], 500);
        }

        if (empty($resultado['ok'])) {
            return $this->responder([
                'status' => 'error',
                'message' => 'No se pudo realizar el canje por falta de puntos',
                'puntos_disponibles' => $resultado['total'] ?? 0,
                'puntos_necesarios' => $costo,
            ], 400);
        }

        $this->responder([
            'status' => 'ok',
            'message' => '¡Canje realizado con éxito!',
            'recompensa' => $recompensa['nombre'],
            'puntos_gastados' => $costo,
            'puntos_restantes' => $resultado['total'],
        ]);
    }
}