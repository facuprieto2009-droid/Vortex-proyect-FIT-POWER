<?php
namespace App\Utils;

class EnvLoader {
    public static function load($path) {
        if (!file_exists($path)) return;

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            // Ignorar comentarios y líneas vacías (tras trim)
            if ($line === '' || strpos($line, '#') === 0) continue;

            $parts = explode('=', $line, 2);
            if (count($parts) !== 2) continue;

            $name = trim($parts[0]);
            $value = trim($parts[1]);
            // BOM UTF-8 en la primera clave del archivo
            $name = preg_replace('/^\xEF\xBB\xBF/', '', $name);
            if ($name === '') continue;

            // Si el proceso ya tiene un valor no vacío (Docker, Apache SetEnv, etc.), no pisarlo.
            // Si existe pero está vacío, sí cargar desde .env — sin eso B2_* suele fallar aunque el .env esté bien.
            $current = '';
            if (array_key_exists($name, $_ENV)) {
                $current = (string) $_ENV[$name];
            } elseif (array_key_exists($name, $_SERVER)) {
                $current = (string) $_SERVER[$name];
            } elseif (getenv($name) !== false) {
                $current = (string) getenv($name);
            }

            if ($current !== '') {
                continue;
            }

            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}