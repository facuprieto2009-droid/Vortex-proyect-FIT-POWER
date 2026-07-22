<?php
// api/index.php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// ... el resto de tu código (require autoload, router, etc.)
// 1. Iniciamos buffer para atrapar cualquier error de texto plano o warnings de PHP
ob_start(); 

// 2. Cabeceras estrictas para API-Driven
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Manejo de peticiones preflight (CORS) de los navegadores
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'autoload.php';

// 3. Cargar las variables del archivo .env
\App\Utils\EnvLoader::load(__DIR__ . '/.env');

require_once 'config/database.php';

// 4. Intentar conexión aislada
try {
    $db = (new Database())->getConnection();
} catch (Exception $e) {
    ob_clean();
    error_log('DB connection failed: ' . $e->getMessage());
    http_response_code(500);
    $isLocalHost = isset($_SERVER['HTTP_HOST'])
        && (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false
            || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false);
    $clientMsg = $isLocalHost
        ? ('Error crítico de BD: ' . $e->getMessage())
        : 'Error crítico de BD: no se pudo conectar al servidor de datos';
    echo json_encode([
        'status' => 'error',
        'message' => $clientMsg,
    ]);
    exit;
}

// ==============================================================================
// LÓGICA HÍBRIDA DE ENRUTAMIENTO (Local vs Producción)
// ==============================================================================
// Si estamos en local, la URL web contiene la subcarpeta.
// Si estamos en producción (NGINX), la URL web siempre empieza desde /api.
$isLocal = (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false);

$base = $isLocal ? '/URBE-API-DRIVEN/api' : '/api';

// Instanciamos el router inyectando el base path correcto y la DB
$router = new \App\Utils\Router($base, $db);

// Cargamos todas las definiciones de rutas
require_once 'routes.php';

// 5. Limpiamos cualquier echo/espacio en blanco accidental antes de ejecutar
$basura = ob_get_clean(); 

// 6. Lanzar la aplicación
$router->run();