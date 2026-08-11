import { useEffect, useState } from 'react';
import { cambiarContrasena } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const CheckIcon = ({ valid }) => (
  <span className={`material-symbols-outlined text-[16px] ${valid ? 'text-emerald-500' : 'text-on-surface-variant/40'}`} aria-hidden="true">
    {valid ? 'check_circle' : 'radio_button_unchecked'}
  </span>
);

const CambiarContrasena = ({ obligatorio = false, onClose }) => {
  const { setUser, logout } = useAuth();
  const [formData, setFormData] = useState({
    contrasena_actual: '',
    nueva_contrasena: '',
    confirmar_contrasena: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !obligatorio) onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [obligatorio, onClose]);

  const validaciones = {
    longitud: formData.nueva_contrasena.length >= 12,
    mayuscula: /[A-Z]/.test(formData.nueva_contrasena),
    minuscula: /[a-z]/.test(formData.nueva_contrasena),
    numero: /\d/.test(formData.nueva_contrasena),
    coincide: formData.nueva_contrasena === formData.confirmar_contrasena && formData.confirmar_contrasena.length > 0,
  };

  const formularioValido = Object.values(validaciones).every(Boolean) && formData.contrasena_actual.length > 0;

  const updateField = (field, value) => {
    setError('');
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formularioValido || loading) return;

    setLoading(true);
    setError('');
    try {
      const response = await cambiarContrasena({
        contrasena_actual: formData.contrasena_actual,
        nueva_contrasena: formData.nueva_contrasena,
      });

      if (response.token) localStorage.setItem('token', response.token);
      setUser((current) => ({
        ...current,
        ...(response.user || {}),
        token: response.token || current.token,
        debe_cambiar_contrasena: false,
      }));

      toast.success('Contraseña actualizada correctamente.');
      onClose?.();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'No fue posible cambiar la contraseña.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-black/60 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-dialog-title"
    >
      <div className="flex min-h-full items-center justify-center">
        <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
          <header className="shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 text-[26px] text-white" aria-hidden="true">lock_reset</span>
              <div className="min-w-0 flex-1">
                <h2 id="password-dialog-title" className="text-base font-bold text-white sm:text-lg">
                  {obligatorio ? 'Cambio de contraseña obligatorio' : 'Cambiar contraseña'}
                </h2>
                <p className="mt-0.5 text-xs text-emerald-100">
                  {obligatorio
                    ? 'Actualiza tu contraseña temporal para continuar.'
                    : 'Actualiza tu contraseña de acceso al sistema.'}
                </p>
              </div>
              {!obligatorio && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                  aria-label="Cerrar ventana"
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
                </button>
              )}
            </div>
          </header>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {obligatorio && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-amber-500" aria-hidden="true">warning</span>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    Estás usando una contraseña temporal. Por seguridad debes cambiarla antes de continuar.
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-medium text-red-700 dark:text-red-300" role="alert">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="current-password" className="mb-1.5 block text-xs font-bold text-on-surface">Contraseña actual</label>
                <input
                  id="current-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={formData.contrasena_actual}
                  onChange={(event) => updateField('contrasena_actual', event.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2.5 text-xs text-on-surface transition-colors placeholder-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  autoComplete="current-password"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label htmlFor="new-password" className="mb-1.5 block text-xs font-bold text-on-surface">Nueva contraseña</label>
                <input
                  id="new-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={formData.nueva_contrasena}
                  onChange={(event) => updateField('nueva_contrasena', event.target.value)}
                  placeholder="Ingresa la nueva contraseña"
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2.5 text-xs text-on-surface transition-colors placeholder-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-bold text-on-surface">Confirmar nueva contraseña</label>
                <input
                  id="confirm-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={formData.confirmar_contrasena}
                  onChange={(event) => updateField('confirmar_contrasena', event.target.value)}
                  placeholder="Confirma la nueva contraseña"
                  className="w-full rounded-xl border border-outline-variant bg-background px-3 py-2.5 text-xs text-on-surface transition-colors placeholder-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  autoComplete="new-password"
                  required
                />
              </div>

              <label className="flex cursor-pointer select-none items-center gap-2">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(event) => setShowPasswords(event.target.checked)}
                  className="h-3.5 w-3.5 accent-emerald-500"
                />
                <span className="text-[11px] font-medium text-on-surface-variant">Mostrar contraseñas</span>
              </label>

              <div className="space-y-1.5 rounded-xl bg-surface-container/50 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Requisitos de seguridad</p>
                {[
                  ['longitud', 'Mínimo 12 caracteres'],
                  ['mayuscula', 'Al menos una mayúscula'],
                  ['minuscula', 'Al menos una minúscula'],
                  ['numero', 'Al menos un número'],
                  ['coincide', 'Las contraseñas coinciden'],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <CheckIcon valid={validaciones[key]} />
                    <span className={validaciones[key] ? 'font-medium text-on-surface' : 'text-on-surface-variant'}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <footer className="flex shrink-0 gap-3 border-t border-outline-variant/60 bg-surface-container-lowest p-4 sm:px-6">
              {obligatorio ? (
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl border border-outline-variant bg-surface-container px-4 py-2.5 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
                >
                  Cerrar sesión
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-outline-variant bg-surface-container px-4 py-2.5 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={!formularioValido || loading}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  formularioValido && !loading
                    ? 'cursor-pointer bg-primary text-on-primary shadow-lg hover:bg-primary/90'
                    : 'cursor-not-allowed bg-surface-container text-on-surface-variant/50'
                }`}
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                    Actualizando…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">lock</span>
                    Actualizar contraseña
                  </>
                )}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CambiarContrasena;
