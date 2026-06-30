const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

const migrate = async () => {
  try {
    console.log("Iniciando migración...");
    await pool.query("ALTER TABLE empleados ADD COLUMN IF NOT EXISTS habilidades TEXT[];");
    await pool.query("ALTER TABLE empleados ADD COLUMN IF NOT EXISTS fecha_info_personal DATE;");
    await pool.query("ALTER TABLE empleados ADD COLUMN IF NOT EXISTS fecha_soportes DATE;");
    await pool.query("ALTER TABLE empleados ADD COLUMN IF NOT EXISTS fecha_seguridad DATE;");
    await pool.query("ALTER TABLE empleados ADD COLUMN IF NOT EXISTS superior_inmediato VARCHAR(100);");
    console.log("Migración completada con éxito.");
  } catch (err) {
    console.error("Error durante la migración:", err);
  } finally {
    await pool.end();
  }
};

migrate();
