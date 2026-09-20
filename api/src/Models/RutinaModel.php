<?php
namespace App\Models;

class RutinaModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listarPorCliente($idPersona) {
        try {
            $sql = "SELECT r.id_rutinas, r.nombre, r.dias_semana, r.fecha_creacion
                    FROM rutinas r
                    JOIN persona_rutinas pr ON pr.id_rutinas = r.id_rutinas
                    WHERE pr.id_persona = :id_persona";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['id_persona' => $idPersona]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function verDetalle($idRutina) {
        try {
            $stmtRutina = $this->db->prepare(
                "SELECT id_rutinas, nombre, dias_semana, fecha_creacion FROM rutinas WHERE id_rutinas = :id"
            );
            $stmtRutina->execute(['id' => $idRutina]);
            $rutina = $stmtRutina->fetch(\PDO::FETCH_ASSOC);
            if (!$rutina) return false;

            $stmtEj = $this->db->prepare(
                "SELECT e.id_ejercicio, e.nombre, e.grupo_muscular
                 FROM rutinas_ejercicio re
                 JOIN ejercicio e ON e.id_ejercicio = re.id_ejercicio
                 WHERE re.id_rutinas = :id"
            );
            $stmtEj->execute(['id' => $idRutina]);
            $rutina['ejercicios'] = $stmtEj->fetchAll(\PDO::FETCH_ASSOC);

            return $rutina;
        } catch (\Exception $e) {
            return false;
        }
    }

    // dias_semana esperado como texto simple, ej: "Lun,Mie,Vie"
    public function crear($nombre, $diasSemana) {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO rutinas (nombre, dias_semana, fecha_creacion) VALUES (:nombre, :dias_semana, CURDATE())"
            );
            $stmt->execute(['nombre' => $nombre, 'dias_semana' => $diasSemana]);
            return (int) $this->db->lastInsertId();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function actualizar($idRutina, $datos) {
        $camposPermitidos = ['nombre', 'dias_semana'];
        $set = [];
        $params = ['id' => $idRutina];

        foreach ($camposPermitidos as $campo) {
            if (array_key_exists($campo, $datos)) {
                $set[] = "$campo = :$campo";
                $params[$campo] = $datos[$campo];
            }
        }

        if (empty($set)) return false;

        try {
            $sql = "UPDATE rutinas SET " . implode(', ', $set) . " WHERE id_rutinas = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function asignarACliente($idPersona, $idRutina) {
        try {
            $stmt = $this->db->prepare(
                "INSERT IGNORE INTO persona_rutinas (id_persona, id_rutinas) VALUES (:id_persona, :id_rutinas)"
            );
            return $stmt->execute(['id_persona' => $idPersona, 'id_rutinas' => $idRutina]);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function quitarDeCliente($idPersona, $idRutina) {
        try {
            $stmt = $this->db->prepare(
                "DELETE FROM persona_rutinas WHERE id_persona = :id_persona AND id_rutinas = :id_rutinas"
            );
            return $stmt->execute(['id_persona' => $idPersona, 'id_rutinas' => $idRutina]);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function agregarEjercicio($idRutina, $idEjercicio) {
        try {
            $stmt = $this->db->prepare(
                "INSERT IGNORE INTO rutinas_ejercicio (id_rutinas, id_ejercicio) VALUES (:id_rutinas, :id_ejercicio)"
            );
            return $stmt->execute(['id_rutinas' => $idRutina, 'id_ejercicio' => $idEjercicio]);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function quitarEjercicio($idRutina, $idEjercicio) {
        try {
            $stmt = $this->db->prepare(
                "DELETE FROM rutinas_ejercicio WHERE id_rutinas = :id_rutinas AND id_ejercicio = :id_ejercicio"
            );
            return $stmt->execute(['id_rutinas' => $idRutina, 'id_ejercicio' => $idEjercicio]);
        } catch (\Exception $e) {
            return false;
        }
    }

    // Catálogo completo de ejercicios (para selects en el front)
    public function listarEjercicios() {
        try {
            $stmt = $this->db->query("SELECT id_ejercicio, nombre, grupo_muscular, calorias_por_unidad FROM ejercicio ORDER BY nombre");
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }

    // Catálogo completo de rutinas (para asignar una ya existente a un cliente)
    public function listarTodas() {
        try {
            $stmt = $this->db->query("SELECT id_rutinas, nombre, dias_semana, fecha_creacion FROM rutinas ORDER BY nombre");
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }
}
