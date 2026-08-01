const db = require('../config/db');
const { crearNotificacionInterna } = require('./notificacionController');
const path = require('path');
const fs = require('fs');

const buildSolicitudResponse = (solicitud) => ({
  ...solicitud,
  archivo_url: solicitud.archivo_adjunto
    ? `/api/solicitudes/${solicitud.id}/adjunto`
    : null,
});

// Helper para dar formato corto y limpio a la fecha (DD/MM/YYYY)
const formatearFechaCorta = (fecha) => {
  if (!fecha) return '';
  if (fecha instanceof Date) {
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }
  const str = String(fecha).split('T')[0];
  const partes = str.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return str;
};

// Crear una nueva solicitud (Empleado)
exports.crearSolicitud = async (req, res) => {
  const { tipo_solicitud, fecha_inicio, fecha_fin, motivo } = req.body || {};
  const usuario_id = req.user.id;

  const inicio = new Date(`${fecha_inicio}T00:00:00`);
  const fin = new Date(`${fecha_fin || fecha_inicio}T00:00:00`);
  if (!tipo_solicitud || String(tipo_solicitud).length > 100 || !/^\d{4}-\d{2}-\d{2}$/.test(fecha_inicio || '') || !motivo || String(motivo).trim().length > 2000) {
    return res.status(400).json({ message: 'Se requieren los campos tipo_solicitud, fecha_inicio y motivo.' });
  }
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || fin < inicio) {
    return res.status(400).json({ message: 'El rango de fechas de la solicitud no es válido.' });
  }

  const fechaFinalFinal = fecha_fin || fecha_inicio;
  const archivo_adjunto = req.file ? req.file.filename : null;

  try {
    // 1. Encontrar el perfil del colaborador
    const empRes = await db.query('SELECT id, nombres, apellidos FROM empleados WHERE usuario_id = $1', [usuario_id]);
    if (empRes.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró un perfil de colaborador asociado a este usuario.' });
    }
    const empleado = empRes.rows[0];

    // 2. Insertar la solicitud
    const result = await db.query(
      `INSERT INTO solicitudes (empleado_id, tipo_solicitud, fecha_inicio, fecha_fin, motivo, archivo_adjunto)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [empleado.id, String(tipo_solicitud).trim(), fecha_inicio, fechaFinalFinal, String(motivo).trim(), archivo_adjunto]
    );

    // 3. Notificar a todos los usuarios Administradores (rol_id = 1)
    const adminsRes = await db.query('SELECT id FROM usuarios WHERE rol_id = 1');
    const adminUsers = adminsRes.rows;
    const fechaFormateada = formatearFechaCorta(fecha_inicio);

    for (const admin of adminUsers) {
      await crearNotificacionInterna(
        admin.id,
        'Nueva Solicitud de Ausentismo',
        `${empleado.nombres} ${empleado.apellidos} ha enviado una solicitud de ${tipo_solicitud} para el ${fechaFormateada}.`,
        'warning',
        '/solicitudes'
      );
    }

    return res.status(201).json({
      message: 'Solicitud enviada con éxito.',
      solicitud: buildSolicitudResponse(result.rows[0])
    });
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    return res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud.' });
  }
};

// Listar solicitudes (Admin ve todas, Empleado ve sus activas/recientes de 7 días)
exports.listarSolicitudes = async (req, res) => {
  const usuario_id = req.user.id;
  const rol_id = req.user.rol_id;

  try {
    if (rol_id === 1) {
      // Caso 1: Administrador - Ver todas las solicitudes
      const result = await db.query(`
        SELECT s.*, e.nombres, e.apellidos, e.documento_identidad, e.foto_perfil, e.departamento,
               (SELECT cargo FROM contratos c WHERE c.empleado_id = e.id AND c.estado = 'Activo' ORDER BY c.id DESC LIMIT 1) AS cargo
        FROM solicitudes s
        JOIN empleados e ON s.empleado_id = e.id
        ORDER BY
          CASE WHEN s.estado = 'Pendiente' THEN 1 ELSE 2 END,
          s.fecha_creacion DESC
      `);
      return res.status(200).json({
        message: 'Solicitudes obtenidas exitosamente.',
        solicitudes: result.rows.map(buildSolicitudResponse)
      });
    } else {
      // Caso 2: Colaborador - Ver solo sus solicitudes (Pendientes + Resueltas en los últimos 7 días)
      const empRes = await db.query('SELECT id FROM empleados WHERE usuario_id = $1', [usuario_id]);
      if (empRes.rows.length === 0) {
        return res.status(200).json({ message: 'Sin solicitudes.', solicitudes: [] });
      }
      const empleado_id = empRes.rows[0].id;

      const result = await db.query(`
        SELECT s.*, e.nombres, e.apellidos
        FROM solicitudes s
        JOIN empleados e ON s.empleado_id = e.id
        WHERE s.empleado_id = $1
          AND (s.estado = 'Pendiente' OR s.fecha_creacion >= NOW() - INTERVAL '7 days')
        ORDER BY s.fecha_creacion DESC
      `, [empleado_id]);

      return res.status(200).json({
        message: 'Tus solicitudes obtenidas exitosamente.',
        solicitudes: result.rows.map(buildSolicitudResponse)
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

  if (!estado || !['Aprobado', 'Rechazado', 'Pendiente'].includes(estado) || String(comentarios_admin || '').length > 2000) {
    return res.status(400).json({ message: 'Estado inválido. Debe ser Aprobado, Rechazado o Pendiente.' });
  }

  try {
    // 1. Obtener la solicitud y el usuario_id del colaborador
    const checkRes = await db.query(`
      SELECT s.*, e.usuario_id, e.nombres
      FROM solicitudes s
      JOIN empleados e ON s.empleado_id = e.id
      WHERE s.id = $1
    `, [id]);

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada.' });
    }

    const solicitud = checkRes.rows[0];

    // 2. Actualizar la solicitud
    const result = await db.query(
      `UPDATE solicitudes
       SET estado = $1, comentarios_admin = $2
       WHERE id = $3
       RETURNING *`,
      [estado, comentarios_admin ? String(comentarios_admin).trim() : null, id]
    );

    // 3. Generar notificación para el colaborador propietario
    const tipoNotif = estado === 'Aprobado' ? 'success' : 'danger';
    const tituloNotif = `Solicitud de Ausentismo ${estado}`;
    const msjComentario = comentarios_admin ? ` Observación: "${comentarios_admin}"` : '';
    const fechaFormateada = formatearFechaCorta(solicitud.fecha_inicio);
    const msjNotif = `Tu solicitud de ${solicitud.tipo_solicitud} para la fecha ${fechaFormateada} ha sido ${estado.toLowerCase()}.${msjComentario}`;

    await crearNotificacionInterna(
      solicitud.usuario_id,
      tituloNotif,
      msjNotif,
      tipoNotif,
      '/perfil'
    );

    return res.status(200).json({
      message: `Solicitud marcada como ${estado} con éxito.`,
      solicitud: buildSolicitudResponse(result.rows[0])
    });
  } catch (error) {
    console.error('Error al actualizar estado de solicitud:', error);
    return res.status(500).json({ message: 'Error interno del servidor al actualizar la solicitud.' });
  }
};

// Los soportes contienen información médica o personal; nunca se sirven como archivos públicos.
exports.descargarAdjunto = async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(String(id))) {
    return res.status(400).json({ message: 'El identificador de la solicitud no es válido.' });
  }

  try {
    const result = await db.query(
      `SELECT s.archivo_adjunto, e.usuario_id
       FROM solicitudes s
       JOIN empleados e ON e.id = s.empleado_id
       WHERE s.id = $1`,
      [id]
    );
    const solicitud = result.rows[0];
    if (!solicitud?.archivo_adjunto) {
      return res.status(404).json({ message: 'La solicitud no tiene un soporte adjunto.' });
    }
    if (req.user.rol_id !== 1 && Number(solicitud.usuario_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'No tienes permiso para consultar este soporte.' });
    }

    const fileName = path.basename(solicitud.archivo_adjunto);
    const uploadDir = path.resolve(__dirname, '../../uploads/solicitudes');
    const filePath = path.join(uploadDir, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'El archivo adjunto ya no está disponible.' });
    }

    return res.sendFile(filePath, {
      headers: { 'Content-Disposition': 'inline' },
    });
  } catch (error) {
    console.error('Error al descargar adjunto:', error);
    return res.status(500).json({ message: 'Error interno del servidor al consultar el soporte.' });
  }
};
