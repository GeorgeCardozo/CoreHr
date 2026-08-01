const express = require('express');
const router = express.Router();
const { 
  obtenerNotificaciones, 
  marcarNotificacionLeida, 
  marcarTodasLeidas 
} = require('../controllers/notificacionController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', verifyToken, obtenerNotificaciones);
router.put('/marcar-todas', verifyToken, marcarTodasLeidas);
router.put('/:id/leida', verifyToken, marcarNotificacionLeida);

module.exports = router;
