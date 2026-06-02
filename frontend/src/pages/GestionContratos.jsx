import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerEmpleados, obtenerContratos, crearContrato } from '../services/api';

const GestionContratos = () => {
  const [empleados, setEmpleados] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [formData, setFormData] = useState({
    empleado_id: '',
    tipo_contrato: '',
    cargo: '',
    fecha_inicio: '',
    fecha_fin: '',
    salario: '',
    estado: 'Activo'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empData, conData] = await Promise.all([
          obtenerEmpleados(),
          obtenerContratos()
        ]);
        setEmpleados(empData.empleados || []);
        setContratos(conData.contratos || []);
      } catch (err) {
        console.error(err);
        setError('Error al cargar la información de colaboradores y contratos.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
    setSubmitting(true);

    const payload = {
      empleado_id: parseInt(formData.empleado_id),
      tipo_contrato: formData.tipo_contrato,
      cargo: formData.cargo,
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin || undefined,
      salario: parseFloat(formData.salario),
      estado: formData.estado
    };

    try {
      await crearContrato(payload);
      setSuccess('Contrato laboral asignado con éxito.');
      setFormData({
        empleado_id: '',
        tipo_contrato: '',
        cargo: '',
        fecha_inicio: '',
        fecha_fin: '',
        salario: '',
        estado: 'Activo'
      });
      // Recargar contratos
      const conData = await obtenerContratos();
      setContratos(conData.contratos || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al guardar el contrato.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Banner de Advertencia Restringido */}
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium rounded-xl p-4 flex items-center gap-3 shadow-lg">
          <span className="text-xl">⚠️</span>
          <span><strong>Vista con acceso restringido (Nivel Administrador)</strong> - Se está manejando información salarial y financiera sensible de la empresa.</span>
        </div>

        {/* Header de navegación */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mb-2 transition-colors"
            >
              ← Volver al Dashboard
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Gestión de Contratos Laborales
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Asignación, salarios e historial contractual del personal.
            </p>
          </div>
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

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Cargando datos del sistema...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Formulario de Asignación (Bento Grid Style) */}
            <div className="lg:col-span-1 bg-slate-950/40 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-md">
              <h2 className="text-lg font-semibold border-b border-slate-800 pb-2 text-emerald-400">
                Asignar Contrato
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Seleccionar Empleado */}
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5" htmlFor="empleado_id">
                    Empleado Colaborador *
                  </label>
                  <select
                    id="empleado_id"
                    name="empleado_id"
                    required
                    className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={formData.empleado_id}
                    onChange={handleChange}
                  >
                    <option value="" className="bg-slate-900 text-slate-400">Selecciona un empleado...</option>
                    {empleados.map((emp) => (
                      <option key={emp.id} value={emp.id} className="bg-slate-900 text-white">
                        {emp.nombres} {emp.apellidos} ({emp.documento_identidad})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cargo */}
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5" htmlFor="cargo">
                    Cargo o Puesto *
                  </label>
                  <input
                    id="cargo"
                    name="cargo"
                    type="text"
                    required
                    placeholder="Ej. Desarrollador Senior"
                    className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-550 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={formData.cargo}
                    onChange={handleChange}
                  />
                </div>

                {/* Tipo de Contrato */}
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5" htmlFor="tipo_contrato">
                    Tipo de Contrato *
                  </label>
                  <select
                    id="tipo_contrato"
                    name="tipo_contrato"
                    required
                    className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={formData.tipo_contrato}
                    onChange={handleChange}
                  >
                    <option value="" className="bg-slate-900 text-slate-400">Selecciona tipo...</option>
                    <option value="Fijo" className="bg-slate-900 text-white">Fijo</option>
                    <option value="Indefinido" className="bg-slate-900 text-white">Indefinido</option>
                    <option value="Prestación de Servicios" className="bg-slate-900 text-white">Prestación de Servicios</option>
                  </select>
                </div>

                {/* Salario Base */}
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5" htmlFor="salario">
                    Salario Base (COP) *
                  </label>
                  <input
                    id="salario"
                    name="salario"
                    type="number"
                    required
                    placeholder="Ej. 2500000"
                    className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-550 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={formData.salario}
                    onChange={handleChange}
                  />
                </div>

                {/* Fecha Inicio */}
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5" htmlFor="fecha_inicio">
                    Fecha de Inicio *
                  </label>
                  <input
                    id="fecha_inicio"
                    name="fecha_inicio"
                    type="date"
                    required
                    className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                  />
                </div>

                {/* Fecha Fin */}
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5" htmlFor="fecha_fin">
                    Fecha de Fin (Opcional)
                  </label>
                  <input
                    id="fecha_fin"
                    name="fecha_fin"
                    type="date"
                    className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={formData.fecha_fin}
                    onChange={handleChange}
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5" htmlFor="estado">
                    Estado
                  </label>
                  <select
                    id="estado"
                    name="estado"
                    className="w-full bg-slate-800/40 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={formData.estado}
                    onChange={handleChange}
                  >
                    <option value="Activo" className="bg-slate-900 text-white">Activo</option>
                    <option value="Inactivo" className="bg-slate-900 text-white">Inactivo</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg py-2.5 px-4 shadow-lg hover:shadow-emerald-500/20 transition-all text-sm disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Asignar Contrato'}
                </button>
              </form>
            </div>

            {/* Listado de Contratos */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50">
                  <h2 className="text-lg font-semibold text-emerald-400">Contratos Registrados</h2>
                </div>

                {contratos.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="text-slate-500 text-5xl">📄</div>
                    <p className="text-slate-400 font-medium">No hay contratos activos registrados en el sistema.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800/80 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          <th className="py-3 px-6">Empleado</th>
                          <th className="py-3 px-6">Cargo</th>
                          <th className="py-3 px-6">Tipo</th>
                          <th className="py-3 px-6 text-right">Salario Base</th>
                          <th className="py-3 px-6">Fecha Inicio</th>
                          <th className="py-3 px-6">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-sm">
                        {contratos.map((contrato) => (
                          <tr key={contrato.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-6 font-medium text-slate-200">
                              {contrato.nombres} {contrato.apellidos}
                            </td>
                            <td className="py-4 px-6 text-slate-300">
                              {contrato.cargo || 'No especificado'}
                            </td>
                            <td className="py-4 px-6 text-slate-300">
                              <span className="px-2.5 py-0.5 rounded text-xs bg-slate-800 text-slate-400">
                                {contrato.tipo_contrato}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-mono font-bold text-emerald-400">
                              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(contrato.salario)}
                            </td>
                            <td className="py-4 px-6 text-slate-400">
                              {new Date(contrato.fecha_inicio).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                contrato.estado === 'Activo' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {contrato.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default GestionContratos;
