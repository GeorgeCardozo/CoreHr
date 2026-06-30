const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

const reset = async () => {
  try {
    const hash = await bcrypt.hash('Colombia1', 10);
    
    // Update all users in usuarios table to Colombia1
    const res = await pool.query(
      "UPDATE usuarios SET contrasena = $1 WHERE correo IN ('6e0rgge@gmail.com', 'soporte@gla.edu.co', 'usuario_prueba@correo.com') RETURNING correo",
      [hash]
    );
    console.log("Updated users:", res.rows.map(r => r.correo));

  } catch (err) {
    console.error("Error resetting passwords:", err);
  } finally {
    await pool.end();
  }
};

reset();
