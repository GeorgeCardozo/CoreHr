const express = require('express');
const router = express.Router();
const { obtenerPerfil, crearEmpleado } = require('../controllers/empleadoController');
const { verifyToken, verificarAdmin } = require('../middlewares/auth');

// Ruta: GET /api/empleados/perfil (Protegida por JWT)
router.get('/perfil', verifyToken, obtenerPerfil);

// Ruta: POST /api/empleados (Protegida por JWT y Administrador)
router.post('/', verifyToken, verificarAdmin, crearEmpleado);

module.exports = router;
