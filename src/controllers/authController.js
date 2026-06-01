const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ message: 'Se requiere correo y contrasena' });
  }

  try {
    // Buscar al usuario en la tabla usuarios por correo
    const result = await db.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const usuario = result.rows[0];

    // Verificar la contraseña con bcrypt (buscando contrasena o password de la BD)
    const storedHash = usuario.contrasena || usuario.password;
    if (!storedHash) {
      return res.status(500).json({ message: 'Error de configuración de usuario en la base de datos' });
    }

    const passwordMatch = await bcrypt.compare(contrasena, storedHash);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Firmar y devolver el token JWT incluyendo el id y el rol_id
    const payload = {
      id: usuario.id,
      rol_id: usuario.rol_id
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      message: 'Autenticación exitosa',
      token,
      user: {
        id: usuario.id,
        correo: usuario.correo,
        rol_id: usuario.rol_id
      }
    });

  } catch (error) {
    console.error('Error en authController.login:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const registro = async (req, res) => {
  const { correo, contrasena, rol_id } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ message: 'Se requiere correo y contrasena' });
  }

  const finalRolId = rol_id !== undefined ? rol_id : 1;

  try {
    // Encriptar la contraseña usando bcrypt con 10 saltos
    const hash = await bcrypt.hash(contrasena, 10);

    // Hacer un INSERT en la tabla usuarios de PostgreSQL devolviendo el usuario creado
    const result = await db.query(
      'INSERT INTO usuarios (correo, contrasena, rol_id) VALUES ($1, $2, $3) RETURNING id, correo, rol_id',
      [correo, hash, finalRolId]
    );

    const usuarioCreado = result.rows[0];

    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: usuarioCreado
    });

  } catch (error) {
    console.log(error); // Imprimir error en consola para depuración rápida
    return res.status(500).json({ message: 'Error interno del servidor al registrar usuario' });
  }
};

module.exports = {
  login,
  registro
};
