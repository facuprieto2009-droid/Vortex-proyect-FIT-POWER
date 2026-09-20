<?php
namespace App\Models;

class PagoModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar($idPersona = null) {
        try {
            $sql = "SELECT pg.id_pago, pg.id_persona, p.email, pg.id_membresia, pg.monto, pg.fecha, pg.metodo_pago
                    FROM pago pg
                    JOIN persona p ON p.id_persona = pg.id_persona";
            $params = [];
            if ($idPersona) {
                $sql .= " WHERE pg.id_persona = :id_persona";
                $params['id_persona'] = $idPersona;
            }
            $sql .= " ORDER BY pg.fecha DESC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function crear($datos) {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO pago (id_persona, id_membresia, monto, fecha, metodo_pago)
                 VALUES (:id_persona, :id_membresia, :monto, :fecha, :metodo_pago)"
            );
            $stmt->execute([
                'id_persona' => $datos['id_persona'],
                'id_membresia' => $datos['id_membresia'] ?? null,
                'monto' => $datos['monto'],
                'fecha' => $datos['fecha'] ?? date('Y-m-d'),
                'metodo_pago' => $datos['metodo_pago'] ?? null,
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function actualizar($idPago, $datos) {
        $camposPermitidos = ['id_membresia', 'monto', 'fecha', 'metodo_pago'];
        $set = [];
        $params = ['id' => $idPago];

        foreach ($camposPermitidos as $campo) {
            if (array_key_exists($campo, $datos)) {
                $set[] = "$campo = :$campo";
                $params[$campo] = $datos[$campo];
            }
        }

        if (empty($set)) return false;

        try {
            $sql = "UPDATE pago SET " . implode(', ', $set) . " WHERE id_pago = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function eliminar($idPago) {
        try {
            $stmt = $this->db->prepare("DELETE FROM pago WHERE id_pago = :id");
            return $stmt->execute(['id' => $idPago]);
        } catch (\Exception $e) {
            return false;
        }
    }
}