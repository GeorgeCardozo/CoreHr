const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const empleadoRoutes = require('./src/routes/empleadoRoutes');
const contratoRoutes = require('./src/routes/contratoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Registro de rutas
app.use('/api/auth', authRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/contratos', contratoRoutes);

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
