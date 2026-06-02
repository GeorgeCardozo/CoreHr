import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearEmpleado } from '../services/api';

const CrearEmpleado = () => {
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
    documento_identidad: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    fecha_ingreso: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload = {
      correo: formData.correo,
      contrasena: formData.contrasena,
      documento_identidad: formData.documento_identidad,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      telefono: formData.telefono || undefined,
      fecha_ingreso: formData.fecha_ingreso || undefined
    };

    try {
      await crearEmpleado(payload);
      setSuccess('Colaborador y cuenta de usuario creados exitosamente. Redirigiendo...');
      setTimeout(() => {
        navigate('/empleados');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al guardar los datos del colaborador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header de navegación */}
        <div>
          <button 
            onClick={() => navigate('/empleados')}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mb-2 transition-colors"
          >
            ← Volver a la Lista
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Registrar Nuevo Colaborador
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Crea la cuenta de acceso y la ficha de empleado de forma unificada.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg p-3">
            {success}
          </div>
        )}

        {/* Formulario Unificado a Dos Columnas */}
        <form 
          onSubmit={handleSubmit}
          className="bg-slate-950/40 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 backdrop-blur-md"
        >
          <h2 className="text-lg font-semibold border-b border-slate-800 pb-2 text-emerald-400">
            Datos de Acceso del Usuario
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Correo Institucional */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="correo">
                Correo Institucional *
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                required
                placeholder="Ej. colaborador@empresa.com"
                className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                value={formData.correo}
                onChange={handleChange}
              />
            </div>

            {/* Contraseña Temporal */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="contrasena">
                Contraseña Temporal *
              </label>
              <input
                id="contrasena"
                name="contrasena"
                type="text"
                required
                placeholder="Contraseña de primer ingreso"
                className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                value={formData.contrasena}
                onChange={handleChange}
              />
            </div>

          </div>

          <h2 className="text-lg font-semibold border-b border-slate-800 pb-2 pt-4 text-emerald-400">
            Ficha de Datos del Empleado
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Documento Identidad */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="documento_identidad">
                Documento de Identidad *
              </label>
              <input
                id="documento_identidad"
                name="documento_identidad"
                type="text"
                required
                placeholder="Ej. 987654321B"
                className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                value={formData.documento_identidad}
                onChange={handleChange}
              />
            </div>

            {/* Nombres */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="nombres">
                Nombres *
              </label>
              <input
                id="nombres"
                name="nombres"
                type="text"
                required
                placeholder="Nombres completos"
                className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                value={formData.nombres}
                onChange={handleChange}
              />
            </div>

            {/* Apellidos */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="apellidos">
                Apellidos *
              </label>
              <input
                id="apellidos"
                name="apellidos"
                type="text"
                required
                placeholder="Apellidos completos"
                className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                value={formData.apellidos}
                onChange={handleChange}
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="telefono">
                Teléfono de Contacto
              </label>
              <input
                id="telefono"
                name="telefono"
                type="text"
                placeholder="Ej. +34 600 000 000"
                className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>

            {/* Fecha Ingreso */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="fecha_ingreso">
                Fecha de Ingreso
              </label>
              <input
                id="fecha_ingreso"
                name="fecha_ingreso"
                type="date"
                className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                value={formData.fecha_ingreso}
                onChange={handleChange}
              />
            </div>

          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4 border-t border-slate-800 pt-6">
            <button
              type="button"
              onClick={() => navigate('/empleados')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg py-2.5 px-6 shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar Colaborador'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default CrearEmpleado;
