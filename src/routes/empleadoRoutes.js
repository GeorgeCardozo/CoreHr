const express = require('express');
const router = express.Router();
const { obtenerPerfil, crearEmpleado, listarEmpleados, actualizarEmpleado, eliminarEmpleado, generarCertificado } = require('../controllers/empleadoController');
const { verifyToken, verificarAdmin, verificarAdminOPropioEmpleado } = require('../middlewares/auth');

// Ruta: GET /api/empleados/perfil (Protegida por JWT)
router.get('/perfil', verifyToken, obtenerPerfil);

// Ruta: GET /api/empleados/certificado (Protegida por JWT)
router.get('/certificado', verifyToken, generarCertificado);

// Ruta: GET /api/empleados (Protegida por JWT)
router.get('/', verifyToken, listarEmpleados);

// Ruta: POST /api/empleados (Protegida por JWT y Administrador)
router.post('/', verifyToken, verificarAdmin, crearEmpleado);

// Ruta: PUT /api/empleados/:id (Protegida por JWT y Administrador/Propio)
router.put('/:id', verifyToken, verificarAdminOPropioEmpleado, actualizarEmpleado);

// Ruta: DELETE /api/empleados/:id (Protegida por JWT y Administrador)
router.delete('/:id', verifyToken, verificarAdmin, eliminarEmpleado);

module.exports = router;
