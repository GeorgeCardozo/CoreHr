const express = require('express');
const router = express.Router();
const { crearSolicitud, listarSolicitudes, actualizarEstadoSolicitud, descargarAdjunto } = require('../controllers/solicitudController');
const { verifyToken, verificarAdmin } = require('../middlewares/auth');

const uploadSolicitudes = require('../middlewares/uploadSolicitudes');

// GET y POST /api/solicitudes - Empleados y Admins
router.get('/', verifyToken, listarSolicitudes);
router.post('/', verifyToken, uploadSolicitudes.single('adjunto'), crearSolicitud);
router.get('/:id/adjunto', verifyToken, descargarAdjunto);

// PUT /api/solicitudes/:id/estado - Solo Admins pueden aprobar/rechazar
router.put('/:id/estado', verifyToken, verificarAdmin, actualizarEstadoSolicitud);

module.exports = router;
