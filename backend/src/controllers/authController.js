const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = new Set([1, 2]);

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET no está configurado correctamente.');
  }
  return process.env.JWT_SECRET;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const createToken = (usuario, expiresIn = process.env.JWT_EXPIRES_IN || '8h') => jwt.sign(
  { id: usuario.id, rol_id: usuario.rol_id, correo: usuario.correo },
  getJwtSecret(),
  { expiresIn }
);

const login = async (req, res) => {
  const correo = normalizeEmail(req.body?.correo);
  const contrasena = req.body?.contrasena;

  if (!EMAIL_PATTERN.test(correo) || typeof contrasena !== 'string' || contrasena.length === 0) {
    return res.status(400).json({ message: 'Se requiere un correo válido y una contraseña.' });
  }

  try {
    const result = await db.query(
      'SELECT id, correo, contrasena, rol_id FROM usuarios WHERE correo = $1',
      [correo]
    );
    const usuario = result.rows[0];
    const passwordMatch = usuario?.contrasena ? await bcrypt.compare(contrasena, usuario.contrasena) : false;

    if (!usuario || !passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const token = createToken(usuario);
    return res.status(200).json({
      message: 'Autenticación exitosa.',
      token,
      user: { id: usuario.id, correo: usuario.correo, rol_id: usuario.rol_id },
    });
  } catch (error) {
    console.error('Error en authController.login:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Esta ruta está protegida para que solo RR.HH. pueda crear cuentas.
const registro = async (req, res) => {
  const correo = normalizeEmail(req.body?.correo);
  const contrasena = req.body?.contrasena;
  const rolId = Number(req.body?.rol_id ?? 2);

  if (!EMAIL_PATTERN.test(correo) || typeof contrasena !== 'string' || contrasena.length < 12) {
    return res.status(400).json({ message: 'El correo debe ser válido y la contraseña debe tener al menos 12 caracteres.' });
  }
  if (!ALLOWED_ROLES.has(rolId)) {
    return res.status(400).json({ message: 'El rol solicitado no es válido.' });
  }

  try {
    const hash = await bcrypt.hash(contrasena, 12);
    const result = await db.query(
      `INSERT INTO usuarios (correo, contrasena, rol_id)
       VALUES ($1, $2, $3)
       RETURNING id, correo, rol_id`,
      [correo, hash, rolId]
    );

    return res.status(201).json({ message: 'Usuario registrado exitosamente.', user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'El correo ya se encuentra registrado.' });
    }
    console.error('Error en authController.registro:', error);
    return res.status(500).json({ message: 'Error interno del servidor al registrar el usuario.' });
  }
};

const listarUsuarios = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.correo, u.rol_id, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       ORDER BY u.id ASC`
    );
    return res.status(200).json({ message: 'Usuarios obtenidos exitosamente.', usuarios: result.rows });
  } catch (error) {
    console.error('Error en authController.listarUsuarios:', error);
    return res.status(500).json({ message: 'Error interno del servidor al listar usuarios.' });
  }
};

const loginConGoogle = async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const tokenGoogle = req.body?.tokenGoogle;

  if (!clientId) {
    return res.status(503).json({ message: 'El inicio de sesión con Google no está configurado.' });
  }
  if (typeof tokenGoogle !== 'string' || tokenGoogle.length < 20) {
    return res.status(400).json({ message: 'Se requiere un token válido de Google.' });
  }

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: tokenGoogle, audience: clientId });
    const payload = ticket.getPayload();
    const correo = normalizeEmail(payload?.email);
    const allowedDomain = (process.env.GOOGLE_ALLOWED_DOMAIN || 'gla.edu.co').toLowerCase();

    if (!payload?.email_verified || !correo.endsWith(`@${allowedDomain}`)) {
      return res.status(403).json({ message: 'Acceso denegado. Usa un correo institucional verificado.' });
    }

    const result = await db.query(
      'SELECT id, correo, rol_id, google_id FROM usuarios WHERE correo = $1',
      [correo]
    );
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(403).json({ message: 'Tu correo es válido, pero no está registrado en el portal de Recursos Humanos.' });
    }

    if (!usuario.google_id) {
      await db.query('UPDATE usuarios SET google_id = $1 WHERE id = $2', [payload.sub, usuario.id]);
    }

    return res.status(200).json({
      message: 'Autenticación exitosa.',
      token: createToken(usuario),
      user: { id: usuario.id, correo: usuario.correo, rol_id: usuario.rol_id },
    });
  } catch (error) {
    console.error('Error en la autenticación con Google:', error);
    return res.status(401).json({ message: 'No fue posible validar el token de Google.' });
  }
};

module.exports = { login, registro, listarUsuarios, loginConGoogle };
