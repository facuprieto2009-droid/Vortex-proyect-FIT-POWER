<?php
namespace App\Controllers;

use App\Models\ProductoModel;

class ProductoController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    private function responder($data, $codigo = 200) {
        http_response_code($codigo);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }

    // GET /productos?categoria=Pesas
    // Público: lo usa el catálogo (Pesas.html, Suplementos.html, BarrasProteicas.html).
    // No requiere sesión ni rol, a diferencia de /admin/productos.
    public function verPublicos() {
        $categoria = $_GET['categoria'] ?? null;
        $modelo = new ProductoModel($this->db);
        $productos = $modelo->listar($categoria);

        if ($productos === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo obtener la lista de productos'], 500);
        }
        $this->responder(['status' => 'ok', 'productos' => $productos]);
    }
}