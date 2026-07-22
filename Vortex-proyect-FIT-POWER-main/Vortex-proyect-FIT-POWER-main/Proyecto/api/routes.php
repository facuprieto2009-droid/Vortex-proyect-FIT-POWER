<?php
// api/routes.php

// ============================================================
// SECCIÓN: Autenticación y Registro
// ============================================================
$router->post('/login', 'AuthController@login');
$router->post('/register', 'UserController@register');
$router->post('/confirm-account', 'UserController@confirmAccount');
$router->get('/check-username', 'UserController@checkUsername');