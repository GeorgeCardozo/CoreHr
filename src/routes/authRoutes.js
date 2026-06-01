const express = require('express');
const router = express.Router();
const { login, registro } = require('../controllers/authController');

// Ruta: POST /api/auth/login
router.post('/login', login);

// Ruta: POST /api/auth/registro
router.post('/registro', registro);

module.exports = router;
