const { Client } = require('pg');
require('dotenv').config();

const main = async () => {
  // 1. Conectar a la base de datos por defecto 'postgres' para crear la BD 'core_rrhh'
  const clientPostgres = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Base de datos por defecto en PostgreSQL
    password: process.env.DB_PASSWORD || 'admin',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  });

  try {
    await clientPostgres.connect();
    console.log('Conectado a la base de datos base "postgres"...');
    
    // Verificar si existe la base de datos core_rrhh
    const resDb = await clientPostgres.query("SELECT 1 FROM pg_database WHERE datname = 'core_rrhh'");
    if (resDb.rows.length === 0) {
      // No existe la base de datos, la creamos
      await clientPostgres.query('CREATE DATABASE core_rrhh');
      console.log('Base de datos "core_rrhh" creada exitosamente.');
    } else {
      console.log('La base de datos "core_rrhh" ya existe.');
    }
  } catch (err) {
    console.error('Error al verificar/crear la base de datos:', err);
    process.exit(1);
  } finally {
    await clientPostgres.end();
  }

  // 2. Conectar a 'core_rrhh' para crear las tablas e insertar registros
  const clientCore = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'core_rrhh',
    password: process.env.DB_PASSWORD || 'admin',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  });

  try {
    await clientCore.connect();
    console.log('Conectado a la base de datos "core_rrhh" para inicializar tablas...');

    // Crear tabla usuarios
    await clientCore.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        correo VARCHAR(255) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        rol_id INTEGER NOT NULL
      );
    `);
    console.log('Tabla "usuarios" verificada/creada.');

    // Crear tabla empleados
    await clientCore.query(`
      CREATE TABLE IF NOT EXISTS empleados (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        puesto VARCHAR(100),
        departamento VARCHAR(100),
        fecha_ingreso DATE DEFAULT CURRENT_DATE
      );
    `);
    console.log('Tabla "empleados" verificada/creada.');

    // Insertar usuario de prueba (contraseña '1001089215ge' encriptada con bcrypt)
    const passwordHash = '$2b$10$JS.5b2qpHFFaVgfoxgnC2ehfGaf2CKdhdGHJsIyxQwJNNN8rJr/AS';
    await clientCore.query(`
      INSERT INTO usuarios (correo, contrasena, rol_id) 
      VALUES ('6e0rgge@gmail.com', $1, 1)
      ON CONFLICT (correo) DO UPDATE SET contrasena = EXCLUDED.contrasena;
    `, [passwordHash]);

    // Insertar perfil de empleado de prueba
    await clientCore.query(`
      INSERT INTO empleados (usuario_id, nombre, apellido, puesto, departamento)
      VALUES (
        (SELECT id FROM usuarios WHERE correo = '6e0rgge@gmail.com'),
        'Jorge',
        'Gómez',
        'Director de RRHH',
        'Recursos Humanos'
      )
      ON CONFLICT (usuario_id) DO NOTHING;
    `);
    console.log('Tablas y registros de prueba inicializados correctamente.');

  } catch (err) {
    console.error('Error al inicializar las tablas en "core_rrhh":', err);
    process.exit(1);
  } finally {
    await clientCore.end();
  }
};

main();
