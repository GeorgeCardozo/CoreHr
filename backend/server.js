const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const empleadoRoutes = require('./src/routes/empleadoRoutes');
const contratoRoutes = require('./src/routes/contratoRoutes');
const recursosRoutes = require('./src/routes/recursosRoutes');
const solicitudRoutes = require('./src/routes/solicitudRoutes');
const notificacionRoutes = require('./src/routes/notificacionRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const profileUploadsPath = path.join(__dirname, 'uploads', 'perfiles');
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middlewares globales
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origen no permitido por la política CORS'));
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
// Solo las imágenes de perfil son públicas. Los soportes documentales requieren JWT.
app.use('/uploads/perfiles', express.static(profileUploadsPath, { index: false, maxAge: '1d' }));
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

// Registro de rutas
app.use('/api/auth', authRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/recursos', recursosRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/notificaciones', notificacionRoutes);

// Endpoint de salud base
app.get('/', (req, res) => {
  res.json({
    name: 'CoreRRHH API',
    description: 'Sistema On-Premise para la gestión de personal y automatización de documentos',
    status: 'online',
    timestamp: new Date()
  });
});

// Manejo de error 404 para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Errores de validación de archivos y errores inesperados siempre se responden como JSON.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'El archivo supera el tamaño máximo permitido.' });
  }
  if (error.message?.includes('Solo se permiten')) {
    return res.status(400).json({ message: error.message });
  }
  if (error.message?.includes('CORS')) {
    return res.status(403).json({ message: 'Origen no permitido.' });
  }
  console.error('Error no controlado:', error);
  return res.status(500).json({ message: 'Error interno del servidor.' });
});

const startServer = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe existir y tener al menos 32 caracteres.');
  }

  return app.listen(PORT, () => {
    console.log(`Servidor CoreRRHH corriendo en http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
