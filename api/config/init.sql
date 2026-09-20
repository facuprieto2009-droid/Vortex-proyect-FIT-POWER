-- ========================================================
-- SCRIPT DE CREACIÓN: SISTEMA DE GESTIÓN DE AUTOMOTORA
-- ========================================================

-- 1. CREACIÓN DE TABLAS (DDL)

CREATE TABLE MARCAS (
    id_marca INT AUTO_INCREMENT PRIMARY KEY,
    nombre_marca VARCHAR(50) NOT NULL,
    pais_origen VARCHAR(50)
);

CREATE TABLE VEHICULOS (
    id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
    id_marca INT,
    modelo VARCHAR(50) NOT NULL,
    anio INT,
    precio DECIMAL(10, 2),
    estado VARCHAR(20), -- 'Nuevo' o 'Usado'
    FOREIGN KEY (id_marca) REFERENCES MARCAS(id_marca)
);

CREATE TABLE CLIENTES (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(20) -- Algunos no tendrán teléfono para probar IS NULL
);

CREATE TABLE EMPLEADOS (
    id_empleado INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    cargo VARCHAR(50),
    salario DECIMAL(10, 2)
);

CREATE TABLE VENTAS (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    id_vehiculo INT UNIQUE, -- Un vehículo se vende una sola vez en este sistema
    id_cliente INT,
    id_empleado INT,
    fecha_venta DATE,
    monto_total DECIMAL(10, 2),
    FOREIGN KEY (id_vehiculo) REFERENCES VEHICULOS(id_vehiculo),
    FOREIGN KEY (id_cliente) REFERENCES CLIENTES(id_cliente),
    FOREIGN KEY (id_empleado) REFERENCES EMPLEADOS(id_empleado)
);

-- ========================================================
-- 2. POBLACIÓN DE DATOS (DML - INSERTS)
-- ========================================================

-- Insertar Marcas (Dejamos a Tesla sin vehículos para probar LEFT/RIGHT JOIN)
INSERT INTO MARCAS (nombre_marca, pais_origen) VALUES 
('Toyota', 'Japón'),
('Volkswagen', 'Alemania'),
('Ford', 'Estados Unidos'),
('Chevrolet', 'Estados Unidos'),
('Tesla', 'Estados Unidos');

-- Insertar Vehículos
INSERT INTO VEHICULOS (id_marca, modelo, anio, precio, estado) VALUES 
(1, 'Corolla', 2023, 25000.00, 'Nuevo'),
(1, 'Hilux', 2019, 32000.00, 'Usado'),
(2, 'Golf', 2018, 18000.00, 'Usado'),
(2, 'Taos', 2024, 35000.00, 'Nuevo'),
(3, 'Mustang', 2021, 45000.00, 'Usado'),
(3, 'Ranger', 2024, 40000.00, 'Nuevo'),
(4, 'Onix', 2022, 15000.00, 'Usado');

-- Insertar Clientes (Ana López y Pedro Gómez no tienen teléfono)
INSERT INTO CLIENTES (nombre_completo, email, telefono) VALUES 
('Martín Silva', 'martin.silva@email.com', '099123456'),
('Ana López', 'ana.lopez@email.com', NULL),
('Carlos Rodríguez', 'carlos.r@email.com', '098765432'),
('Laura Martínez', 'laura.m@email.com', '091555666'),
('Pedro Gómez', 'pedro.gomez@email.com', NULL);

-- Insertar Empleados
INSERT INTO EMPLEADOS (nombre_completo, cargo, salario) VALUES 
('Roberto Sánchez', 'Vendedor Junior', 30000.00),
('Sofía Acosta', 'Vendedora Senior', 45000.00),
('Diego Fernández', 'Gerente de Ventas', 70000.00);

-- Insertar Ventas (Dejamos vehículos sin vender para hacer pruebas)
INSERT INTO VENTAS (id_vehiculo, id_cliente, id_empleado, fecha_venta, monto_total) VALUES 
(1, 1, 2, '2024-01-15', 25000.00), -- Martín compró el Corolla con Sofía
(3, 2, 1, '2024-02-10', 17500.00), -- Ana compró el Golf con Roberto (con un pequeño descuento)
(5, 4, 2, '2024-03-22', 45000.00), -- Laura compró el Mustang con Sofía
(2, 3, 3, '2024-04-05', 31000.00); -- Carlos compró la Hilux con Diego

