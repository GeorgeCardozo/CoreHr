import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
export const API_BASE_URL = configuredApiUrl || '/api';
export const API_ORIGIN = configuredApiUrl
  ? configuredApiUrl.replace(/\/api\/?$/, '')
  : '';

export const getAssetUrl = (assetPath) => {
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath) || assetPath.startsWith('data:')) return assetPath;
  return `${API_ORIGIN}${assetPath}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para inyectar automáticamente el token JWT en las cabeceras
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Funciones API para Empleados
export const obtenerEmpleados = async () => {
  const response = await api.get('/empleados');
  return response.data;
};

export const obtenerDirectorio = async () => {
  const response = await api.get('/empleados/directorio');
  return response.data;
};

export const crearEmpleado = async (datos) => {
  const response = await api.post('/empleados', datos);
  return response.data;
};

export const crearEmpleadosMasivo = async (empleados) => {
  const response = await api.post('/empleados/bulk', { empleados });
  return response.data;
};

export const obtenerUsuarios = async () => {
  const response = await api.get('/auth/usuarios');
  return response.data;
};

export const crearContrato = async (datos) => {
  const response = await api.post('/contratos', datos);
  return response.data;
};

export const obtenerContratos = async () => {
  const response = await api.get('/contratos');
  return response.data;
};

export const actualizarEmpleado = async (id, datos) => {
  const response = await api.put(`/empleados/${id}`, datos);
  return response.data;
};

export const obtenerPerfil = async (id) => {
  const response = await api.get(id ? `/empleados/perfil/${id}` : '/empleados/perfil');
  return response.data;
};

export const actualizarPrivacidadPerfil = async (preferencias) => {
  const response = await api.put('/empleados/perfil/privacidad', { preferencias });
  return response.data;
};

export const subirFotoPerfil = async (formData) => {
  const response = await api.put('/empleados/perfil/foto', formData);
  return response.data;
};

export const eliminarEmpleado = async (id) => {
  const response = await api.delete(`/empleados/${id}`);
  return response.data;
};

export const actualizarContrato = async (id, datos) => {
  const response = await api.put(`/contratos/${id}`, datos);
  return response.data;
};

// Recursos & Solicitudes
export const enviarMensajeChat = async (mensaje) => {
  const response = await api.post('/recursos/chat', { mensaje });
  return response.data;
};

export const crearSolicitud = async (solicitud) => {
  const response = await api.post('/solicitudes', solicitud);
  return response.data;
};

export const obtenerAdjuntoSolicitud = async (url) => {
  const requestPath = url?.startsWith('/api/') ? url.slice(4) : url;
  const response = await api.get(requestPath, { responseType: 'blob' });
  return response.data;
};

export const obtenerSolicitudes = async () => {
  const response = await api.get('/solicitudes');
  return response.data;
};

export const actualizarEstadoSolicitud = async (id, payload) => {
  const response = await api.put(`/solicitudes/${id}/estado`, payload);
  return response.data;
};

// Notificaciones
export const obtenerNotificaciones = async () => {
  const response = await api.get('/notificaciones');
  return response.data;
};

export const marcarNotificacionLeida = async (id) => {
  const response = await api.put(`/notificaciones/${id}/leida`);
  return response.data;
};

export const marcarTodasNotificacionesLeidas = async () => {
  const response = await api.put('/notificaciones/marcar-todas');
  return response.data;
};

// Cambio de contraseña
export const cambiarContrasena = async (data) => {
  const response = await api.put('/auth/cambiar-contrasena', data);
  return response.data;
};

// Crear Administrador
export const crearAdministrador = async (data) => {
  const response = await api.post('/empleados/crear-admin', data);
  return response.data;
};

export default api;
