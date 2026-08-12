const bcrypt = require('bcrypt');
const db = require('../config/db');
const { buildCertificatePdf } = require('../services/certificateService');
const { isDateRangeValid, isValidIsoDate } = require('../utils/dateValidation');
const {
  PROFILE_PRIVACY_FIELDS,
  normalizeProfilePrivacy,
  sanitizePerfilForViewer,
} = require('../utils/perfilSanitizer');
const { validatePassword } = require('../utils/passwordPolicy');
const { detectImageMime } = require('../utils/imageMime');
const { normalizeProfilePhoto } = require('../utils/profilePhoto');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BULK_SIZE = 500;
const EMPLOYEE_SELECT = `
  e.id, e.usuario_id, e.documento_identidad, e.nombres, e.apellidos, e.telefono,
  e.fecha_ingreso, e.departamento, e.habilidades, e.fecha_info_personal,
  e.fecha_soportes, e.fecha_seguridad, e.superior_inmediato, e.fecha_terminacion,
  e.tipo_genero, e.fecha_nacimiento, e.correo_personal, e.contacto_emergencia,
  e.parentesco, e.telefono_emergencia, e.direccion, e.foto_perfil,
  (e.foto_perfil_datos IS NOT NULL) AS tiene_foto_perfil,
  e.privacidad_perfil, e.activo`;
const stripStoredPhoto = ({ foto_perfil_datos, foto_perfil_tipo, ...employee }) => normalizeProfilePhoto({
  ...employee,
  tiene_foto_perfil: Boolean(foto_perfil_datos || employee.tiene_foto_perfil),
});

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const trimValue = (value) => typeof value === 'string' ? value.trim() : value;
const optionalText = (value, maxLength) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = trimValue(String(value));
  return normalized.length <= maxLength ? normalized : undefined;
};

const validateProfileFields = (data, { requireIdentity = false } = {}) => {
  const correo = normalizeEmail(data.correo);
  const documento = optionalText(data.documento_identidad, 50);
  const nombres = optionalText(data.nombres, 100);
  const apellidos = optionalText(data.apellidos, 100);

  if (requireIdentity && (!EMAIL_PATTERN.test(correo) || !documento || !nombres || !apellidos)) {
    return { message: 'Se requieren correo válido, documento de identidad, nombres y apellidos.' };
  }
  if (correo && !EMAIL_PATTERN.test(correo)) return { message: 'El correo institucional no es válido.' };
  if ([documento, nombres, apellidos].some((value) => value === undefined)) {
    return { message: 'Documento, nombres o apellidos superan la longitud permitida.' };
  }

  const textRules = [
    ['telefono', 50], ['superior_inmediato', 100], ['departamento', 100], ['tipo_genero', 50],
    ['correo_personal', 255], ['contacto_emergencia', 100], ['parentesco', 50],
    ['telefono_emergencia', 50], ['direccion', 255],
  ];
  const values = { correo, documento_identidad: documento, nombres, apellidos };
  for (const [field, maxLength] of textRules) {
    const value = optionalText(data[field], maxLength);
    if (value === undefined) return { message: `El campo ${field} supera la longitud permitida.` };
    values[field] = value;
  }
  if (values.correo_personal && !EMAIL_PATTERN.test(values.correo_personal)) {
    return { message: 'El correo personal no es válido.' };
  }

  for (const field of ['fecha_ingreso', 'fecha_info_personal', 'fecha_soportes', 'fecha_seguridad', 'fecha_terminacion', 'fecha_nacimiento']) {
    const value = data[field];
    if (value && !isValidIsoDate(value)) return { message: `La fecha ${field} no es válida.` };
    values[field] = value || null;
  }
  if (values.fecha_ingreso && values.fecha_terminacion && !isDateRangeValid(values.fecha_ingreso, values.fecha_terminacion)) {
    return { message: 'La fecha de terminación no puede ser anterior a la fecha de ingreso.' };
  }

  if (data.habilidades !== undefined && !Array.isArray(data.habilidades)) {
    return { message: 'Las habilidades deben enviarse como una lista.' };
  }
  const habilidades = data.habilidades === undefined
    ? undefined
    : data.habilidades.map((item) => trimValue(String(item))).filter(Boolean);
  if (habilidades?.length > 30 || habilidades?.some((item) => item.length > 80)) {
    return { message: 'Las habilidades exceden el límite permitido.' };
  }
  values.habilidades = habilidades;
  return { values };
};

