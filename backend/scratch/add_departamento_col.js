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
    console.log("Checking and adding departamento column if not exists...");
    await pool.query("ALTER TABLE empleados ADD COLUMN IF NOT EXISTS departamento VARCHAR(100);");
    console.log("Database schema check/migration completed successfully.");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
};

run();
