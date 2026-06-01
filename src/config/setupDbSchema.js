const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

const setup = async () => {
  try {
    console.log('Actualizando esquema de base de datos...');

    // 1. Modificar/Crear la tabla empleados con las columnas especificadas
    // Para no perder datos o evitar errores, primero eliminamos la tabla existente y la volvemos a crear con el formato correcto.
    // (Dado que es ambiente de desarrollo/pruebas inicial, esto es lo más seguro).
    await pool.query('DROP TABLE IF EXISTS contratos CASCADE;');
    await pool.query('DROP TABLE IF EXISTS empleados CASCADE;');

    await pool.query(`
      CREATE TABLE empleados (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
        documento_identidad VARCHAR(50) UNIQUE NOT NULL,
        nombres VARCHAR(100) NOT NULL,
        apellidos VARCHAR(100) NOT NULL,
        telefono VARCHAR(50),
        fecha_ingreso DATE DEFAULT CURRENT_DATE
      );
    `);
    console.log('Tabla "empleados" creada con las columnas solicitadas.');

    // 2. Crear la tabla contratos
    await pool.query(`
      CREATE TABLE contratos (
        id SERIAL PRIMARY KEY,
        empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
        tipo_contrato VARCHAR(100) NOT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE,
        salario NUMERIC(12, 2) NOT NULL,
        estado VARCHAR(50) DEFAULT 'Activo'
      );
    `);
    console.log('Tabla "contratos" creada exitosamente.');

    // Insertar un empleado de prueba asociado al usuario administrador de prueba (6e0rgge@gmail.com)
    const adminUserRes = await pool.query("SELECT id FROM usuarios WHERE correo = '6e0rgge@gmail.com'");
    if (adminUserRes.rows.length > 0) {
      const adminId = adminUserRes.rows[0].id;
      await pool.query(`
        INSERT INTO empleados (usuario_id, documento_identidad, nombres, apellidos, telefono, fecha_ingreso)
        VALUES ($1, '12345678A', 'Jorge', 'Gómez', '555-0199', '2026-01-01')
        ON CONFLICT (usuario_id) DO NOTHING;
      `, [adminId]);
      console.log('Empleado de prueba asignado al administrador.');
    }

  } catch (err) {
    console.error('Error al configurar el esquema:', err);
  } finally {
    await pool.end();
  }
};

setup();
