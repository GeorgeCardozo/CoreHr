const fs = require('fs/promises');
const path = require('path');
const db = require('../config/db');
const { crearNotificacionInterna } = require('./notificacionController');
const { isDateRangeValid, isValidIsoDate, normalizeDateFields } = require('../utils/dateValidation');
const { profilePhotoPath } = require('../utils/profilePhoto');

const MAX_PAGE_SIZE = 200;
const REQUEST_COLUMNS = `
  s.id, s.empleado_id, s.tipo_solicitud, s.fecha_inicio, s.fecha_fin,
  s.motivo, s.archivo_adjunto, s.estado, s.comentarios_admin, s.fecha_creacion`;

const buildSolicitudResponse = (solicitud) => normalizeDateFields({
  ...Object.fromEntries(Object.entries(solicitud).filter(([key]) => !['archivo_datos', 'archivo_tipo'].includes(key))),
  tiene_foto_perfil: Boolean(solicitud.tiene_foto_perfil),
  ...(Object.hasOwn(solicitud, 'foto_perfil') ? {
    foto_perfil: profilePhotoPath({
      empleado_id: solicitud.empleado_id,
      foto_perfil: solicitud.foto_perfil,
      tiene_foto_perfil: solicitud.tiene_foto_perfil,
    }),
  } : {}),
  archivo_url: solicitud.archivo_adjunto ? `/api/solicitudes/${solicitud.id}/adjunto` : null,
}, ['fecha_inicio', 'fecha_fin']);

const formatDate = (value) => {
  const date = String(value || '').slice(0, 10).split('-');
  return date.length === 3 ? `${date[2]}/${date[1]}/${date[0]}` : '';
};

const parsePagination = (query) => ({
  limit: Math.min(Math.max(Number.parseInt(query.limit, 10) || 50, 1), MAX_PAGE_SIZE),
  page: Math.max(Number.parseInt(query.page, 10) || 1, 1),
});

const crearSolicitud = async (req, res) => {
  const { tipo_solicitud, fecha_inicio, fecha_fin, motivo } = req.body || {};
  const endDate = fecha_fin || fecha_inicio;
  const requestType = String(tipo_solicitud || '').trim();
  const reason = String(motivo || '').trim();

  if (!requestType || requestType.length > 100 || !reason || reason.length > 2000 ||
    !isValidIsoDate(fecha_inicio) || !isValidIsoDate(endDate) || !isDateRangeValid(fecha_inicio, endDate)) {
    return res.status(400).json({ message: 'Los datos de la solicitud o su rango de fechas no son válidos.' });
  }

  try {
    const employeeResult = await db.query(
      'SELECT id, nombres, apellidos FROM empleados WHERE usuario_id = $1 AND activo = TRUE',
      [req.user.id]
    );
    const employee = employeeResult.rows[0];
    if (!employee) {
      return res.status(404).json({ message: 'No se encontró un perfil de colaborador activo para este usuario.' });
    }

    const result = await db.query(
      `INSERT INTO solicitudes (
         empleado_id, tipo_solicitud, fecha_inicio, fecha_fin, motivo,
         archivo_adjunto, archivo_datos, archivo_tipo
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, empleado_id, tipo_solicitud, fecha_inicio, fecha_fin, motivo,
                 archivo_adjunto, estado, comentarios_admin, fecha_creacion`,
      [
        employee.id, requestType, fecha_inicio, endDate, reason,
        req.file?.originalname || null, req.file?.buffer || null, req.file?.mimetype || null,
      ]
    );

    // Las notificaciones no alteran la creación de la solicitud si fallan.
    void db.query('SELECT id FROM usuarios WHERE rol_id = 1 AND activo = TRUE')
      .then(({ rows }) => Promise.allSettled(rows.map((admin) => crearNotificacionInterna(
        admin.id,
        'Nueva solicitud',
        `${employee.nombres} ${employee.apellidos} envió una solicitud de ${requestType} para el ${formatDate(fecha_inicio)}.`,
        'warning',
        '/solicitudes'
      ))))
      .catch((error) => console.error('Error al crear notificaciones administrativas:', error));

    return res.status(201).json({ message: 'Solicitud enviada con éxito.', solicitud: buildSolicitudResponse(result.rows[0]) });
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    return res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud.' });
  }
};

