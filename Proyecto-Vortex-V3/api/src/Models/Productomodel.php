<?php
namespace App\Models;

class ProductoModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Lista productos, opcionalmente filtrados por categoría (Pesas, Suplementos, Barras Proteicas)
    public function listar($categoria = null) {
        try {
            if ($categoria) {
                $stmt = $this->db->prepare("SELECT * FROM producto WHERE categoria = :categoria ORDER BY id_producto DESC");
                $stmt->execute(['categoria' => $categoria]);
            } else {
                $stmt = $this->db->query("SELECT * FROM producto ORDER BY categoria, id_producto DESC");
            }
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function crear($datos) {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO producto (nombre, categoria, precio, imagen_url)
                 VALUES (:nombre, :categoria, :precio, :imagen_url)"
            );
            $stmt->execute([
                'nombre' => $datos['nombre'],
                'categoria' => $datos['categoria'],
                'precio' => $datos['precio'],
                'imagen_url' => $datos['imagen_url'] ?? null,
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function eliminar($idProducto) {
        try {
            $stmt = $this->db->prepare("DELETE FROM producto WHERE id_producto = :id");
            $stmt->execute(['id' => $idProducto]);
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            return false;
        }
    }
}