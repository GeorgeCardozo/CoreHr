const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  max: Number(process.env.DB_POOL_MAX || 20),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log('Pool de PostgreSQL conectado exitosamente.');
});

pool.on('error', (err) => {
  console.error('Error inesperado en el Pool de PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
