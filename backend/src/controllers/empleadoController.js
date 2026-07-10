const db = require('../config/db');
const bcrypt = require('bcrypt');
const PDFDocument = require('pdfkit');

const obtenerPerfil = async (req, res) => {
  const requesterUserId = req.user.id;
  const requesterRolId = req.user.rol_id;
  const targetEmployeeId = req.params.id;

  try {
    let result;
    if (targetEmployeeId) {
      result = await db.query(
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
         WHERE e.id = $1`, 
        [targetEmployeeId]
      );
    } else {
      result = await db.query(
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
        [requesterUserId]
      );
    }

    if (result.rows.length === 0) {
      if (!targetEmployeeId) {
        // Obtenemos información del usuario de la tabla usuarios
        const userRes = await db.query('SELECT correo FROM usuarios WHERE id = $1', [requesterUserId]);
        if (userRes.rows.length > 0) {
          const correoUsuario = userRes.rows[0].correo;
          const nombresTemp = correoUsuario.split('@')[0];
          
          // Insertamos un registro de empleado básico vacío
          await db.query(
            `INSERT INTO empleados (usuario_id, nombres, apellidos, documento_identidad, fecha_ingreso)
             VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
            [
              requesterUserId,
              nombresTemp,
              'Colaborador',
              'REG-' + requesterUserId
            ]
          );

          // Volvemos a consultar
          result = await db.query(
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
            [requesterUserId]
          );
        }
      }
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Perfil de empleado no encontrado' });
      }
    }

    let perfil = result.rows[0];

    // Lógica de seguridad / censura:
    // Si el solicitante es Empleado (rol_id === 2) y está consultando el perfil de otra persona
    if (requesterRolId === 2 && perfil.usuario_id !== requesterUserId) {
      perfil = {
        ...perfil,
        documento_identidad: '*********',
        telefono: '*********',
        tipo_contrato: '*********',
        salario: null,
        contrato_fecha_inicio: null,
        contrato_fecha_fin: null,
        contrato_estado: null,
        fecha_nacimiento: null,
        tipo_genero: '*********',
        correo_personal: '*********',
        contacto_emergencia: '*********',
        parentesco: '*********',
        telefono_emergencia: '*********',
        fecha_terminacion: null
      };
    }

    return res.status(200).json({
      message: 'Perfil obtenido exitosamente',
      perfil
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
    fecha_seguridad,
    superior_inmediato,
    departamento,
    fecha_terminacion,
    tipo_genero,
    fecha_nacimiento,
    correo_personal,
    contacto_emergencia,
    parentesco,
    telefono_emergencia
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
        habilidades, fecha_info_personal, fecha_soportes, fecha_seguridad, superior_inmediato, departamento,
        fecha_terminacion, tipo_genero, fecha_nacimiento, correo_personal, contacto_emergencia, parentesco, telefono_emergencia
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
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
      fecha_seguridad || null,
      superior_inmediato || null,
      departamento || null,
      fecha_terminacion || null,
      tipo_genero || null,
      fecha_nacimiento || null,
      correo_personal || null,
      contacto_emergencia || null,
      parentesco || null,
      telefono_emergencia || null
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
    const result = await db.query(`
      SELECT e.*, u.correo,
             (SELECT cargo FROM contratos c WHERE c.empleado_id = e.id AND c.estado = 'Activo' ORDER BY c.id DESC LIMIT 1) AS cargo,
             (SELECT COUNT(*) FROM contratos c WHERE c.empleado_id = e.id AND c.estado = 'Activo') > 0 AS tiene_contrato
      FROM empleados e 
      LEFT JOIN usuarios u ON e.usuario_id = u.id 
      ORDER BY e.id ASC
    `);
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
    correo,
    documento_identidad, 
    nombres, 
    apellidos, 
    telefono, 
    fecha_ingreso,
    habilidades,
    fecha_info_personal,
    fecha_soportes,
    fecha_seguridad,
    superior_inmediato,
    departamento,
    fecha_terminacion,
    tipo_genero,
    fecha_nacimiento,
    correo_personal,
    contacto_emergencia,
    parentesco,
    telefono_emergencia,
    direccion
  } = req.body;

  if (!documento_identidad || !nombres || !apellidos) {
    return res.status(400).json({ message: 'Se requieren documento_identidad, nombres y apellidos' });
  }

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

    // 2. Actualizar el correo en la tabla usuarios si se proporciona
    if (correo) {
      await client.query(
        'UPDATE usuarios SET correo = $1 WHERE id = $2',
        [correo, usuarioId]
      );
    }

    // 3. Actualizar la ficha de empleado
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
          fecha_seguridad = $9,
          superior_inmediato = $10,
          departamento = $11,
          fecha_terminacion = $12,
          tipo_genero = $13,
          fecha_nacimiento = $14,
          correo_personal = $15,
          contacto_emergencia = $16,
          parentesco = $17,
          telefono_emergencia = $18,
          direccion = $19
      WHERE id = $20
      RETURNING *
    `;
    const result = await client.query(queryText, [
      documento_identidad,
      nombres,
      apellidos,
      telefono || null,
      fecha_ingreso || new Date(),
      finalHabilidades,
      fecha_info_personal || null,
      fecha_soportes || null,
      fecha_seguridad || null,
      superior_inmediato || null,
      departamento || null,
      fecha_terminacion || null,
      tipo_genero || null,
      fecha_nacimiento || null,
      correo_personal || null,
      contacto_emergencia || null,
      parentesco || null,
      telefono_emergencia || null,
      direccion || null,
      id
    ]);

    await client.query('COMMIT');

    const empleadoModificado = {
      ...result.rows[0],
      correo
    };

    return res.status(200).json({
      message: 'Empleado actualizado exitosamente',
      empleado: empleadoModificado
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en empleadoController.actualizarEmpleado:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El documento de identidad o correo electrónico ya se encuentra registrado por otro colaborador' });
    }
    return res.status(500).json({ message: 'Error interno del servidor al actualizar empleado' });
  } finally {
    client.release();
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

const obtenerDirectorio = async (req, res) => {
  try {
    const queryText = `
      SELECT id, nombres, apellidos, foto_perfil,
             (SELECT cargo FROM contratos WHERE empleado_id = empleados.id AND estado = 'Activo' AND cargo IS NOT NULL ORDER BY id DESC LIMIT 1) AS cargo, 
             departamento 
      FROM empleados
      ORDER BY id ASC
    `;
    const result = await db.query(queryText);
    return res.status(200).json({
      message: 'Directorio obtenido exitosamente',
      empleados: result.rows
    });
  } catch (error) {
    console.error('Error en empleadoController.obtenerDirectorio:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener el directorio' });
  }
};

const subirFotoPerfil = async (req, res) => {
  const usuarioId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo o el formato no es válido.' });
  }

  try {
    const fotoRuta = `/uploads/perfiles/${req.file.filename}`;

    const queryText = `
      UPDATE empleados 
      SET foto_perfil = $1 
      WHERE usuario_id = $2 
      RETURNING id, nombres, apellidos, foto_perfil
    `;
    const result = await db.query(queryText, [fotoRuta, usuarioId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    return res.status(200).json({
      message: 'Foto de perfil actualizada exitosamente',
      foto_perfil: fotoRuta,
      empleado: result.rows[0]
    });
  } catch (error) {
    console.error('Error en empleadoController.subirFotoPerfil:', error);
    return res.status(500).json({ message: 'Error interno del servidor al subir foto de perfil' });
  }
};

const crearEmpleadosMasivo = async (req, res) => {
  const { empleados } = req.body;

  if (!empleados || !Array.isArray(empleados) || empleados.length === 0) {
    return res.status(400).json({ 
      message: 'Se requiere una lista de colaboradores en el campo "empleados"' 
    });
  }

  const pool = db.pool;
  const client = await pool.connect();
  const resultados = { creados: [], errores: [] };

  try {
    await client.query('BEGIN');

    for (let i = 0; i < empleados.length; i++) {
      const emp = empleados[i];
      const { 
        correo, 
        contrasena, 
        documento_identidad, 
        nombres, 
        apellidos,
        telefono,
        fecha_ingreso,
        habilidades,
        departamento,
        tipo_genero,
        correo_personal
      } = emp;

      // Validaciones básicas
      if (!correo || !documento_identidad || !nombres || !apellidos) {
        resultados.errores.push({ 
          fila: i + 1, 
          correo: correo || 'N/A', 
          error: 'Faltan campos requeridos (correo, documento_identidad, nombres, apellidos)' 
        });
        continue;
      }

      // Contraseña por defecto es el documento de identidad si no se especifica
      const passFinal = contrasena || documento_identidad.toString();
      const hash = await bcrypt.hash(passFinal, 10);

      try {
        // Verificar si el correo ya existe
        const checkUser = await client.query('SELECT id FROM usuarios WHERE correo = $1', [correo]);
        if (checkUser.rows.length > 0) {
          resultados.errores.push({ fila: i + 1, correo, error: 'El correo institucional ya está registrado' });
          continue;
        }

        // Verificar si el documento ya existe
        const checkEmp = await client.query('SELECT id FROM empleados WHERE documento_identidad = $1', [documento_identidad]);
        if (checkEmp.rows.length > 0) {
          resultados.errores.push({ fila: i + 1, correo, error: `El documento de identidad ${documento_identidad} ya está registrado` });
          continue;
        }

        // Registrar usuario
        const userResult = await client.query(
          `INSERT INTO usuarios (correo, contrasena, rol_id) VALUES ($1, $2, 2) RETURNING id`,
          [correo, hash]
        );
        const newUserId = userResult.rows[0].id;

        // Registrar empleado
        const finalHabilidades = Array.isArray(habilidades) ? habilidades : (habilidades ? habilidades.split(',').map(h => h.trim()) : null);
        const employeeResult = await client.query(
          `INSERT INTO empleados (
            usuario_id, documento_identidad, nombres, apellidos, telefono, fecha_ingreso,
            habilidades, departamento, tipo_genero, correo_personal
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`,
          [
            newUserId,
            documento_identidad,
            nombres,
            apellidos,
            telefono || null,
            fecha_ingreso || new Date(),
            finalHabilidades,
            departamento || null,
            tipo_genero || null,
            correo_personal || null
          ]
        );

        resultados.creados.push(employeeResult.rows[0]);
      } catch (innerError) {
        console.error('Error al insertar fila', i, innerError);
        resultados.errores.push({ fila: i + 1, correo, error: innerError.message || 'Error de base de datos' });
      }
    }

    await client.query('COMMIT');
    return res.status(201).json({
      message: `Proceso masivo completado. Creados: ${resultados.creados.length}, Errores: ${resultados.errores.length}`,
      ...resultados
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error general en crearEmpleadosMasivo:', error);
    return res.status(500).json({ message: 'Error de servidor durante la carga masiva', error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  obtenerPerfil,
  crearEmpleado,
  listarEmpleados,
  actualizarEmpleado,
  eliminarEmpleado,
  generarCertificado,
  obtenerDirectorio,
  subirFotoPerfil,
  crearEmpleadosMasivo
};

