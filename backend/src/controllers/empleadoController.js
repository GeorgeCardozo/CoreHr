const db = require('../config/db');
const bcrypt = require('bcrypt');
const PDFDocument = require('pdfkit');

const obtenerPerfil = async (req, res) => {
  const requesterUserId = req.user.id;
  const requesterRolId = req.user.rol_id;
  const targetEmployeeId = req.params.id;

  try {
    if (targetEmployeeId && !/^\d+$/.test(String(targetEmployeeId))) {
      return res.status(400).json({ message: 'El identificador del empleado no es válido.' });
    }

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
        // Si el usuario no tiene ficha, creamos una básica para que pueda acceder al sistema
        const userRes = await db.query('SELECT correo FROM usuarios WHERE id = $1', [requesterUserId]);
        if (userRes.rows.length > 0) {
          const correoUsuario = userRes.rows[0].correo;
          const nombresTemp = correoUsuario.split('@')[0];

          await db.query(
            `INSERT INTO empleados (usuario_id, nombres, apellidos, documento_identidad, fecha_ingreso)
             VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
            [requesterUserId, nombresTemp, 'Colaborador', 'REG-' + requesterUserId]
          );

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

    // Ocultar y enmascarar datos sensibles si el consultante no es administrador ni el propio dueño del perfil.
    // Los datos de contacto de emergencia permanecen visibles por razones de seguridad/emergencia laboral.
    if (requesterRolId !== 1 && Number(perfil.usuario_id) !== Number(requesterUserId)) {
      perfil.salario = '••••••••';
      perfil.documento_identidad = '••••••••';
      perfil.telefono = '••••••••';
      perfil.correo_personal = '••••••••';
      perfil.fecha_nacimiento = '••••••••';
    }

    // Consultar el número de descargas de certificado en el mes actual
    const descargasRes = await db.query(
      `SELECT COUNT(*) AS total
       FROM descargas_certificados
       WHERE empleado_id = $1
         AND EXTRACT(MONTH FROM fecha_descarga) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR FROM fecha_descarga) = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [perfil.id]
    );
    const descargasMesActual = parseInt(descargasRes.rows[0].total || '0', 10);
    perfil.descargas_mes_actual = descargasMesActual;
    perfil.max_descargas_mes = 2;

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
    telefono_emergencia,
    direccion
  } = req.body;

  if (!correo || !contrasena || !documento_identidad || !nombres || !apellidos) {
    return res.status(400).json({
      message: 'Se requieren los campos correo, contrasena, documento_identidad, nombres y apellidos'
    });
  }

  const finalRolId = Number(rol_id ?? 2);
  if (![1, 2].includes(finalRolId)) {
    return res.status(400).json({ message: 'El rol del colaborador no es válido.' });
  }
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
        fecha_terminacion, tipo_genero, fecha_nacimiento, correo_personal, contacto_emergencia, parentesco, telefono_emergencia, direccion
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
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
      telefono_emergencia || null,
      direccion || null
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
             c.cargo,
             (c.id IS NOT NULL) AS tiene_contrato
      FROM empleados e
      LEFT JOIN usuarios u ON e.usuario_id = u.id
      LEFT JOIN LATERAL (
        SELECT id, cargo FROM contratos
        WHERE empleado_id = e.id AND estado = 'Activo'
        ORDER BY id DESC LIMIT 1
      ) c ON TRUE
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

  const esAdmin = req.user.rol_id === 1;
  if (esAdmin && (!documento_identidad || !nombres || !apellidos)) {
    return res.status(400).json({ message: 'Se requieren documento_identidad, nombres y apellidos' });
  }

  const pool = db.pool;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Obtener el usuario_id asociado a la ficha de empleado
    const empRes = await client.query('SELECT * FROM empleados WHERE id = $1', [id]);
    if (empRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    const empleadoActual = empRes.rows[0];
    const usuarioId = empleadoActual.usuario_id;

    // Un colaborador puede actualizar datos de contacto, pero no su identificación,
    // fechas administrativas, dependencia ni la cuenta institucional.
    const datos = esAdmin
      ? {
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
          direccion,
        }
      : {
          documento_identidad: empleadoActual.documento_identidad,
          nombres: empleadoActual.nombres,
          apellidos: empleadoActual.apellidos,
          telefono: telefono ?? empleadoActual.telefono,
          fecha_ingreso: empleadoActual.fecha_ingreso,
          habilidades: habilidades ?? empleadoActual.habilidades,
          fecha_info_personal: empleadoActual.fecha_info_personal,
          fecha_soportes: empleadoActual.fecha_soportes,
          fecha_seguridad: empleadoActual.fecha_seguridad,
          superior_inmediato: empleadoActual.superior_inmediato,
          departamento: empleadoActual.departamento,
          fecha_terminacion: empleadoActual.fecha_terminacion,
          tipo_genero: tipo_genero ?? empleadoActual.tipo_genero,
          fecha_nacimiento: fecha_nacimiento ?? empleadoActual.fecha_nacimiento,
          correo_personal: correo_personal ?? empleadoActual.correo_personal,
          contacto_emergencia: contacto_emergencia ?? empleadoActual.contacto_emergencia,
          parentesco: parentesco ?? empleadoActual.parentesco,
          telefono_emergencia: telefono_emergencia ?? empleadoActual.telefono_emergencia,
          direccion: direccion ?? empleadoActual.direccion,
        };

    // 2. Actualizar el correo en la tabla usuarios si se proporciona
    if (esAdmin && correo) {
      await client.query(
        'UPDATE usuarios SET correo = $1 WHERE id = $2',
        [correo, usuarioId]
      );
    }

    // 3. Actualizar la ficha de empleado
    const finalHabilidades = Array.isArray(datos.habilidades) ? datos.habilidades : null;
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
      datos.documento_identidad,
      datos.nombres,
      datos.apellidos,
      datos.telefono || null,
      datos.fecha_ingreso || new Date(),
      finalHabilidades,
      datos.fecha_info_personal || null,
      datos.fecha_soportes || null,
      datos.fecha_seguridad || null,
      datos.superior_inmediato || null,
      datos.departamento || null,
      datos.fecha_terminacion || null,
      datos.tipo_genero || null,
      datos.fecha_nacimiento || null,
      datos.correo_personal || null,
      datos.contacto_emergencia || null,
      datos.parentesco || null,
      datos.telefono_emergencia || null,
      datos.direccion || null,
      id
    ]);

    await client.query('COMMIT');

    const empleadoModificado = {
      ...result.rows[0],
      correo: esAdmin ? correo : undefined
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
  const requesterRolId = req.user.rol_id;
  const { empleado_id } = req.query;

  try {
    let queryText = '';
    let values = [];

    if (empleado_id) {
      if (requesterRolId !== 1) {
        const checkEmp = await db.query('SELECT usuario_id FROM empleados WHERE id = $1', [empleado_id]);
        if (checkEmp.rows.length === 0 || checkEmp.rows[0].usuario_id !== usuarioId) {
          return res.status(403).json({ message: 'No tienes autorización para descargar este certificado' });
        }
      }
      queryText = `
        SELECT
          e.id AS empleado_id,
          e.nombres,
          e.apellidos,
          e.documento_identidad,
          e.telefono,
          e.fecha_ingreso,
          COALESCE(c.cargo, 'Colaborador Institucional') AS cargo,
          COALESCE(c.tipo_contrato, 'Término Indefinido') AS tipo_contrato,
          COALESCE(c.salario, 0) AS salario
        FROM empleados e
        LEFT JOIN LATERAL (
          SELECT cargo, tipo_contrato, salario
          FROM contratos
          WHERE empleado_id = e.id AND estado = 'Activo'
          ORDER BY id DESC
          LIMIT 1
        ) c ON TRUE
        WHERE e.id = $1
      `;
      values = [empleado_id];
    } else {
      queryText = `
        SELECT
          e.id AS empleado_id,
          e.nombres,
          e.apellidos,
          e.documento_identidad,
          e.telefono,
          e.fecha_ingreso,
          COALESCE(c.cargo, 'Colaborador Institucional') AS cargo,
          COALESCE(c.tipo_contrato, 'Término Indefinido') AS tipo_contrato,
          COALESCE(c.salario, 0) AS salario
        FROM empleados e
        LEFT JOIN LATERAL (
          SELECT cargo, tipo_contrato, salario
          FROM contratos
          WHERE empleado_id = e.id AND estado = 'Activo'
          ORDER BY id DESC
          LIMIT 1
        ) c ON TRUE
        WHERE e.usuario_id = $1
      `;
      values = [usuarioId];
    }

    const result = await db.query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Perfil de empleado no encontrado' });
    }

    const emp = result.rows[0];

    // Verificar conteo de descargas en el mes actual
    const descargasRes = await db.query(
      `SELECT COUNT(*) AS total
       FROM descargas_certificados
       WHERE empleado_id = $1
         AND EXTRACT(MONTH FROM fecha_descarga) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR FROM fecha_descarga) = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [emp.empleado_id]
    );

    const descargasMes = parseInt(descargasRes.rows[0].total || '0', 10);

    // Límite de 2 descargas por mes para colaboradores (rol_id !== 1)
    if (requesterRolId !== 1 && descargasMes >= 2) {
      return res.status(429).json({
        message: 'Has alcanzado el límite máximo de 2 descargas de certificación laboral para este mes. Podrás volver a descargar el próximo mes.'
      });
    }

    // Inicializar PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Configurar cabeceras de respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=certificado_laboral.pdf');

    // Registrar descarga SOLO cuando el PDF se entregue exitosamente
    doc.on('end', async () => {
      try {
        await db.query(
          'INSERT INTO descargas_certificados (empleado_id) VALUES ($1)',
          [emp.empleado_id]
        );
      } catch (dbErr) {
        console.error('Error al registrar descarga de certificado:', dbErr);
      }
    });

    // Transmitir PDF a la respuesta
    doc.pipe(res);

    // Diseñar el PDF
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
    const salarioFormateado = emp.salario && parseFloat(emp.salario) > 0
      ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(emp.salario)
      : 'Según asignación escalar contractual';

    const fechaIngresoFormateada = emp.fecha_ingreso
      ? new Date(emp.fecha_ingreso).toLocaleDateString('es-CO', opcionesFecha)
      : 'la fecha de vinculación registrada';

    const cuerpoTexto = `El Gimnasio Los Arrayanes Bilingüe certifica que ${emp.nombres} ${emp.apellidos}, identificado(a) con documento ${emp.documento_identidad}, labora en nuestra institución con un contrato de tipo ${emp.tipo_contrato} desempeñándose en el cargo de ${emp.cargo}.\n\n` +
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
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Error interno del servidor al generar el certificado en PDF' });
    }
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
  const requesterUserId = req.user.id;
  const requesterRolId = req.user.rol_id;
  const targetEmpleadoId = req.body?.empleado_id || req.query?.empleado_id;

  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo o el formato no es válido.' });
  }

  try {
    const fotoRuta = `/uploads/perfiles/${req.file.filename}`;
    let queryText;
    let values;

    if (requesterRolId === 1 && targetEmpleadoId) {
      queryText = `
        UPDATE empleados
        SET foto_perfil = $1
        WHERE id = $2
        RETURNING id, nombres, apellidos, foto_perfil
      `;
      values = [fotoRuta, targetEmpleadoId];
    } else {
      queryText = `
        UPDATE empleados
        SET foto_perfil = $1
        WHERE usuario_id = $2
        RETURNING id, nombres, apellidos, foto_perfil
      `;
      values = [fotoRuta, requesterUserId];
    }

    const result = await db.query(queryText, values);

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
  if (empleados.length > 500) {
    return res.status(400).json({ message: 'La carga masiva no puede superar 500 colaboradores por operación.' });
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
    return res.status(500).json({ message: 'Error de servidor durante la carga masiva.' });
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
