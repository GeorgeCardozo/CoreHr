import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerEmpleados, obtenerContratos, crearContrato, actualizarContrato, actualizarEmpleado, getAssetUrl } from '../services/api';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

// Componente reutilizable para Input con Etiqueta Flotante
const FloatingInput = ({ label, id, name, value, onChange, type = 'text', required = false, placeholder = '', prefix = '', readOnly = false, disabled = false }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`relative border border-outline-variant/60 rounded-lg bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all duration-200 ${disabled || readOnly ? 'opacity-60 bg-surface-container-lowest' : ''}`}>
      {prefix && (
        <span className="absolute left-3 top-[17px] text-xs text-on-surface-variant font-semibold">
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
        className={`block w-full px-3 pt-5 pb-1.5 text-xs text-on-surface bg-transparent border-0 focus:outline-none focus:ring-0 ${prefix ? 'pl-6' : ''} ${disabled || readOnly ? 'cursor-not-allowed' : ''}`}
      />
      <label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-200 pointer-events-none ${
          focused || value || type === 'date'
            ? 'top-1 text-[9px] text-primary font-bold uppercase tracking-wider'
            : 'top-3 text-xs text-on-surface-variant'
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
    <div className="relative border border-outline-variant/60 rounded-lg bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all duration-200">
      <select
        id={id}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="block w-full px-3 pt-5 pb-1.5 text-xs text-on-surface bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer appearance-none"
        style={{ colorScheme: 'dark' }}
      >
        <option value="" disabled className="bg-background text-on-surface-variant/70">Buscar por nombre…</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-background text-on-surface">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
      </div>
      <label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-200 pointer-events-none ${
          focused || value
            ? 'top-1 text-[9px] text-primary font-bold uppercase tracking-wider'
            : 'top-3 text-xs text-on-surface-variant'
        }`}
      >
        {label}
      </label>
    </div>
  );
};

// Se conservan como componentes reutilizables para futuras pantallas de formularios.
void FloatingInput;
void FloatingSelect;

const GestionContratos = () => {
  const [empleados, setEmpleados] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [formData, setFormData] = useState({
    empleado_id: '',
    empleado_nombre: '',
    tipo_contrato: 'Indefinido',
    cargo: '',
    cargo_actual: '',
    departamento: '',
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

    const emp = empleados.find(e => Number(e.id) === Number(contrato.empleado_id));
    setFormData({
      empleado_id: contrato.empleado_id.toString(),
      empleado_nombre: `${contrato.nombres} ${contrato.apellidos}`,
      tipo_contrato: contrato.tipo_contrato || 'Indefinido',
      cargo: contrato.cargo || '',
      cargo_actual: contrato.cargo || '',
      departamento: emp ? (emp.departamento || '') : '',
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
      cargo_actual: '',
      departamento: '',
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

        // Sincronizar departamento editado en el perfil del empleado
        const emp = empleados.find(e => Number(e.id) === Number(formData.empleado_id));
        if (emp && formData.departamento !== emp.departamento) {
          await actualizarEmpleado(emp.id, {
            ...emp,
            departamento: formData.departamento
          });
        }

        toast.success('Contrato laboral actualizado con éxito.');
        setSuccess('Contrato laboral actualizado con éxito.');
        handleCancelEdit();
      } else {
        await crearContrato(payload);

        // Sincronizar departamento asignado en el perfil del empleado
        const emp = empleados.find(e => Number(e.id) === Number(formData.empleado_id));
        if (emp && formData.departamento !== emp.departamento) {
          await actualizarEmpleado(emp.id, {
            ...emp,
            departamento: formData.departamento
          });
        }

        toast.success('Contrato laboral asignado con éxito.');
        setSuccess('Contrato laboral asignado con éxito.');
        handleCancelEdit();
      }

      // Recargar contratos y empleados para tener la información fresca
      const [empData, conData] = await Promise.all([
        obtenerEmpleados(),
        obtenerContratos()
      ]);
      setEmpleados(empData.empleados || []);
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
      return getAssetUrl(contrato.foto_perfil);
    }
    const nombres = contrato?.nombres || 'C';
    const apellidos = contrato?.apellidos || 'Colaborador';
    const iniciales = `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();

    const colores = [
      '#008080', '#004d40', '#0f766e', '#0369a1', '#1d4ed8',
      '#6d28d9', '#a21caf', '#be185d', '#b91c1c', '#c2410c'
    ];
    const index = (iniciales.charCodeAt(0) + (iniciales.charCodeAt(1) || 0)) % colores.length;
    const color = colores[index];

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <rect width="100" height="100" fill="${color}" />
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Inter', sans-serif" font-size="38" font-weight="bold" fill="#ffffff">
          ${iniciales}
        </text>
      </svg>
    `.trim().replace(/\s+/g, ' ');

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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

  if (isEditing) {
    const selectedEmp = empleados.find(emp => emp.id.toString() === formData.empleado_id);
    const documentId = selectedEmp?.documento_identidad || 'No disponible';
    const email = selectedEmp?.correo || 'No disponible';
    const nombres = selectedEmp?.nombres || formData.empleado_nombre.split(' ')[0];
    const apellidos = selectedEmp?.apellidos || formData.empleado_nombre.split(' ').slice(1).join(' ');

    return (
      <div className="min-h-screen bg-background text-on-surface font-sans transition-colors duration-200">
        <form onSubmit={handleSubmit} className="w-full flex flex-col min-h-screen">

          {/* Main Content Area */}
          <main className="flex-1 max-w-4xl w-full mx-auto py-12 px-6 pb-28 space-y-8">

            {/* Breadcrumbs and Title */}
            <div className="space-y-2">
              <nav className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                <span>Contratos</span>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                <span className="text-on-surface">Editar Contrato</span>
              </nav>
              <h1 className="text-2xl font-black text-on-surface tracking-tight">
                Editar Contrato: {formData.empleado_nombre}
              </h1>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl p-4 shadow-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form Steps / Cards */}
            <div className="space-y-6">

              {/* Card 1: Información del Colaborador */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-extrabold flex items-center justify-center text-sm shadow-sm select-none border border-primary/20">
                    1
                  </div>
                  <h3 className="text-sm font-bold text-on-surface tracking-tight uppercase">
                    Información del Colaborador
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">Nombres</label>
                    <input
                      type="text"
                      value={nombres}
                      readOnly
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 text-on-surface-variant text-xs focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">Apellidos</label>
                    <input
                      type="text"
                      value={apellidos}
                      readOnly
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 text-on-surface-variant text-xs focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">Documento de Identidad</label>
                    <input
                      type="text"
                      value={documentId}
                      readOnly
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 text-on-surface-variant text-xs focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">Correo Institucional</label>
                    <input
                      type="text"
                      value={email}
                      readOnly
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 text-on-surface-variant text-xs focus:outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Términos del Contrato */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-extrabold flex items-center justify-center text-sm shadow-sm select-none border border-primary/20">
                    2
                  </div>
                  <h3 className="text-sm font-bold text-on-surface tracking-tight uppercase">
                    Términos del Contrato
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Grid 1: fechas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">Fecha de Inicio *</label>
                      <input
                        type="date"
                        name="fecha_inicio"
                        required
                        value={formData.fecha_inicio}
                        onChange={handleChange}
                        className="w-full bg-background border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-lg py-2.5 px-4 text-on-surface text-xs focus:outline-none transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">Fecha de Fin</label>
                      <input
                        type="date"
                        name="fecha_fin"
                        value={formData.fecha_fin}
                        onChange={handleChange}
                        className="w-full bg-background border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-lg py-2.5 px-4 text-on-surface text-xs focus:outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Grid 2: tipo contrato y salario */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">Tipo de Contrato *</label>
                      <select
                        name="tipo_contrato"
                        required
                        value={formData.tipo_contrato}
                        onChange={handleChange}
                        className="w-full bg-background border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-lg py-2.5 px-4 text-on-surface text-xs focus:outline-none transition-all font-medium cursor-pointer"
                      >
                        <option value="Indefinido">Indefinido</option>
                        <option value="Fijo">Término Fijo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">Salario Mensual (COP) *</label>
                      <div className="relative rounded-lg border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all bg-background overflow-hidden">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-bold">$</span>
                        <input
                          type="number"
                          name="salario"
                          required
                          value={formData.salario}
                          onChange={handleChange}
                          className="w-full bg-transparent border-0 pl-7 pr-4 py-2.5 text-on-surface text-xs focus:outline-none font-medium"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cargo y Estado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">Cargo / Departamento *</label>
                      <input
                        type="text"
                        name="cargo"
                        required
                        value={formData.cargo}
                        onChange={handleChange}
                        className="w-full bg-background border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-lg py-2.5 px-4 text-on-surface text-xs focus:outline-none transition-all font-medium"
                        placeholder="Ej. Soporte TI"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">Estado del Contrato</label>
                      <select
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        className="w-full bg-background border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-lg py-2.5 px-4 text-on-surface text-xs focus:outline-none transition-all font-medium cursor-pointer"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </main>

          {/* Sticky Footer Bar */}
          <footer className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest/90 backdrop-blur border-t border-outline-variant py-4 px-8 flex justify-end items-center gap-3 z-50">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant border border-outline-variant px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-700 hover:bg-emerald-650 text-white font-semibold px-6 py-2.5 rounded-lg text-xs shadow-md hover:shadow-emerald-700/10 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </footer>

        </form>
      </div>
    );
  }

  if (showForm && !isEditing) {
    return (
      <AdminLayout>
        <div className="space-y-8 max-w-4xl mx-auto py-4">

          {/* Breadcrumbs and Title */}
          <div className="space-y-2">
            <nav className="text-xs font-semibold text-on-surface-variant/70 flex items-center gap-1.5">
              <span className="cursor-pointer hover:text-on-surface transition-colors" onClick={() => setShowForm(false)}>Contratos</span>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-on-surface font-bold">Registrar Nuevo Contrato</span>
            </nav>
            <h1 className="text-2xl font-black text-on-surface tracking-tight">
              Registro de Contrato
            </h1>
            <p className="text-on-surface-variant text-xs font-medium">
              Complete los campos necesarios para formalizar la vinculación laboral.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-4 shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Card 1: Información del Colaborador */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-extrabold flex items-center justify-center text-sm shadow-sm select-none border border-primary/20">
                  1
                </div>
                <h3 className="text-sm font-bold text-on-surface tracking-tight uppercase">
                  Información del Colaborador
                </h3>
              </div>

              <div className="space-y-4">
                {/* Seleccionar Colaborador */}
                <div>
                  <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">
                    Seleccionar Colaborador *
                  </label>
                  <select
                    id="empleado_id"
                    name="empleado_id"
                    required
                    value={formData.empleado_id}
                    onChange={(e) => {
                      const empId = e.target.value;
                      const emp = empleados.find(emp => Number(emp.id) === Number(empId));

                      // Buscar el cargo del contrato más reciente para este colaborador
                      const lastContract = contratos
                        .filter(con => Number(con.empleado_id) === Number(empId))
                        .sort((a, b) => b.id - a.id)[0];

                      setFormData({
                        ...formData,
                        empleado_id: empId,
                        cargo: lastContract ? lastContract.cargo : '',
                        cargo_actual: lastContract ? lastContract.cargo : '',
                        departamento: emp ? (emp.departamento || '') : '',
                        empleado_nombre: emp ? `${emp.nombres} ${emp.apellidos}` : '',
                      });
                    }}
                    className="w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 text-xs text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="">Buscar por nombre o ID...</option>
                    {empleados
                      .filter(emp => !contratos.some(con => con.empleado_id === emp.id && con.estado === 'Activo'))
                      .map(emp => (
                        <option key={emp.id} value={emp.id.toString()}>
                          {emp.nombres} {emp.apellidos} ({emp.documento_identidad})
                        </option>
                      ))}
                  </select>
                </div>

              </div>
            </div>

            {/* Card 2: Términos del Contrato */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-extrabold flex items-center justify-center text-sm shadow-sm select-none border border-primary/20">
                  2
                </div>
                <h3 className="text-sm font-bold text-on-surface tracking-tight uppercase">
                  Términos del Contrato
                </h3>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cargo del Contrato */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">
                      Cargo del Contrato *
                    </label>
                    <input
                      type="text"
                      name="cargo"
                      required
                      value={formData.cargo}
                      onChange={handleChange}
                      placeholder="Ej. Docente Bilingüe Primaria"
                      className="w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors font-medium"
                    />
                  </div>
                  {/* Departamento */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">
                      Departamento *
                    </label>
                    <input
                      type="text"
                      name="departamento"
                      required
                      value={formData.departamento}
                      onChange={handleChange}
                      placeholder="Ej. Académico"
                      className="w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de Contrato */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">
                      Tipo de Contrato *
                    </label>
                    <select
                      name="tipo_contrato"
                      required
                      value={formData.tipo_contrato}
                      onChange={handleChange}
                      className="w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                      <option value="Indefinido">Indefinido</option>
                      <option value="Fijo">Término Fijo</option>
                    </select>
                  </div>
                  {/* Periodo de prueba */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">
                      Periodo de Prueba (Días)
                    </label>
                    <input
                      type="number"
                      placeholder="60"
                      className="w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fecha de Inicio */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      name="fecha_inicio"
                      required
                      value={formData.fecha_inicio}
                      onChange={handleChange}
                      className="w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  {/* Fecha de Fin */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">
                      Fecha de Fin (Opcional)
                    </label>
                    <input
                      type="date"
                      name="fecha_fin"
                      value={formData.fecha_fin}
                      onChange={handleChange}
                      className="w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Condiciones Económicas */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-extrabold flex items-center justify-center text-sm shadow-sm select-none border border-primary/20">
                  3
                </div>
                <h3 className="text-sm font-bold text-on-surface tracking-tight uppercase">
                  Condiciones Económicas
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Salario Base */}
                <div>
                  <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">
                    Salario Base (Mensual) *
                  </label>
                  <div className="relative rounded-lg border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all bg-background overflow-hidden">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-bold">$</span>
                    <input
                      type="text"
                      name="salario"
                      required
                      value={(() => {
                        if (!formData.salario) return '';
                        const clean = formData.salario.toString().replace(/\D/g, '');
                        return new Intl.NumberFormat('es-CO', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(clean);
                      })()}
                      onChange={(e) => {
                        const rawVal = e.target.value.replace(/\D/g, '');
                        setFormData({
                          ...formData,
                          salario: rawVal
                        });
                      }}
                      className="w-full bg-transparent border-0 pl-7 pr-4 py-2.5 text-on-surface text-xs focus:outline-none font-medium"
                      placeholder="0"
                    />
                  </div>
                </div>
                {/* Frecuencia de pago */}
                <div>
                  <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase mb-1.5">
                    Frecuencia de Pago
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Mensual"
                    className="w-full bg-background/50 border border-outline-variant rounded-lg py-2.5 px-4 text-xs text-on-surface-variant/80 focus:outline-none cursor-not-allowed font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Help/Verification Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex gap-4">
                <span className="material-symbols-outlined text-[24px] text-primary select-none mt-0.5">info</span>
                <div>
                  <h4 className="text-xs font-bold text-on-surface leading-tight">Validación Automática</h4>
                  <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
                    El sistema verificará automáticamente si el colaborador ya tiene un contrato activo antes de permitir el registro de uno nuevo.
                  </p>
                </div>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/65 rounded-2xl p-5 flex gap-4">
                <span className="material-symbols-outlined text-[24px] text-on-surface-variant select-none mt-0.5">gavel</span>
                <div>
                  <h4 className="text-xs font-bold text-on-surface leading-tight">Legalidad</h4>
                  <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
                    Todos los formatos de contrato se rigen bajo el Código Sustantivo del Trabajo de la República de Colombia.
                  </p>
                </div>
              </div>
            </div>

            {/* Sticky Actions Bar */}
            <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-outline-variant/60 py-4 flex justify-end gap-3 z-50">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-surface-container hover:bg-surface-container-low text-on-surface border border-outline-variant px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-lg text-xs shadow-md hover:shadow-emerald-700/10 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>Guardar Contrato</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Restrained admin center info bar */}
        <div className="bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-400/90 text-xs font-medium rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-sm">⚠️</span>
            <span><strong>Acceso restringido (Nivel de Administrador)</strong> - Está operando con información salarial y métricas financieras confidenciales de los colaboradores.</span>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-primary/10 border border-emerald-500/20 text-primary text-xs rounded-xl p-3">
              {success}
            </div>
          )}

          {loading ? (
            <div className="py-24 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-on-surface-variant text-sm">Cargando base operativa...</p>
            </div>
          ) : (
            <div className="space-y-6">

                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* METRIC 1: TOTAL STAFF */}
                  <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-350 hover:border-outline-variant/60 hover:shadow-slate-900/10">
                    <div>
                      <span className="text-[9px] font-extrabold text-on-surface-variant tracking-widest uppercase block">Personal Total</span>
                      <span className="text-3xl font-extrabold text-on-surface mt-1 block">{empleados.length}</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-primary mt-4 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">trending_up</span>
                      Colaboradores en sistema
                    </span>
                  </div>

                  {/* METRIC 2: ACTIVE CONTRACTS */}
                  <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-350 hover:border-outline-variant/60 hover:shadow-slate-900/10">
                    <div>
                      <span className="text-[9px] font-extrabold text-on-surface-variant tracking-widest uppercase block">Contratos Activos</span>
                      <span className="text-3xl font-extrabold text-on-surface mt-1 block">
                        {contratos.filter(c => c.estado === 'Activo').length}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-primary mt-4 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      {contratos.length > 0 ? ((contratos.filter(c => c.estado === 'Activo').length / contratos.length) * 100).toFixed(1) : 0}% de cumplimiento
                    </span>
                  </div>

                  {/* METRIC 3: OPEN ROLES */}
                  <div
                    onClick={() => navigate('/empleados?filtro=sin-contrato')}
                    className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-350 hover:border-amber-500/30 hover:shadow-amber-500/5 cursor-pointer group"
                  >
                    <div>
                      <span className="text-[9px] font-extrabold text-on-surface-variant tracking-widest uppercase block group-hover:text-amber-600 dark:text-amber-450 transition-colors">Vacantes Activas</span>
                      <span className="text-3xl font-extrabold text-on-surface mt-1 block">
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
                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-on-surface tracking-wide">Empleados Registrados</h2>
                      <p className="text-xs text-on-surface-variant mt-0.5 font-medium">Administre y supervise la nómina de su personal.</p>
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
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-on-primary rounded-lg text-xs font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-[0.98]"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          <span>Asignar Contrato</span>
                        </button>
                      )}

                      <div className="flex bg-background border border-outline-variant/60 rounded-lg p-0.5">
                        <button
                          onClick={() => setFiltroEstado('Todos')}
                          className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                            filtroEstado === 'Todos' ? 'bg-surface-container-lowest text-on-surface' : 'text-on-surface-variant hover:text-on-surface-variant'
                          }`}
                        >
                          Todos
                        </button>
                        <button
                          onClick={() => setFiltroEstado('Activo')}
                          className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                            filtroEstado === 'Activo' ? 'bg-surface-container-lowest text-on-surface' : 'text-on-surface-variant hover:text-on-surface-variant'
                          }`}
                        >
                          Activos
                        </button>
                        <button
                          onClick={() => setFiltroEstado('Inactivo')}
                          className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                            filtroEstado === 'Inactivo' ? 'bg-surface-container-lowest text-on-surface' : 'text-on-surface-variant hover:text-on-surface-variant'
                          }`}
                        >
                          Inactivos
                        </button>
                      </div>

                      <button
                        onClick={manejarModuloEnDesarrollo}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant/60 hover:border-outline-variant bg-background hover:bg-surface-container-lowest rounded-lg text-on-surface-variant text-xs font-bold transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">filter_list</span>
                        <span>Filtrar</span>
                      </button>
                    </div>
                  </div>

                  {contratosFiltrados.length === 0 ? (
                    <div className="py-24 text-center space-y-4">
                      <span className="material-symbols-outlined text-slate-600 text-5xl">description</span>
                      <p className="text-on-surface-variant font-medium text-sm">No hay contratos registrados bajo los criterios seleccionados.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-hidden w-full">
                      <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                          <tr className="border-b border-outline-variant/60 text-on-surface-variant text-[10px] font-medium uppercase tracking-widest">
                            <th className="pb-3 pr-4 font-medium w-[40%]">Nombre</th>
                            <th className="pb-3 px-4 font-medium w-[25%]">Cargo</th>
                            <th className="pb-3 px-4 font-medium w-[20%]">Salario</th>
                            <th className="pb-3 px-4 font-medium w-[15%]">Estado</th>
                            <th className="pb-3 pl-4 font-medium text-right w-[10%]">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 text-sm">
                          {contratosFiltrados.map((contrato) => (
                            <tr key={contrato.id} className="group hover:bg-surface-container/10 transition-colors">
                              <td className="py-3.5 pr-4 flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden shrink-0 border border-outline-variant/60">
                                  <img
                                    alt={`${contrato.nombres} profile avatar`}
                                    className="w-full h-full object-cover"
                                    src={getAvatar(contrato)}
                                  />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-on-surface tracking-tight truncate max-w-[140px] sm:max-w-[180px]">
                                    {contrato.nombres} {contrato.apellidos}
                                  </span>
                                  <span className="text-[10px] text-on-surface-variant font-medium truncate max-w-[140px] sm:max-w-[180px] mt-0.5">
                                    {contrato.correo || `${contrato.nombres.toLowerCase()}@gla.edu.co`}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-xs text-on-surface-variant font-medium truncate">
                                {contrato.cargo || 'No especificado'}
                              </td>
                              <td className="py-3.5 px-4 text-xs text-on-surface-variant font-bold font-mono">
                                {formatSalary(contrato.salario)}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md transition-all ${
                                  contrato.estado === 'Activo'
                                    ? 'bg-primary/10 text-primary border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.12)]'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${contrato.estado === 'Activo' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                                  {contrato.estado === 'Activo' ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="py-3.5 pl-4 text-right">
                                <button
                                  onClick={() => handleStartEdit(contrato)}
                                  className="text-on-surface-variant hover:text-primary hover:bg-background p-1.5 rounded-lg transition-all cursor-pointer material-symbols-outlined text-[18px]"
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
                  <div className="pt-4 border-t border-outline-variant/60 flex justify-between items-center text-xs text-on-surface-variant font-semibold">
                    <span>
                      Mostrando {contratosFiltrados.length > 0 ? 1 : 0} a {contratosFiltrados.length} de {contratosFiltrados.length} colaboradores
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={manejarModuloEnDesarrollo}
                        className="px-2 py-1 bg-background border border-outline-variant/60 rounded hover:bg-surface-container-lowest transition-colors text-on-surface-variant font-bold cursor-pointer"
                      >
                        &lt;
                      </button>
                      <button
                        onClick={manejarModuloEnDesarrollo}
                        className="px-2 py-1 bg-background border border-outline-variant/60 rounded hover:bg-surface-container-lowest transition-colors text-on-surface-variant font-bold cursor-pointer"
                      >
                        &gt;
                      </button>
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
