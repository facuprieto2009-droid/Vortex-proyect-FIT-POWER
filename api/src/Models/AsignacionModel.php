<?php
namespace App\Models;

class AsignacionModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Lista los clientes asignados a un entrenador
    public function listarClientesDeEntrenador($idEntrenador) {
        try {
            $sql = "SELECT p.id_persona, p.email, u.nombre, a.fecha_asignacion
                    FROM asignacion_entrenador a
                    JOIN persona p ON p.id_persona = a.id_cliente
                    JOIN usuario u ON u.id_persona = p.id_persona
                    WHERE a.id_entrenador = :id_entrenador
                    ORDER BY u.nombre";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['id_entrenador' => $idEntrenador]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function asignarCliente($idEntrenador, $idCliente) {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO asignacion_entrenador (id_entrenador, id_cliente, fecha_asignacion)
                 VALUES (:id_entrenador, :id_cliente, CURDATE())"
            );
            return $stmt->execute(['id_entrenador' => $idEntrenador, 'id_cliente' => $idCliente]);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function quitarCliente($idEntrenador, $idCliente) {
        try {
            $stmt = $this->db->prepare(
                "DELETE FROM asignacion_entrenador WHERE id_entrenador = :id_entrenador AND id_cliente = :id_cliente"
            );
            return $stmt->execute(['id_entrenador' => $idEntrenador, 'id_cliente' => $idCliente]);
        } catch (\Exception $e) {
            return false;
        }
    }
}
