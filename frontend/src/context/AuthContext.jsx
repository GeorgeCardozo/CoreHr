import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/empleados/perfil');
          const perfil = response.data.perfil;
          setUser({
            token,
            profile: perfil,
            id: perfil.usuario_id,
            rol_id: perfil.rol_id,
            correo: perfil.correo
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
    } catch (e) {
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

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
