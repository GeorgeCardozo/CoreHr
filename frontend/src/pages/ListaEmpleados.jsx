import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerEmpleados, actualizarEmpleado, eliminarEmpleado } from '../services/api';

const ListaEmpleados = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Estados para Edición y Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [editFormData, setEditFormData] = useState({
    documento_identidad: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    fecha_ingreso: ''
  });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchEmpleados = async () => {
    try {
      const data = await obtenerEmpleados();
      setEmpleados(data.empleados || []);
    } catch (err) {
      console.error(err);
      setError('Error al obtener la lista de colaboradores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar a este colaborador? Esta acción también eliminará su cuenta de usuario y es irreversible.')) {
      try {
        setError('');
        await eliminarEmpleado(id);
        setEmpleados((prev) => prev.filter((emp) => emp.id !== id));
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Error al eliminar el colaborador.');
      }
    }
  };

  const handleOpenEdit = (emp) => {
    setSelectedEmpleado(emp);
    
    let formattedDate = '';
    if (emp.fecha_ingreso) {
      const d = new Date(emp.fecha_ingreso);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
    }

    setEditFormData({
      documento_identidad: emp.documento_identidad || '',
      nombres: emp.nombres || '',
      apellidos: emp.apellidos || '',
      telefono: emp.telefono || '',
      fecha_ingreso: formattedDate
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);

    try {
      const data = await actualizarEmpleado(selectedEmpleado.id, {
        documento_identidad: editFormData.documento_identidad,
        nombres: editFormData.nombres,
        apellidos: editFormData.apellidos,
        telefono: editFormData.telefono || null,
        fecha_ingreso: editFormData.fecha_ingreso || null
      });

      // Actualizar la lista localmente
      setEmpleados((prev) => 
        prev.map((emp) => emp.id === selectedEmpleado.id ? { ...emp, ...data.empleado } : emp)
      );
      setIsEditModalOpen(false);
      setSelectedEmpleado(null);
    } catch (err) {
      console.error(err);
      setEditError(err.response?.data?.message || 'Error al actualizar los datos del colaborador.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header con navegación y botón de creación */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mb-2 transition-colors"
            >
              ← Volver al Dashboard
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Colaboradores de CoreRRHH
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Listado general y administración del personal contratado.
            </p>
          </div>
          <button
            onClick={() => navigate('/crear-empleado')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg py-2.5 px-4 shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <span className="text-lg font-bold">+</span> Registrar Colaborador
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Bento-Grid / Contenedor Estilizado de Tabla */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-slate-400 text-sm">Cargando colaboradores...</p>
            </div>
          ) : empleados.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="text-slate-500 text-5xl">👥</div>
              <p className="text-slate-400 font-medium">No hay colaboradores registrados en el sistema.</p>
              <p className="text-slate-500 text-xs">Presiona el botón superior para añadir el primer empleado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-6">Documento</th>
                    <th className="py-4 px-6">Nombres</th>
                    <th className="py-4 px-6">Apellidos</th>
                    <th className="py-4 px-6">Teléfono</th>
                    <th className="py-4 px-6">Ingreso</th>
                    <th className="py-4 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {empleados.map((emp) => (
                    <tr 
                      key={emp.id} 
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="py-4 px-6 font-mono text-emerald-400 group-hover:text-emerald-300">
                        {emp.documento_identidad}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-200">
                        {emp.nombres}
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {emp.apellidos}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {emp.telefono || 'No registrado'}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {new Date(emp.fecha_ingreso).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs py-1.5 px-3 rounded-lg shadow-md hover:shadow-sky-500/10 transition-all cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs py-1.5 px-3 rounded-lg shadow-md hover:shadow-rose-500/10 transition-all cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Editar Colaborador
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-2xl font-bold focus:outline-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {editError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg p-2.5">
                {editError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              
              {/* Documento Identidad */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_documento_identidad">
                  Documento de Identidad *
                </label>
                <input
                  id="edit_documento_identidad"
                  name="documento_identidad"
                  type="text"
                  required
                  className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-550 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  value={editFormData.documento_identidad}
                  onChange={(e) => setEditFormData({ ...editFormData, documento_identidad: e.target.value })}
                />
              </div>

              {/* Nombres */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_nombres">
                  Nombres *
                </label>
                <input
                  id="edit_nombres"
                  name="nombres"
                  type="text"
                  required
                  className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-550 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  value={editFormData.nombres}
                  onChange={(e) => setEditFormData({ ...editFormData, nombres: e.target.value })}
                />
              </div>

              {/* Apellidos */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_apellidos">
                  Apellidos *
                </label>
                <input
                  id="edit_apellidos"
                  name="apellidos"
                  type="text"
                  required
                  className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-550 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  value={editFormData.apellidos}
                  onChange={(e) => setEditFormData({ ...editFormData, apellidos: e.target.value })}
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_telefono">
                  Teléfono de Contacto
                </label>
                <input
                  id="edit_telefono"
                  name="telefono"
                  type="text"
                  placeholder="Ej. +57 300 000 0000"
                  className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-550 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  value={editFormData.telefono}
                  onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
                />
              </div>

              {/* Fecha Ingreso */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_fecha_ingreso">
                  Fecha de Ingreso
                </label>
                <input
                  id="edit_fecha_ingreso"
                  name="fecha_ingreso"
                  type="date"
                  className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  value={editFormData.fecha_ingreso}
                  onChange={(e) => setEditFormData({ ...editFormData, fecha_ingreso: e.target.value })}
                />
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg px-5 py-2 text-xs shadow-lg hover:shadow-emerald-500/10 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaEmpleados;
