<?php
namespace App\Models;

// Datos personales del socio logueado, su entrenador asignado y las solicitudes
// de cambio de entrenador. Lo usa la vista del usuario (VistaUsuario.html).
class PerfilModel {
    private $db;

    // Valores aceptados en el campo sexo (el <select> del formulario manda uno de estos)
    public static $sexosValidos = ['Femenino', 'Masculino', 'Otro', 'Prefiero no decirlo'];

    public function __construct($db) {
        $this->db = $db;
    }

    // Perfil completo: datos de persona + nombre y rol del usuario + estado de la membresía
    public function ver($idPersona) {
        try {
            $stmt = $this->db->prepare(
                "SELECT p.id_persona, p.email, p.documento, p.fecha_nacimiento, p.sexo,
                        p.peso_kg, p.altura_cm, p.carne_salud_vencimiento, p.especialidad,
                        u.nombre, r.nombre_rol, em.estado AS estado_membresia
                 FROM persona p
                 JOIN usuario u ON u.id_persona = p.id_persona
                 JOIN rol r ON r.id_rol = u.id_rol
                 LEFT JOIN estado_membresia em ON em.id_tipo_membresia = p.id_tipo_membresia
                 WHERE p.id_persona = :id"
            );
            $stmt->execute(['id' => $idPersona]);
            $perfil = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$perfil) return false;

            // Campos calculados, para que el front no tenga que hacer cuentas de fechas
            $perfil['edad'] = self::calcularEdad($perfil['fecha_nacimiento']);
            $perfil['carne_salud_vigente'] = self::carneVigente($perfil['carne_salud_vencimiento']);

            // Normalizamos los números para que el JSON no mande "70.00" como texto
            $perfil['peso_kg'] = $perfil['peso_kg'] === null ? null : (float) $perfil['peso_kg'];
            $perfil['altura_cm'] = $perfil['altura_cm'] === null ? null : (int) $perfil['altura_cm'];
            // Total de puntos acumulados del socio
            $puntoModelo = new PuntoModel($this->db);
            $total = $puntoModelo->totalDe($idPersona);
            $perfil['puntos_totales'] = ($total === false) ? 0 : $total;

            return $perfil;
        } catch (\Exception $e) {
            return false;
        }
    }

    // Guarda solo los campos que el socio puede editar de sí mismo.
    // Nada de email, rol ni membresía: eso lo cambia el administrador.
    public function actualizar($idPersona, $datos) {
        $camposPermitidos = ['documento', 'fecha_nacimiento', 'sexo', 'peso_kg', 'altura_cm', 'carne_salud_vencimiento'];
        $set = [];
        $params = ['id' => $idPersona];

        foreach ($camposPermitidos as $campo) {
            if (array_key_exists($campo, $datos)) {
                $set[] = "$campo = :$campo";
                $params[$campo] = $datos[$campo];
            }
        }

        if (empty($set)) return false;

        try {
            $sql = "UPDATE persona SET " . implode(', ', $set) . " WHERE id_persona = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (\Exception $e) {
            return false;
        }
    }

    // Entrenador asignado al socio.
    // Devuelve el array del entrenador, null si no tiene ninguno, o false si falló la consulta.
    public function entrenadorDe($idPersona) {
        try {
            $stmt = $this->db->prepare(
                "SELECT p.id_persona, u.nombre, p.email, p.especialidad, a.fecha_asignacion
                 FROM asignacion_entrenador a
                 JOIN persona p ON p.id_persona = a.id_entrenador
                 JOIN usuario u ON u.id_persona = p.id_persona
                 WHERE a.id_cliente = :id
                 ORDER BY a.fecha_asignacion DESC
                 LIMIT 1"
            );
            $stmt->execute(['id' => $idPersona]);
            $entrenador = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $entrenador ?: null;
        } catch (\Exception $e) {
            return false;
        }
    }

    // Solicitud de cambio que todavía no resolvió el administrador.
    // Devuelve la solicitud, null si no hay ninguna, o false si falló la consulta.
    public function solicitudPendiente($idCliente) {
        try {
            $stmt = $this->db->prepare(
                "SELECT id_solicitud, motivo, estado, fecha
                 FROM solicitud_cambio_entrenador
                 WHERE id_cliente = :id AND estado = 'pendiente'
                 ORDER BY fecha DESC
                 LIMIT 1"
            );
            $stmt->execute(['id' => $idCliente]);
            $solicitud = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $solicitud ?: null;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function crearSolicitud($idCliente, $idEntrenadorActual, $motivo) {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO solicitud_cambio_entrenador (id_cliente, id_entrenador_actual, motivo, estado, fecha)
                 VALUES (:id_cliente, :id_entrenador, :motivo, 'pendiente', CURDATE())"
            );
            $stmt->execute([
                'id_cliente' => $idCliente,
                'id_entrenador' => $idEntrenadorActual,
                'motivo' => $motivo,
            ]);
            return (int) $this->db->lastInsertId();
        } catch (\Exception $e) {
            return false;
        }
    }

    /* ---------- Ayudas ---------- */

    // fecha_nacimiento es varchar en la base y puede venir vacía o con cualquier formato,
    // así que si no se entiende devolvemos null en vez de romper.
    private static function calcularEdad($fechaNacimiento) {
        if (empty($fechaNacimiento)) return null;
        try {
            $nacimiento = new \DateTime($fechaNacimiento);
        } catch (\Exception $e) {
            return null;
        }
        $hoy = new \DateTime('today');
        if ($nacimiento > $hoy) return null;
        return (int) $nacimiento->diff($hoy)->y;
    }

    // true / false según la fecha de vencimiento; null si todavía no cargó el carné
    private static function carneVigente($vencimiento) {
        if (empty($vencimiento)) return null;
        try {
            $fecha = new \DateTime($vencimiento);
        } catch (\Exception $e) {
            return null;
        }
        return $fecha >= new \DateTime('today');
    }
}
