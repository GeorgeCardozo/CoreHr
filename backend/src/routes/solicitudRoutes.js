const express = require('express');
const router = express.Router();
const { crearSolicitud, listarSolicitudes, actualizarEstadoSolicitud } = require('../controllers/solicitudController');
const { verifyToken, verificarAdmin } = require('../middlewares/auth');

// GET y POST /api/solicitudes - Empleados y Admins
router.get('/', verifyToken, listarSolicitudes);
router.post('/', verifyToken, crearSolicitud);

// PUT /api/solicitudes/:id/estado - Solo Admins pueden aprobar/rechazar
router.put('/:id/estado', verifyToken, verificarAdmin, actualizarEstadoSolicitud);

module.exports = router;
