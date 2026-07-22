<?php
namespace App\Controllers;

use App\Models\Auth\AuthModel;

class AuthController {
    private $db;
    private $model;

    public function __construct($db) { 
        $this->db = $db; // Guardamos la BD para la bitácora
        $this->model = new AuthModel($db);
    }


}