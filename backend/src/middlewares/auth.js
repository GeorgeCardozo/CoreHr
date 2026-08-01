const jwt = require('jsonwebtoken');
const db = require('../config/db');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Acceso denegado: Token no proporcionado' });
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({ message: 'Acceso denegado: Formato de token inválido. Debe ser Bearer <token>' });
  }

  const token = parts[1];

  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(500).json({ message: 'La autenticación no está configurada en el servidor.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { ...decoded, id: Number(decoded.id), rol_id: Number(decoded.rol_id) };
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(401).json({ message: 'Token inválido o expirado. Por favor inicie sesión nuevamente.' });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !Number.isInteger(req.user.rol_id)) {
      return res.status(403).json({ message: 'Acceso denegado: Rol no identificado' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.map(Number).includes(req.user.rol_id)) {
      return res.status(403).json({ message: 'Acceso denegado: Permisos insuficientes' });
    }

    next();
  };
};

const verificarAdmin = (req, res, next) => {
  if (!req.user || req.user.rol_id !== 1) {
    return res.status(403).json({ message: 'Acceso denegado: Se requieren permisos de administrador' });
  }
  next();
};

const verificarAdminOPropioEmpleado = async (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Acceso denegado: Usuario no autenticado' });
  }

  // Si es administrador (rol_id 1), permitir siempre
  if (req.user.rol_id === 1) {
    return next();
  }

  // Si es empleado, verificar si el id del empleado que intenta actualizar corresponde a su propio usuario_id
  const { id } = req.params;
  try {
    const result = await db.query('SELECT usuario_id FROM empleados WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    
    if (result.rows[0].usuario_id === req.user.id) {
      return next();
    }
    
    return res.status(403).json({ message: 'Acceso denegado: No tienes permisos para modificar este perfil' });
  } catch (error) {
    console.error('Error en verificarAdminOPropioEmpleado:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  verifyToken,
  authorize,
  verificarAdmin,
  verificarAdminOPropioEmpleado,
};
