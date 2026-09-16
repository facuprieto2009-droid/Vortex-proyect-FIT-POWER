<?php
namespace App\Models;

class AuthModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function buscarPorEmail($email) {
        try {
            $stmt = $this->db->prepare(
                "SELECT u.id_user, u.nombre, u.contrasena, p.id_persona, p.email, rol.nombre_rol
                 FROM usuario u
                 JOIN persona p ON p.id_persona = u.id_persona
                 JOIN rol ON rol.id_rol = u.id_rol
                 WHERE p.email = :email"
            );
            $stmt->execute(['email' => $email]);
            $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $fila ?: false;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function idRolPorNombre($nombreRol) {
        try {
            $stmt = $this->db->prepare("SELECT id_rol FROM rol WHERE nombre_rol = :nombre");
            $stmt->execute(['nombre' => $nombreRol]);
            $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $fila ? (int) $fila['id_rol'] : false;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function registrar($email, $passwordHash, $nombre) {
        $idRol = $this->idRolPorNombre('Cliente');
        if ($idRol === false) return false;

        try {
            $this->db->beginTransaction();

            $stmtPersona = $this->db->prepare(
                "INSERT INTO persona (email, fecha_nacimiento, especialidad, id_tipo_membresia)
                 VALUES (:email, '', NULL, (SELECT id_tipo_membresia FROM estado_membresia ORDER BY id_tipo_membresia LIMIT 1))"
            );
            $stmtPersona->execute(['email' => $email]);
            $idPersona = (int) $this->db->lastInsertId();

            $stmtUsuario = $this->db->prepare(
                "INSERT INTO usuario (nombre, contrasena, id_persona, id_rol)
                 VALUES (:nombre, :contrasena, :id_persona, :id_rol)"
            );
            $stmtUsuario->execute([
                'nombre' => $nombre,
                'contrasena' => $passwordHash,
                'id_persona' => $idPersona,
                'id_rol' => $idRol,
            ]);

            $idUser = (int) $this->db->lastInsertId();
            $this->db->commit();
            return $idUser;
        } catch (\Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    public function obtenerHash($idUser) {
        try {
            $stmt = $this->db->prepare("SELECT contrasena FROM usuario WHERE id_user = :id");
            $stmt->execute(['id' => $idUser]);
            $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $fila ? $fila['contrasena'] : false;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function cambiarPassword($idUser, $passwordHash) {
        try {
            $stmt = $this->db->prepare("UPDATE usuario SET contrasena = :contrasena WHERE id_user = :id_user");
            return $stmt->execute(['contrasena' => $passwordHash, 'id_user' => $idUser]);
        } catch (\Exception $e) {
            return false;
        }
    }
}
