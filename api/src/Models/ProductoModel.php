<?php
namespace App\Models;

class ProductoModel {
    private $db;

    // Únicas categorías válidas para un producto
    public static $categoriasValidas = ['Pesas', 'Suplementos', 'BarrasProteicas'];

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar($categoria = null) {
        try {
            $sql = "SELECT id_producto, nombre, categoria, precio, imagen_url FROM producto";
            $params = [];
            if ($categoria) {
                $sql .= " WHERE categoria = :categoria";
                $params['categoria'] = $categoria;
            }
            $sql .= " ORDER BY nombre ASC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function ver($idProducto) {
        try {
            $stmt = $this->db->prepare(
                "SELECT id_producto, nombre, categoria, precio, imagen_url FROM producto WHERE id_producto = :id"
            );
            $stmt->execute(['id' => $idProducto]);
            $producto = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $producto ?: false;
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

    public function actualizar($idProducto, $datos) {
        $camposPermitidos = ['nombre', 'categoria', 'precio', 'imagen_url'];
        $set = [];
        $params = ['id' => $idProducto];

        foreach ($camposPermitidos as $campo) {
            if (array_key_exists($campo, $datos)) {
                $set[] = "$campo = :$campo";
                $params[$campo] = $datos[$campo];
            }
        }

        if (empty($set)) return false;

        try {
            $sql = "UPDATE producto SET " . implode(', ', $set) . " WHERE id_producto = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function eliminar($idProducto) {
        try {
            $stmt = $this->db->prepare("DELETE FROM producto WHERE id_producto = :id");
            return $stmt->execute(['id' => $idProducto]);
        } catch (\Exception $e) {
            return false;
        }
    }
}
