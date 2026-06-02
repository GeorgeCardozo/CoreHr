const db = require('../config/db');
const bcrypt = require('bcrypt');

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
  const { 
    correo, 
    contrasena, 
    rol_id, 
    documento_identidad, 
    nombres, 
    apellidos, 
    telefono, 
    fecha_ingreso 
  } = req.body;

  if (!correo || !contrasena || !documento_identidad || !nombres || !apellidos) {
    return res.status(400).json({ 
      message: 'Se requieren los campos correo, contrasena, documento_identidad, nombres y apellidos' 
    });
  }

  const finalRolId = rol_id !== undefined ? rol_id : 2; // Por defecto 2 para Empleado
  const fechaIngresoFinal = fecha_ingreso || new Date();
  
  const pool = db.pool;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Paso 1: Encriptar contraseña y registrar usuario
    const hash = await bcrypt.hash(contrasena, 10);
    const userInsertQuery = `
      INSERT INTO usuarios (correo, contrasena, rol_id)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const userResult = await client.query(userInsertQuery, [correo, hash, finalRolId]);
    const newUserId = userResult.rows[0].id;

    // Paso 2: Crear la ficha de empleado con el id del usuario generado
    const employeeInsertQuery = `
      INSERT INTO empleados (usuario_id, documento_identidad, nombres, apellidos, telefono, fecha_ingreso)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const employeeResult = await client.query(employeeInsertQuery, [
      newUserId,
      documento_identidad,
      nombres,
      apellidos,
      telefono || null,
      fechaIngresoFinal
    ]);

    const nuevoEmpleado = employeeResult.rows[0];

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Colaborador y cuenta de usuario creados exitosamente',
      empleado: nuevoEmpleado
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en transacción de crearEmpleado:', error);

    if (error.code === '23505') {
      return res.status(400).json({ 
        message: 'El correo electrónico o documento de identidad ya se encuentra registrado' 
      });
    }

    return res.status(500).json({ message: 'Error interno del servidor al crear colaborador' });
  } finally {
    client.release();
  }
};

const listarEmpleados = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM empleados ORDER BY id ASC');
    return res.status(200).json({
      message: 'Empleados obtenidos exitosamente',
      empleados: result.rows
    });
  } catch (error) {
    console.error('Error en empleadoController.listarEmpleados:', error);
    return res.status(500).json({ message: 'Error interno del servidor al listar empleados' });
  }
};

const actualizarEmpleado = async (req, res) => {
  const { id } = req.params;
  const { documento_identidad, nombres, apellidos, telefono, fecha_ingreso } = req.body;

  if (!documento_identidad || !nombres || !apellidos) {
    return res.status(400).json({ message: 'Se requieren documento_identidad, nombres y apellidos' });
  }

  try {
    const queryText = `
      UPDATE empleados
      SET documento_identidad = $1, nombres = $2, apellidos = $3, telefono = $4, fecha_ingreso = $5
      WHERE id = $6
      RETURNING *
    `;
    const result = await db.query(queryText, [
      documento_identidad,
      nombres,
      apellidos,
      telefono || null,
      fecha_ingreso || new Date(),
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    return res.status(200).json({
      message: 'Empleado actualizado exitosamente',
      empleado: result.rows[0]
    });
  } catch (error) {
    console.error('Error en empleadoController.actualizarEmpleado:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El documento de identidad ya se encuentra registrado por otro colaborador' });
    }
    return res.status(500).json({ message: 'Error interno del servidor al actualizar empleado' });
  }
};

const eliminarEmpleado = async (req, res) => {
  const { id } = req.params;
  const pool = db.pool;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Obtener el usuario_id asociado a la ficha de empleado
    const empRes = await client.query('SELECT usuario_id FROM empleados WHERE id = $1', [id]);
    if (empRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    const usuarioId = empRes.rows[0].usuario_id;

    // 2. Borrar primero el registro de la tabla empleados
    await client.query('DELETE FROM empleados WHERE id = $1', [id]);

    // 3. Borrar luego el registro de la tabla usuarios
    await client.query('DELETE FROM usuarios WHERE id = $1', [usuarioId]);

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Empleado y cuenta de acceso eliminados exitosamente'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en empleadoController.eliminarEmpleado:', error);
    return res.status(500).json({ message: 'Error interno del servidor al eliminar empleado' });
  } finally {
    client.release();
  }
};

module.exports = {
  obtenerPerfil,
  crearEmpleado,
  listarEmpleados,
  actualizarEmpleado,
  eliminarEmpleado
};
