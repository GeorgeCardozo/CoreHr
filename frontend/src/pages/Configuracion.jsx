import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { obtenerPerfil, actualizarEmpleado, subirFotoPerfil } from '../services/api';
import { toast } from 'react-hot-toast';
import CambiarContrasena from '../components/CambiarContrasena';
import EmployeeAvatar from '../components/EmployeeAvatar';

const Configuracion = () => {
  const { user, setUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Estados del perfil
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados de los campos editables
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [contactoEmergencia, setContactoEmergencia] = useState('');
  const [telefonoEmergencia, setTelefonoEmergencia] = useState('');

  // Estados de la foto de perfil
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Tab activa de Ajustes
  const [activeTab, setActiveTab] = useState('Perfil');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const response = await obtenerPerfil();
        const p = response.perfil;
        if (p) {
          setProfile(p);
          setTelefono(p.telefono || '');
          setDireccion(p.direccion || '');
          setContactoEmergencia(p.contacto_emergencia || '');
          setTelefonoEmergencia(p.telefono_emergencia || '');
        }
      } catch (err) {
        console.error(err);
        toast.error('No se pudo cargar el perfil de usuario');
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validación de tamaño (máx 10MB como dice el mockup)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo excede los 10MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleGuardarCambios = async (e) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      // 1. Si hay una nueva foto seleccionada, subirla primero
      let tieneFotoPerfil = profile.tiene_foto_perfil;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('foto', selectedFile);
        await subirFotoPerfil(formData);
        tieneFotoPerfil = true;
      }

      // 2. Actualizar el resto de la información
      const actualizacion = {
        telefono: telefono,
        direccion: direccion,
        contacto_emergencia: contactoEmergencia,
        telefono_emergencia: telefonoEmergencia,
      };

      const response = await actualizarEmpleado(profile.id, actualizacion);

      // 3. Actualizar el AuthContext para que se refresque en toda la app inmediatamente
      setUser(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...response.empleado,
          tiene_foto_perfil: tieneFotoPerfil
        }
      }));

      // Actualizar estado local
      setProfile(prev => ({
        ...prev,
        ...response.empleado,
        tiene_foto_perfil: tieneFotoPerfil
      }));
      setSelectedFile(null);
      setPreviewUrl(null);

      toast.success('Cambios guardados exitosamente');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const manejarModuloEnDesarrollo = (e) => {
    e?.preventDefault();
    toast('Módulo en desarrollo para la Fase 2', { icon: '🚧' });
  };

  const activeUserName = user?.profile
    ? `${user.profile.nombres} ${user.profile.apellidos || ''}`
    : (user?.correo ? user.correo.split('@')[0] : 'Alex Rivera');
  const activeUserRole = user?.profile?.cargo || (user?.rol_id === 1 ? 'Gestión Humana' : 'Colaborador');
  const pageContent = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Sub-Navegación Lateral Interna */}
      <div className="md:col-span-1 flex flex-col space-y-6">
        <div className="space-y-4">
          <p className="text-[10px] font-extrabold text-on-surface-variant/70 tracking-widest uppercase px-4">Ajustes</p>
          <nav className="flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab('Perfil')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-bold cursor-pointer text-left ${
                activeTab === 'Perfil'
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)]'
                  : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span>Perfil</span>
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-3 w-full px-4 py-3 text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface rounded-xl transition-all text-xs font-bold cursor-pointer text-left"
            >
              <span className="material-symbols-outlined text-[18px]">security</span>
              <span>Seguridad</span>
            </button>
            <button
              onClick={manejarModuloEnDesarrollo}
              className="flex items-center gap-3 w-full px-4 py-3 text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface rounded-xl transition-all text-xs font-bold cursor-pointer text-left"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              <span>Notificaciones</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-outline-variant flex flex-col space-y-1">
          <button
            onClick={manejarModuloEnDesarrollo}
            className="flex items-center gap-3 w-full px-4 py-3 text-on-surface-variant/70 hover:bg-surface-container/50 hover:text-on-surface rounded-xl transition-all text-xs font-bold cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
            <span>Centro de ayuda</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-on-surface-variant/75 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all text-xs font-bold cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Panel de Contenido Principal de Ajustes */}
      <div className="md:col-span-3 space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">Configuración de cuenta</h2>
          <p className="text-on-surface-variant text-xs mt-1">Gestiona tu información personal y preferencias de seguridad para mantener tu perfil actualizado.</p>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-on-surface-variant text-sm">Cargando configuración...</p>
          </div>
        ) : (
          <form onSubmit={handleGuardarCambios} className="space-y-6">
            
            {/* Card 1: Foto de Perfil */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-extrabold text-on-surface-variant tracking-widest uppercase border-b border-outline-variant pb-2">Foto de Perfil</h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Visualizador de Avatar */}
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-outline-variant group-hover:border-primary/45 transition-colors shadow-lg bg-surface-container-low">
                    <EmployeeAvatar
                      employee={profile}
                      previewSrc={previewUrl}
                      alt="Avatar de perfil"
                      className="w-full h-full text-xl"
                    />
                  </div>
                </div>

                {/* Dropzone de Carga */}
                <label className="flex-1 w-full flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/80 hover:border-primary/50 bg-surface-container-lowest rounded-xl p-5 text-center cursor-pointer transition-colors group">
                  <span className="material-symbols-outlined text-[24px] text-on-surface-variant group-hover:text-primary transition-colors">cloud_upload</span>
                  <span className="text-xs font-bold text-on-surface mt-2 group-hover:text-primary transition-colors">
                    {selectedFile ? selectedFile.name : 'Subir nueva foto de perfil'}
                  </span>
                  <span className="text-[10px] text-on-surface-variant/70 mt-1">PNG, JPG hasta 10MB</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* Card 2: Información de Contacto */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-xl space-y-6">
              <h3 className="text-xs font-extrabold text-on-surface-variant tracking-widest uppercase border-b border-outline-variant pb-2">Información de Contacto</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Teléfono */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-bold mb-1" htmlFor="telefono">
                    Teléfono
                  </label>
                  <input
                    id="telefono"
                    type="text"
                    placeholder="+57 300 123 4567"
                    className="w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 text-xs text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-on-surface-variant text-xs font-bold mb-1" htmlFor="direccion">
                    Dirección
                  </label>
                  <input
                    id="direccion"
                    type="text"
                    placeholder="Calle 127 #45-67, Bogotá"
                    className="w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 text-xs text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </div>
              </div>

              {/* Sub-Sección: Contacto de Emergencia */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-outline-variant/45 pb-1">
                  <span className="material-symbols-outlined text-[18px] text-primary">contact_phone</span>
                  <h4 className="text-[10px] font-extrabold text-on-surface-variant tracking-wider uppercase">Contacto de Emergencia</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre del Contacto */}
                  <div>
                    <label className="block text-on-surface-variant text-xs font-bold mb-1" htmlFor="contacto_emergencia">
                      Nombre del Contacto
                    </label>
                    <input
                      id="contacto_emergencia"
                      type="text"
                      placeholder="Ej: María Rodríguez"
                      className="w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 text-xs text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      value={contactoEmergencia}
                      onChange={(e) => setContactoEmergencia(e.target.value)}
                    />
                  </div>

                  {/* Teléfono de Emergencia */}
                  <div>
                    <label className="block text-on-surface-variant text-xs font-bold mb-1" htmlFor="telefono_emergencia">
                      Teléfono de Emergencia
                    </label>
                    <input
                      id="telefono_emergencia"
                      type="text"
                      placeholder="+57 310 000 0000"
                      className="w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 text-xs text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      value={telefonoEmergencia}
                      onChange={(e) => setTelefonoEmergencia(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-surface-container hover:bg-surface-container-low text-on-surface border border-outline-variant px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-on-primary font-semibold rounded-lg px-5 py-2.5 text-xs shadow-lg hover:shadow-primary/10 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {saving ? (
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
            </div>

          </form>
        )}
      </div>
    </div>
  );

  // Renderizar interfaz unificada full-screen con botón de volver
  return (
    <div className="min-h-screen bg-background text-on-surface transition-colors duration-200">
      {/* Top Navbar */}
      <header className="h-16 border-b border-outline-variant bg-surface-container-low flex items-center justify-between px-8 fixed top-0 left-0 right-0 z-50 transition-colors duration-200">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-outline-variant bg-background hover:bg-surface-container text-on-surface text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] font-bold">arrow_back</span>
            <span>Volver</span>
          </button>
          <span className="text-xl font-black text-primary tracking-tight ml-4 select-none">CoreRRHH</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button 
              className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer" 
              onClick={toggleTheme}
              title={theme === 'light' ? 'Activar Modo Oscuro' : 'Activar Modo Claro'}
            >
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </button>
            <button className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer" onClick={manejarModuloEnDesarrollo}>notifications</button>
            <button 
              className="material-symbols-outlined text-primary bg-primary/10 border border-primary/20 p-2 rounded-full transition-colors cursor-pointer"
              onClick={() => setActiveTab('Perfil')}
              title="Ajustes"
            >
              settings
            </button>
          </div>

          <div className="flex items-center gap-3 border-l border-outline-variant pl-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/perfil')}>
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-on-surface leading-tight">{activeUserName}</span>
                <span className="text-[10px] text-on-surface-variant font-semibold">{activeUserRole}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-surface-container overflow-hidden ring-2 ring-outline-variant">
                <EmployeeAvatar
                  employee={user?.profile}
                  alt="Foto del usuario actual"
                  className="w-full h-full text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="pt-24 pb-16 px-8 flex-1 max-w-7xl w-full mx-auto">
        {pageContent}
      </main>
      {showPasswordModal && (
        <CambiarContrasena onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
};

export default Configuracion;
