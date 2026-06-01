const db = require('../config/db');

const crearContrato = async (req, res) => {
  const { empleado_id, tipo_contrato, fecha_inicio, fecha_fin, salario, estado } = req.body;

  if (!empleado_id || !tipo_contrato || !fecha_inicio || salario === undefined) {
    return res.status(400).json({
      message: 'Se requieren los campos empleado_id, tipo_contrato, fecha_inicio y salario'
    });
  }

  try {
    const queryText = `
      INSERT INTO contratos (empleado_id, tipo_contrato, fecha_inicio, fecha_fin, salario, estado)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      empleado_id, 
      tipo_contrato, 
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
    
    // Error de clave foránea (empleado_id no existe)
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
    if (empleado_id) {
      result = await db.query('SELECT * FROM contratos WHERE empleado_id = $1', [empleado_id]);
    } else {
      result = await db.query('SELECT * FROM contratos');
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

module.exports = {
  crearContrato,
  obtenerContratos
};
