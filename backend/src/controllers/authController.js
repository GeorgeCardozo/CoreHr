const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const { validatePassword } = require('../utils/passwordPolicy');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET no está configurado correctamente.');
  }
  return process.env.JWT_SECRET;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isAllowedGooglePayload = (payload, allowedDomain) => {
  const correo = normalizeEmail(payload?.email);
  const domain = String(allowedDomain || '').replace(/^@/, '').trim().toLowerCase();
  return Boolean(payload?.email_verified && correo && domain && correo.split('@')[1] === domain);
};

const createToken = (usuario, expiresIn = process.env.JWT_EXPIRES_IN || '8h') => jwt.sign(
  {
    id: usuario.id,
    rol_id: usuario.rol_id,
    correo: usuario.correo,
    tv: Number(usuario.token_version || 0),
  },
  getJwtSecret(),
  { expiresIn }
);

const publicUser = (usuario) => ({
  id: usuario.id,
  correo: usuario.correo,
  rol_id: usuario.rol_id,
  debe_cambiar_contrasena: Boolean(usuario.debe_cambiar_contrasena),
});

const obtenerSesion = (req, res) => res.status(200).json({ user: publicUser(req.user) });

const login = async (req, res) => {
  const correo = normalizeEmail(req.body?.correo);
  const contrasena = req.body?.contrasena;

  if (!EMAIL_PATTERN.test(correo) || typeof contrasena !== 'string' || contrasena.length === 0) {
    return res.status(400).json({ message: 'Se requiere un correo válido y una contraseña.' });
  }

  try {
    const result = await db.query(
      `SELECT id, correo, contrasena, rol_id, activo, token_version, debe_cambiar_contrasena
       FROM usuarios WHERE correo = $1`,
      [correo]
    );
    const usuario = result.rows[0];
    const passwordMatch = usuario?.contrasena ? await bcrypt.compare(contrasena, usuario.contrasena) : false;

    // La respuesta no revela si la cuenta existe, está inactiva o tiene una contraseña errónea.
    if (!usuario || !usuario.activo || !passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    return res.status(200).json({
      message: 'Autenticación exitosa.',
      token: createToken(usuario),
      user: publicUser(usuario),
    });
  } catch (error) {
    console.error('Error en authController.login:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Las cuentas con ficha se crean por /api/empleados. Esta ruta se conserva para
// integraciones administrativas y nunca permite crear administradores sin ficha.
const registro = async (req, res) => {
  const correo = normalizeEmail(req.body?.correo);
  const contrasena = req.body?.contrasena;
  const passwordValidation = validatePassword(contrasena);

  if (!EMAIL_PATTERN.test(correo) || !passwordValidation.valid) {
    return res.status(400).json({
      message: EMAIL_PATTERN.test(correo)
        ? passwordValidation.message
        : 'El correo debe ser válido.',
    });
  }

  try {
    const hash = await bcrypt.hash(contrasena, 12);
    const result = await db.query(
      `INSERT INTO usuarios (correo, contrasena, rol_id, debe_cambiar_contrasena)
       VALUES ($1, $2, 2, true)
       RETURNING id, correo, rol_id, debe_cambiar_contrasena`,
      [correo, hash]
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
      `SELECT u.id, u.correo, u.rol_id, u.activo, r.nombre AS rol
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
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
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
    const allowedDomain = String(process.env.GOOGLE_ALLOWED_DOMAIN || 'gla.edu.co').replace(/^@/, '').toLowerCase();

    if (!isAllowedGooglePayload(payload, allowedDomain)) {
      return res.status(403).json({ message: 'Acceso denegado. Usa un correo institucional verificado.' });
    }

    const result = await db.query(
      `SELECT id, correo, rol_id, google_id, activo, token_version, debe_cambiar_contrasena
       FROM usuarios WHERE correo = $1`,
      [correo]
    );
    const usuario = result.rows[0];

    if (!usuario || !usuario.activo) {
      return res.status(403).json({ message: 'No es posible autorizar esta cuenta en el portal de Recursos Humanos.' });
    }
    if (usuario.google_id && usuario.google_id !== payload.sub) {
      return res.status(403).json({ message: 'La identidad de Google no coincide con la cuenta institucional registrada.' });
    }
    if (!usuario.google_id) {
      await db.query('UPDATE usuarios SET google_id = $1 WHERE id = $2', [payload.sub, usuario.id]);
      usuario.google_id = payload.sub;
    }

    return res.status(200).json({
      message: 'Autenticación exitosa.',
      token: createToken(usuario),
      user: publicUser(usuario),
    });
  } catch (error) {
    console.error('Error en la autenticación con Google:', error);
    return res.status(401).json({ message: 'No fue posible validar el token de Google.' });
  }
};

const cambiarContrasena = async (req, res) => {
  const userId = req.user.id;
  const { contrasena_actual, nueva_contrasena } = req.body || {};
  const passwordValidation = validatePassword(nueva_contrasena);

  if (typeof contrasena_actual !== 'string' || !contrasena_actual || !passwordValidation.valid) {
    return res.status(400).json({
      message: passwordValidation.valid
        ? 'Se requiere la contraseña actual.'
        : passwordValidation.message,
    });
  }

  try {
    const result = await db.query(
      `SELECT id, correo, contrasena, rol_id, activo, token_version, debe_cambiar_contrasena
       FROM usuarios WHERE id = $1`,
      [userId]
    );
    const usuario = result.rows[0];
    if (!usuario || !usuario.activo) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(contrasena_actual, usuario.contrasena);
    if (!isMatch) {
      return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
    }
    if (await bcrypt.compare(nueva_contrasena, usuario.contrasena)) {
      return res.status(400).json({ message: 'La nueva contraseña debe ser diferente de la actual.' });
    }

    const hash = await bcrypt.hash(nueva_contrasena, 12);
    const updated = await db.query(
      `UPDATE usuarios
       SET contrasena = $1, debe_cambiar_contrasena = false, token_version = token_version + 1
       WHERE id = $2
       RETURNING id, correo, rol_id, token_version, debe_cambiar_contrasena`,
      [hash, userId]
    );

    return res.status(200).json({
      message: 'Contraseña actualizada exitosamente.',
      token: createToken(updated.rows[0]),
      user: publicUser(updated.rows[0]),
    });
  } catch (error) {
    console.error('Error en authController.cambiarContrasena:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  login,
  registro,
  listarUsuarios,
  loginConGoogle,
  cambiarContrasena,
  obtenerSesion,
  createToken,
  normalizeEmail,
  isAllowedGooglePayload,
};
