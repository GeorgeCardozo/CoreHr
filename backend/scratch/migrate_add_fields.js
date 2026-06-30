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
    console.log("Iniciando migración de base de datos...");
    
    // Lista de columnas a agregar
    const columns = [
      { name: 'fecha_terminacion', type: 'DATE' },
      { name: 'tipo_genero', type: 'VARCHAR(50)' },
      { name: 'fecha_nacimiento', type: 'DATE' },
      { name: 'correo_personal', type: 'VARCHAR(255)' },
      { name: 'contacto_emergencia', type: 'VARCHAR(150)' },
      { name: 'parentesco', type: 'VARCHAR(100)' },
      { name: 'telefono_emergencia', type: 'VARCHAR(50)' }
    ];

    for (const col of columns) {
      const checkRes = await pool.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'empleados' AND column_name = $1`,
        [col.name]
      );

      if (checkRes.rows.length === 0) {
        console.log(`Agregando columna: ${col.name} (${col.type})`);
        await pool.query(`ALTER TABLE empleados ADD COLUMN ${col.name} ${col.type}`);
      } else {
        console.log(`La columna ${col.name} ya existe.`);
      }
    }

    console.log("Migración completada exitosamente.");
  } catch (err) {
    console.error("Error durante la migración:", err);
  } finally {
    await pool.end();
  }
};

migrate();
