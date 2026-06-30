const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { OAuth2Client } = require('google-auth-library');

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

    // Firmar y devolver el token JWT incluyendo el id, el rol_id y el correo
    const payload = {
      id: usuario.id,
      rol_id: usuario.rol_id,
      correo: usuario.correo
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

const listarUsuarios = async (req, res) => {
  try {
    const result = await db.query('SELECT id, correo FROM usuarios ORDER BY id ASC');
    return res.status(200).json({
      message: 'Usuarios obtenidos exitosamente',
      usuarios: result.rows
    });
  } catch (error) {
    console.error('Error en authController.listarUsuarios:', error);
    return res.status(500).json({ message: 'Error interno del servidor al listar usuarios' });
  }
};

// Inicializamos la herramienta de Google con tu Client ID del .env
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID?.trim());

const loginConGoogle = async (req, res) => {
  try {
    // 1. Recibimos el certificado que manda React
    const { tokenGoogle } = req.body;

    if (!tokenGoogle) {
      return res.status(400).json({ error: "Se requiere el token de Google" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID?.trim();

    // 2. Le pedimos a Google que verifique si el certificado es real
    const ticket = await client.verifyIdToken({
      idToken: tokenGoogle,
      audience: clientId,
    });

    // 3. Si es real, Google nos devuelve la información del usuario// 3. Extraemos los datos de Google
    const payload = ticket.getPayload();
    const correo = payload.email;
    const googleId = payload.sub;

    // 4. Primer filtro: Solo correos de la institución
    if (!correo.endsWith('@gla.edu.co')) {
      return res.status(403).json({ error: "Acceso denegado. Usa tu correo institucional." });
    }

    // 5. Segundo filtro (LA LISTA BLANCA): Buscamos si RRHH ya lo registró
    let result = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    
    // Si no está en la base de datos (es un estudiante o alguien no autorizado)
    if (result.rows.length === 0) {
      return res.status(403).json({ 
        error: "Acceso denegado. Tu correo es válido, pero no estás registrado en el portal de Recursos Humanos." 
      });
    }

    // Si pasó los filtros, cargamos al usuario
    let usuario = result.rows[0];

    // 6. Vinculamos su cuenta de Google si es su primera vez entrando
    if (!usuario.google_id) {
      await pool.query('UPDATE usuarios SET google_id = $1 WHERE id = $2', [googleId, usuario.id]);
      console.log(`Cuenta de Google vinculada para: ${correo}`);
    }

    // 7. Creamos tu JWT (esto ya lo tienes)
    const tokenInterno = jwt.sign(
      { id: usuario.id, rol_id: usuario.rol_id, correo: usuario.correo },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    // 8. Se lo enviamos a React INCLUYENDO los datos del usuario
    res.json({ 
      mensaje: "Login exitoso", 
      token: tokenInterno,
      usuario: {
        id: usuario.id,
        correo: usuario.correo,
        rol_id: usuario.rol_id
      }
    });


  } catch (error) {
    console.error("Error en la autenticación:", error);
    res.status(500).json({ error: "Error validando el token de Google" });
  }
};

module.exports = {
  login,
  registro,
  listarUsuarios,
  loginConGoogle
};
