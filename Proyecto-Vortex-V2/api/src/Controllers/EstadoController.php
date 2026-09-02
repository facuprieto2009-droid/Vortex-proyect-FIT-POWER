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
        // 1. Preparamos la respuesta base
        $respuesta = [
            'status' => 'ok',
            'message' => 'La API responde',
            'base_datos' => 'conectada',
            'tabla_clientes' => 'no existe todavía',
            'cantidad_clientes' => 0
        ];

        // 2. Instanciamos el Modelo (El Cocinero) pasándole la conexión
        $clienteModel = new ClienteModel($this->db);

        // 3. Le pedimos los datos al Modelo
        $cantidad = $clienteModel->contarClientes();

        // 4. Lógica de negocio (Controlador evaluando qué pasó)
        if ($cantidad !== false) {
            $respuesta['tabla_clientes'] = 'ok';
            $respuesta['cantidad_clientes'] = $cantidad;
        } else {
            $respuesta['tabla_clientes'] = 'Falta crear la tabla clientes (phpMyAdmin o init.sql)';
        }

        // 5. Entregamos la caja cerrada (JSON) al repartidor
        echo json_encode($respuesta, JSON_UNESCAPED_UNICODE);
    }
}