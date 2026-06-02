const express = require('express');
const router = express.Router();
const { login, registro, listarUsuarios } = require('../controllers/authController');
const { verifyToken, verificarAdmin } = require('../middlewares/auth');

// Ruta: POST /api/auth/login
router.post('/login', login);

// Ruta: POST /api/auth/registro
router.post('/registro', registro);

// Ruta: GET /api/auth/usuarios (Protegido para Administradores)
router.get('/usuarios', verifyToken, verificarAdmin, listarUsuarios);

module.exports = router;
