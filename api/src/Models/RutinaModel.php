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

        // Rutinas asignadas a una persona, cada una con su lista de ejercicios.
    // Se usa en el panel del usuario (GET /mis-rutinas).
    public function listarConEjerciciosPorCliente($idPersona) {
        try {
            $stmt = $this->db->prepare(
                "SELECT r.id_rutinas, r.nombre, r.dias_semana,
                        e.id_ejercicio, e.nombre AS ejercicio, e.grupo_muscular, e.descripcion, e.video_url
                 FROM persona_rutinas pr
                 JOIN rutinas r ON r.id_rutinas = pr.id_rutinas
                 LEFT JOIN rutinas_ejercicio re ON re.id_rutinas = r.id_rutinas
                 LEFT JOIN ejercicio e ON e.id_ejercicio = re.id_ejercicio
                 WHERE pr.id_persona = :id_persona
                 ORDER BY r.nombre, e.nombre"
            );
            $stmt->execute(['id_persona' => $idPersona]);

            $rutinas = [];
            foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $fila) {
                $id = $fila['id_rutinas'];
                if (!isset($rutinas[$id])) {
                    $rutinas[$id] = [
                        'id_rutinas'  => (int) $id,
                        'nombre'      => $fila['nombre'],
                        'dias_semana' => $fila['dias_semana'],
                        'ejercicios'  => [],
                    ];
                }
                if ($fila['id_ejercicio'] !== null) {
                    $rutinas[$id]['ejercicios'][] = [
                        'id_ejercicio'   => (int) $fila['id_ejercicio'],
                        'nombre'         => $fila['ejercicio'],
                        'grupo_muscular' => $fila['grupo_muscular'],
                        'descripcion'    => $fila['descripcion'],
                        'video_url'      => $fila['video_url'],
                    ];
                }
            }
            return array_values($rutinas);
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
                "SELECT e.id_ejercicio, e.nombre, e.grupo_muscular, e.video_url
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

    // Borra la rutina. Las FK con ON DELETE CASCADE limpian rutinas_ejercicio y persona_rutinas;
    // registro_actividad.id_rutinas pasa a NULL (SET NULL), así que no se pierde el historial.
    public function eliminar($idRutina) {
        try {
            $stmt = $this->db->prepare("DELETE FROM rutinas WHERE id_rutinas = :id");
            return $stmt->execute(['id' => $idRutina]);
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
            $stmt = $this->db->query("SELECT id_ejercicio, nombre, descripcion, grupo_muscular, calorias_por_unidad, video_url FROM ejercicio ORDER BY nombre");
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }

    // Catálogo completo de rutinas (para asignar una ya existente a un cliente)
    public function listarTodas() {
        try {
            $stmt = $this->db->query(
                "SELECT r.id_rutinas, r.nombre, r.dias_semana, r.fecha_creacion,
                        COUNT(re.id_ejercicio) AS cantidad_ejercicios
                 FROM rutinas r
                 LEFT JOIN rutinas_ejercicio re ON re.id_rutinas = r.id_rutinas
                 GROUP BY r.id_rutinas, r.nombre, r.dias_semana, r.fecha_creacion
                 ORDER BY r.nombre"
            );
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }

    // ===== CRUD de ejercicios (catálogo) =====

    public function verEjercicio($idEjercicio) {
        try {
            $stmt = $this->db->prepare(
                "SELECT id_ejercicio, nombre, descripcion, grupo_muscular, calorias_por_unidad, video_url
                 FROM ejercicio WHERE id_ejercicio = :id"
            );
            $stmt->execute(['id' => $idEjercicio]);
            return $stmt->fetch(\PDO::FETCH_ASSOC); // false si no existe
        } catch (\Exception $e) {
            return false;
        }
    }

    public function crearEjercicio($datos) {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO ejercicio (nombre, descripcion, grupo_muscular, calorias_por_unidad, video_url)
                 VALUES (:nombre, :descripcion, :grupo_muscular, :calorias, :video_url)"
            );
            $stmt->execute([
                'nombre'         => $datos['nombre'],
                'descripcion'    => $datos['descripcion'],
                'grupo_muscular' => $datos['grupo_muscular'],
                'calorias'       => $datos['calorias_por_unidad'],
                'video_url'      => $datos['video_url'],
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function actualizarEjercicio($idEjercicio, $datos) {
        $camposPermitidos = ['nombre', 'descripcion', 'grupo_muscular', 'calorias_por_unidad', 'video_url'];
        $set = [];
        $params = ['id' => $idEjercicio];

        foreach ($camposPermitidos as $campo) {
            if (array_key_exists($campo, $datos)) {
                $set[] = "$campo = :$campo";
                $params[$campo] = $datos[$campo];
            }
        }

        if (empty($set)) return false;

        try {
            $sql = "UPDATE ejercicio SET " . implode(', ', $set) . " WHERE id_ejercicio = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\Exception $e) {
            return false;
        }
    }

    // Cuántos registros de actividad de clientes usan este ejercicio.
    // registro_actividad tiene ON DELETE CASCADE sobre id_ejercicio: borrar el ejercicio
    // borraría también el historial de peso/series de los clientes. Por eso se consulta antes.
    public function contarRegistrosDeEjercicio($idEjercicio) {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM registro_actividad WHERE id_ejercicio = :id");
            $stmt->execute(['id' => $idEjercicio]);
            return (int) $stmt->fetchColumn();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function eliminarEjercicio($idEjercicio) {
        try {
            $stmt = $this->db->prepare("DELETE FROM ejercicio WHERE id_ejercicio = :id");
            return $stmt->execute(['id' => $idEjercicio]);
        } catch (\Exception $e) {
            return false;
        }
    }
}