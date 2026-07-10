const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const empleadoRoutes = require('./src/routes/empleadoRoutes');
const contratoRoutes = require('./src/routes/contratoRoutes');
const recursosRoutes = require('./src/routes/recursosRoutes');
const solicitudRoutes = require('./src/routes/solicitudRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// Registro de rutas
app.use('/api/auth', authRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/recursos', recursosRoutes);
app.use('/api/solicitudes', solicitudRoutes);

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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor de desarrollo CoreRRHH corriendo en http://localhost:${PORT}`);
});
