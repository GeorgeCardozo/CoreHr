const db = require('../config/db');

const validarContrato = ({ empleado_id, tipo_contrato, fecha_inicio, fecha_fin, salario, estado }) => {
  const employeeId = Number(empleado_id);
  const salary = Number(salario);
  const normalizedState = estado || 'Activo';

  if (!Number.isInteger(employeeId) || employeeId <= 0 || !tipo_contrato || !fecha_inicio) {
    return { message: 'Se requieren un empleado válido, tipo de contrato y fecha de inicio.' };
  }
  if (!Number.isFinite(salary) || salary < 0) {
    return { message: 'El salario debe ser un número mayor o igual a cero.' };
  }
  if (!['Activo', 'Inactivo'].includes(normalizedState)) {
    return { message: 'El estado del contrato no es válido.' };
  }
  if (fecha_fin && new Date(`${fecha_fin}T00:00:00`) < new Date(`${fecha_inicio}T00:00:00`)) {
    return { message: 'La fecha de finalización no puede ser anterior a la fecha de inicio.' };
  }

  return { employeeId, salary, state: normalizedState };
};

const crearContrato = async (req, res) => {
  const { empleado_id, tipo_contrato, cargo, fecha_inicio, fecha_fin, salario, estado } = req.body;

  const validation = validarContrato(req.body);
  if (validation.message) {
    return res.status(400).json({ message: validation.message });
  }
  const { employeeId, salary, state } = validation;

  try {
    const esActivo = state === 'Activo';

    if (esActivo) {
      // Buscar contratos activos existentes para este empleado
      const existingRes = await db.query(
        `SELECT id, fecha_inicio, fecha_fin FROM contratos
         WHERE empleado_id = $1 AND estado = 'Activo'
         LIMIT 1`,
        [employeeId]
      );

      if (existingRes.rows.length > 0) {
        const activeContract = existingRes.rows[0];

        if (!activeContract.fecha_fin) {
          return res.status(400).json({
            message: 'El empleado ya tiene un contrato activo indefinido. Debe finalizarse o desactivarse antes de asignar uno nuevo.'
          });
        }

        const finContratoActual = new Date(activeContract.fecha_fin);
        const inicioNuevoContrato = new Date(fecha_inicio);

        if (inicioNuevoContrato <= finContratoActual) {
          const finFormateado = finContratoActual.toLocaleDateString('es-CO');
          return res.status(400).json({
            message: `El empleado tiene un contrato activo que finaliza el ${finFormateado}. El nuevo contrato debe iniciar después de esta fecha.`
          });
        }
      }
    }

    const queryText = `
      INSERT INTO contratos (empleado_id, tipo_contrato, cargo, fecha_inicio, fecha_fin, salario, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      employeeId,
      tipo_contrato,
      cargo || null,
      fecha_inicio,
      fecha_fin || null,
      salary,
      state
    ];

    const result = await db.query(queryText, values);
    const nuevoContrato = result.rows[0];

    return res.status(201).json({
      message: 'Contrato creado exitosamente',
      contrato: nuevoContrato
    });

  } catch (error) {
    console.error('Error en contratoController.crearContrato:', error);

    if (error.code === '23503') {
      return res.status(400).json({ message: 'El empleado_id especificado no existe' });
    }

    return res.status(500).json({ message: 'Error interno del servidor al crear contrato' });
  }
};

const obtenerContratos = async (req, res) => {
  const { empleado_id, limit = 50, page = 1 } = req.query;
  const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const offset = (parsedPage - 1) * parsedLimit;

  try {
    let result;
    const queryText = `
      SELECT c.*, e.nombres, e.apellidos, e.foto_perfil
      FROM contratos c
      JOIN empleados e ON c.empleado_id = e.id
    `;

    if (empleado_id) {
      result = await db.query(`${queryText} WHERE c.empleado_id = $1 ORDER BY c.id DESC LIMIT $2 OFFSET $3`, [empleado_id, parsedLimit, offset]);
    } else {
      result = await db.query(`${queryText} ORDER BY c.id DESC LIMIT $1 OFFSET $2`, [parsedLimit, offset]);
    }

    return res.status(200).json({
      message: 'Contratos obtenidos exitosamente',
      contratos: result.rows,
      pagination: { limit: parsedLimit, page: parsedPage }
    });

  } catch (error) {
    console.error('Error en contratoController.obtenerContratos:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener contratos' });
  }
};

const actualizarContrato = async (req, res) => {
  const { id } = req.params;
  const { empleado_id, tipo_contrato, cargo, fecha_inicio, fecha_fin, salario, estado } = req.body;

  const validation = validarContrato(req.body);
  if (validation.message) {
    return res.status(400).json({ message: validation.message });
  }
  const { employeeId, salary, state } = validation;

  try {
    const esActivo = state === 'Activo';

    if (esActivo) {
      // Buscar otros contratos activos para el mismo empleado
      const existingRes = await db.query(
        `SELECT id, fecha_inicio, fecha_fin FROM contratos
         WHERE empleado_id = $1 AND estado = 'Activo' AND id != $2
         LIMIT 1`,
        [employeeId, id]
      );

      if (existingRes.rows.length > 0) {
        const activeContract = existingRes.rows[0];
        if (!activeContract.fecha_fin) {
          return res.status(400).json({
            message: 'El empleado ya tiene otro contrato activo indefinido. Debe finalizarse o desactivarse primero.'
          });
        }

        const finContratoActual = new Date(activeContract.fecha_fin);
        const inicioNuevoContrato = new Date(fecha_inicio);

        if (inicioNuevoContrato <= finContratoActual) {
          const finFormateado = finContratoActual.toLocaleDateString('es-CO');
          return res.status(400).json({
            message: `El empleado tiene otro contrato activo que finaliza el ${finFormateado}. Este contrato debe iniciar después de esa fecha.`
          });
        }
      }
    }

    const queryText = `
      UPDATE contratos
      SET empleado_id = $1, tipo_contrato = $2, cargo = $3, fecha_inicio = $4, fecha_fin = $5, salario = $6, estado = $7
      WHERE id = $8
      RETURNING *
    `;
    const values = [
      employeeId,
      tipo_contrato,
      cargo || null,
      fecha_inicio,
      fecha_fin || null,
      salary,
      state,
      id
    ];

    const result = await db.query(queryText, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    return res.status(200).json({
      message: 'Contrato actualizado exitosamente',
      contrato: result.rows[0]
    });

  } catch (error) {
    console.error('Error en contratoController.actualizarContrato:', error);
    return res.status(500).json({ message: 'Error interno del servidor al actualizar contrato' });
  }
};

module.exports = {
  crearContrato,
  obtenerContratos,
  actualizarContrato
};
