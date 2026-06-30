import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { obtenerEmpleados, actualizarEmpleado, eliminarEmpleado } from '../services/api';
import AdminLayout from '../components/AdminLayout';

const ListaEmpleados = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbiertoId, setMenuAbiertoId]= useState(null);

  // Obtener filtro inicial del query string
  const queryParams = new URLSearchParams(location.search);
  const filtroInicial = queryParams.get('filtro') === 'sin-contrato' ? 'Sin Contrato' : 'Todos';

  const [filtroContrato, setFiltroContrato] = useState(filtroInicial);

  // Sincronizar el filtro si cambia el query string
  useEffect(() => {
    const qParams = new URLSearchParams(location.search);
    const filterVal = qParams.get('filtro') === 'sin-contrato' ? 'Sin Contrato' : 'Todos';
    setFiltroContrato(filterVal);
  }, [location.search]);

  // Estados para Edición y Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [editFormData, setEditFormData] = useState({
    correo: '',
    documento_identidad: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    fecha_ingreso: '',
    superior_inmediato: '',
    habilidades: '',
    fecha_info_personal: '',
    fecha_soportes: '',
    fecha_seguridad: '',
    departamento: '',
    fecha_terminacion: '',
    tipo_genero: '',
    fecha_nacimiento: '',
    correo_personal: '',
    contacto_emergencia: '',
    parentesco: '',
    telefono_emergencia: ''
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
    
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setEditFormData({
      correo: emp.correo || '',
      documento_identidad: emp.documento_identidad || '',
      nombres: emp.nombres || '',
      apellidos: emp.apellidos || '',
      telefono: emp.telefono || '',
      fecha_ingreso: formatDate(emp.fecha_ingreso),
      superior_inmediato: emp.superior_inmediato || '',
      habilidades: Array.isArray(emp.habilidades) ? emp.habilidades.join(', ') : '',
      fecha_info_personal: formatDate(emp.fecha_info_personal),
      fecha_soportes: formatDate(emp.fecha_soportes),
      fecha_seguridad: formatDate(emp.fecha_seguridad),
      departamento: emp.departamento || '',
      fecha_terminacion: formatDate(emp.fecha_terminacion),
      tipo_genero: emp.tipo_genero || '',
      fecha_nacimiento: formatDate(emp.fecha_nacimiento),
      correo_personal: emp.correo_personal || '',
      contacto_emergencia: emp.contacto_emergencia || '',
      parentesco: emp.parentesco || '',
      telefono_emergencia: emp.telefono_emergencia || ''
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
        correo: editFormData.correo || null,
        documento_identidad: editFormData.documento_identidad,
        nombres: editFormData.nombres,
        apellidos: editFormData.apellidos,
        telefono: editFormData.telefono || null,
        fecha_ingreso: editFormData.fecha_ingreso || null,
        superior_inmediato: editFormData.superior_inmediato || null,
        habilidades: editFormData.habilidades ? editFormData.habilidades.split(',').map(s => s.trim()).filter(Boolean) : [],
        fecha_info_personal: editFormData.fecha_info_personal || null,
        fecha_soportes: editFormData.fecha_soportes || null,
        fecha_seguridad: editFormData.fecha_seguridad || null,
        departamento: editFormData.departamento || null,
        fecha_terminacion: editFormData.fecha_terminacion || null,
        tipo_genero: editFormData.tipo_genero || null,
        fecha_nacimiento: editFormData.fecha_nacimiento || null,
        correo_personal: editFormData.correo_personal || null,
        contacto_emergencia: editFormData.contacto_emergencia || null,
        parentesco: editFormData.parentesco || null,
        telefono_emergencia: editFormData.telefono_emergencia || null
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

  const empleadosFiltrados = empleados.filter((emp) => {
    if (filtroContrato === 'Sin Contrato') {
      return !emp.tiene_contrato;
    }
    return true;
  });

  return (
    <AdminLayout>
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
            <div className="space-y-6 p-6">
              {/* Header de la tabla con toggle de filtro */}
              <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-850 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">Colaboradores Registrados</h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Administre las cuentas y fichas de su personal.</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex bg-slate-950 border border-slate-850 rounded-lg p-0.5">
                    <button 
                      onClick={() => setFiltroContrato('Todos')}
                      className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                        filtroContrato === 'Todos' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Todos
                    </button>
                    <button 
                      onClick={() => setFiltroContrato('Sin Contrato')}
                      className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                        filtroContrato === 'Sin Contrato' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Sin Contrato
                    </button>
                  </div>
                </div>
              </div>

              {empleadosFiltrados.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <span className="material-symbols-outlined text-slate-600 text-4xl">work_off</span>
                  <p className="text-slate-400 font-medium text-sm">No hay colaboradores sin contrato activo bajo este filtro.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-4 px-6">Colaborador</th>
                        <th className="py-4 px-6">Teléfono</th>
                        <th className="py-4 px-6">Ingreso</th>
                        <th className="py-4 px-6">Contrato</th>
                        <th className="py-4 px-6 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-sm">
                      {empleadosFiltrados.map((emp) => (
                        <tr 
                          key={emp.id} 
                          className="hover:bg-slate-800/30 transition-colors group"
                        >
                          <td className="py-4 px-6">
                            <div className='flex gap-2 items-center'>
                            <img src="http://localhost:3000/uploads/perfiles/foto-1781366448102-987988271.jpg" alt="" className='w-10 h-10 rounded-full' />
                            <div>
                            <div className='font-medium text-slate-200'> { emp.nombres} { emp.apellidos}</div>
                            <div className='text-xs  text-slate-400'> { emp.correo}</div>
                            </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-400">
                            {emp.telefono || 'No registrado'}
                          </td>
                          <td className="py-4 px-6 text-slate-400">
                            {new Date(emp.fecha_ingreso).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            {emp.tiene_contrato ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.08)]">
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-emerald-400"></span>
                                Con Contrato
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.08)] animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-400 animate-pulse"></span>
                                Sin Contrato
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex justify-center items-center gap-2 relative">
                              
                              <button
                                onClick={() => setMenuAbiertoId(emp.id)}
                                className="text-white font-semibold text-xs py-1.5 px-3 rounded-lg shadow-md hover:shadow-sky-500/10 transition-all cursor-pointer">
                               <span className='material-symbols-outlined'> more_vert </span>
                              </button>
                              {menuAbiertoId == emp.id && <div className="absolute z-10 border border-slate-700/50 py-1.5 min-w-[90px] bg-slate-800 right-0 mt-0 rounded-md shadow-lg flex items-center gap-1.5 justify-end">
                                <button className='text-xs text-slate-300 px-4 py-2 hover:text-green-300 text-left material-symbols-outlined' onClick={()=>handleOpenEdit(emp)}>Edit_Square</button>
                                <button className='text-xs text-slate-300 px-4 py-2 hover:text-red-400 text-left material-symbols-outlined ' onClick={()=>handleDelete(emp.id)}>delete</button>

                                </div>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                
                {/* Correo Institucional */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_correo">
                    Correo Institucional *
                  </label>
                  <input
                    id="edit_correo"
                    name="correo"
                    type="email"
                    required
                    className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={editFormData.correo}
                    onChange={(e) => setEditFormData({ ...editFormData, correo: e.target.value })}
                  />
                </div>

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

                {/* Fecha Terminación */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_fecha_terminacion">
                    Fecha de Terminación
                  </label>
                  <input
                    id="edit_fecha_terminacion"
                    name="fecha_terminacion"
                    type="date"
                    className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={editFormData.fecha_terminacion}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha_terminacion: e.target.value })}
                  />
                </div>

                {/* Superior Inmediato */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_superior_inmediato">
                    Superior Inmediato
                  </label>
                  <input
                    id="edit_superior_inmediato"
                    name="superior_inmediato"
                    type="text"
                    placeholder="Ej. Dra. Marta Rivera"
                    className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-550 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={editFormData.superior_inmediato}
                    onChange={(e) => setEditFormData({ ...editFormData, superior_inmediato: e.target.value })}
                  />
                </div>

                {/* Departamento */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_departamento">
                    Departamento (Ej. Académico - STEM)
                  </label>
                  <input
                    id="edit_departamento"
                    name="departamento"
                    type="text"
                    placeholder="Ej. Académico - STEM"
                    className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-550 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={editFormData.departamento}
                    onChange={(e) => setEditFormData({ ...editFormData, departamento: e.target.value })}
                  />
                </div>

                {/* Género */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_tipo_genero">
                    Género
                  </label>
                  <select
                    id="edit_tipo_genero"
                    name="tipo_genero"
                    className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={editFormData.tipo_genero}
                    onChange={(e) => setEditFormData({ ...editFormData, tipo_genero: e.target.value })}
                  >
                    <option value="">Seleccione género</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_fecha_nacimiento">
                    Fecha de Nacimiento
                  </label>
                  <input
                    id="edit_fecha_nacimiento"
                    name="fecha_nacimiento"
                    type="date"
                    className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={editFormData.fecha_nacimiento}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha_nacimiento: e.target.value })}
                  />
                </div>

                {/* Correo Personal */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_correo_personal">
                    Correo Personal
                  </label>
                  <input
                    id="edit_correo_personal"
                    name="correo_personal"
                    type="email"
                    placeholder="Ej. personal@correo.com"
                    className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={editFormData.correo_personal}
                    onChange={(e) => setEditFormData({ ...editFormData, correo_personal: e.target.value })}
                  />
                </div>

                {/* Habilidades */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_habilidades">
                    Habilidades (separadas por coma)
                  </label>
                  <input
                    id="edit_habilidades"
                    name="habilidades"
                    type="text"
                    placeholder="Ej. Node.js, Inglés B2, Google Workspace"
                    className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-550 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={editFormData.habilidades}
                    onChange={(e) => setEditFormData({ ...editFormData, habilidades: e.target.value })}
                  />
                </div>

                {/* Fecha Info Personal */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_fecha_info_personal">
                    Fecha Verificación Info Personal
                  </label>
                  <input
                    id="edit_fecha_info_personal"
                    name="fecha_info_personal"
                    type="date"
                    className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={editFormData.fecha_info_personal}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha_info_personal: e.target.value })}
                  />
                </div>

                {/* Fecha Soportes */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_fecha_soportes">
                    Fecha Verificación Soportes
                  </label>
                  <input
                    id="edit_fecha_soportes"
                    name="fecha_soportes"
                    type="date"
                    className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={editFormData.fecha_soportes}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha_soportes: e.target.value })}
                  />
                </div>

                {/* Fecha Seguridad */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_fecha_seguridad">
                    Fecha Validación Seguridad
                  </label>
                  <input
                    id="edit_fecha_seguridad"
                    name="fecha_seguridad"
                    type="date"
                    className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={editFormData.fecha_seguridad}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha_seguridad: e.target.value })}
                  />
                </div>

                <h4 className="text-sm font-bold text-emerald-400 border-b border-slate-800 pb-1 pt-2">
                  Contacto de Emergencia
                </h4>

                {/* Contacto de Emergencia - Nombre */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_contacto_emergencia">
                    Nombre del Contacto
                  </label>
                  <input
                    id="edit_contacto_emergencia"
                    name="contacto_emergencia"
                    type="text"
                    placeholder="Nombre completo"
                    className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={editFormData.contacto_emergencia}
                    onChange={(e) => setEditFormData({ ...editFormData, contacto_emergencia: e.target.value })}
                  />
                </div>

                {/* Contacto de Emergencia - Parentesco */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_parentesco">
                    Parentesco
                  </label>
                  <input
                    id="edit_parentesco"
                    name="parentesco"
                    type="text"
                    placeholder="Ej. Madre, Cónyuge, Hermano"
                    className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={editFormData.parentesco}
                    onChange={(e) => setEditFormData({ ...editFormData, parentesco: e.target.value })}
                  />
                </div>

                {/* Contacto de Emergencia - Teléfono */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="edit_telefono_emergencia">
                    Teléfono de Emergencia
                  </label>
                  <input
                    id="edit_telefono_emergencia"
                    name="telefono_emergencia"
                    type="text"
                    placeholder="Ej. +57 300 000 0000"
                    className="w-full bg-slate-950/50 border border-slate-700/60 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={editFormData.telefono_emergencia}
                    onChange={(e) => setEditFormData({ ...editFormData, telefono_emergencia: e.target.value })}
                  />
                </div>

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
    </AdminLayout>
  );
};

export default ListaEmpleados;
