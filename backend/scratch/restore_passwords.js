const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

const restore = async () => {
  try {
    // Restore admin password to '1001089215ge' hash
    const originalHash = '$2b$10$JS.5b2qpHFFaVgfoxgnC2ehfGaf2CKdhdGHJsIyxQwJNNN8rJr/AS';
    
    const adminRes = await pool.query(
      "UPDATE usuarios SET contrasena = $1 WHERE correo = '6e0rgge@gmail.com'",
      [originalHash]
    );
    console.log("Admin password restored successfully. Rows affected:", adminRes.rowCount);

  } catch (err) {
    console.error("Error restoring password:", err);
  } finally {
    await pool.end();
  }
};

restore();
