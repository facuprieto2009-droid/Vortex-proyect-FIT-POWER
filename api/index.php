<?php
// api/index.php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

ob_start(); 

header("Content-Type: application/json; charset=UTF-8");

$origenPermitido = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origenPermitido");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'autoload.php';

\App\Utils\EnvLoader::load(__DIR__ . '/.env');

require_once 'config/database.php';

try {
    $db = (new Database())->getConnection();
} catch (Throwable $e) {
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

$base = '/api';

$router = new \App\Utils\Router($base, $db);

require_once 'routes.php';

$basura = ob_get_clean(); 

$router->run();