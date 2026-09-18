<?php
// api/routes.php
// Acá se anota: "cuando pidan ESTA url, ejecutá ESTE controlador@método"

$router->get('/estado', 'EstadoController@ver');


// ===== AUTENTICACIÓN =====
$router->post('/register', 'AuthController@registrar');
$router->post('/login', 'AuthController@login');
$router->post('/logout', 'AuthController@logout');
$router->get('/session', 'AuthController@sesionActual');
$router->put('/password', 'AuthController@cambiarPassword');


// ===== ENTRENADORES =====
// Usuarios (clientes) asignados
$router->get('/entrenadores/:id/clientes', 'EntrenadorController@verClientes');
$router->post('/entrenadores/:id/clientes', 'EntrenadorController@asignarCliente');
$router->delete('/entrenadores/:id/clientes/:idCliente', 'EntrenadorController@quitarCliente');

// Ejercicios / actividad de un cliente (incluye peso levantado)
$router->get('/clientes/:id/actividad', 'EntrenadorController@verActividad');
$router->post('/clientes/:id/actividad', 'EntrenadorController@crearActividad');
$router->put('/actividad/:id', 'EntrenadorController@actualizarActividad');
$router->delete('/actividad/:id', 'EntrenadorController@eliminarActividad');

// Rutinas de un cliente (incluye días de la semana)
$router->get('/clientes/:id/rutinas', 'EntrenadorController@verRutinasDeCliente');
$router->post('/clientes/:id/rutinas', 'EntrenadorController@asignarRutina');
$router->delete('/clientes/:id/rutinas/:idRutina', 'EntrenadorController@quitarRutina');

// Rutinas (catálogo) y sus ejercicios
$router->get('/rutinas/:id', 'EntrenadorController@verRutina');
$router->get('/rutinas', 'EntrenadorController@verTodasLasRutinas');
$router->post('/rutinas', 'EntrenadorController@crearRutina');
$router->put('/rutinas/:id', 'EntrenadorController@actualizarRutina');
$router->post('/rutinas/:id/ejercicios', 'EntrenadorController@agregarEjercicioARutina');
$router->delete('/rutinas/:id/ejercicios/:idEjercicio', 'EntrenadorController@quitarEjercicioDeRutina');
$router->get('/ejercicios', 'EntrenadorController@verEjercicios');


// ===== ADMINISTRADORES =====
// Usuarios y entrenadores
$router->get('/admin/usuarios', 'AdminController@verUsuarios');
$router->post('/admin/usuarios', 'AdminController@crearUsuario');
$router->get('/admin/usuarios/:id', 'AdminController@verUsuario');
$router->put('/admin/usuarios/:id', 'AdminController@actualizarUsuario');
$router->delete('/admin/usuarios/:id', 'AdminController@eliminarUsuario');
$router->get('/roles', 'AdminController@verRoles');

// Pagos
$router->get('/admin/pagos', 'AdminController@verPagos');
$router->post('/admin/pagos', 'AdminController@crearPago');
$router->put('/admin/pagos/:id', 'AdminController@actualizarPago');
$router->delete('/admin/pagos/:id', 'AdminController@eliminarPago');

// Puntos
$router->get('/admin/puntos', 'AdminController@verPuntos');
$router->post('/admin/puntos', 'AdminController@agregarPuntos');
$router->put('/admin/puntos/:id', 'AdminController@actualizarPuntos');
$router->delete('/admin/puntos/:id', 'AdminController@eliminarPuntos');

// ===== CATÁLOGO DE PRODUCTOS =====
// GET pública (la usan también las páginas de Pesas/Suplementos/Barras Proteicas)
$router->get('/productos', 'ProductoController@verProductos');
$router->post('/admin/productos', 'ProductoController@crearProducto');
$router->delete('/admin/productos/:id', 'ProductoController@eliminarProducto');