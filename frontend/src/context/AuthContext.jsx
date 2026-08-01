import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Helper para decodificar JWT sin dependencias externas
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // 1. Decodificamos el token primero para obtener los datos básicos
          const decoded = decodeToken(token);
          if (!decoded) {
            throw new Error('Token inválido o corrupto');
          }

          // Verificar si el token ya expiró en tiempo del cliente
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            throw new Error('Token expirado');
          }

          // 2. Intentamos cargar el perfil completo, pero si falla (404) no deslogueamos al usuario
          let perfil = null;
          try {
            const response = await api.get('/empleados/perfil');
            perfil = response.data.perfil;
          } catch (profileError) {
            console.warn('No se pudo obtener el perfil completo, continuando con datos básicos:', profileError.message);
            // Si el error es de autenticación (401), el token es inválido/expiró en el servidor
            if (profileError.response && profileError.response.status === 401) {
              throw profileError;
            }
          }

          setUser({
            token,
            profile: perfil,
            id: decoded.id,
            rol_id: decoded.rol_id,
            correo: decoded.correo || (perfil ? perfil.correo : '')
          });
        } catch (error) {
          console.error('Sesión inválida o expirada:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (correo, contrasena) => {
    const response = await api.post('/auth/login', { correo, contrasena });
    const { token, user: userData } = response.data;
    
    localStorage.setItem('token', token);
    
    let profile = null;
    try {
      const profileResponse = await api.get('/empleados/perfil');
      profile = profileResponse.data.perfil;
    } catch {
      console.log('No se encontró perfil asociado al usuario actual.');
    }

    setUser({
      token,
      profile,
      id: userData.id,
      rol_id: userData.rol_id,
      correo: userData.correo
    });

    return response.data;
  };

  const loginGoogle = async (googleData) => {
    try {
      // Soporta tanto recibir el string directo del token como un objeto wrapper { tokenGoogle }
      const tokenGoogle = (googleData && typeof googleData === 'object' && googleData.tokenGoogle)
        ? googleData.tokenGoogle
        : googleData;

      // 1. Hacemos la petición a la API
      const response = await api.post('/auth/google', { tokenGoogle });
      const { token } = response.data;
      const userData = response.data.user || response.data.usuario;

      // Guardamos el token en localStorage
      localStorage.setItem('token', token);

      // 2. Intentamos buscar el perfil completo, pero si falla NO estrellamos la app
      let profile = null;
      try {
        const perfilResponse = await api.get('/empleados/perfil');
        profile = perfilResponse.data.perfil;
      } catch {
        console.warn("No se encontró perfil en /api/empleados/perfil. Usando datos básicos.");
      }

      setUser({
        token,
        profile,
        id: userData.id,
        rol_id: userData.rol_id,
        correo: userData.correo
      });

      return response.data;
    } catch (error) {
      console.error("Error en loginGoogle:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, loginGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
