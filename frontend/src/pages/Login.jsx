import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(correo, contrasena);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100">
      {/* Panel Izquierdo: Diseño Split de Esmeralda Oscuro Corporativo */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 p-12 flex-col justify-between relative overflow-hidden">
        {/* Efectos difusos de luz de fondo */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            CoreRRHH
          </span>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Gestión inteligente de personal y contratos.
          </h1>
          <p className="text-emerald-300/80 text-lg">
            Accede al portal para gestionar contratos de trabajo, consultar tu perfil de empleado y automatizar documentación laboral de forma segura.
          </p>
        </div>

        <div className="relative z-10 text-xs text-emerald-400/60">
          © 2026 CoreRRHH. Todos los derechos reservados.
        </div>
      </div>

      {/* Panel Derecho: Formulario Limpio */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 bg-slate-900">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-white tracking-tight">Iniciar Sesión</h2>
            <p className="text-slate-400 text-sm mt-2">
              Ingresa tus credenciales para acceder a la plataforma.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="correo">
                Correo Electrónico
              </label>
              <input
                id="correo"
                type="email"
                required
                className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="nombre@empresa.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="contrasena">
                Contraseña
              </label>
              <input
                id="contrasena"
                type="password"
                required
                className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg py-3 px-4 shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Validando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
