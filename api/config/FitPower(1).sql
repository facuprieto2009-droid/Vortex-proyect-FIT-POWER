-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: db
-- Tiempo de generación: 11-11-2026 a las 12:07:13
-- Versión del servidor: 8.0.46
-- Versión de PHP: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `FitPower`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asignacion_entrenador`
--

CREATE TABLE `asignacion_entrenador` (
  `id_asignacion` int NOT NULL,
  `id_entrenador` int NOT NULL,
  `id_cliente` int NOT NULL,
  `fecha_asignacion` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `asignacion_entrenador`
--

INSERT INTO `asignacion_entrenador` (`id_asignacion`, `id_entrenador`, `id_cliente`, `fecha_asignacion`) VALUES
(4, 8, 7, '2026-09-18'),
(7, 8, 9, '2026-10-06'),
(8, 8, 12, '2026-10-26'),
(9, 8, 15, '2026-10-28');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `contador_calorias`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `contador_calorias` (
`id_persona` int
,`email` varchar(100)
,`total_calorias` decimal(32,0)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `contador_puntos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `contador_puntos` (
`id_persona` int
,`email` varchar(100)
,`total_puntos` decimal(32,0)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ejercicio`
--

CREATE TABLE `ejercicio` (
  `id_ejercicio` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `grupo_muscular` varchar(50) NOT NULL,
  `calorias_por_unidad` int NOT NULL DEFAULT '0',
  `video_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `ejercicio`
--

INSERT INTO `ejercicio` (`id_ejercicio`, `nombre`, `descripcion`, `grupo_muscular`, `calorias_por_unidad`, `video_url`) VALUES
(7, 'Press de banca', NULL, 'Pecho', 15, 'https://www.youtube.com/shorts/wLayV1XggbM'),
(8, 'Sentadilla', NULL, 'Piernas', 15, 'https://www.youtube.com/shorts/UbIClfnHOuw'),
(9, 'Curl bicep con barra', NULL, 'Biceps', 0, 'https://www.youtube.com/shorts/jz5_o-Tdxb4'),
(10, 'Plancha', NULL, 'Abdominales', 0, 'https://www.youtube.com/shorts/wTXneM9aU0E'),
(11, 'Jalon al pecho', NULL, 'Pecho', 0, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_membresia`
--

CREATE TABLE `estado_membresia` (
  `id_tipo_membresia` int NOT NULL,
  `estado` varchar(50) NOT NULL,
  `fecha_inicio` varchar(20) NOT NULL,
  `fecha_vencimiento` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `estado_membresia`
--

INSERT INTO `estado_membresia` (`id_tipo_membresia`, `estado`, `fecha_inicio`, `fecha_vencimiento`) VALUES
(1, 'Activa', '', ''),
(2, 'Inactiva', '', ''),
(3, 'Cancelada', '', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `membresia`
--

CREATE TABLE `membresia` (
  `id_membresia` int NOT NULL,
  `precio` int NOT NULL,
  `ofertas` varchar(255) DEFAULT NULL,
  `id_tipo_membresia` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pago`
--

CREATE TABLE `pago` (
  `id_pago` int NOT NULL,
  `id_persona` int NOT NULL,
  `id_membresia` int DEFAULT NULL,
  `monto` int NOT NULL,
  `fecha` varchar(20) NOT NULL,
  `metodo_pago` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `persona`
--

CREATE TABLE `persona` (
  `id_persona` int NOT NULL,
  `email` varchar(100) NOT NULL,
  `documento` varchar(20) DEFAULT NULL,
  `fecha_nacimiento` varchar(20) NOT NULL,
  `sexo` varchar(20) DEFAULT NULL,
  `peso_kg` decimal(5,2) DEFAULT NULL,
  `altura_cm` int DEFAULT NULL,
  `carne_salud_vencimiento` date DEFAULT NULL,
  `especialidad` varchar(100) DEFAULT NULL,
  `id_tipo_membresia` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `persona`
--

INSERT INTO `persona` (`id_persona`, `email`, `documento`, `fecha_nacimiento`, `sexo`, `peso_kg`, `altura_cm`, `carne_salud_vencimiento`, `especialidad`, `id_tipo_membresia`) VALUES
(6, 'Pepe@gmail.com', NULL, '', NULL, NULL, NULL, NULL, NULL, 1),
(7, 'Hola@gmail.com', NULL, '', NULL, NULL, NULL, NULL, 'Sis', 1),
(8, 'Pala@gmail.com', NULL, '', NULL, NULL, NULL, NULL, 'entrenador', 1),
(9, 'federicoabreu@gnail.com', NULL, '', NULL, NULL, NULL, NULL, 'Piernas', 1),
(11, 'Cheleseca@gmail.com', NULL, '', NULL, NULL, NULL, NULL, NULL, 1),
(12, 'Juanito@gmail.com', '222222222222', '2009-01-01', 'Masculino', 70.00, 180, '2199-12-01', NULL, 1),
(13, 'Tapa@gmail.com', NULL, '', NULL, NULL, NULL, NULL, NULL, 1),
(14, 'Goncho@gmail.com', '948204', '2007-09-11', 'Prefiero no decirlo', 90.00, 100, '2026-10-07', NULL, 1),
(15, 'Pedro1324@gmail.com', '54738479', '0003-01-01', 'Masculino', 80.00, 190, '2080-01-01', NULL, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `persona_rutinas`
--

CREATE TABLE `persona_rutinas` (
  `id_persona` int NOT NULL,
  `id_rutinas` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `persona_rutinas`
--

INSERT INTO `persona_rutinas` (`id_persona`, `id_rutinas`) VALUES
(12, 5),
(7, 6),
(15, 7);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto`
--

CREATE TABLE `producto` (
  `id_producto` int NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `imagen_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `producto`
--

INSERT INTO `producto` (`id_producto`, `nombre`, `categoria`, `precio`, `imagen_url`) VALUES
(15, 'Barra de chocolate', 'BarrasProteicas', 25.00, '/front/dist/assets/Productos/producto_6aaf111da02857.98566041.png'),
(16, 'Barra sabor Coco', 'BarrasProteicas', 25.00, '/front/dist/assets/Productos/producto_6aaf189ad8ede8.50797746.png'),
(17, 'Barra sabor frutilla', 'BarrasProteicas', 25.00, '/front/dist/assets/Productos/producto_6aaf18b4bfb1f0.69252369.png'),
(18, 'Barra sabor manzana verde', 'BarrasProteicas', 25.00, '/front/dist/assets/Productos/producto_6aaf18db1cd904.07516378.png'),
(19, 'Creatina “MONOHIDRATO” FitPower', 'Suplementos', 45.00, '/front/dist/assets/Productos/producto_6aaf1a5a3bc180.82558938.png'),
(20, 'Proteína “DE SUERO” FitPower', 'Suplementos', 38.00, '/front/dist/assets/Productos/producto_6aaf1b59c57175.39021425.png'),
(21, 'Redu-Shake “VAINILLA” FitPower', 'Suplementos', 30.00, '/front/dist/assets/Productos/producto_6aaf1b8f79ec38.48105061.png'),
(23, 'Mancuerna 1Kg FitPower', 'Pesas', 5.00, '/front/dist/assets/Productos/producto_6aaf1c44f17a17.65390029.png'),
(24, 'Mancuerna 5Kg  FitPower', 'Pesas', 11.00, '/front/dist/assets/Productos/producto_6aaf1c63670fe6.36670601.webp'),
(25, 'Mancuerna 10Kg FitPower', 'Pesas', 20.00, '/front/dist/assets/Productos/producto_6aaf1cac1e0a54.13560583.png'),
(26, 'Mancuerna 15Kg FitPower', 'Pesas', 25.00, '/front/dist/assets/Productos/producto_6aaf1cc94aac32.08361067.png'),
(31, 'FitPower creatina', 'Suplementos', 30.00, '/front/dist/assets/Productos/producto_6ae26001d0dd44.35363240.png');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `puntos`
--

CREATE TABLE `puntos` (
  `id_punto` int NOT NULL,
  `id_persona` int NOT NULL,
  `id_pago` int DEFAULT NULL,
  `cantidad` int NOT NULL,
  `origen` enum('pago','manual') NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `puntos`
--

INSERT INTO `puntos` (`id_punto`, `id_persona`, `id_pago`, `cantidad`, `origen`, `descripcion`, `fecha`) VALUES
(1, 6, NULL, 2000, 'manual', 'sisusas', '2026-09-28'),
(2, 12, NULL, 20000, 'manual', 'Se lo merece', '2026-10-28'),
(3, 15, NULL, 100, 'manual', 'Te lo mereces', '2026-10-28'),
(4, 12, NULL, -100, 'manual', 'Canje: Proteinas', '2026-11-08'),
(5, 12, NULL, -300, 'manual', 'Canje: Pesa 10kg', '2026-11-08'),
(6, 12, NULL, -300, 'manual', 'Canje: Pesa 10kg', '2026-11-10');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recompensa`
--

CREATE TABLE `recompensa` (
  `id_recompensa` int NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `puntos` int NOT NULL,
  `imagen_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `recompensa`
--

INSERT INTO `recompensa` (`id_recompensa`, `nombre`, `puntos`, `imagen_url`) VALUES
(8, 'Proteinas', 100, '/front/dist/assets/Productos/producto_6ae248feae2648.45661641.png'),
(9, 'Pesa 10kg', 300, '/front/dist/assets/Productos/producto_6ae260255afcb5.73817712.webp');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registro_actividad`
--

CREATE TABLE `registro_actividad` (
  `id_registro` int NOT NULL,
  `id_persona` int NOT NULL,
  `id_ejercicio` int NOT NULL,
  `id_rutinas` int DEFAULT NULL,
  `fecha` varchar(20) NOT NULL,
  `series` int NOT NULL DEFAULT '1',
  `peso_kg` decimal(6,2) DEFAULT NULL,
  `calorias_quemadas` int NOT NULL,
  `puntos_ganados` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rol`
--

CREATE TABLE `rol` (
  `id_rol` int NOT NULL,
  `nombre_rol` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `rol`
--

INSERT INTO `rol` (`id_rol`, `nombre_rol`) VALUES
(1, 'Administrador'),
(2, 'Entrenador'),
(3, 'Usuario');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rutinas`
--

CREATE TABLE `rutinas` (
  `id_rutinas` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `dias_semana` varchar(50) DEFAULT NULL,
  `fecha_creacion` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `rutinas`
--

INSERT INTO `rutinas` (`id_rutinas`, `nombre`, `dias_semana`, `fecha_creacion`) VALUES
(5, 'Hevi ulti', 'Lunes, Miercoles, Viernes', '2026-10-28'),
(6, 'Pluto', 'Lunes, Miercoles, Jueves', '2026-10-28'),
(7, 'Full body', 'Lunes, Miercoles, Viernes', '2026-10-28');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rutinas_ejercicio`
--

CREATE TABLE `rutinas_ejercicio` (
  `id_rutinas` int NOT NULL,
  `id_ejercicio` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `rutinas_ejercicio`
--

INSERT INTO `rutinas_ejercicio` (`id_rutinas`, `id_ejercicio`) VALUES
(5, 7),
(6, 7),
(5, 8),
(6, 8),
(7, 8),
(5, 9),
(6, 9),
(7, 9),
(5, 10),
(6, 10),
(7, 10);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitud_cambio_entrenador`
--

CREATE TABLE `solicitud_cambio_entrenador` (
  `id_solicitud` int NOT NULL,
  `id_cliente` int NOT NULL,
  `id_entrenador_actual` int DEFAULT NULL,
  `motivo` text NOT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'pendiente',
  `fecha` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `solicitud_cambio_entrenador`
--

INSERT INTO `solicitud_cambio_entrenador` (`id_solicitud`, `id_cliente`, `id_entrenador_actual`, `motivo`, `estado`, `fecha`) VALUES
(1, 12, 8, '111111111111111111111111111111111111111111111111111pene', 'pendiente', '2026-10-28'),
(2, 15, 8, 'Es muy sorete', 'pendiente', '2026-10-28');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id_user` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `id_persona` int NOT NULL,
  `id_rol` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id_user`, `nombre`, `contrasena`, `id_persona`, `id_rol`) VALUES
(5, 'Bomba', '$2y$10$c.mmNSK7DgxDTZLR1/R7pujHcy7QMTm7M.rpXn6gScx.dhkrh5Ayq', 6, 1),
(6, 'Miranda', '$2y$10$WcHvIEoSXxGyYwnZ1MdwbuzPXAgYJNRNmEGDxrTxjzzV0BH0wvWrG', 7, 3),
(7, 'Willy', '$2y$10$hFc4mlBE/S6IzWdh1yCzqeCCmQ2sF6fYzSmmTaMG.J3d.b8Uh8TBG', 8, 2),
(8, 'Federico', '$2y$10$2KO8/4Z3dI/SkHXozj6lV.tgsR.tUx0sx9K2UzLycyx.5xfetrPfy', 9, 2),
(10, 'Cheleseca', '$2y$10$LmcsOASP21oZbROKuUJJg.OR3E18HWGB9.WfXtZ0cY3d.6bEa1A3u', 11, 3),
(11, 'Sapolio', '$2y$10$DxdbfwJk.GmHoTSsRBvdH.zzdIWTP5U2UnqN9gdExkrqafmdxgRfq', 12, 3),
(12, 'Julian', '$2y$10$fTV7ZFqoqrDk.ZS9M7X1yO7AqjU2YbZkedqC5gqPRsXtbnIL9/bBa', 13, 3),
(13, 'Goncho', '$2y$10$xM0NY4ct68.cmJg0nH4Mc.6RmH3/furTdlhvCcg.fTs9CsDO.Hgri', 14, 3),
(14, 'Pedro', '$2y$10$lIlwQEVkgsu8TZLBfrL69upyLO0yNm.7Z5.0xlHDnt8rFfKLxAPw2', 15, 3);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `asignacion_entrenador`
--
ALTER TABLE `asignacion_entrenador`
  ADD PRIMARY KEY (`id_asignacion`),
  ADD UNIQUE KEY `entrenador_cliente_unico` (`id_entrenador`,`id_cliente`),
  ADD KEY `id_cliente` (`id_cliente`);

--
-- Indices de la tabla `ejercicio`
--
ALTER TABLE `ejercicio`
  ADD PRIMARY KEY (`id_ejercicio`);

--
-- Indices de la tabla `estado_membresia`
--
ALTER TABLE `estado_membresia`
  ADD PRIMARY KEY (`id_tipo_membresia`);

--
-- Indices de la tabla `membresia`
--
ALTER TABLE `membresia`
  ADD PRIMARY KEY (`id_membresia`),
  ADD KEY `id_tipo_membresia` (`id_tipo_membresia`);

--
-- Indices de la tabla `pago`
--
ALTER TABLE `pago`
  ADD PRIMARY KEY (`id_pago`),
  ADD KEY `id_persona` (`id_persona`),
  ADD KEY `id_membresia` (`id_membresia`);

--
-- Indices de la tabla `persona`
--
ALTER TABLE `persona`
  ADD PRIMARY KEY (`id_persona`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `id_tipo_membresia` (`id_tipo_membresia`);

--
-- Indices de la tabla `persona_rutinas`
--
ALTER TABLE `persona_rutinas`
  ADD PRIMARY KEY (`id_persona`,`id_rutinas`),
  ADD KEY `id_rutinas` (`id_rutinas`);

--
-- Indices de la tabla `producto`
--
ALTER TABLE `producto`
  ADD PRIMARY KEY (`id_producto`);

--
-- Indices de la tabla `puntos`
--
ALTER TABLE `puntos`
  ADD PRIMARY KEY (`id_punto`),
  ADD KEY `id_persona` (`id_persona`),
  ADD KEY `id_pago` (`id_pago`);

--
-- Indices de la tabla `recompensa`
--
ALTER TABLE `recompensa`
  ADD PRIMARY KEY (`id_recompensa`);

--
-- Indices de la tabla `registro_actividad`
--
ALTER TABLE `registro_actividad`
  ADD PRIMARY KEY (`id_registro`),
  ADD KEY `id_persona` (`id_persona`),
  ADD KEY `id_ejercicio` (`id_ejercicio`),
  ADD KEY `id_rutinas` (`id_rutinas`);

--
-- Indices de la tabla `rol`
--
ALTER TABLE `rol`
  ADD PRIMARY KEY (`id_rol`);

--
-- Indices de la tabla `rutinas`
--
ALTER TABLE `rutinas`
  ADD PRIMARY KEY (`id_rutinas`);

--
-- Indices de la tabla `rutinas_ejercicio`
--
ALTER TABLE `rutinas_ejercicio`
  ADD PRIMARY KEY (`id_rutinas`,`id_ejercicio`),
  ADD KEY `id_ejercicio` (`id_ejercicio`);

--
-- Indices de la tabla `solicitud_cambio_entrenador`
--
ALTER TABLE `solicitud_cambio_entrenador`
  ADD PRIMARY KEY (`id_solicitud`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_entrenador_actual` (`id_entrenador_actual`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `id_persona` (`id_persona`),
  ADD KEY `id_rol` (`id_rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `asignacion_entrenador`
--
ALTER TABLE `asignacion_entrenador`
  MODIFY `id_asignacion` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `ejercicio`
--
ALTER TABLE `ejercicio`
  MODIFY `id_ejercicio` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `estado_membresia`
--
ALTER TABLE `estado_membresia`
  MODIFY `id_tipo_membresia` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `membresia`
--
ALTER TABLE `membresia`
  MODIFY `id_membresia` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pago`
--
ALTER TABLE `pago`
  MODIFY `id_pago` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `persona`
--
ALTER TABLE `persona`
  MODIFY `id_persona` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `producto`
--
ALTER TABLE `producto`
  MODIFY `id_producto` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de la tabla `puntos`
--
ALTER TABLE `puntos`
  MODIFY `id_punto` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `recompensa`
--
ALTER TABLE `recompensa`
  MODIFY `id_recompensa` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `registro_actividad`
--
ALTER TABLE `registro_actividad`
  MODIFY `id_registro` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `rol`
--
ALTER TABLE `rol`
  MODIFY `id_rol` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `rutinas`
--
ALTER TABLE `rutinas`
  MODIFY `id_rutinas` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `solicitud_cambio_entrenador`
--
ALTER TABLE `solicitud_cambio_entrenador`
  MODIFY `id_solicitud` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id_user` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

-- --------------------------------------------------------

--
-- Estructura para la vista `contador_calorias`
--
DROP TABLE IF EXISTS `contador_calorias`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `contador_calorias`  AS SELECT `p`.`id_persona` AS `id_persona`, `p`.`email` AS `email`, coalesce(sum(`r`.`calorias_quemadas`),0) AS `total_calorias` FROM (`persona` `p` left join `registro_actividad` `r` on((`p`.`id_persona` = `r`.`id_persona`))) GROUP BY `p`.`id_persona`, `p`.`email` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `contador_puntos`
--
DROP TABLE IF EXISTS `contador_puntos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`%` SQL SECURITY DEFINER VIEW `contador_puntos`  AS SELECT `p`.`id_persona` AS `id_persona`, `p`.`email` AS `email`, coalesce(sum(`pt`.`cantidad`),0) AS `total_puntos` FROM (`persona` `p` left join `puntos` `pt` on((`p`.`id_persona` = `pt`.`id_persona`))) GROUP BY `p`.`id_persona`, `p`.`email` ;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `asignacion_entrenador`
--
ALTER TABLE `asignacion_entrenador`
  ADD CONSTRAINT `asignacion_entrenador_ibfk_1` FOREIGN KEY (`id_entrenador`) REFERENCES `persona` (`id_persona`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `asignacion_entrenador_ibfk_2` FOREIGN KEY (`id_cliente`) REFERENCES `persona` (`id_persona`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `membresia`
--
ALTER TABLE `membresia`
  ADD CONSTRAINT `membresia_ibfk_1` FOREIGN KEY (`id_tipo_membresia`) REFERENCES `estado_membresia` (`id_tipo_membresia`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Filtros para la tabla `pago`
--
ALTER TABLE `pago`
  ADD CONSTRAINT `pago_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `pago_ibfk_2` FOREIGN KEY (`id_membresia`) REFERENCES `membresia` (`id_membresia`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `persona`
--
ALTER TABLE `persona`
  ADD CONSTRAINT `persona_ibfk_1` FOREIGN KEY (`id_tipo_membresia`) REFERENCES `estado_membresia` (`id_tipo_membresia`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Filtros para la tabla `persona_rutinas`
--
ALTER TABLE `persona_rutinas`
  ADD CONSTRAINT `persona_rutinas_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `persona_rutinas_ibfk_2` FOREIGN KEY (`id_rutinas`) REFERENCES `rutinas` (`id_rutinas`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `puntos`
--
ALTER TABLE `puntos`
  ADD CONSTRAINT `puntos_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `puntos_ibfk_2` FOREIGN KEY (`id_pago`) REFERENCES `pago` (`id_pago`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `registro_actividad`
--
ALTER TABLE `registro_actividad`
  ADD CONSTRAINT `registro_actividad_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `registro_actividad_ibfk_2` FOREIGN KEY (`id_ejercicio`) REFERENCES `ejercicio` (`id_ejercicio`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `registro_actividad_ibfk_3` FOREIGN KEY (`id_rutinas`) REFERENCES `rutinas` (`id_rutinas`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `rutinas_ejercicio`
--
ALTER TABLE `rutinas_ejercicio`
  ADD CONSTRAINT `rutinas_ejercicio_ibfk_1` FOREIGN KEY (`id_rutinas`) REFERENCES `rutinas` (`id_rutinas`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `rutinas_ejercicio_ibfk_2` FOREIGN KEY (`id_ejercicio`) REFERENCES `ejercicio` (`id_ejercicio`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `solicitud_cambio_entrenador`
--
ALTER TABLE `solicitud_cambio_entrenador`
  ADD CONSTRAINT `sce_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `persona` (`id_persona`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `sce_ibfk_2` FOREIGN KEY (`id_entrenador_actual`) REFERENCES `persona` (`id_persona`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `usuario_ibfk_2` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
