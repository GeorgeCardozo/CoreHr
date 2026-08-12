const db = require('../config/db');
const { isDateRangeValid, isValidIsoDate, normalizeDateFields } = require('../utils/dateValidation');
const { normalizeProfilePhoto } = require('../utils/profilePhoto');

const ACTIVE = 'Activo';
const INACTIVE = 'Inactivo';

const validarContrato = ({ empleado_id, tipo_contrato, cargo, fecha_inicio, fecha_fin, salario, estado }) => {
  const employeeId = Number(empleado_id);
  const salary = Number(salario);
  const contractType = String(tipo_contrato || '').trim();
  const jobTitle = cargo === undefined || cargo === null ? null : String(cargo).trim();
  const normalizedState = estado || ACTIVE;

  if (!Number.isInteger(employeeId) || employeeId <= 0 || !contractType || !isValidIsoDate(fecha_inicio)) {
    return { message: 'Se requieren un empleado válido, tipo de contrato y fecha de inicio válida.' };
  }
  if (contractType.length > 100 || jobTitle?.length > 100) {
    return { message: 'El tipo de contrato o cargo supera la longitud permitida.' };
  }
  if (fecha_fin && !isDateRangeValid(fecha_inicio, fecha_fin)) {
    return { message: 'La fecha de finalización no puede ser anterior a la fecha de inicio.' };
  }
  if (!Number.isFinite(salary) || salary < 0 || salary > 9999999999.99) {
    return { message: 'El salario debe ser un número entre 0 y 9.999.999.999,99.' };
  }
  if (![ACTIVE, INACTIVE].includes(normalizedState)) {
    return { message: 'El estado del contrato no es válido.' };
  }

  return { employeeId, salary, contractType, jobTitle: jobTitle || null, state: normalizedState };
};

const validateActiveContract = async (client, employeeId, startDate, excludedId = null) => {
  const result = await client.query(
    `SELECT id, fecha_inicio, fecha_fin FROM contratos
     WHERE empleado_id = $1 AND estado = $2 ${excludedId ? 'AND id <> $3' : ''}
     ORDER BY id DESC LIMIT 1`,
    excludedId ? [employeeId, ACTIVE, excludedId] : [employeeId, ACTIVE]
  );
  const activeContract = result.rows[0];
  if (!activeContract) return null;
  if (!activeContract.fecha_fin) {
    return 'El empleado ya tiene un contrato activo indefinido. Debe finalizarse o desactivarse antes de asignar uno nuevo.';
  }
  const activeEndDate = normalizeDateFields(activeContract, ['fecha_fin']).fecha_fin;
  if (!activeEndDate) return 'La fecha final del contrato activo no tiene un formato valido.';
  if (startDate <= activeEndDate) {
    return `El empleado tiene un contrato activo que finaliza el ${activeEndDate}. El nuevo contrato debe iniciar después de esa fecha.`;
  }
  return null;
};

const crearContrato = async (req, res) => {
  const validation = validarContrato(req.body || {});
  if (validation.message) return res.status(400).json({ message: validation.message });
  const { employeeId, salary, contractType, jobTitle, state } = validation;
  const { fecha_inicio, fecha_fin } = req.body;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    const employee = await client.query('SELECT id FROM empleados WHERE id = $1 AND activo = TRUE FOR UPDATE', [employeeId]);
    if (!employee.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El empleado no existe o está inactivo.' });
    }
    if (state === ACTIVE) {
      const conflict = await validateActiveContract(client, employeeId, fecha_inicio);
      if (conflict) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: conflict });
      }
    }
    const result = await client.query(
      `INSERT INTO contratos (empleado_id, tipo_contrato, cargo, fecha_inicio, fecha_fin, salario, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [employeeId, contractType, jobTitle, fecha_inicio, fecha_fin || null, salary, state]
    );
    await client.query('COMMIT');
    return res.status(201).json({ message: 'Contrato creado exitosamente.', contrato: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ message: 'Ya existe un contrato activo para este empleado.' });
    console.error('Error en crearContrato:', error);
    return res.status(500).json({ message: 'Error interno del servidor al crear contrato.' });
  } finally {
    client.release();
  }
};

const obtenerContratos = async (req, res) => {
  const employeeId = req.query.empleado_id ? Number(req.query.empleado_id) : null;
  const parsedLimit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 200);
  const parsedPage = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const offset = (parsedPage - 1) * parsedLimit;
  if (req.query.empleado_id && (!Number.isInteger(employeeId) || employeeId <= 0)) {
    return res.status(400).json({ message: 'El empleado_id no es válido.' });
  }

  try {
    const result = await db.query(
      `SELECT c.*, e.nombres, e.apellidos, e.foto_perfil,
              (e.foto_perfil_datos IS NOT NULL) AS tiene_foto_perfil
       FROM contratos c JOIN empleados e ON c.empleado_id = e.id
       WHERE ($1::integer IS NULL OR c.empleado_id = $1)
       ORDER BY c.id DESC LIMIT $2 OFFSET $3`,
      [employeeId, parsedLimit, offset]
    );
    return res.status(200).json({
      message: 'Contratos obtenidos exitosamente.',
      contratos: result.rows.map((contrato) => normalizeDateFields(
        normalizeProfilePhoto(contrato),
        ['fecha_inicio', 'fecha_fin']
      )),
      pagination: { limit: parsedLimit, page: parsedPage },
    });
  } catch (error) {
    console.error('Error en obtenerContratos:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener contratos.' });
  }
};

const actualizarContrato = async (req, res) => {
  const contractId = Number(req.params.id);
  if (!Number.isInteger(contractId) || contractId <= 0) {
    return res.status(400).json({ message: 'El identificador del contrato no es válido.' });
  }
  const validation = validarContrato(req.body || {});
  if (validation.message) return res.status(400).json({ message: validation.message });
  const { employeeId, salary, contractType, jobTitle, state } = validation;
  const { fecha_inicio, fecha_fin } = req.body;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT id FROM contratos WHERE id = $1 FOR UPDATE', [contractId]);
    if (!current.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Contrato no encontrado.' });
    }
    const employee = await client.query('SELECT id FROM empleados WHERE id = $1 AND activo = TRUE FOR UPDATE', [employeeId]);
    if (!employee.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El empleado no existe o está inactivo.' });
    }
    if (state === ACTIVE) {
      const conflict = await validateActiveContract(client, employeeId, fecha_inicio, contractId);
      if (conflict) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: conflict });
      }
    }
    const result = await client.query(
      `UPDATE contratos
       SET empleado_id = $1, tipo_contrato = $2, cargo = $3, fecha_inicio = $4, fecha_fin = $5, salario = $6, estado = $7
       WHERE id = $8 RETURNING *`,
      [employeeId, contractType, jobTitle, fecha_inicio, fecha_fin || null, salary, state, contractId]
    );
    await client.query('COMMIT');
    return res.status(200).json({ message: 'Contrato actualizado exitosamente.', contrato: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ message: 'Ya existe un contrato activo para este empleado.' });
    console.error('Error en actualizarContrato:', error);
    return res.status(500).json({ message: 'Error interno del servidor al actualizar contrato.' });
  } finally {
    client.release();
  }
};

module.exports = { crearContrato, obtenerContratos, actualizarContrato, validarContrato };
