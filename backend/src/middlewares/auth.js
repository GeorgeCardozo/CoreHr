const jwt = require('jsonwebtoken');
const db = require('../config/db');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Acceso denegado: token no proporcionado.' });
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    return res.status(401).json({ message: 'Acceso denegado: el token debe usar el formato Bearer.' });
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    return res.status(500).json({ message: 'La autenticación no está configurada en el servidor.' });
  }

  try {
    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
    const userId = Number(decoded.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Token inválido o expirado.' });
    }

    // El rol y el estado se consultan en la base de datos para que una
    // desactivación o un cambio de contraseña revoque tokens ya emitidos.
    const result = await db.query(
      `SELECT id, correo, rol_id, activo, token_version, debe_cambiar_contrasena
       FROM usuarios WHERE id = $1`,
      [userId]
    );
    const usuario = result.rows[0];
    if (!usuario || !usuario.activo || Number(usuario.token_version || 0) !== Number(decoded.tv || 0)) {
      return res.status(401).json({ message: 'Token inválido, revocado o expirado.' });
    }

    req.user = {
      id: usuario.id,
      correo: usuario.correo,
      rol_id: Number(usuario.rol_id),
      debe_cambiar_contrasena: Boolean(usuario.debe_cambiar_contrasena),
    };
    return next();
  } catch (error) {
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
      console.error('Error en la verificación de autenticación:', error);
    }
    return res.status(401).json({ message: 'Token inválido o expirado. Por favor inicie sesión nuevamente.' });
  }
};

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !Number.isInteger(req.user.rol_id) || !allowedRoles.map(Number).includes(req.user.rol_id)) {
    return res.status(403).json({ message: 'Acceso denegado: permisos insuficientes.' });
  }
  return next();
};

const verificarAdmin = authorize(1);

const verificarAdminOPropioEmpleado = async (req, res, next) => {
  if (req.user?.rol_id === 1) return next();
  const employeeId = Number(req.params.id);
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return res.status(400).json({ message: 'El identificador del empleado no es válido.' });
  }

  try {
    const result = await db.query('SELECT usuario_id FROM empleados WHERE id = $1', [employeeId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado.' });
    }
    if (Number(result.rows[0].usuario_id) !== Number(req.user?.id)) {
      return res.status(403).json({ message: 'Acceso denegado: no tienes permisos para modificar este perfil.' });
    }
    return next();
  } catch (error) {
    console.error('Error en verificarAdminOPropioEmpleado:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { verifyToken, authorize, verificarAdmin, verificarAdminOPropioEmpleado };
