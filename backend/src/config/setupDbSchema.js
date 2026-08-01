const { Client } = require('pg');
const path = require('path');
const { ensureSchema } = require('./schema');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'core_rrhh',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT, 10) : 5432,
});

const main = async () => {
  try {
    await client.connect();
    await ensureSchema(client);
    console.log('Esquema de base de datos verificado y actualizado sin borrar información.');
  } catch (error) {
    console.error('Error al actualizar el esquema:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
};

main();
