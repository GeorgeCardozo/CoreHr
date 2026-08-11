import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearAdministrador } from '../services/api';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

const CrearAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [formData, setFormData] = useState({
    correo: '',
    documento_identidad: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    departamento: 'Administración'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const camposValidos = formData.correo && formData.documento_identidad && formData.nombres && formData.apellidos;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }

    setLoading(true);
    try {
      const response = await crearAdministrador(formData);
      toast.success(response.message || 'Administrador creado exitosamente.');
      navigate('/empleados');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al crear el administrador.';
      toast.error(msg);
      setConfirmStep(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-outline-variant/60 pb-6">
          <button
            onClick={() => navigate('/empleados')}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 mb-2 transition-colors"
          >
            ← Volver a Colaboradores
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Crear Administrador
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Registrar una nueva cuenta con privilegios de administrador del sistema.
          </p>
        </div>

        {/* Warning */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-red-500 text-[24px] shrink-0 mt-0.5">admin_panel_settings</span>
          <div>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              Acceso Total al Sistema
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Este usuario tendrá acceso completo a todas las funcionalidades del sistema: gestión de empleados, contratos, solicitudes, nómina y configuración. Solo crea administradores para personas de confianza.
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-surface-container/50 px-6 py-4 border-b border-outline-variant/40">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-amber-500">shield_person</span>
              Datos del Nuevo Administrador
            </h2>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Nombres <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleChange}
                  placeholder="Nombres completos"
                  className="w-full bg-background border border-outline-variant rounded-xl py-2.5 px-3 text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Apellidos <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  placeholder="Apellidos completos"
                  className="w-full bg-background border border-outline-variant rounded-xl py-2.5 px-3 text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                Correo Institucional <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                placeholder="correo@gla.edu.co"
                className="w-full bg-background border border-outline-variant rounded-xl py-2.5 px-3 text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Documento de Identidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="documento_identidad"
                  value={formData.documento_identidad}
                  onChange={handleChange}
                  placeholder="Número de documento"
                  className="w-full bg-background border border-outline-variant rounded-xl py-2.5 px-3 text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Teléfono de contacto"
                  className="w-full bg-background border border-outline-variant rounded-xl py-2.5 px-3 text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Departamento</label>
              <input
                type="text"
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                placeholder="Departamento o área"
                className="w-full bg-background border border-outline-variant rounded-xl py-2.5 px-3 text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>

            {/* Info de Credenciales */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Credenciales de Acceso
              </p>
              <p className="text-xs text-on-surface-variant">
                Se asignará la contraseña temporal <code className="bg-surface-container px-1.5 py-0.5 rounded font-mono text-primary font-bold">CoreRRHH2025*</code> y se le pedirá cambiarla al primer inicio de sesión.
              </p>
              <p className="text-xs text-on-surface-variant">
                Si el correo electrónico del sistema está configurado, se enviarán las credenciales automáticamente al correo del nuevo administrador.
              </p>
            </div>
          </div>

          {/* Confirmación */}
          {confirmStep && (
            <div className="border-t border-outline-variant/40 bg-amber-500/5 px-6 py-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-500 text-[24px] shrink-0">help</span>
                <div>
                  <p className="text-sm font-bold text-on-surface">¿Confirmas la creación de este administrador?</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    <strong>{formData.nombres} {formData.apellidos}</strong> ({formData.correo}) tendrá acceso completo al sistema.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="px-6 py-4 border-t border-outline-variant/40 flex gap-3">
            <button
              type="button"
              onClick={() => { confirmStep ? setConfirmStep(false) : navigate('/empleados'); }}
              className="flex-1 bg-surface-container hover:bg-surface-container-low text-on-surface border border-outline-variant font-semibold rounded-xl py-2.5 px-4 text-xs transition-colors cursor-pointer"
            >
              {confirmStep ? 'Volver' : 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={!camposValidos || loading}
              className={`flex-1 font-bold rounded-xl py-2.5 px-4 text-xs transition-all flex items-center justify-center gap-2 ${
                camposValidos && !loading
                  ? confirmStep
                    ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-lg'
                    : 'bg-primary hover:bg-primary/90 text-on-primary cursor-pointer shadow-lg'
                  : 'bg-surface-container text-on-surface-variant/50 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-current"></div>
                  <span>Creando...</span>
                </>
              ) : confirmStep ? (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Sí, Crear Administrador</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                  <span>Crear Administrador</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default CrearAdmin;
