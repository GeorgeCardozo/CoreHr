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
    console.log("Añadiendo columna contrasena a usuarios...");
    await pool.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS contrasena VARCHAR(255)');
    
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('Colombia1', 10);
    const originalHash = '$2b$10$JS.5b2qpHFFaVgfoxgnC2ehfGaf2CKdhdGHJsIyxQwJNNN8rJr/AS';
    
    await pool.query("UPDATE usuarios SET contrasena = $1 WHERE correo = '6e0rgge@gmail.com'", [originalHash]);
    await pool.query("UPDATE usuarios SET contrasena = $1 WHERE correo IN ('soporte@gla.edu.co', 'usuario_prueba@correo.com')", [hash]);
    
    console.log("Columna contrasena creada y contraseñas restablecidas.");
    const res = await pool.query('SELECT * FROM usuarios');
    console.log("ROWS:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
};

run();
