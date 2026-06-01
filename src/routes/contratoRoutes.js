const express = require('express');
const router = express.Router();
const { crearContrato, obtenerContratos } = require('../controllers/contratoController');
const { verifyToken, verificarAdmin } = require('../middlewares/auth');

// Proteger todas las rutas del contrato con JWT y verificación de Administrador
router.use(verifyToken, verificarAdmin);

// Ruta: POST /api/contratos
router.post('/', crearContrato);

// Ruta: GET /api/contratos
router.get('/', obtenerContratos);

module.exports = router;
