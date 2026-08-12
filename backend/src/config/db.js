const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { connectionConfig } = require('./databaseOptions');

const pool = new Pool(connectionConfig({ includePoolOptions: true }));

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
