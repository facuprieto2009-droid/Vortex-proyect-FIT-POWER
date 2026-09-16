-- Migración: soporte para funciones de Entrenador y Administrador
-- Ejecutar sobre la base FitPower ya existente.

-- 1. Peso levantado, por ejercicio registrado (kg en esa serie/sesión)
ALTER TABLE `registro_actividad`
  ADD COLUMN `peso_kg` DECIMAL(6,2) DEFAULT NULL AFTER `series`;

-- 2. Días de entrenamiento fijos por rutina (ej: 'Lun,Mie,Vie')
ALTER TABLE `rutinas`
  ADD COLUMN `dias_semana` VARCHAR(50) DEFAULT NULL AFTER `nombre`;

-- 3. Relación entrenador-cliente
CREATE TABLE `asignacion_entrenador` (
  `id_asignacion` INT NOT NULL AUTO_INCREMENT,
  `id_entrenador` INT NOT NULL,
  `id_cliente` INT NOT NULL,
  `fecha_asignacion` DATE NOT NULL,
  PRIMARY KEY (`id_asignacion`),
  UNIQUE KEY `entrenador_cliente_unico` (`id_entrenador`,`id_cliente`),
  KEY `id_cliente` (`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `asignacion_entrenador`
  ADD CONSTRAINT `asignacion_entrenador_ibfk_1`
    FOREIGN KEY (`id_entrenador`) REFERENCES `persona` (`id_persona`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `asignacion_entrenador_ibfk_2`
    FOREIGN KEY (`id_cliente`) REFERENCES `persona` (`id_persona`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Roles básicos (idempotente: no duplica si ya existen).
-- /register (auth) necesita que exista el rol 'Cliente'.
INSERT INTO `rol` (`nombre_rol`)
SELECT 'Cliente' WHERE NOT EXISTS (SELECT 1 FROM `rol` WHERE `nombre_rol` = 'Cliente');

INSERT INTO `rol` (`nombre_rol`)
SELECT 'Entrenador' WHERE NOT EXISTS (SELECT 1 FROM `rol` WHERE `nombre_rol` = 'Entrenador');

INSERT INTO `rol` (`nombre_rol`)
SELECT 'Administrador' WHERE NOT EXISTS (SELECT 1 FROM `rol` WHERE `nombre_rol` = 'Administrador');

-- 5. /register también necesita al menos una fila en estado_membresia (columna NOT NULL en persona).
-- Si ya tenés tipos de membresía cargados, este INSERT no hace falta.
INSERT INTO `estado_membresia` (`estado`, `fecha_inicio`, `fecha_vencimiento`)
SELECT 'Sin membresía', '', ''
WHERE NOT EXISTS (SELECT 1 FROM `estado_membresia`);
