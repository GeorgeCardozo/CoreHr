const express = require('express');
const router = express.Router();
const { procesarChatRecursos } = require('../controllers/recursosController');
const { verifyToken, authorize } = require('../middlewares/auth');

// POST /api/recursos/chat - Consultar con el Asistente de IA (protegido por token)
router.post('/chat', verifyToken, authorize(2), procesarChatRecursos);

module.exports = router;
