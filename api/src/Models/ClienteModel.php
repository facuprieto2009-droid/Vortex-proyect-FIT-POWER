<?php
namespace App\Models;

class ClienteModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function contarClientes() {
        try {
            $stmt = $this->db->query('SELECT COUNT(*) AS total FROM CLIENTES');
            $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
            return (int) $fila['total'];
        } catch (\Exception $e) {
            return false; 
        }
    }
}