const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

const inspect = async () => {
  try {
    const users = await pool.query("SELECT id, correo, rol_id FROM usuarios");
    console.log("--- USUARIOS ---");
    console.table(users.rows);

    const userCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'usuarios'");
    console.log("--- USUARIOS COLUMNS ---");
    console.table(userCols.rows);

    const emps = await pool.query("SELECT id, usuario_id, documento_identidad, nombres, apellidos, telefono, fecha_ingreso, habilidades, fecha_info_personal, fecha_soportes, fecha_seguridad, superior_inmediato FROM empleados");
    console.log("--- EMPLEADOS ---");
    console.table(emps.rows);

    const contrs = await pool.query("SELECT id, empleado_id, cargo, tipo_contrato, salario, fecha_inicio, fecha_fin, estado FROM contratos");
    console.log("--- CONTRATOS ---");
    console.table(contrs.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
};

inspect();
