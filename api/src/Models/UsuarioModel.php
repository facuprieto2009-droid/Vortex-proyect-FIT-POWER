<?php
namespace App\Models;

class UsuarioModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // Lista usuarios, opcionalmente filtrados por nombre de rol ('Entrenador', 'Cliente', 'Administrador')
    public function listar($nombreRol = null) {
        try {
            $sql = "SELECT u.id_user, u.nombre, p.id_persona, p.email, p.especialidad, rol.nombre_rol
                    FROM usuario u
                    JOIN persona p ON p.id_persona = u.id_persona
                    JOIN rol ON rol.id_rol = u.id_rol";
            $params = [];
            if ($nombreRol) {
                $sql .= " WHERE rol.nombre_rol = :rol";
                $params['rol'] = $nombreRol;
            }
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function ver($idUser) {
        try {
            $stmt = $this->db->prepare(
                "SELECT u.id_user, u.nombre, p.id_persona, p.email, p.fecha_nacimiento,
                        p.especialidad, p.id_tipo_membresia, rol.nombre_rol
                 FROM usuario u
                 JOIN persona p ON p.id_persona = u.id_persona
                 JOIN rol ON rol.id_rol = u.id_rol
                 WHERE u.id_user = :id"
            );
            $stmt->execute(['id' => $idUser]);
            $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $fila ?: false;
        } catch (\Exception $e) {
            return false;
        }
    }

    // Actualiza datos de usuario y/o persona en una sola llamada (transacción)
    public function actualizar($idUser, $idPersona, $datos) {
        try {
            $this->db->beginTransaction();

            $camposUsuario = ['nombre', 'id_rol'];
            $setU = [];
            $paramsU = ['id_user' => $idUser];
            foreach ($camposUsuario as $campo) {
                if (array_key_exists($campo, $datos)) {
                    $setU[] = "$campo = :$campo";
                    $paramsU[$campo] = $datos[$campo];
                }
            }
            if (!empty($setU)) {
                $stmt = $this->db->prepare("UPDATE usuario SET " . implode(', ', $setU) . " WHERE id_user = :id_user");
                $stmt->execute($paramsU);
            }

            $camposPersona = ['email', 'fecha_nacimiento', 'especialidad', 'id_tipo_membresia'];
            $setP = [];
            $paramsP = ['id_persona' => $idPersona];
            foreach ($camposPersona as $campo) {
                if (array_key_exists($campo, $datos)) {
                    $setP[] = "$campo = :$campo";
                    $paramsP[$campo] = $datos[$campo];
                }
            }
            if (!empty($setP)) {
                $stmt = $this->db->prepare("UPDATE persona SET " . implode(', ', $setP) . " WHERE id_persona = :id_persona");
                $stmt->execute($paramsP);
            }

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    // Crea una persona + usuario en una sola transacción.
    // $datos: { email, password (sin hashear), nombre, id_rol, especialidad?, fecha_nacimiento?, id_tipo_membresia? }
    public function crear($datos) {
        try {
            $this->db->beginTransaction();

            $stmtPersona = $this->db->prepare(
                "INSERT INTO persona (email, fecha_nacimiento, especialidad, id_tipo_membresia)
                 VALUES (:email, :fecha_nacimiento, :especialidad,
                         COALESCE(:id_tipo_membresia, (SELECT id_tipo_membresia FROM estado_membresia ORDER BY id_tipo_membresia LIMIT 1)))"
            );
            $stmtPersona->execute([
                'email' => $datos['email'],
                'fecha_nacimiento' => $datos['fecha_nacimiento'] ?? '',
                'especialidad' => $datos['especialidad'] ?? null,
                'id_tipo_membresia' => $datos['id_tipo_membresia'] ?? null,
            ]);
            $idPersona = (int) $this->db->lastInsertId();

            $hash = password_hash($datos['password'], PASSWORD_BCRYPT);

            $stmtUsuario = $this->db->prepare(
                "INSERT INTO usuario (nombre, contrasena, id_persona, id_rol)
                 VALUES (:nombre, :contrasena, :id_persona, :id_rol)"
            );
            $stmtUsuario->execute([
                'nombre' => $datos['nombre'],
                'contrasena' => $hash,
                'id_persona' => $idPersona,
                'id_rol' => $datos['id_rol'],
            ]);

            $idUser = (int) $this->db->lastInsertId();
            $this->db->commit();
            return $idUser;
        } catch (\Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    public function eliminar($idUser) {
        try {
            $stmt = $this->db->prepare("SELECT id_persona FROM usuario WHERE id_user = :id");
            $stmt->execute(['id' => $idUser]);
            $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$fila) return false;

            $stmt = $this->db->prepare("DELETE FROM persona WHERE id_persona = :id_persona");
            return $stmt->execute(['id_persona' => $fila['id_persona']]);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function listarRoles() {
        try {
            $stmt = $this->db->query("SELECT id_rol, nombre_rol FROM rol ORDER BY id_rol");
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return false;
        }
    }
}
