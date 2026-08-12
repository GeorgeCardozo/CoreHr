const express = require('express');
const router = express.Router();
const { obtenerPerfil, actualizarPrivacidadPerfil, crearEmpleado, listarEmpleados, actualizarEmpleado, eliminarEmpleado, generarCertificado, obtenerDirectorio, subirFotoPerfil, obtenerFotoPerfil, crearEmpleadosMasivo, crearAdministrador } = require('../controllers/empleadoController');
const { verifyToken, verificarAdmin, verificarAdminOPropioEmpleado } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Ruta: GET /api/empleados/perfil/:id? (Protegida por JWT)
router.get('/perfil/:id?', verifyToken, obtenerPerfil);

// Ruta: GET /api/empleados/certificado (Protegida por JWT)
router.get('/certificado', verifyToken, generarCertificado);

// Ruta: GET /api/empleados/directorio (Protegida por JWT, accesible por cualquier rol)
router.get('/directorio', verifyToken, obtenerDirectorio);

// El titular administra qué datos personales comparte con otros colaboradores.
router.put('/perfil/privacidad', verifyToken, actualizarPrivacidadPerfil);

// La lista completa contiene información administrativa y solo la consulta RR.HH.
router.get('/', verifyToken, verificarAdmin, listarEmpleados);

// Ruta: POST /api/empleados/bulk (Protegida por JWT y Administrador)
router.post('/bulk', verifyToken, verificarAdmin, crearEmpleadosMasivo);

// Ruta: POST /api/empleados (Protegida por JWT y Administrador)
router.post('/', verifyToken, verificarAdmin, crearEmpleado);

// Ruta: PUT /api/empleados/perfil/foto (Protegida por JWT)
router.put('/perfil/foto', verifyToken, upload.single('foto'), subirFotoPerfil);

// Las fotos forman parte del directorio interno y requieren una sesion valida.
router.get('/:id/foto', verifyToken, obtenerFotoPerfil);

// Ruta: PUT /api/empleados/:id (Protegida por JWT y Administrador/Propio)
router.put('/:id', verifyToken, verificarAdminOPropioEmpleado, actualizarEmpleado);
router.patch('/:id', verifyToken, verificarAdminOPropioEmpleado, actualizarEmpleado);

// Ruta: DELETE /api/empleados/:id (Protegida por JWT y Administrador)
router.delete('/:id', verifyToken, verificarAdmin, eliminarEmpleado);

// Ruta: POST /api/empleados/crear-admin (Protegida por JWT y Administrador)
router.post('/crear-admin', verifyToken, verificarAdmin, crearAdministrador);

module.exports = router;
