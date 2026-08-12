const { Client } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
const { ensureSchema } = require('./schema');
const { validatePassword } = require('../utils/passwordPolicy');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { connectionConfig } = require('./databaseOptions');

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
  if (!email) throw new Error('SEED_ADMIN_EMAIL es obligatorio cuando se configura el seed.');

  const existing = await client.query('SELECT id FROM usuarios WHERE correo = $1', [email]);
  let userId = existing.rows[0]?.id;

  // El seed solo crea la cuenta inicial. Nunca debe reactivar una cuenta ni
  // restaurar el indicador de contraseña temporal en despliegues posteriores.
  if (!userId) {
    const passwordValidation = validatePassword(password);
    if (!password || !passwordValidation.valid) {
      throw new Error(`SEED_ADMIN_PASSWORD es obligatoria para crear la cuenta inicial; ${passwordValidation.message || 'la contraseña no es válida.'}`);
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await client.query(
      `INSERT INTO usuarios (correo, contrasena, rol_id, debe_cambiar_contrasena)
       VALUES ($1, $2, 1, TRUE)
       RETURNING id`,
      [email, hash]
    );
    userId = result.rows[0].id;
  }

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
  const usesManagedDatabase = Boolean(process.env.DATABASE_URL?.trim());
  if (!usesManagedDatabase) {
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
  }

  const client = new Client(usesManagedDatabase
    ? connectionConfig()
    : { ...connectionOptions, database: databaseName });
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

if (require.main === module) main();

module.exports = { main, seedAdminIfConfigured };
