import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearEmpleado } from '../services/api';
import AdminLayout from '../components/AdminLayout';

const CrearEmpleado = () => {
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
    documento_identidad: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    fecha_ingreso: '',
    habilidades: '',
    fecha_info_personal: '',
    fecha_soportes: '',
    fecha_seguridad: '',
    superior_inmediato: '',
    departamento: '',
    fecha_terminacion: '',
    tipo_genero: '',
    fecha_nacimiento: '',
    correo_personal: '',
    contacto_emergencia: '',
    parentesco: '',
    telefono_emergencia: ''
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
      fecha_ingreso: formData.fecha_ingreso || undefined,
      habilidades: formData.habilidades ? formData.habilidades.split(',').map(s => s.trim()).filter(Boolean) : [],
      fecha_info_personal: formData.fecha_info_personal || undefined,
      fecha_soportes: formData.fecha_soportes || undefined,
      fecha_seguridad: formData.fecha_seguridad || undefined,
      superior_inmediato: formData.superior_inmediato || undefined,
      departamento: formData.departamento || undefined,
      fecha_terminacion: formData.fecha_terminacion || undefined,
      tipo_genero: formData.tipo_genero || undefined,
      fecha_nacimiento: formData.fecha_nacimiento || undefined,
      correo_personal: formData.correo_personal || undefined,
      contacto_emergencia: formData.contacto_emergencia || undefined,
      parentesco: formData.parentesco || undefined,
      telefono_emergencia: formData.telefono_emergencia || undefined
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
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header de navegación */}
        <div>
          <button 
            onClick={() => navigate('/empleados')}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 mb-2 transition-colors"
          >
            ← Volver a la Lista
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
            Registrar Nuevo Colaborador
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Crea la cuenta de acceso y la ficha de empleado de forma unificada.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-primary/10 border border-emerald-500/30 text-primary text-sm rounded-lg p-3">
            {success}
          </div>
        )}

        {/* Formulario Unificado a Dos Columnas */}
        <form 
          onSubmit={handleSubmit}
          className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 backdrop-blur-md"
        >
          <h2 className="text-lg font-semibold border-b border-outline-variant/60 pb-2 text-primary">
            Datos de Acceso del Usuario
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Correo Institucional */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="correo">
                Correo Institucional *
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                required
                placeholder="Ej. colaborador@empresa.com"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.correo}
                onChange={handleChange}
              />
            </div>

            {/* Contraseña Temporal */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="contrasena">
                Contraseña Temporal *
              </label>
              <input
                id="contrasena"
                name="contrasena"
                type="password"
                required
                minLength="12"
                autoComplete="new-password"
                placeholder="Mínimo 12 caracteres, mayúscula y número"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.contrasena}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-on-surface-variant">Entrégala por un canal seguro; el sistema exigirá cambiarla en el primer acceso.</p>
            </div>

          </div>

          <h2 className="text-lg font-semibold border-b border-outline-variant/60 pb-2 pt-4 text-primary">
            Ficha de Datos del Empleado
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Documento Identidad */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="documento_identidad">
                Documento de Identidad *
              </label>
              <input
                id="documento_identidad"
                name="documento_identidad"
                type="text"
                required
                placeholder="Ej. 987654321B"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.documento_identidad}
                onChange={handleChange}
              />
            </div>

            {/* Nombres */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="nombres">
                Nombres *
              </label>
              <input
                id="nombres"
                name="nombres"
                type="text"
                required
                placeholder="Nombres completos"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.nombres}
                onChange={handleChange}
              />
            </div>

            {/* Apellidos */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="apellidos">
                Apellidos *
              </label>
              <input
                id="apellidos"
                name="apellidos"
                type="text"
                required
                placeholder="Apellidos completos"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.apellidos}
                onChange={handleChange}
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="telefono">
                Teléfono de Contacto
              </label>
              <input
                id="telefono"
                name="telefono"
                type="text"
                placeholder="Ej. +34 600 000 000"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>

            {/* Fecha Ingreso */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="fecha_ingreso">
                Fecha de Ingreso
              </label>
              <input
                id="fecha_ingreso"
                name="fecha_ingreso"
                type="date"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.fecha_ingreso}
                onChange={handleChange}
              />
            </div>

            {/* Fecha Terminación */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="fecha_terminacion">
                Fecha de Terminación
              </label>
              <input
                id="fecha_terminacion"
                name="fecha_terminacion"
                type="date"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.fecha_terminacion}
                onChange={handleChange}
              />
            </div>

            {/* Superior Inmediato */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="superior_inmediato">
                Superior Inmediato
              </label>
              <input
                id="superior_inmediato"
                name="superior_inmediato"
                type="text"
                placeholder="Ej. Dra. Marta Rivera"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.superior_inmediato}
                onChange={handleChange}
              />
            </div>

            {/* Departamento */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="departamento">
                Departamento (Ej. Académico - STEM)
              </label>
              <input
                id="departamento"
                name="departamento"
                type="text"
                placeholder="Ej. Académico - STEM"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.departamento}
                onChange={handleChange}
              />
            </div>

            {/* Género */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="tipo_genero">
                Género
              </label>
              <select
                id="tipo_genero"
                name="tipo_genero"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.tipo_genero}
                onChange={handleChange}
              >
                <option value="">Seleccione género</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Fecha de Nacimiento */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="fecha_nacimiento">
                Fecha de Nacimiento
              </label>
              <input
                id="fecha_nacimiento"
                name="fecha_nacimiento"
                type="date"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
              />
            </div>

            {/* Correo Personal */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="correo_personal">
                Correo Personal
              </label>
              <input
                id="correo_personal"
                name="correo_personal"
                type="email"
                placeholder="Ej. personal@correo.com"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.correo_personal}
                onChange={handleChange}
              />
            </div>

            {/* Habilidades */}
            <div className="md:col-span-2">
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="habilidades">
                Habilidades (separadas por coma)
              </label>
              <input
                id="habilidades"
                name="habilidades"
                type="text"
                placeholder="Ej. Node.js, Inglés B2, Google Workspace"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.habilidades}
                onChange={handleChange}
              />
            </div>

            {/* Fecha Verificación Info Personal */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="fecha_info_personal">
                Fecha Verificación Info Personal
              </label>
              <input
                id="fecha_info_personal"
                name="fecha_info_personal"
                type="date"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.fecha_info_personal}
                onChange={handleChange}
              />
            </div>

            {/* Fecha Verificación Soportes */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="fecha_soportes">
                Fecha Verificación Soportes
              </label>
              <input
                id="fecha_soportes"
                name="fecha_soportes"
                type="date"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.fecha_soportes}
                onChange={handleChange}
              />
            </div>

            {/* Fecha Validación Seguridad */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="fecha_seguridad">
                Fecha Validación Seguridad
              </label>
              <input
                id="fecha_seguridad"
                name="fecha_seguridad"
                type="date"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.fecha_seguridad}
                onChange={handleChange}
              />
            </div>

            <h2 className="text-lg font-semibold border-b border-outline-variant/60 pb-2 pt-4 md:col-span-2 text-primary">
              Contacto de Emergencia
            </h2>

            {/* Contacto de Emergencia - Nombre */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="contacto_emergencia">
                Nombre del Contacto
              </label>
              <input
                id="contacto_emergencia"
                name="contacto_emergencia"
                type="text"
                placeholder="Nombre completo"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-550 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.contacto_emergencia}
                onChange={handleChange}
              />
            </div>

            {/* Contacto de Emergencia - Parentesco */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="parentesco">
                Parentesco
              </label>
              <input
                id="parentesco"
                name="parentesco"
                type="text"
                placeholder="Ej. Madre, Cónyuge, Hermano"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-550 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.parentesco}
                onChange={handleChange}
              />
            </div>

            {/* Contacto de Emergencia - Teléfono */}
            <div>
              <label className="block text-on-surface-variant text-sm font-medium mb-2" htmlFor="telefono_emergencia">
                Teléfono de Emergencia
              </label>
              <input
                id="telefono_emergencia"
                name="telefono_emergencia"
                type="text"
                placeholder="Ej. +57 300 000 0000"
                className="w-full bg-background border border-outline-variant/60 rounded-lg py-2.5 px-4 text-on-surface placeholder-slate-550 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.telefono_emergencia}
                onChange={handleChange}
              />
            </div>

          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4 border-t border-outline-variant/60 pt-6">
            <button
              type="button"
              onClick={() => navigate('/empleados')}
              className="bg-surface-container hover:bg-surface-container-low text-on-surface-variant border border-outline-variant px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-on-primary font-semibold rounded-lg py-2.5 px-6 shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar Colaborador'}
            </button>
          </div>

        </form>

      </div>
    </AdminLayout>
  );
};

export default CrearEmpleado;