const profileQuery = (whereClause) => `
  SELECT ${EMPLOYEE_SELECT}, u.correo, u.rol_id, u.activo AS usuario_activo,
         c.cargo, c.tipo_contrato, c.salario,
         c.fecha_inicio AS contrato_fecha_inicio, c.fecha_fin AS contrato_fecha_fin,
         c.estado AS contrato_estado
  FROM empleados e
  JOIN usuarios u ON e.usuario_id = u.id
  LEFT JOIN LATERAL (
    SELECT cargo, tipo_contrato, salario, fecha_inicio, fecha_fin, estado
    FROM contratos
    WHERE empleado_id = e.id AND estado = 'Activo'
    ORDER BY id DESC
    LIMIT 1
  ) c ON TRUE
  WHERE ${whereClause}`;

const obtenerPerfil = async (req, res) => {
  const requesterUserId = Number(req.user.id);
  const requesterRoleId = Number(req.user.rol_id);
  const rawEmployeeId = req.params.id;

  if (rawEmployeeId && !/^\d+$/.test(String(rawEmployeeId))) {
    return res.status(400).json({ message: 'El identificador del empleado no es válido.' });
  }

  try {
    const result = rawEmployeeId
      ? await db.query(profileQuery('e.id = $1'), [Number(rawEmployeeId)])
      : await db.query(profileQuery('e.usuario_id = $1'), [requesterUserId]);
    const perfil = result.rows[0];

    if (!perfil || (requesterRoleId !== 1 && (!perfil.activo || !perfil.usuario_activo))) {
      return res.status(404).json({ message: 'Perfil de empleado no encontrado.' });
    }

    return res.status(200).json({
      message: 'Perfil obtenido exitosamente.',
      perfil: sanitizePerfilForViewer(perfil, requesterUserId, requesterRoleId),
    });
  } catch (error) {
    console.error('Error en empleadoController.obtenerPerfil:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const actualizarPrivacidadPerfil = async (req, res) => {
  const preferences = req.body?.preferencias;
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
    return res.status(400).json({ message: 'Se requiere un objeto de preferencias válido.' });
  }

  const entries = Object.entries(preferences);
  if (entries.length === 0 || entries.some(([field, visible]) =>
    !PROFILE_PRIVACY_FIELDS.includes(field) || typeof visible !== 'boolean')) {
    return res.status(400).json({ message: 'Las preferencias de privacidad contienen campos o valores no permitidos.' });
  }

  try {
    const current = await db.query(
      'SELECT privacidad_perfil FROM empleados WHERE usuario_id = $1 AND activo = TRUE',
      [Number(req.user.id)]
    );
    if (!current.rows[0]) return res.status(404).json({ message: 'Perfil de empleado no encontrado.' });

    const merged = {
      ...normalizeProfilePrivacy(current.rows[0].privacidad_perfil),
      ...preferences,
    };
    const result = await db.query(
      `UPDATE empleados
          SET privacidad_perfil = $1::jsonb
        WHERE usuario_id = $2 AND activo = TRUE
        RETURNING privacidad_perfil`,
      [JSON.stringify(merged), Number(req.user.id)]
    );

    return res.status(200).json({
      message: 'Preferencias de privacidad actualizadas.',
      privacidad_perfil: normalizeProfilePrivacy(result.rows[0].privacidad_perfil),
    });
  } catch (error) {
    console.error('Error en actualizarPrivacidadPerfil:', error);
    return res.status(500).json({ message: 'Error interno del servidor al actualizar la privacidad.' });
  }
};

const createEmployeeAccount = async (client, data, roleId) => {
  const validation = validateProfileFields(data, { requireIdentity: true });
  const passwordValidation = validatePassword(data.contrasena);
  if (validation.message) return validation;
  if (!passwordValidation.valid) return { message: passwordValidation.message };

  const values = validation.values;
  const hash = await bcrypt.hash(data.contrasena, 12);
  const userResult = await client.query(
    `INSERT INTO usuarios (correo, contrasena, rol_id, debe_cambiar_contrasena)
     VALUES ($1, $2, $3, true)
     RETURNING id`,
    [values.correo, hash, roleId]
  );
  const employeeResult = await client.query(
    `INSERT INTO empleados (
      usuario_id, documento_identidad, nombres, apellidos, telefono, fecha_ingreso,
      habilidades, fecha_info_personal, fecha_soportes, fecha_seguridad, superior_inmediato,
      departamento, fecha_terminacion, tipo_genero, fecha_nacimiento, correo_personal,
      contacto_emergencia, parentesco, telefono_emergencia, direccion
    ) VALUES (
      $1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
    ) RETURNING *`,
    [
      userResult.rows[0].id, values.documento_identidad, values.nombres, values.apellidos,
      values.telefono, values.fecha_ingreso, values.habilidades || null, values.fecha_info_personal,
      values.fecha_soportes, values.fecha_seguridad, values.superior_inmediato, values.departamento,
      values.fecha_terminacion, values.tipo_genero, values.fecha_nacimiento, values.correo_personal,
      values.contacto_emergencia, values.parentesco, values.telefono_emergencia, values.direccion,
    ]
  );
  return { employee: stripStoredPhoto(employeeResult.rows[0]) };
};

const crearEmpleado = async (req, res) => {
  if (req.body?.rol_id && Number(req.body.rol_id) !== 2) {
    return res.status(400).json({ message: 'La creación de administradores se realiza mediante el flujo administrativo específico.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await createEmployeeAccount(client, req.body || {}, 2);
    if (result.message) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: result.message });
    }
    await client.query('COMMIT');
    return res.status(201).json({
      message: 'Colaborador y cuenta creados. Debe cambiar la contraseña en el primer ingreso.',
      empleado: result.employee,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ message: 'El correo o documento de identidad ya se encuentra registrado.' });
    console.error('Error en crearEmpleado:', error);
    return res.status(500).json({ message: 'Error interno del servidor al crear colaborador.' });
  } finally {
    client.release();
  }
};

