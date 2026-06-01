const db = require('../config/db');

const obtenerPerfil = async (req, res) => {
  // El usuario_id viene decodificado en el token dentro de req.user.id
  const usuarioId = req.user.id;

  try {
    const result = await db.query('SELECT * FROM empleados WHERE usuario_id = $1', [usuarioId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Perfil de empleado no encontrado' });
    }

    return res.status(200).json({
      message: 'Perfil obtenido exitosamente',
      perfil: result.rows[0]
    });

  } catch (error) {
    console.error('Error en empleadoController.obtenerPerfil:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const crearEmpleado = async (req, res) => {
  const { usuario_id, documento_identidad, nombres, apellidos, telefono, fecha_ingreso } = req.body;

  if (!usuario_id || !documento_identidad || !nombres || !apellidos) {
    return res.status(400).json({ 
      message: 'Se requieren los campos usuario_id, documento_identidad, nombres y apellidos' 
    });
  }

  // fecha_ingreso por defecto hoy si no se envía
  const fechaIngresoFinal = fecha_ingreso || new Date();

  try {
    const queryText = `
      INSERT INTO empleados (usuario_id, documento_identidad, nombres, apellidos, telefono, fecha_ingreso)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [usuario_id, documento_identidad, nombres, apellidos, telefono || null, fechaIngresoFinal];

    const result = await db.query(queryText, values);
    const nuevoEmpleado = result.rows[0];

    return res.status(201).json({
      message: 'Empleado creado exitosamente',
      empleado: nuevoEmpleado
    });

  } catch (error) {
    console.error('Error en empleadoController.crearEmpleado:', error);
    
    // Capturar error de clave duplicada o de referencia
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El usuario_id o documento_identidad ya está registrado' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ message: 'El usuario_id especificado no existe' });
    }

    return res.status(500).json({ message: 'Error interno del servidor al crear empleado' });
  }
};

module.exports = {
  obtenerPerfil,
  crearEmpleado
};
