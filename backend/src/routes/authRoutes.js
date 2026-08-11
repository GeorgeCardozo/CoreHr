const express = require('express');
const router = express.Router();
const {
  login,
  registro,
  listarUsuarios,
  loginConGoogle,
  cambiarContrasena,
  obtenerSesion,
} = require('../controllers/authController');
const { verifyToken, verificarAdmin } = require('../middlewares/auth');
const rateLimiter = require('../middlewares/rateLimiter');

const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Demasiados intentos. Por favor intenta nuevamente en 15 minutos.' },
});
const passwordLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Demasiados intentos de cambio de contraseña. Intenta nuevamente en 15 minutos.' },
});

router.post('/login', loginLimiter, login);
router.post('/google', loginLimiter, loginConGoogle);
router.post('/registro', verifyToken, verificarAdmin, registro);
router.get('/me', verifyToken, obtenerSesion);
router.get('/usuarios', verifyToken, verificarAdmin, listarUsuarios);
router.put('/cambiar-contrasena', verifyToken, passwordLimiter, cambiarContrasena);

module.exports = router;
