<?php
namespace App\Models;

class PuntoModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar($idPersona = null) {
        try {
            $sql = "SELECT pt.id_punto, pt.id_persona, p.email, pt.id_pago, pt.cantidad, pt.origen, pt.descripcion, pt.fecha
                    FROM puntos pt
                    JOIN persona p ON p.id_persona = pt.id_persona";
            $params = [];
            if ($idPersona) {
                $sql .= " WHERE pt.id_persona = :id_persona";
                $params['id_persona'] = $idPersona;
            }
            $sql .= " ORDER BY pt.fecha DESC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function agregarManual($idPersona, $cantidad, $descripcion = null) {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO puntos (id_persona, id_pago, cantidad, origen, descripcion, fecha)
                 VALUES (:id_persona, NULL, :cantidad, 'manual', :descripcion, CURDATE())"
            );
            $stmt->execute([
                'id_persona' => $idPersona,
                'cantidad' => $cantidad,
                'descripcion' => $descripcion,
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function actualizar($idPunto, $datos) {
        $camposPermitidos = ['cantidad', 'descripcion'];
        $set = [];
        $params = ['id' => $idPunto];

        foreach ($camposPermitidos as $campo) {
            if (array_key_exists($campo, $datos)) {
                $set[] = "$campo = :$campo";
                $params[$campo] = $datos[$campo];
            }
        }

        if (empty($set)) return false;

        try {
            $sql = "UPDATE puntos SET " . implode(', ', $set) . " WHERE id_punto = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function eliminar($idPunto) {
        try {
            $stmt = $this->db->prepare("DELETE FROM puntos WHERE id_punto = :id");
            return $stmt->execute(['id' => $idPunto]);
        } catch (\Exception $e) {
            return false;
        }
    }

    // Suma de todos los movimientos de puntos de una persona
    public function totalDe($idPersona) {
        try {
            $stmt = $this->db->prepare(
                "SELECT COALESCE(SUM(cantidad), 0) AS total
                 FROM puntos
                 WHERE id_persona = :id"
            );
            $stmt->execute(['id' => $idPersona]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            return (int) $row['total'];
        } catch (\Exception $e) {
            return false;
        }
    }

    // Descuenta puntos usando el mismo INSERT que el admin (origen 'manual')
    public function canjear($idPersona, $cantidad, $descripcion = null) {
        $cantidad = abs((int) $cantidad);
        if ($cantidad <= 0) {
            return false;
        }

        $total = $this->totalDe($idPersona);
        if ($total === false) {
            return false;
        }

        if ($total < $cantidad) {
            return ['ok' => false, 'motivo' => 'insuficientes', 'total' => $total];
        }

        // cantidad negativa = descuento
        $id = $this->agregarManual($idPersona, -$cantidad, $descripcion);
        if ($id === false) {
            return false;
        }

        return ['ok' => true, 'total' => $total - $cantidad];
    }
}