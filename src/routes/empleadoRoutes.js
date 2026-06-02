const express = require('express');
const router = express.Router();
const { obtenerPerfil, crearEmpleado, listarEmpleados, actualizarEmpleado, eliminarEmpleado } = require('../controllers/empleadoController');
const { verifyToken, verificarAdmin } = require('../middlewares/auth');

// Ruta: GET /api/empleados/perfil (Protegida por JWT)
router.get('/perfil', verifyToken, obtenerPerfil);

// Ruta: GET /api/empleados (Protegida por JWT)
router.get('/', verifyToken, listarEmpleados);

// Ruta: POST /api/empleados (Protegida por JWT y Administrador)
router.post('/', verifyToken, verificarAdmin, crearEmpleado);

// Ruta: PUT /api/empleados/:id (Protegida por JWT y Administrador)
router.put('/:id', verifyToken, verificarAdmin, actualizarEmpleado);

// Ruta: DELETE /api/empleados/:id (Protegida por JWT y Administrador)
router.delete('/:id', verifyToken, verificarAdmin, eliminarEmpleado);

module.exports = router;
