<?php
namespace App\Utils;

class ImagenUtil {
    // Extensiones/mime permitidos
    private static $mimesPermitidos = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif',
        'image/avif' => 'avif',
    ];

    // Tamaño máximo del archivo ya decodificado (5 MB)
    private static $maxBytes = 5 * 1024 * 1024;

    /**
     * Recibe un data URL tipo "data:image/png;base64,AAAA..." y lo guarda
     * físicamente en /front/dist/assets/Productos/.
     *
     * Devuelve la ruta pública (para guardar en la BD y usar en <img src>)
     * o false si algo falla / el formato no es válido.
     */
    public static function guardarDesdeBase64($dataUrl) {
        if (empty($dataUrl) || !is_string($dataUrl)) return false;

        // Formato esperado: data:image/xxx;base64,XXXXX
        if (!preg_match('/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/', $dataUrl, $match)) {
            return false;
        }

        $mime = strtolower($match[1]);
        $datos = $match[2];

        if (!isset(self::$mimesPermitidos[$mime])) {
            return false; // tipo de imagen no permitido
        }
        $extension = self::$mimesPermitidos[$mime];

        $binario = base64_decode($datos, true);
        if ($binario === false) return false;
        if (strlen($binario) > self::$maxBytes) return false;

        // Carpeta física real: api/../front/dist/assets/Productos/
        $carpeta = dirname(__DIR__, 2) . '/../front/dist/assets/Productos/';
        if (!is_dir($carpeta)) {
            mkdir($carpeta, 0775, true);
        }

        $nombreArchivo = uniqid('producto_', true) . '.' . $extension;
        $rutaFisica = $carpeta . $nombreArchivo;

        if (file_put_contents($rutaFisica, $binario) === false) {
            return false;
        }

        // Ruta pública, servida directo por Apache desde la raíz del sitio
        return '/front/dist/assets/Productos/' . $nombreArchivo;
    }

    /**
     * Borra un archivo de imagen de producto a partir de su ruta pública
     * guardada en la BD (si existe físicamente).
     */
    public static function eliminar($rutaPublica) {
        if (empty($rutaPublica)) return;
        // Solo borramos archivos dentro de la carpeta esperada, por seguridad
        if (strpos($rutaPublica, '/front/dist/assets/Productos/') !== 0) return;

        $rutaFisica = dirname(__DIR__, 2) . '/..' . $rutaPublica;
        if (is_file($rutaFisica)) {
            @unlink($rutaFisica);
        }
    }
}
