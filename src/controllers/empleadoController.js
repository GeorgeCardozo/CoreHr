const db = require('../config/db');
const bcrypt = require('bcrypt');
const PDFDocument = require('pdfkit');

const obtenerPerfil = async (req, res) => {
  // El usuario_id viene decodificado en el token dentro de req.user.id
  const usuarioId = req.user.id;

  try {
    const result = await db.query(
      `SELECT 
        e.*, 
        u.correo, 
        u.rol_id,
        c.cargo,
        c.tipo_contrato,
        c.salario,
        c.fecha_inicio AS contrato_fecha_inicio,
        c.fecha_fin AS contrato_fecha_fin,
        c.estado AS contrato_estado
       FROM empleados e 
       JOIN usuarios u ON e.usuario_id = u.id 
       LEFT JOIN contratos c ON e.id = c.empleado_id AND c.estado = 'Activo'
       WHERE e.usuario_id = $1`, 
      [usuarioId]
    );

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
    fecha_ingreso,
    habilidades,
    fecha_info_personal,
    fecha_soportes,
    fecha_seguridad
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
    const finalHabilidades = Array.isArray(habilidades) ? habilidades : null;
    const employeeInsertQuery = `
      INSERT INTO empleados (
        usuario_id, documento_identidad, nombres, apellidos, telefono, fecha_ingreso,
        habilidades, fecha_info_personal, fecha_soportes, fecha_seguridad
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const employeeResult = await client.query(employeeInsertQuery, [
      newUserId,
      documento_identidad,
      nombres,
      apellidos,
      telefono || null,
      fechaIngresoFinal,
      finalHabilidades,
      fecha_info_personal || null,
      fecha_soportes || null,
      fecha_seguridad || null
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
  const { 
    documento_identidad, 
    nombres, 
    apellidos, 
    telefono, 
    fecha_ingreso,
    habilidades,
    fecha_info_personal,
    fecha_soportes,
    fecha_seguridad 
  } = req.body;

  if (!documento_identidad || !nombres || !apellidos) {
    return res.status(400).json({ message: 'Se requieren documento_identidad, nombres y apellidos' });
  }

  try {
    const finalHabilidades = Array.isArray(habilidades) ? habilidades : null;
    const queryText = `
      UPDATE empleados
      SET documento_identidad = $1, 
          nombres = $2, 
          apellidos = $3, 
          telefono = $4, 
          fecha_ingreso = $5,
          habilidades = $6,
          fecha_info_personal = $7,
          fecha_soportes = $8,
          fecha_seguridad = $9
      WHERE id = $10
      RETURNING *
    `;
    const result = await db.query(queryText, [
      documento_identidad,
      nombres,
      apellidos,
      telefono || null,
      fecha_ingreso || new Date(),
      finalHabilidades,
      fecha_info_personal || null,
      fecha_soportes || null,
      fecha_seguridad || null,
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

const generarCertificado = async (req, res) => {
  const usuarioId = req.user.id;

  try {
    // 1. Obtener la información del empleado y su contrato activo
    const queryText = `
      SELECT 
        e.nombres, 
        e.apellidos, 
        e.documento_identidad, 
        e.telefono,
        e.fecha_ingreso,
        c.cargo, 
        c.tipo_contrato, 
        c.salario
      FROM empleados e
      LEFT JOIN contratos c ON e.id = c.empleado_id AND c.estado = 'Activo'
      WHERE e.usuario_id = $1
    `;
    const result = await db.query(queryText, [usuarioId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Perfil de empleado no encontrado' });
    }

    const emp = result.rows[0];

    if (!emp.cargo) {
      return res.status(404).json({ 
        message: 'No se encontró un contrato activo asignado para generar el certificado laboral.' 
      });
    }

    // 2. Inicializar PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Configurar cabeceras de respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=certificado_laboral.pdf');

    // Transmitir PDF a la respuesta
    doc.pipe(res);

    // 3. Diseñar el PDF
    // Membrete / Encabezado
    doc
      .fillColor('#065f46') // Emerald 800
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('GIMNASIO LOS ARRAYANES BILINGÜE', { align: 'center' });

    doc
      .fillColor('#475569') // Slate 600
      .fontSize(10)
      .font('Helvetica')
      .text('Educación de Excelencia y Valores para el Futuro', { align: 'center' })
      .text('Bogotá D.C., Colombia | Tel: (601) 745-9000', { align: 'center' });

    doc.moveDown(2);

    // Separador
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();

    doc.moveDown(3);

    // Título del documento
    doc
      .fillColor('#0f172a') // Slate 900
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('CERTIFICACIÓN LABORAL', { align: 'center' });

    doc.moveDown(2);

    // Fecha actual para el documento
    const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
    const fechaActualStr = new Date().toLocaleDateString('es-CO', opcionesFecha);

    // Cuerpo del certificado
    const salarioFormateado = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(emp.salario);

    const fechaIngresoFormateada = new Date(emp.fecha_ingreso).toLocaleDateString('es-CO', opcionesFecha);

    const cuerpoTexto = `El Gimnasio Los Arrayanes Bilingüe certifica que ${emp.nombres} ${emp.apellidos}, identificado(a) con documento ${emp.documento_identidad}, labora en nuestra institución con un contrato ${emp.tipo_contrato} ocupando el cargo de ${emp.cargo}.\n\n` +
      `Su fecha de ingreso a la institución fue el ${fechaIngresoFormateada} y actualmente devenga un salario básico mensual de ${salarioFormateado}.\n\n` +
      `Se expide la presente certificación a solicitud del interesado, en la ciudad de Bogotá D.C., el día ${fechaActualStr}.`;

    doc
      .fillColor('#334155') // Slate 700
      .fontSize(12)
      .font('Helvetica')
      .text(cuerpoTexto, {
        align: 'justify',
        lineGap: 6,
        paragraphGap: 10
      });

    doc.moveDown(4);

    // Firma
    doc
      .fillColor('#0f172a')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('DEPARTAMENTO DE RECURSOS HUMANOS', { align: 'left' });

    doc
      .fillColor('#475569')
      .fontSize(10)
      .font('Helvetica')
      .text('Gimnasio Los Arrayanes Bilingüe', { align: 'left' })
      .text('Email: rrhh@arrayanes.edu.co', { align: 'left' });

    // Finalizar el documento
    doc.end();

  } catch (error) {
    console.error('Error en empleadoController.generarCertificado:', error);
    return res.status(500).json({ message: 'Error interno del servidor al generar el certificado en PDF' });
  }
};

module.exports = {
  obtenerPerfil,
  crearEmpleado,
  listarEmpleados,
  actualizarEmpleado,
  eliminarEmpleado,
  generarCertificado
};
