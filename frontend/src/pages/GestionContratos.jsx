import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerEmpleados, obtenerContratos, crearContrato, actualizarContrato } from '../services/api';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../assets/default_avatar.png';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

// Componente reutilizable para Input con Etiqueta Flotante
const FloatingInput = ({ label, id, name, value, onChange, type = 'text', required = false, placeholder = '', prefix = '', readOnly = false, disabled = false }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`relative border border-slate-850 rounded-lg bg-slate-950/90 focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all duration-200 ${disabled || readOnly ? 'opacity-60 bg-slate-950/40' : ''}`}>
      {prefix && (
        <span className="absolute left-3 top-[17px] text-xs text-slate-500 font-semibold">
          {prefix}
        </span>
      )}
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={focused ? placeholder : ''}
        readOnly={readOnly}
        disabled={disabled}
        className={`block w-full px-3 pt-5 pb-1.5 text-xs text-white bg-transparent border-0 focus:outline-none focus:ring-0 ${prefix ? 'pl-6' : ''} ${disabled || readOnly ? 'cursor-not-allowed' : ''}`}
      />
      <label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-200 pointer-events-none ${
          focused || value || type === 'date'
            ? 'top-1 text-[9px] text-emerald-450 font-bold uppercase tracking-wider'
            : 'top-3 text-xs text-slate-400'
        } ${prefix && !(focused || value) ? 'pl-3' : ''}`}
      >
        {label}
      </label>
    </div>
  );
};

// Componente reutilizable para Select con Etiqueta Flotante
const FloatingSelect = ({ label, id, name, value, onChange, options, required = false }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative border border-slate-850 rounded-lg bg-slate-950/90 focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all duration-200">
      <select
        id={id}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="block w-full px-3 pt-5 pb-1.5 text-xs text-white bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer appearance-none"
        style={{ colorScheme: 'dark' }}
      >
        <option value="" disabled className="bg-slate-950 text-slate-550">Search by name...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-950 text-white">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
        <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
      </div>
      <label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-200 pointer-events-none ${
          focused || value
            ? 'top-1 text-[9px] text-emerald-450 font-bold uppercase tracking-wider'
            : 'top-3 text-xs text-slate-400'
        }`}
      >
        {label}
      </label>
    </div>
  );
};

