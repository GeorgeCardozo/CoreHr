const express = require('express');
const router = express.Router();
const { login, registro, listarUsuarios, loginConGoogle } = require('../controllers/authController');
const { verifyToken, verificarAdmin } = require('../middlewares/auth');

// Ruta: POST /api/auth/login
router.post('/login', login);

// Ruta: POST /api/auth/google
router.post('/google', loginConGoogle);

// Ruta: POST /api/auth/registro
// El registro de cuentas es una operación administrativa; nunca se acepta rol desde una ruta pública.
router.post('/registro', verifyToken, verificarAdmin, registro);

// Ruta: GET /api/auth/usuarios (Protegido para Administradores)
router.get('/usuarios', verifyToken, verificarAdmin, listarUsuarios);

module.exports = router;
