const db = require('../config/db');

// Crear una nueva solicitud (Empleado)
exports.crearSolicitud = async (req, res) => {
  const { tipo_solicitud, fecha_inicio, fecha_fin, motivo } = req.body;
  const usuario_id = req.user.id; // Proveniente del verifyToken middleware

  if (!tipo_solicitud || !fecha_inicio || !fecha_fin || !motivo) {
    return res.status(400).json({ message: 'Todos los campos son requeridos (tipo_solicitud, fecha_inicio, fecha_fin, motivo).' });
  }

  try {
    // 1. Encontrar el empleado_id a partir del usuario_id
    const empRes = await db.query('SELECT id FROM empleados WHERE usuario_id = $1', [usuario_id]);
    if (empRes.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró un perfil de colaborador asociado a este usuario.' });
    }
    const empleado_id = empRes.rows[0].id;

    // 2. Insertar la solicitud
    const result = await db.query(
      `INSERT INTO solicitudes (empleado_id, tipo_solicitud, fecha_inicio, fecha_fin, motivo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [empleado_id, tipo_solicitud, fecha_inicio, fecha_fin, motivo]
    );

    return res.status(201).json({
      message: 'Solicitud enviada con éxito.',
      solicitud: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    return res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud.' });
  }
};

// Listar solicitudes (Admin ve todas, Empleado ve solo las suyas)
exports.listarSolicitudes = async (req, res) => {
  const usuario_id = req.user.id;
  const rol_id = req.user.rol_id;

  try {
    if (rol_id === 1) {
      // Caso 1: Administrador - Ver todas las solicitudes
      const result = await db.query(`
        SELECT s.*, e.nombres, e.apellidos, e.documento_identidad, e.foto_perfil
        FROM solicitudes s
        JOIN empleados e ON s.empleado_id = e.id
        ORDER BY s.fecha_creacion DESC
      `);
      return res.status(200).json({
        message: 'Solicitudes obtenidas exitosamente.',
        solicitudes: result.rows
      });
    } else {
      // Caso 2: Colaborador - Ver solo las suyas
      // 1. Encontrar el empleado_id
      const empRes = await db.query('SELECT id FROM empleados WHERE usuario_id = $1', [usuario_id]);
      if (empRes.rows.length === 0) {
        return res.status(200).json({ message: 'Sin solicitudes.', solicitudes: [] });
      }
      const empleado_id = empRes.rows[0].id;

      // 2. Obtener solicitudes de este empleado
      const result = await db.query(`
        SELECT s.*, e.nombres, e.apellidos
        FROM solicitudes s
        JOIN empleados e ON s.empleado_id = e.id
        WHERE s.empleado_id = $1
        ORDER BY s.fecha_creacion DESC
      `, [empleado_id]);

      return res.status(200).json({
        message: 'Tus solicitudes obtenidas exitosamente.',
        solicitudes: result.rows
      });
    }
  } catch (error) {
    console.error('Error al listar solicitudes:', error);
    return res.status(500).json({ message: 'Error interno del servidor al listar solicitudes.' });
  }
};

// Actualizar estado de una solicitud (Aprobar/Rechazar - Solo Admin)
exports.actualizarEstadoSolicitud = async (req, res) => {
  const { id } = req.params;
  const { estado, comentarios_admin } = req.body;

  if (!estado || !['Aprobado', 'Rechazado', 'Pendiente'].includes(estado)) {
    return res.status(400).json({ message: 'Estado inválido. Debe ser Aprobado, Rechazado o Pendiente.' });
  }

  try {
    // Verificar que la solicitud existe
    const checkRes = await db.query('SELECT id FROM solicitudes WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada.' });
    }

    // Actualizar la solicitud
    const result = await db.query(
      `UPDATE solicitudes 
       SET estado = $1, comentarios_admin = $2 
       WHERE id = $3
       RETURNING *`,
      [estado, comentarios_admin || null, id]
    );

    return res.status(200).json({
      message: `Solicitud marcada como ${estado} con éxito.`,
      solicitud: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar estado de solicitud:', error);
    return res.status(500).json({ message: 'Error interno del servidor al actualizar la solicitud.' });
  }
};
