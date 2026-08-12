const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./src/routes/authRoutes');
const empleadoRoutes = require('./src/routes/empleadoRoutes');
const contratoRoutes = require('./src/routes/contratoRoutes');
const recursosRoutes = require('./src/routes/recursosRoutes');
const solicitudRoutes = require('./src/routes/solicitudRoutes');
const notificacionRoutes = require('./src/routes/notificacionRoutes');

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const profileUploadsPath = path.join(__dirname, 'uploads', 'perfiles');
const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length > 0
  ? configuredOrigins
  : process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

app.use(cors({
  origin: (origin, callback) => {
    const normalizedOrigin = origin?.replace(/\/$/, '');
    if (!origin || allowedOrigins.includes(normalizedOrigin)) return callback(null, true);
    return callback(new Error('Origen no permitido por la política CORS'));
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86400,
}));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use('/uploads/perfiles', express.static(profileUploadsPath, { index: false, maxAge: '1d' }));
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  next();
});
app.use((req, res, next) => {
  if (process.env.LOG_REQUESTS === 'true') console.info(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/recursos', recursosRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/notificaciones', notificacionRoutes);

app.get('/', (req, res) => {
  res.json({ name: 'CoreRRHH API', status: 'online', timestamp: new Date().toISOString() });
});
app.get('/health', async (req, res) => {
  try {
    await require('./src/config/db').query('SELECT 1');
    return res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Error en health check:', error);
    return res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));

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
  if (!Number.isInteger(PORT) || PORT < 0 || PORT > 65535) {
    throw new Error('PORT debe ser un entero entre 0 y 65535.');
  }

  return app.listen(PORT, () => console.log(`Servidor CoreRRHH escuchando en el puerto ${PORT}.`));
};

if (require.main === module) startServer();

module.exports = { app, startServer };