const listarEmpleados = async (req, res) => {
  const includeInactive = req.query.incluir_inactivos === 'true';
  try {
    const result = await db.query(`
      SELECT ${EMPLOYEE_SELECT}, u.correo, u.activo AS usuario_activo, c.cargo, (c.id IS NOT NULL) AS tiene_contrato
      FROM empleados e
      JOIN usuarios u ON u.id = e.usuario_id
      LEFT JOIN LATERAL (
        SELECT id, cargo FROM contratos WHERE empleado_id = e.id AND estado = 'Activo' ORDER BY id DESC LIMIT 1
      ) c ON TRUE
      WHERE ($1::boolean OR e.activo = TRUE)
      ORDER BY e.activo DESC, e.id ASC`, [includeInactive]);
    return res.status(200).json({ message: 'Empleados obtenidos exitosamente.', empleados: result.rows.map(stripStoredPhoto) });
  } catch (error) {
    console.error('Error en listarEmpleados:', error);
    return res.status(500).json({ message: 'Error interno del servidor al listar empleados.' });
  }
};

const actualizarEmpleado = async (req, res) => {
  const employeeId = Number(req.params.id);
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return res.status(400).json({ message: 'El identificador del empleado no es válido.' });
  }
  const isAdmin = req.user.rol_id === 1;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    const existingResult = await client.query('SELECT * FROM empleados WHERE id = $1', [employeeId]);
    const existing = existingResult.rows[0];
    if (!existing) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Empleado no encontrado.' });
    }

    const incoming = req.body || {};
    const merged = isAdmin
      ? { ...existing, ...incoming, correo: incoming.correo }
      : {
          ...existing,
          telefono: incoming.telefono ?? existing.telefono,
          habilidades: incoming.habilidades ?? existing.habilidades,
          tipo_genero: incoming.tipo_genero ?? existing.tipo_genero,
          fecha_nacimiento: incoming.fecha_nacimiento ?? existing.fecha_nacimiento,
          correo_personal: incoming.correo_personal ?? existing.correo_personal,
          contacto_emergencia: incoming.contacto_emergencia ?? existing.contacto_emergencia,
          parentesco: incoming.parentesco ?? existing.parentesco,
          telefono_emergencia: incoming.telefono_emergencia ?? existing.telefono_emergencia,
          direccion: incoming.direccion ?? existing.direccion,
        };
    if (!isAdmin) merged.correo = null;

    const validation = validateProfileFields(merged, { requireIdentity: isAdmin });
    if (validation.message) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: validation.message });
    }
    const values = validation.values;
    const nextActive = isAdmin && incoming.activo === true ? true : existing.activo;

    if (isAdmin && incoming.activo === false) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Para desactivar una cuenta utiliza la acción de desactivación.' });
    }
    if (isAdmin && incoming.correo) {
      await client.query('UPDATE usuarios SET correo = $1 WHERE id = $2', [values.correo, existing.usuario_id]);
    }
    if (isAdmin && nextActive !== existing.activo) {
      await client.query('UPDATE usuarios SET activo = $1, token_version = token_version + 1 WHERE id = $2', [nextActive, existing.usuario_id]);
    }

    const result = await client.query(
      `UPDATE empleados SET
        documento_identidad = $1, nombres = $2, apellidos = $3, telefono = $4, fecha_ingreso = $5,
        habilidades = $6, fecha_info_personal = $7, fecha_soportes = $8, fecha_seguridad = $9,
        superior_inmediato = $10, departamento = $11, fecha_terminacion = $12, tipo_genero = $13,
        fecha_nacimiento = $14, correo_personal = $15, contacto_emergencia = $16, parentesco = $17,
        telefono_emergencia = $18, direccion = $19, activo = $20
       WHERE id = $21 RETURNING *`,
      [
        values.documento_identidad, values.nombres, values.apellidos, values.telefono,
        values.fecha_ingreso || existing.fecha_ingreso, values.habilidades ?? existing.habilidades,
        values.fecha_info_personal, values.fecha_soportes, values.fecha_seguridad, values.superior_inmediato,
        values.departamento, values.fecha_terminacion, values.tipo_genero, values.fecha_nacimiento,
        values.correo_personal, values.contacto_emergencia, values.parentesco, values.telefono_emergencia,
        values.direccion, nextActive, employeeId,
      ]
    );
    await client.query('COMMIT');
    return res.status(200).json({ message: 'Empleado actualizado exitosamente.', empleado: stripStoredPhoto(result.rows[0]) });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ message: 'El documento de identidad o correo ya están registrados.' });
    console.error('Error en actualizarEmpleado:', error);
    return res.status(500).json({ message: 'Error interno del servidor al actualizar empleado.' });
  } finally {
    client.release();
  }
};