const listarSolicitudes = async (req, res) => {
  const { limit, page } = parsePagination(req.query);
  const offset = (page - 1) * limit;
  try {
    if (req.user.rol_id === 1) {
      const result = await db.query(
        `SELECT ${REQUEST_COLUMNS}, e.nombres, e.apellidos, e.documento_identidad, e.foto_perfil,
                (e.foto_perfil_datos IS NOT NULL) AS tiene_foto_perfil, e.departamento, c.cargo
         FROM solicitudes s
         JOIN empleados e ON s.empleado_id = e.id
         LEFT JOIN LATERAL (
           SELECT cargo FROM contratos WHERE empleado_id = e.id AND estado = 'Activo' ORDER BY id DESC LIMIT 1
         ) c ON TRUE
         ORDER BY CASE WHEN s.estado = 'Pendiente' THEN 1 ELSE 2 END, s.fecha_creacion DESC
         LIMIT $1 OFFSET $2`, [limit, offset]
      );
      return res.status(200).json({
        message: 'Solicitudes obtenidas exitosamente.',
        solicitudes: result.rows.map(buildSolicitudResponse),
        pagination: { limit, page },
      });
    }

    const result = await db.query(
      `SELECT ${REQUEST_COLUMNS} FROM solicitudes s
       JOIN empleados e ON e.id = s.empleado_id
       WHERE e.usuario_id = $1
       ORDER BY s.fecha_creacion DESC
       LIMIT $2 OFFSET $3`, [req.user.id, limit, offset]
    );
    return res.status(200).json({
      message: 'Tus solicitudes fueron obtenidas exitosamente.',
      solicitudes: result.rows.map(buildSolicitudResponse),
      pagination: { limit, page },
    });
  } catch (error) {
    console.error('Error al listar solicitudes:', error);
    return res.status(500).json({ message: 'Error interno del servidor al listar solicitudes.' });
  }
};

const actualizarEstadoSolicitud = async (req, res) => {
  const requestId = Number(req.params.id);
  const estado = String(req.body?.estado || '');
  const comments = req.body?.comentarios_admin === undefined || req.body?.comentarios_admin === null
    ? null
    : String(req.body.comentarios_admin).trim();
  if (!Number.isInteger(requestId) || requestId <= 0 || !['Aprobado', 'Rechazado', 'Pendiente'].includes(estado) || comments?.length > 2000) {
    return res.status(400).json({ message: 'El estado, comentario o identificador de la solicitud no son válidos.' });
  }

  try {
    const result = await db.query(
      `UPDATE solicitudes s SET estado = $1, comentarios_admin = $2
       FROM empleados e
       WHERE s.id = $3 AND e.id = s.empleado_id
       RETURNING s.id, s.empleado_id, s.tipo_solicitud, s.fecha_inicio, s.fecha_fin,
                 s.motivo, s.archivo_adjunto, s.estado, s.comentarios_admin, s.fecha_creacion,
                 e.usuario_id, e.nombres`,
      [estado, comments, requestId]
    );
    const solicitud = result.rows[0];
    if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada.' });

    const notificationText = `Tu solicitud de ${solicitud.tipo_solicitud} para el ${formatDate(solicitud.fecha_inicio)} fue ${estado.toLowerCase()}.` +
      (comments ? ` Observación: ${comments}` : '');
    void crearNotificacionInterna(
      solicitud.usuario_id,
      `Solicitud ${estado}`,
      notificationText,
      estado === 'Aprobado' ? 'success' : estado === 'Rechazado' ? 'danger' : 'info',
      '/perfil'
    );
    return res.status(200).json({ message: `Solicitud marcada como ${estado}.`, solicitud: buildSolicitudResponse(solicitud) });
  } catch (error) {
    console.error('Error al actualizar estado de solicitud:', error);
    return res.status(500).json({ message: 'Error interno del servidor al actualizar la solicitud.' });
  }
};

const descargarAdjunto = async (req, res) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ message: 'El identificador de la solicitud no es válido.' });
  }
  try {
    const result = await db.query(
      `SELECT s.archivo_adjunto, s.archivo_datos, s.archivo_tipo, e.usuario_id
       FROM solicitudes s JOIN empleados e ON e.id = s.empleado_id
       WHERE s.id = $1`, [requestId]
    );
    const solicitud = result.rows[0];
    if (!solicitud?.archivo_adjunto) return res.status(404).json({ message: 'La solicitud no tiene un soporte adjunto.' });
    if (req.user.rol_id !== 1 && Number(solicitud.usuario_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'No tienes permiso para consultar este soporte.' });
    }

    if (solicitud.archivo_datos) {
      res.setHeader('Content-Type', solicitud.archivo_tipo || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(solicitud.archivo_adjunto).replace(/["\\]/g, '_')}"`);
      res.setHeader('Content-Security-Policy', 'sandbox');
      res.setHeader('Cache-Control', 'private, no-store');
      return res.send(solicitud.archivo_datos);
    }

    // Compatibilidad con soportes creados antes de la migración a PostgreSQL.
    const filename = path.basename(solicitud.archivo_adjunto);
    const uploadDir = path.resolve(__dirname, '../../uploads/solicitudes');
    const filePath = path.join(uploadDir, filename);
    await fs.access(filePath);
    return res.sendFile(filePath, { headers: { 'Content-Disposition': 'inline', 'Content-Security-Policy': 'sandbox' } });
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ message: 'El archivo adjunto ya no está disponible.' });
    console.error('Error al descargar adjunto:', error);
    return res.status(500).json({ message: 'Error interno del servidor al consultar el soporte.' });
  }
};

module.exports = { crearSolicitud, listarSolicitudes, actualizarEstadoSolicitud, descargarAdjunto };
