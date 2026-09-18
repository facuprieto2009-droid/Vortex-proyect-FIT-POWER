<?php
namespace App\Models;

class ActividadModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Historial de ejercicios de un cliente, con nombre de ejercicio incluido
    public function listarPorCliente($idPersona) {
        try {
            $sql = "SELECT r.id_registro, r.id_ejercicio, e.nombre AS ejercicio, r.id_rutinas,
                           r.fecha, r.series, r.peso_kg, r.calorias_quemadas, r.puntos_ganados
                    FROM registro_actividad r
                    JOIN ejercicio e ON e.id_ejercicio = r.id_ejercicio
                    WHERE r.id_persona = :id_persona
                    ORDER BY r.fecha DESC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['id_persona' => $idPersona]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function crear($idPersona, $datos) {
        try {
            $sql = "INSERT INTO registro_actividad
                        (id_persona, id_ejercicio, id_rutinas, fecha, series, peso_kg, calorias_quemadas, puntos_ganados)
                    VALUES
                        (:id_persona, :id_ejercicio, :id_rutinas, :fecha, :series, :peso_kg, :calorias_quemadas, :puntos_ganados)";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'id_persona' => $idPersona,
                'id_ejercicio' => $datos['id_ejercicio'],
                'id_rutinas' => $datos['id_rutinas'] ?? null,
                'fecha' => $datos['fecha'] ?? date('Y-m-d'),
                'series' => $datos['series'] ?? 1,
                'peso_kg' => $datos['peso_kg'] ?? null,
                'calorias_quemadas' => $datos['calorias_quemadas'] ?? 0,
                'puntos_ganados' => $datos['puntos_ganados'] ?? 0,
            ]);
        } catch (\Exception $e) {
            return false;
        }
    }

    // Actualiza solo los campos que vengan en $datos (ej: solo peso_kg, o solo series)
    public function actualizar($idRegistro, $datos) {
        $camposPermitidos = ['id_ejercicio', 'id_rutinas', 'fecha', 'series', 'peso_kg', 'calorias_quemadas', 'puntos_ganados'];
        $set = [];
        $params = ['id_registro' => $idRegistro];

        foreach ($camposPermitidos as $campo) {
            if (array_key_exists($campo, $datos)) {
                $set[] = "$campo = :$campo";
                $params[$campo] = $datos[$campo];
            }
        }

        if (empty($set)) return false;

        try {
            $sql = "UPDATE registro_actividad SET " . implode(', ', $set) . " WHERE id_registro = :id_registro";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function eliminar($idRegistro) {
        try {
            $stmt = $this->db->prepare("DELETE FROM registro_actividad WHERE id_registro = :id_registro");
            return $stmt->execute(['id_registro' => $idRegistro]);
        } catch (\Exception $e) {
            return false;
        }
    }
}