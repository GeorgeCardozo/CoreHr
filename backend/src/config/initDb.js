const { Client } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
const { ensureSchema } = require('./schema');
const { validatePassword } = require('../utils/passwordPolicy');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const databaseName = process.env.DB_DATABASE || 'core_rrhh';
const connectionOptions = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT, 10) : 5432,
};

const seedAdminIfConfigured = async (client) => {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email && !password) return;
  const passwordValidation = validatePassword(password);
  if (!email || !password || !passwordValidation.valid) {
    throw new Error(`SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD son obligatorios; ${passwordValidation.message || 'la contraseña no es válida.'}`);
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await client.query(
    `INSERT INTO usuarios (correo, contrasena, rol_id)
     VALUES ($1, $2, 1)
     ON CONFLICT (correo) DO NOTHING
     RETURNING id`,
    [email, hash]
  );
  const userId = result.rows[0]?.id || (await client.query('SELECT id FROM usuarios WHERE correo = $1', [email])).rows[0]?.id;
  await client.query('UPDATE usuarios SET activo = TRUE, debe_cambiar_contrasena = TRUE WHERE correo = $1', [email]);

  if (userId) {
    await client.query(
      `INSERT INTO empleados (usuario_id, documento_identidad, nombres, apellidos, departamento)
       VALUES ($1, $2, 'Administrador', 'CoreRRHH', 'Recursos Humanos')
       ON CONFLICT (usuario_id) DO NOTHING`,
      [userId, `ADMIN-${userId}`]
    );
  }
};

const main = async () => {
  const bootstrapClient = new Client({ ...connectionOptions, database: 'postgres' });
  try {
    await bootstrapClient.connect();
    const databaseResult = await bootstrapClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
    if (databaseResult.rows.length === 0) {
      await bootstrapClient.query(`CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`);
      console.log(`Base de datos "${databaseName}" creada exitosamente.`);
    } else {
      console.log(`La base de datos "${databaseName}" ya existe.`);
    }
  } finally {
    await bootstrapClient.end();
  }

  const client = new Client({ ...connectionOptions, database: databaseName });
  try {
    await client.connect();
    await ensureSchema(client);
    await seedAdminIfConfigured(client);
    console.log('Esquema CoreRRHH inicializado sin eliminar datos existentes.');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
};

main();
