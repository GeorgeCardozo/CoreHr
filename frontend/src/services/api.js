import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
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

export const crearEmpleado = async (datos) => {
  const response = await api.post('/empleados', datos);
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

export const eliminarEmpleado = async (id) => {
  const response = await api.delete(`/empleados/${id}`);
  return response.data;
};

export default api;
