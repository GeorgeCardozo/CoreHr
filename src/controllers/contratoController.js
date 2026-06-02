const db = require('../config/db');

const crearContrato = async (req, res) => {
  const { empleado_id, tipo_contrato, cargo, fecha_inicio, fecha_fin, salario, estado } = req.body;

  if (!empleado_id || !tipo_contrato || !fecha_inicio || salario === undefined) {
    return res.status(400).json({
      message: 'Se requieren los campos empleado_id, tipo_contrato, fecha_inicio y salario'
    });
  }

  try {
    const esActivo = (estado || 'Activo') === 'Activo';

    if (esActivo) {
      // Buscar contratos activos existentes para este empleado
      const existingRes = await db.query(
        `SELECT id, fecha_inicio, fecha_fin FROM contratos 
         WHERE empleado_id = $1 AND estado = 'Activo'
         LIMIT 1`,
        [empleado_id]
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
      empleado_id, 
      tipo_contrato, 
      cargo || null,
      fecha_inicio, 
      fecha_fin || null, 
      salario, 
      estado || 'Activo'
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
  const { empleado_id } = req.query;

  try {
    let result;
    const queryText = `
      SELECT c.*, e.nombres, e.apellidos 
      FROM contratos c 
      JOIN empleados e ON c.empleado_id = e.id
    `;
    
    if (empleado_id) {
      result = await db.query(`${queryText} WHERE c.empleado_id = $1 ORDER BY c.id DESC`, [empleado_id]);
    } else {
      result = await db.query(`${queryText} ORDER BY c.id DESC`);
    }

    return res.status(200).json({
      message: 'Contratos obtenidos exitosamente',
      contratos: result.rows
    });

  } catch (error) {
    console.error('Error en contratoController.obtenerContratos:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener contratos' });
  }
};

const actualizarContrato = async (req, res) => {
  const { id } = req.params;
  const { empleado_id, tipo_contrato, cargo, fecha_inicio, fecha_fin, salario, estado } = req.body;

  if (!empleado_id || !tipo_contrato || !fecha_inicio || salario === undefined) {
    return res.status(400).json({
      message: 'Se requieren los campos empleado_id, tipo_contrato, fecha_inicio y salario'
    });
  }

  try {
    const esActivo = (estado || 'Activo') === 'Activo';

    if (esActivo) {
      // Buscar otros contratos activos para el mismo empleado
      const existingRes = await db.query(
        `SELECT id, fecha_inicio, fecha_fin FROM contratos 
         WHERE empleado_id = $1 AND estado = 'Activo' AND id != $2
         LIMIT 1`,
        [empleado_id, id]
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
      empleado_id,
      tipo_contrato,
      cargo || null,
      fecha_inicio,
      fecha_fin || null,
      salario,
      estado || 'Activo',
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
