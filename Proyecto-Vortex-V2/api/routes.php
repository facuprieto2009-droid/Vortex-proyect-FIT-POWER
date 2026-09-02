<?php
// api/routes.php
// Acá se anota: "cuando pidan ESTA url, ejecutá ESTE controlador@método"

$router->get('/estado', 'EstadoController@ver');


// Próxima clase: login
// $router->post('/login', 'AuthController@login');
