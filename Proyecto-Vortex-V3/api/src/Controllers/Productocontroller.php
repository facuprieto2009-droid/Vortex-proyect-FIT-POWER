<?php
namespace App\Controllers;

use App\Models\ProductoModel;
use App\Utils\Auth;

class ProductoController {
    private $db;
    private $rolesPermitidos = ['Administrador'];
    private $categoriasValidas = ['Pesas', 'Suplementos', 'Barras Proteicas'];

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

    // GET /productos?categoria=Pesas   (público, sin login: lo usan tanto el panel de admin como las páginas del catálogo)
    public function verProductos() {
        $categoria = $_GET['categoria'] ?? null;
        $modelo = new ProductoModel($this->db);
        $productos = $modelo->listar($categoria);

        if ($productos === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo obtener el catálogo'], 500);
        }
        $this->responder(['status' => 'ok', 'productos' => $productos]);
    }

    // POST /admin/productos   body: { nombre, categoria, precio, imagen_url? }
    public function crearProducto() {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $body = $this->cuerpo();

        $nombre = trim($body['nombre'] ?? '');
        $categoria = trim($body['categoria'] ?? '');
        $precio = $body['precio'] ?? null;

        if ($nombre === '' || !in_array($categoria, $this->categoriasValidas, true)) {
            return $this->responder([
                'status' => 'error',
                'message' => 'Nombre y categoría (Pesas, Suplementos o Barras Proteicas) son obligatorios',
            ], 400);
        }
        if (!is_numeric($precio) || $precio < 0) {
            return $this->responder(['status' => 'error', 'message' => 'El precio debe ser un número válido y positivo'], 400);
        }

        $modelo = new ProductoModel($this->db);
        $idProducto = $modelo->crear([
            'nombre' => $nombre,
            'categoria' => $categoria,
            'precio' => $precio,
            'imagen_url' => trim($body['imagen_url'] ?? '') ?: null,
        ]);

        if ($idProducto === false) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo crear el artículo'], 500);
        }
        $this->responder(['status' => 'ok', 'message' => 'Artículo creado', 'id_producto' => $idProducto], 201);
    }

    // DELETE /admin/productos/:id
    public function eliminarProducto($idProducto) {
        if (!Auth::requiereRol($this->rolesPermitidos)) return;
        $modelo = new ProductoModel($this->db);
        $ok = $modelo->eliminar($idProducto);

        if (!$ok) {
            return $this->responder(['status' => 'error', 'message' => 'No se pudo eliminar (puede que ya no existiera)'], 404);
        }
        $this->responder(['status' => 'ok', 'message' => 'Artículo eliminado']);
    }
}