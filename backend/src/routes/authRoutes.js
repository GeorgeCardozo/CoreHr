const express = require('express');
const router = express.Router();
const { login, registro, listarUsuarios, loginConGoogle, cambiarContrasena } = require('../controllers/authController');
const { verifyToken, verificarAdmin } = require('../middlewares/auth');

const rateLimiter = require('../middlewares/rateLimiter');

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos por ventana de 15 min
  message: { message: 'Demasiados intentos. Por favor intente nuevamente en 15 minutos.' }
});

// Ruta: POST /api/auth/login
router.post('/login', authLimiter, login);

// Ruta: POST /api/auth/google
router.post('/google', authLimiter, loginConGoogle);

// Ruta: POST /api/auth/registro
// El registro de cuentas es una operación administrativa; nunca se acepta rol desde una ruta pública.
router.post('/registro', verifyToken, verificarAdmin, registro);

// Ruta: GET /api/auth/usuarios (Protegido para Administradores)
router.get('/usuarios', verifyToken, verificarAdmin, listarUsuarios);

// Ruta: PUT /api/auth/cambiar-contrasena (Protegida por JWT)
router.put('/cambiar-contrasena', verifyToken, authLimiter, cambiarContrasena);

module.exports = router;