const GestionContratos = () => {
  const { user, logout } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [formData, setFormData] = useState({
    empleado_id: '',
    empleado_nombre: '',
    tipo_contrato: 'Indefinido',
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

  // Estados para Edición y Filtros
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingContractId, setEditingContractId] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('Todos');

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

  const handleStartEdit = (contrato) => {
    setIsEditing(true);
    setShowForm(true);
    setEditingContractId(contrato.id);
    
    let formattedInicio = '';
    if (contrato.fecha_inicio) {
      const d = new Date(contrato.fecha_inicio);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      formattedInicio = `${year}-${month}-${day}`;
    }
    
    let formattedFin = '';
    if (contrato.fecha_fin) {
      const d = new Date(contrato.fecha_fin);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      formattedFin = `${year}-${month}-${day}`;
    }

    setFormData({
      empleado_id: contrato.empleado_id.toString(),
      empleado_nombre: `${contrato.nombres} ${contrato.apellidos}`,
      tipo_contrato: contrato.tipo_contrato || 'Indefinido',
      cargo: contrato.cargo || '',
      fecha_inicio: formattedInicio,
      fecha_fin: formattedFin,
      salario: contrato.salario.toString(),
      estado: contrato.estado || 'Activo'
    });
    setError('');
    setSuccess('');
    // Scroll smoothly to form card
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setShowForm(false);
    setEditingContractId(null);
    setFormData({
      empleado_id: '',
      empleado_nombre: '',
      tipo_contrato: 'Indefinido',
      cargo: '',
      fecha_inicio: '',
      fecha_fin: '',
      salario: '',
      estado: 'Activo'
    });
    setError('');
    setSuccess('');
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
      if (isEditing) {
        await actualizarContrato(editingContractId, payload);
        toast.success('Contrato laboral actualizado con éxito.');
        setSuccess('Contrato laboral actualizado con éxito.');
        handleCancelEdit();
      } else {
        await crearContrato(payload);
        toast.success('Contrato laboral asignado con éxito.');
        setSuccess('Contrato laboral asignado con éxito.');
        handleCancelEdit();
      }
      // Recargar contratos
      const conData = await obtenerContratos();
      setContratos(conData.contratos || []);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Error al guardar el contrato.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const manejarModuloEnDesarrollo = (e) => {
    e.preventDefault();
    toast('Módulo en desarrollo para la Fase 2', { icon: '🚧' });
  };

  const getAvatar = (contrato) => {
    if (contrato?.foto_perfil) {
      return `http://localhost:3000${contrato.foto_perfil}`;
    }
    return defaultAvatar;
  };

  // Filtrado de contratos en la tabla
  const contratosFiltrados = contratos.filter((con) => {
    if (filtroEstado === 'Todos') return true;
    return con.estado === filtroEstado;
  });

  const formatSalary = (val) => {
    return `${new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(parseFloat(val))} / mes`;
  };

  // Nombres del usuario activo
  const activeUserName = user?.profile
    ? `${user.profile.nombres} ${user.profile.apellidos || ''}`
    : (user?.correo ? user.correo.split('@')[0] : 'Alex Rivera');
  const activeUserRole = user?.profile?.cargo || 'Senior HR Lead';
  const activeUserAvatar = user?.profile?.foto_perfil
    ? `http://localhost:3000${user.profile.foto_perfil}`
    : defaultAvatar;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Restrained admin center info bar */}
        <div className="bg-amber-500/5 border border-amber-500/10 text-amber-400/90 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-sm">⚠️</span>
            <span><strong>Acceso restringido (Nivel de Administrador)</strong> - Está operando con información salarial y métricas financieras confidenciales de los colaboradores.</span>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs rounded-xl p-3">
              {success}
            </div>
          )}

          {loading ? (
            <div className="py-24 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-slate-450 text-sm">Cargando base operativa...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Form Bento Card (1/3 width) */}
              {showForm && (
                <div className="lg:col-span-1 bg-[#0e1320] border border-slate-850/80 rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-400 bg-emerald-500/10 p-2 rounded-xl text-[20px]">assignment_turned_in</span>
                    <h2 className="text-base font-bold text-white tracking-wide">
                      {isEditing ? 'Editar Contrato' : 'Asignar Contrato'}
                    </h2>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Category: INFORMACIÓN DEL EMPLEADO */}
                    <div className="space-y-4">
                      <span className="text-[9px] font-extrabold text-slate-500 tracking-widest uppercase block mb-1">
                        INFORMACIÓN DEL EMPLEADO
                      </span>

                      {isEditing ? (
                        <FloatingInput
                          label="Colaborador"
                          id="empleado_nombre"
                          name="empleado_nombre"
                          value={formData.empleado_nombre}
                          onChange={() => {}}
                          readOnly={true}
                        />
                      ) : (
                        <FloatingSelect
                          label="Seleccionar Colaborador *"
                          id="empleado_id"
                          name="empleado_id"
                          required
                          value={formData.empleado_id}
                          onChange={handleChange}
                          options={empleados
                            .filter(emp => !contratos.some(con => con.empleado_id === emp.id && con.estado === 'Activo'))
                            .map(emp => ({
                              value: emp.id.toString(),
                              label: `${emp.nombres} ${emp.apellidos} (${emp.documento_identidad})`
                            }))}
                        />
                      )}

                      <FloatingInput
                        label="Cargo / Departamento *"
                        id="cargo"
                        name="cargo"
                        required
                        placeholder="Ej. Soporte TI, Ingeniería"
                        value={formData.cargo}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Category: DETALLES DEL CONTRATO */}
                    <div className="border-t border-slate-850 pt-5 mt-6 space-y-4">
                      <span className="text-[9px] font-extrabold text-slate-500 tracking-widest uppercase block mb-1">
                        DETALLES DEL CONTRATO
                      </span>

                      <div className="grid grid-cols-2 gap-4">
                        <FloatingInput
                          label="Fecha de Inicio *"
                          id="fecha_inicio"
                          name="fecha_inicio"
                          type="date"
                          required
                          value={formData.fecha_inicio}
                          onChange={handleChange}
                        />

                        <FloatingInput
                          label="Fecha de Fin"
                          id="fecha_fin"
                          name="fecha_fin"
                          type="date"
                          value={formData.fecha_fin}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-extrabold text-slate-500 tracking-widest uppercase mb-1">
                          Tipo de Contrato *
                        </label>
                        <div className="flex bg-slate-950 border border-slate-850 rounded-lg p-1 gap-1">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, tipo_contrato: 'Indefinido' })}
                            className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all duration-200 cursor-pointer text-center ${
                              formData.tipo_contrato === 'Indefinido'
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                                : 'text-slate-400 hover:text-slate-200 border border-transparent'
                            }`}
                          >
                            Indefinido
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, tipo_contrato: 'Fijo' })}
                            className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all duration-200 cursor-pointer text-center ${
                              formData.tipo_contrato === 'Fijo'
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                                : 'text-slate-400 hover:text-slate-200 border border-transparent'
                            }`}
                          >
                            Término Fijo
                          </button>
                        </div>
                      </div>

                      <FloatingInput
                        label="Salario Mensual (COP) *"
                        id="salario"
                        name="salario"
                        type="number"
                        required
                        prefix="$"
                        placeholder="0.00"
                        value={formData.salario}
                        onChange={handleChange}
                      />

                      {isEditing && (
                        <div className="relative border border-slate-850 rounded-lg bg-slate-950/90 focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all duration-200">
                          <select
                            id="estado"
                            name="estado"
                            className="block w-full px-3 pt-5 pb-1.5 text-xs text-white bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer appearance-none"
                            value={formData.estado}
                            onChange={handleChange}
                            style={{ colorScheme: 'dark' }}
                          >
                            <option value="Activo" className="bg-slate-950 text-white">Activo</option>
                            <option value="Inactivo" className="bg-slate-950 text-white">Inactivo</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                            <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                          </div>
                          <label
                            htmlFor="estado"
                            className="absolute left-3 top-1 text-[9px] text-emerald-450 font-bold uppercase tracking-wider transition-all pointer-events-none"
                          >
                            Estado
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 space-y-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-lg py-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] active:scale-[0.99] transition-all text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <span>{isEditing ? 'Guardar Cambios' : 'Asignar Contrato'}</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="w-full bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-850 rounded-lg py-3 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        {isEditing ? 'Cancelar Edición' : 'Cancelar'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Right Bento Column (dynamic width) */}
              <div className={`${showForm ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6 transition-all duration-300`}>
                
                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* METRIC 1: TOTAL STAFF */}
                  <div className="bg-[#0e1320] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-350 hover:border-slate-700/60 hover:shadow-slate-900/10">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-500 tracking-widest uppercase block">Personal Total</span>
                      <span className="text-3xl font-extrabold text-white mt-1 block">{empleados.length}</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-400 mt-4 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">trending_up</span>
                      Colaboradores en sistema
                    </span>
                  </div>

                  {/* METRIC 2: ACTIVE CONTRACTS */}
                  <div className="bg-[#0e1320] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-350 hover:border-slate-700/60 hover:shadow-slate-900/10">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-500 tracking-widest uppercase block">Contratos Activos</span>
                      <span className="text-3xl font-extrabold text-white mt-1 block">
                        {contratos.filter(c => c.estado === 'Activo').length}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-450 mt-4 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      {contratos.length > 0 ? ((contratos.filter(c => c.estado === 'Activo').length / contratos.length) * 100).toFixed(1) : 0}% de cumplimiento
                    </span>
                  </div>

                  {/* METRIC 3: OPEN ROLES */}
                  <div 
                    onClick={() => navigate('/empleados?filtro=sin-contrato')}
                    className="bg-[#0e1320] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-350 hover:border-amber-500/30 hover:shadow-amber-500/5 cursor-pointer group"
                  >
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-500 tracking-widest uppercase block group-hover:text-amber-450 transition-colors">Vacantes Activas</span>
                      <span className="text-3xl font-extrabold text-white mt-1 block">
                        {empleados.filter(emp => !contratos.some(con => con.empleado_id === emp.id && con.estado === 'Activo')).length}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#f59e0b] mt-4 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">priority_high</span>
                      Colaboradores sin contrato
                    </span>
                  </div>
                </div>

                {/* Table Bento Card */}
                <div className="bg-[#0e1320] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-wide">Empleados Registrados</h2>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Administre y supervise la nómina de su personal.</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {!showForm && (
                        <button 
                          onClick={() => {
                            setIsEditing(false);
                            setShowForm(true);
                            setFormData({
                              empleado_id: '',
                              empleado_nombre: '',
                              tipo_contrato: 'Indefinido',
                              cargo: '',
                              fecha_inicio: '',
                              fecha_fin: '',
                              salario: '',
                              estado: 'Activo'
                            });
                            setError('');
                            setSuccess('');
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-[0.98]"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Asignar Contrato</span>
                        </button>
                      )}

                      <div className="flex bg-slate-950 border border-slate-850 rounded-lg p-0.5">
                        <button 
                          onClick={() => setFiltroEstado('Todos')}
                          className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                            filtroEstado === 'Todos' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Todos
                        </button>
                        <button 
                          onClick={() => setFiltroEstado('Activo')}
                          className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                            filtroEstado === 'Activo' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Activos
                        </button>
                        <button 
                          onClick={() => setFiltroEstado('Inactivo')}
                          className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                            filtroEstado === 'Inactivo' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Inactivos
                        </button>
                      </div>

                      <button 
                        onClick={manejarModuloEnDesarrollo}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-850 hover:border-slate-750 bg-slate-950 hover:bg-slate-900 rounded-lg text-slate-300 text-xs font-bold transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">filter_list</span>
                        <span>Filtrar</span>
                      </button>
                    </div>
                  </div>

                  {contratosFiltrados.length === 0 ? (
                    <div className="py-24 text-center space-y-4">
                      <span className="material-symbols-outlined text-slate-600 text-5xl">description</span>
                      <p className="text-slate-500 font-medium text-sm">No hay contratos registrados bajo los criterios seleccionados.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-hidden w-full">
                      <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                          <tr className="border-b border-slate-850 text-slate-500 text-[10px] font-medium uppercase tracking-widest">
                            <th className="pb-3 pr-4 font-medium w-[40%]">Nombre</th>
                            <th className="pb-3 px-4 font-medium w-[25%]">Cargo</th>
                            <th className="pb-3 px-4 font-medium w-[20%]">Salario</th>
                            <th className="pb-3 px-4 font-medium w-[15%]">Estado</th>
                            <th className="pb-3 pl-4 font-medium text-right w-[10%]">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 text-sm">
                          {contratosFiltrados.map((contrato) => (
                            <tr key={contrato.id} className="group hover:bg-slate-900/10 transition-colors">
                              <td className="py-3.5 pr-4 flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-850">
                                  <img 
                                    alt={`${contrato.nombres} profile avatar`}
                                    className="w-full h-full object-cover" 
                                    src={getAvatar(contrato)} 
                                  />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-slate-200 tracking-tight truncate max-w-[140px] sm:max-w-[180px]">
                                    {contrato.nombres} {contrato.apellidos}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium truncate max-w-[140px] sm:max-w-[180px] mt-0.5">
                                    {contrato.correo || `${contrato.nombres.toLowerCase()}@gla.edu.co`}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-xs text-slate-350 font-medium truncate">
                                {contrato.cargo || 'No especificado'}
                              </td>
                              <td className="py-3.5 px-4 text-xs text-slate-300 font-bold font-mono">
                                {formatSalary(contrato.salario)}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md transition-all ${
                                  contrato.estado === 'Activo' 
                                    ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.12)]' 
                                    : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.12)]'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${contrato.estado === 'Activo' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                                  {contrato.estado === 'Activo' ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="py-3.5 pl-4 text-right">
                                <button
                                  onClick={() => handleStartEdit(contrato)}
                                  className="text-slate-500 hover:text-emerald-400 hover:bg-slate-800/40 p-1.5 rounded-lg transition-all cursor-pointer material-symbols-outlined text-[18px]"
                                  title="Editar Contrato"
                                >
                                  edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination Row */}
                  <div className="pt-4 border-t border-slate-850 flex justify-between items-center text-xs text-slate-500 font-semibold">
                    <span>
                      Mostrando {contratosFiltrados.length > 0 ? 1 : 0} a {contratosFiltrados.length} de {contratosFiltrados.length} colaboradores
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={manejarModuloEnDesarrollo}
                        className="px-2 py-1 bg-slate-950 border border-slate-850 rounded hover:bg-slate-900 transition-colors text-slate-350 font-bold cursor-pointer"
                      >
                        &lt;
                      </button>
                      <button 
                        onClick={manejarModuloEnDesarrollo}
                        className="px-2 py-1 bg-slate-950 border border-slate-850 rounded hover:bg-slate-900 transition-colors text-slate-350 font-bold cursor-pointer"
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
      </div>
    </AdminLayout>
  );
};

export default GestionContratos;