const eliminarEmpleado = async (req, res) => {
  const employeeId = Number(req.params.id);
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return res.status(400).json({ message: 'El identificador del empleado no es válido.' });
  }
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const employeeResult = await client.query(`
      SELECT e.id, e.usuario_id, u.rol_id, u.activo
      FROM empleados e JOIN usuarios u ON u.id = e.usuario_id
      WHERE e.id = $1 FOR UPDATE`, [employeeId]);
    const employee = employeeResult.rows[0];
    if (!employee) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Empleado no encontrado.' });
    }
    if (Number(employee.usuario_id) === Number(req.user.id)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'No puedes desactivar tu propia cuenta.' });
    }
    if (Number(employee.rol_id) === 1 && employee.activo) {
      const admins = await client.query('SELECT COUNT(*)::int AS total FROM usuarios WHERE rol_id = 1 AND activo = TRUE');
      if (admins.rows[0].total <= 1) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'No se puede desactivar el último administrador activo.' });
      }
    }

    await client.query("UPDATE contratos SET estado = 'Inactivo' WHERE empleado_id = $1 AND estado = 'Activo'", [employeeId]);
    await client.query('UPDATE empleados SET activo = FALSE, fecha_terminacion = COALESCE(fecha_terminacion, CURRENT_DATE) WHERE id = $1', [employeeId]);
    await client.query('UPDATE usuarios SET activo = FALSE, token_version = token_version + 1 WHERE id = $1', [employee.usuario_id]);
    await client.query('COMMIT');
    return res.status(200).json({ message: 'Colaborador desactivado. Su historial laboral se conserva.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en eliminarEmpleado:', error);
    return res.status(500).json({ message: 'Error interno del servidor al desactivar colaborador.' });
  } finally {
    client.release();
  }
};

