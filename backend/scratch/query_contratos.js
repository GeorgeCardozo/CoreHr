const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

const run = async () => {
  try {
    const res = await pool.query("SELECT c.*, e.nombres, e.apellidos FROM contratos c JOIN empleados e ON c.empleado_id = e.id LIMIT 10");
    console.log("CONTRACTS:", JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
};

run();
