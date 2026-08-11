import { useState } from 'react';
import { cambiarContrasena } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const CambiarContrasena = ({ obligatorio = false, onClose }) => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar_contrasena: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const validaciones = {
    longitud: formData.nueva_contrasena.length >= 8,
    mayuscula: /[A-Z]/.test(formData.nueva_contrasena),
    minuscula: /[a-z]/.test(formData.nueva_contrasena),
    numero: /\d/.test(formData.nueva_contrasena),
    coincide: formData.nueva_contrasena === formData.confirmar_contrasena && formData.confirmar_contrasena.length > 0
  };

  const formularioValido = Object.values(validaciones).every(Boolean) && formData.contrasena_actual.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formularioValido) return;

    setLoading(true);
    try {
      await cambiarContrasena({
        contrasena_actual: formData.contrasena_actual,
        nueva_contrasena: formData.nueva_contrasena
      });

      toast.success('Contraseña actualizada exitosamente.');

      // Actualizar el estado del usuario para que no vuelva a pedir cambiar contraseña
      setUser((prev) => ({ ...prev, debe_cambiar_contrasena: false }));

      if (onClose) onClose();
    } catch (err) {
      const message = err.response?.data?.message || 'Error al cambiar la contraseña.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const CheckIcon = ({ valid }) => (
    <span className={`material-symbols-outlined text-[16px] ${valid ? 'text-emerald-500' : 'text-on-surface-variant/40'}`}>
      {valid ? 'check_circle' : 'radio_button_unchecked'}
    </span>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white text-[28px]">lock_reset</span>
            <div>
              <h2 className="text-lg font-bold text-white">
                {obligatorio ? 'Cambio de Contraseña Obligatorio' : 'Cambiar Contraseña'}
              </h2>
              <p className="text-emerald-100 text-xs mt-0.5">
                {obligatorio
                  ? 'Debes cambiar tu contraseña temporal para continuar.'
                  : 'Actualiza tu contraseña de acceso al sistema.'
                }
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {obligatorio && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-amber-500 text-[20px] shrink-0 mt-0.5">warning</span>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Estás usando una contraseña temporal. Por seguridad, debes cambiarla antes de continuar usando el sistema.
              </p>
            </div>
          )}

          {/* Contraseña Actual */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Contraseña Actual</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={formData.contrasena_actual}
                onChange={(e) => setFormData({ ...formData, contrasena_actual: e.target.value })}
                placeholder="Ingresa tu contraseña actual"
                className="w-full bg-background border border-outline-variant rounded-xl py-2.5 px-3 text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Nueva Contraseña</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={formData.nueva_contrasena}
              onChange={(e) => setFormData({ ...formData, nueva_contrasena: e.target.value })}
              placeholder="Ingresa la nueva contraseña"
              className="w-full bg-background border border-outline-variant rounded-xl py-2.5 px-3 text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              required
            />
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">Confirmar Nueva Contraseña</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={formData.confirmar_contrasena}
              onChange={(e) => setFormData({ ...formData, confirmar_contrasena: e.target.value })}
              placeholder="Confirma la nueva contraseña"
              className="w-full bg-background border border-outline-variant rounded-xl py-2.5 px-3 text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              required
            />
          </div>

          {/* Toggle mostrar contraseñas */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="accent-emerald-500 w-3.5 h-3.5"
            />
            <span className="text-[11px] text-on-surface-variant font-medium">Mostrar contraseñas</span>
          </label>

          {/* Requisitos de seguridad */}
          <div className="bg-surface-container/50 rounded-xl p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Requisitos de Seguridad</p>
            <div className="flex items-center gap-2 text-xs">
              <CheckIcon valid={validaciones.longitud} />
              <span className={validaciones.longitud ? 'text-on-surface font-medium' : 'text-on-surface-variant'}>Mínimo 8 caracteres</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckIcon valid={validaciones.mayuscula} />
              <span className={validaciones.mayuscula ? 'text-on-surface font-medium' : 'text-on-surface-variant'}>Al menos una mayúscula</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckIcon valid={validaciones.minuscula} />
              <span className={validaciones.minuscula ? 'text-on-surface font-medium' : 'text-on-surface-variant'}>Al menos una minúscula</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckIcon valid={validaciones.numero} />
              <span className={validaciones.numero ? 'text-on-surface font-medium' : 'text-on-surface-variant'}>Al menos un número</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckIcon valid={validaciones.coincide} />
              <span className={validaciones.coincide ? 'text-on-surface font-medium' : 'text-on-surface-variant'}>Las contraseñas coinciden</span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            {!obligatorio && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-surface-container hover:bg-surface-container-low text-on-surface border border-outline-variant font-semibold rounded-xl py-2.5 px-4 text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={!formularioValido || loading}
              className={`flex-1 font-bold rounded-xl py-2.5 px-4 text-xs transition-all flex items-center justify-center gap-2 ${
                formularioValido && !loading
                  ? 'bg-primary hover:bg-primary/90 text-on-primary cursor-pointer shadow-lg'
                  : 'bg-surface-container text-on-surface-variant/50 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-current"></div>
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span>Actualizar Contraseña</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CambiarContrasena;
