const express = require('express');
const router = express.Router();
const { procesarChatRecursos } = require('../controllers/recursosController');
const { verifyToken } = require('../middlewares/auth');

// POST /api/recursos/chat - Consultar con el Asistente de IA (protegido por token)
router.post('/chat', verifyToken, procesarChatRecursos);

module.exports = router;
