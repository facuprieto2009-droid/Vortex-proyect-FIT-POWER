<?php
namespace App\Models;

// Catálogo de la página de Puntos: ítems que se "compran" con puntos en vez de dólares.
// Funciona igual que ProductoModel, pero con la columna `puntos` en lugar de `precio`.
class RecompensaModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar() {
        try {
            $stmt = $this->db->query(
                "SELECT id_recompensa, nombre, puntos, imagen_url FROM recompensa ORDER BY puntos ASC, nombre ASC"
            );
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function ver($idRecompensa) {
        try {
            $stmt = $this->db->prepare(
                "SELECT id_recompensa, nombre, puntos, imagen_url FROM recompensa WHERE id_recompensa = :id"
            );
            $stmt->execute(['id' => $idRecompensa]);
            $recompensa = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $recompensa ?: false;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function crear($datos) {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO recompensa (nombre, puntos, imagen_url)
                 VALUES (:nombre, :puntos, :imagen_url)"
            );
            $stmt->execute([
                'nombre' => $datos['nombre'],
                'puntos' => (int) $datos['puntos'],
                'imagen_url' => $datos['imagen_url'] ?? null,
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function actualizar($idRecompensa, $datos) {
        $camposPermitidos = ['nombre', 'puntos', 'imagen_url'];
        $set = [];
        $params = ['id' => $idRecompensa];

        foreach ($camposPermitidos as $campo) {
            if (array_key_exists($campo, $datos)) {
                $set[] = "$campo = :$campo";
                $params[$campo] = $campo === 'puntos' ? (int) $datos[$campo] : $datos[$campo];
            }
        }

        if (empty($set)) return false;

        try {
            $sql = "UPDATE recompensa SET " . implode(', ', $set) . " WHERE id_recompensa = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function eliminar($idRecompensa) {
        try {
            $stmt = $this->db->prepare("DELETE FROM recompensa WHERE id_recompensa = :id");
            return $stmt->execute(['id' => $idRecompensa]);
        } catch (\Exception $e) {
            return false;
        }
    }
}