const generarCertificado = async (req, res) => {
  const requesterUserId = Number(req.user.id);
  const requesterRoleId = Number(req.user.rol_id);
  const rawEmployeeId = req.query.empleado_id;
  if (rawEmployeeId && !/^\d+$/.test(String(rawEmployeeId))) {
    return res.status(400).json({ message: 'El identificador del empleado no es válido.' });
  }

  try {
    const result = rawEmployeeId
      ? await db.query(`
          SELECT e.id AS empleado_id, e.usuario_id, e.nombres, e.apellidos, e.documento_identidad, e.fecha_ingreso,
                 c.cargo, c.tipo_contrato, c.salario
          FROM empleados e
          LEFT JOIN LATERAL (
            SELECT cargo, tipo_contrato, salario FROM contratos
            WHERE empleado_id = e.id AND estado = 'Activo' ORDER BY id DESC LIMIT 1
          ) c ON TRUE
          WHERE e.id = $1 AND e.activo = TRUE`, [Number(rawEmployeeId)])
      : await db.query(`
          SELECT e.id AS empleado_id, e.usuario_id, e.nombres, e.apellidos, e.documento_identidad, e.fecha_ingreso,
                 c.cargo, c.tipo_contrato, c.salario
          FROM empleados e
          LEFT JOIN LATERAL (
            SELECT cargo, tipo_contrato, salario FROM contratos
            WHERE empleado_id = e.id AND estado = 'Activo' ORDER BY id DESC LIMIT 1
          ) c ON TRUE
          WHERE e.usuario_id = $1 AND e.activo = TRUE`, [requesterUserId]);
    const employee = result.rows[0];
    if (!employee) return res.status(404).json({ message: 'Perfil de empleado no encontrado.' });
    if (requesterRoleId !== 1 && Number(employee.usuario_id) !== requesterUserId) {
      return res.status(403).json({ message: 'No tienes autorización para descargar este certificado.' });
    }

    const includeSalary = requesterRoleId === 1 && req.query.incluir_salario === 'true';
    const pdf = await buildCertificatePdf(employee, { includeSalary });
    await db.query('INSERT INTO descargas_certificados (empleado_id) VALUES ($1)', [employee.empleado_id]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="certificado_laboral.pdf"');
    res.setHeader('Content-Length', pdf.length);
    return res.status(200).send(pdf);
  } catch (error) {
    console.error('Error en generarCertificado:', error);
    return res.status(500).json({ message: 'Error interno del servidor al generar el certificado en PDF.' });
  }
};

const obtenerDirectorio = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.id, e.nombres, e.apellidos, e.foto_perfil,
             (e.foto_perfil_datos IS NOT NULL) AS tiene_foto_perfil, e.departamento,
             (SELECT cargo FROM contratos WHERE empleado_id = e.id AND estado = 'Activo' AND cargo IS NOT NULL ORDER BY id DESC LIMIT 1) AS cargo
      FROM empleados e
      WHERE e.activo = TRUE
      ORDER BY e.nombres ASC, e.apellidos ASC`);
    return res.status(200).json({ message: 'Directorio obtenido exitosamente.', empleados: result.rows.map(normalizeProfilePhoto) });
  } catch (error) {
    console.error('Error en obtenerDirectorio:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener el directorio.' });
  }
};

const subirFotoPerfil = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se recibió una imagen válida.' });
  const requesterRoleId = Number(req.user.rol_id);
  const targetEmployeeId = req.body?.empleado_id || req.query?.empleado_id;
  if (targetEmployeeId && (!/^\d+$/.test(String(targetEmployeeId)) || requesterRoleId !== 1)) {
    return res.status(403).json({ message: 'No tienes permisos para cambiar la foto de otro colaborador.' });
  }

  try {
    const employeeLookup = targetEmployeeId
      ? await db.query('SELECT id FROM empleados WHERE id = $1 AND activo = TRUE', [Number(targetEmployeeId)])
      : await db.query('SELECT id FROM empleados WHERE usuario_id = $1 AND activo = TRUE', [req.user.id]);
    const employee = employeeLookup.rows[0];
    if (!employee) return res.status(404).json({ message: 'Empleado no encontrado o inactivo.' });

    // La versión evita que el navegador siga mostrando una foto anterior en caché.
    const photoPath = `/api/empleados/${employee.id}/foto?v=${Date.now()}`;
    const result = targetEmployeeId
      ? await db.query(
        `UPDATE empleados SET foto_perfil = $1, foto_perfil_datos = $2, foto_perfil_tipo = $3
         WHERE id = $4 AND activo = TRUE RETURNING id, nombres, apellidos, foto_perfil`,
        [photoPath, req.file.buffer, req.file.mimetype, Number(targetEmployeeId)]
      )
      : await db.query(
        `UPDATE empleados SET foto_perfil = $1, foto_perfil_datos = $2, foto_perfil_tipo = $3
         WHERE usuario_id = $4 AND activo = TRUE RETURNING id, nombres, apellidos, foto_perfil`,
        [photoPath, req.file.buffer, req.file.mimetype, req.user.id]
      );
    return res.status(200).json({ message: 'Foto de perfil actualizada exitosamente.', foto_perfil: photoPath, empleado: result.rows[0] });
  } catch (error) {
    console.error('Error en subirFotoPerfil:', error);
    return res.status(500).json({ message: 'Error interno del servidor al subir foto de perfil.' });
  }
};

const obtenerFotoPerfil = async (req, res) => {
  const employeeId = Number(req.params.id);
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return res.status(400).json({ message: 'El identificador del empleado no es válido.' });
  }

  try {
    const result = await db.query(
      `SELECT foto_perfil_datos, foto_perfil_tipo
       FROM empleados WHERE id = $1 AND activo = TRUE`,
      [employeeId]
    );
    const photo = result.rows[0];
    if (!photo) return res.status(404).json({ message: 'La foto de perfil no está disponible.' });

    const bytes = photo.foto_perfil_datos;
    if (!bytes) return res.status(404).json({ message: 'La foto de perfil no est\u00e1 disponible.' });
    const mime = detectImageMime(bytes) || photo.foto_perfil_tipo;
    if (!mime) return res.status(415).json({ message: 'El formato de la foto de perfil no es reconocido.' });

    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'private, max-age=3600, must-revalidate');
    res.setHeader('Content-Disposition', 'inline');
    return res.send(bytes);
  } catch (error) {
    console.error('Error en obtenerFotoPerfil:', error);
    return res.status(500).json({ message: 'Error interno del servidor al consultar la foto.' });
  }
};

const crearEmpleadosMasivo = async (req, res) => {
  const employees = req.body?.empleados;
  if (!Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ message: 'Se requiere una lista de colaboradores en el campo empleados.' });
  }
  if (employees.length > MAX_BULK_SIZE) {
    return res.status(400).json({ message: `La carga masiva no puede superar ${MAX_BULK_SIZE} colaboradores.` });
  }

  const client = await db.pool.connect();
  const results = { creados: [], errores: [] };
  try {
    await client.query('BEGIN');
    for (const [index, employee] of employees.entries()) {
      await client.query('SAVEPOINT bulk_employee');
      try {
        const normalized = {
          ...employee,
          correo: normalizeEmail(employee?.correo),
          habilidades: Array.isArray(employee?.habilidades)
            ? employee.habilidades
            : String(employee?.habilidades || '').split(',').map((item) => item.trim()).filter(Boolean),
        };
        const created = await createEmployeeAccount(client, normalized, 2);
        if (created.message) throw new Error(created.message);
        results.creados.push(created.employee);
        await client.query('RELEASE SAVEPOINT bulk_employee');
      } catch (error) {
        await client.query('ROLLBACK TO SAVEPOINT bulk_employee');
        results.errores.push({
          fila: index + 1,
          correo: normalizeEmail(employee?.correo) || 'N/D',
          error: error.code === '23505' ? 'El correo o documento de identidad ya está registrado.' : 'La fila no cumple las validaciones requeridas.',
        });
      }
    }
    await client.query('COMMIT');
    return res.status(201).json({
      message: `Proceso masivo completado. Creados: ${results.creados.length}, errores: ${results.errores.length}.`,
      ...results,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error general en crearEmpleadosMasivo:', error);
    return res.status(500).json({ message: 'Error de servidor durante la carga masiva.' });
  } finally {
    client.release();
  }
};

const crearAdministrador = async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await createEmployeeAccount(client, req.body || {}, 1);
    if (result.message) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: result.message });
    }
    await client.query('COMMIT');
    return res.status(201).json({
      message: 'Administrador creado. Debe cambiar la contraseña en el primer ingreso.',
      empleado: result.employee,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ message: 'El correo o documento de identidad ya está registrado.' });
    console.error('Error en crearAdministrador:', error);
    return res.status(500).json({ message: 'Error interno del servidor al crear administrador.' });
  } finally {
    client.release();
  }
};

module.exports = {
  obtenerPerfil,
  actualizarPrivacidadPerfil,
  crearEmpleado,
  listarEmpleados,
  actualizarEmpleado,
  eliminarEmpleado,
  generarCertificado,
  obtenerDirectorio,
  subirFotoPerfil,
  obtenerFotoPerfil,
  crearEmpleadosMasivo,
  crearAdministrador,
};
