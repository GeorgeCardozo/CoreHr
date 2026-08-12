const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { connectionConfig } = require('./databaseOptions');

const pool = new Pool(connectionConfig({ includePoolOptions: true }));

const main = async () => {
  try {
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tablas existentes en la base de datos:', tableRes.rows.map(r => r.table_name));

    for (let row of tableRes.rows) {
      const colRes = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [row.table_name]);
      console.log(`Columnas en la tabla "${row.table_name}":`, colRes.rows);
    }
  } catch (err) {
    console.error('Error al inspeccionar la base de datos:', err);
  } finally {
    await pool.end();
  }
};

if (require.main === module) main();

module.exports = { main };
