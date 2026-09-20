<?php
namespace App\Controllers;

// Importamos el molde del Modelo
use App\Models\ClienteModel;

class EstadoController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function ver() {
        $respuesta = [
            'status' => 'ok',
            'message' => 'La API responde',
            'base_datos' => 'conectada',
            'tabla_clientes' => 'no existe todavía',
            'cantidad_clientes' => 0
        ];

        $clienteModel = new ClienteModel($this->db);

        $cantidad = $clienteModel->contarClientes();

        if ($cantidad !== false) {
            $respuesta['tabla_clientes'] = 'ok';
            $respuesta['cantidad_clientes'] = $cantidad;
        } else {
            $respuesta['tabla_clientes'] = 'Falta crear la tabla clientes (phpMyAdmin o init.sql)';
        }

        echo json_encode($respuesta, JSON_UNESCAPED_UNICODE);
    }
}