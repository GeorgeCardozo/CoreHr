const db = require('../config/db');

// Helper interno para insertar notificaciones en DB
const crearNotificacionInterna = async (usuario_id, titulo, mensaje, tipo = 'info', enlace = null) => {
  try {
    await db.query(
      `INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, enlace)
       VALUES ($1, $2, $3, $4, $5)`,
      [usuario_id, titulo, mensaje, tipo, enlace]
    );
  } catch (error) {
    console.error('Error al crear notificación interna:', error);
  }
};

// GET /api/notificaciones - Obtener notificaciones del usuario autenticado
const obtenerNotificaciones = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    const result = await db.query(
      `SELECT * FROM notificaciones 
       WHERE usuario_id = $1 
       ORDER BY fecha_creacion DESC 
       LIMIT 30`,
      [usuario_id]
    );

    const countRes = await db.query(
      `SELECT COUNT(*)::int AS no_leidas FROM notificaciones 
       WHERE usuario_id = $1 AND leido = FALSE`,
      [usuario_id]
    );

    return res.status(200).json({
      message: 'Notificaciones obtenidas con éxito.',
      notificaciones: result.rows,
      no_leidas: countRes.rows[0]?.no_leidas || 0
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({ message: 'Error interno del servidor al consultar notificaciones.' });
  }
};

// PUT /api/notificaciones/:id/leida - Marcar una notificación individual como leída
const marcarNotificacionLeida = async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.user.id;

  try {
    const result = await db.query(
      `UPDATE notificaciones 
       SET leido = TRUE 
       WHERE id = $1 AND usuario_id = $2 
       RETURNING *`,
      [id, usuario_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notificación no encontrada o no pertenece al usuario.' });
    }

    return res.status(200).json({
      message: 'Notificación marcada como leída.',
      notificacion: result.rows[0]
    });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    return res.status(500).json({ message: 'Error interno al actualizar notificación.' });
  }
};

// PUT /api/notificaciones/marcar-todas - Marcar todas como leídas
const marcarTodasLeidas = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    await db.query(
      `UPDATE notificaciones 
       SET leido = TRUE 
       WHERE usuario_id = $1 AND leido = FALSE`,
      [usuario_id]
    );

    return res.status(200).json({
      message: 'Todas las notificaciones fueron marcadas como leídas.'
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error);
    return res.status(500).json({ message: 'Error interno al actualizar notificaciones.' });
  }
};

module.exports = {
  crearNotificacionInterna,
  obtenerNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas
};
