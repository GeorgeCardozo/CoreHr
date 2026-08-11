import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api, { getAssetUrl, actualizarEmpleado, actualizarPrivacidadPerfil } from '../services/api';
import { toast } from 'react-hot-toast';
import NotificationBell from '../components/NotificationBell';
import logoSolo from '../assets/LogoSolo.png';

const VALOR_OCULTO = '••••••••';

const datoOculto = (valor) => valor === VALOR_OCULTO;

const CampoPerfil = ({ etiqueta, valor, campoPrivacidad, esPropioPerfil, preferencias, guardando, onToggle }) => {
  const visible = preferencias?.[campoPrivacidad] === true;
  return (
    <div>
      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">{etiqueta}</span>
      <p className={`text-base font-medium ${datoOculto(valor) ? 'text-on-surface-variant italic' : 'text-on-surface'}`}>
        {datoOculto(valor) ? 'Oculto por el colaborador' : (valor || 'No registrado')}
      </p>
      {esPropioPerfil && campoPrivacidad && (
        <button
          type="button"
          onClick={() => onToggle(campoPrivacidad)}
          disabled={guardando === campoPrivacidad}
          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline disabled:opacity-60 cursor-pointer disabled:cursor-wait"
          aria-pressed={visible}
          aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${etiqueta.toLowerCase()} a otros colaboradores`}
        >
          <span className="material-symbols-outlined text-[15px]">{visible ? 'visibility' : 'visibility_off'}</span>
          {guardando === campoPrivacidad ? 'Guardando…' : (visible ? 'Visible para otros · Ocultar' : 'Oculto para otros · Mostrar')}
        </button>
      )}
    </div>
  );
};

const PerfilEmpleado = () => {
  const { user, setUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardandoPrivacidad, setGuardandoPrivacidad] = useState('');
  const esAdmin = Number(user?.rol_id) === 1;
  const esPropioPerfil = !id || (profile && Number(profile.usuario_id) === Number(user?.id));

  // Estados para modal de edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTelefono, setEditTelefono] = useState('');
  const [editCorreoPersonal, setEditCorreoPersonal] = useState('');
  const [editContactoEmergencia, setEditContactoEmergencia] = useState('');
  const [editParentesco, setEditParentesco] = useState('');
  const [editTelefonoEmergencia, setEditTelefonoEmergencia] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editNombres, setEditNombres] = useState('');
  const [editApellidos, setEditApellidos] = useState('');
  const [editDocumentoIdentidad, setEditDocumentoIdentidad] = useState('');
  const [editTipoGenero, setEditTipoGenero] = useState('');
  const [editFechaNacimiento, setEditFechaNacimiento] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Estados para Modal y Peticiones de Ausentismo / Permiso
  const [isSolicitudModalOpen, setIsSolicitudModalOpen] = useState(false);
  const [tipoSolicitud, setTipoSolicitud] = useState('Ausentismo Laboral');
  const [fechaInicioSolicitud, setFechaInicioSolicitud] = useState('');
  const [fechaFinSolicitud, setFechaFinSolicitud] = useState('');
  const [motivoSolicitud, setMotivoSolicitud] = useState('');
  const [archivoAdjunto, setArchivoAdjunto] = useState(null);
  const [submittingSolicitud, setSubmittingSolicitud] = useState(false);
  const [misSolicitudes, setMisSolicitudes] = useState([]);

  // Cargar solicitudes del colaborador
  const fetchMisSolicitudes = async () => {
    try {
      const res = await api.get('/solicitudes');
      setMisSolicitudes(res.data.solicitudes || []);
    } catch (err) {
      console.error('Error al cargar mis solicitudes:', err);
    }
  };

  // Cargar datos del perfil en tiempo real al entrar a la página
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const url = id ? `/empleados/perfil/${id}` : '/empleados/perfil';
        const response = await api.get(url);
        const loadedProfile = response.data.perfil;
        setProfile(loadedProfile);
        if (!id || Number(loadedProfile.usuario_id) === Number(user?.id)) fetchMisSolicitudes();
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la información de perfil.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, user?.id]);

  const handlePrivacyToggle = async (field) => {
    if (!esPropioPerfil || guardandoPrivacidad) return;
    const currentValue = profile?.privacidad_perfil?.[field] === true;
    setGuardandoPrivacidad(field);
    try {
      const response = await actualizarPrivacidadPerfil({ [field]: !currentValue });
      setProfile((previous) => ({
        ...previous,
        privacidad_perfil: response.privacidad_perfil,
      }));
      setUser((previous) => previous ? ({
        ...previous,
        profile: previous.profile ? {
          ...previous.profile,
          privacidad_perfil: response.privacidad_perfil,
        } : previous.profile,
      }) : previous);
      toast.success(!currentValue ? 'Este dato ahora es visible para otros colaboradores.' : 'Este dato ahora está oculto para otros colaboradores.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar la privacidad del perfil.');
    } finally {
      setGuardandoPrivacidad('');
    }
  };

  const handleCrearSolicitud = async (e) => {
    e.preventDefault();
    if (!fechaInicioSolicitud || !motivoSolicitud) {
      toast.error('La fecha y el motivo son obligatorios.');
      return;
    }

    setSubmittingSolicitud(true);
    try {
      const formData = new FormData();
      formData.append('tipo_solicitud', tipoSolicitud);
      formData.append('fecha_inicio', fechaInicioSolicitud);
      if (fechaFinSolicitud) {
        formData.append('fecha_fin', fechaFinSolicitud);
      }
      formData.append('motivo', motivoSolicitud);
      if (archivoAdjunto) {
        formData.append('adjunto', archivoAdjunto);
      }

      await api.post('/solicitudes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Solicitud de ausentismo enviada con éxito.');
      setIsSolicitudModalOpen(false);
      setTipoSolicitud('Ausentismo Laboral');
      setFechaInicioSolicitud('');
      setFechaFinSolicitud('');
      setMotivoSolicitud('');
      setArchivoAdjunto(null);
      fetchMisSolicitudes();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error al enviar la solicitud.');
    } finally {
      setSubmittingSolicitud(false);
    }
  };

  const handleDescargarCertificado = async () => {
    if (downloading) return;

    setDownloading(true);
    setError('');

    try {
      const url = profile?.id ? `/empleados/certificado?empleado_id=${profile.id}` : '/empleados/certificado';
      const response = await api.get(url, {
        responseType: 'blob'
      });

      // Crear URL temporal para el blob del PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);

      // Crear elemento de descarga y forzar el clic
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Certificado_Laboral_${profile?.nombres || 'Empleado'}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Limpiar el DOM y liberar el recurso
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Certificación laboral descargada con éxito.');
    } catch (err) {
      console.error(err);
      let errorMsg = 'Error al generar la certificación laboral en PDF.';
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errorMsg = json.message;
        } catch {
          // Mantener mensaje por defecto si no es JSON válido
        }
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setDownloading(false);
    }
  };

  const getFormatoMoneda = (valor) => {
    if (valor === null || valor === undefined || valor === '') return 'No registrado';
    if (typeof valor === 'string' && valor.includes('•')) return valor;
    const num = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(/[^0-9.-]+/g, ''));
    if (isNaN(num)) return valor;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const manejarModuloEnDesarrollo = (e) => {
    e.preventDefault();
    toast('Módulo en desarrollo para la Fase 2', { icon: '🚧' });
  };

  const getAvatar = (emp) => {
    if (emp?.foto_perfil) {
      return getAssetUrl(emp.foto_perfil);
    }
    const nombres = emp?.nombres || 'C';
    const apellidos = emp?.apellidos || 'Colaborador';
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

  const getFechaFormateadaStepper = (fechaStr) => {
    if (!fechaStr) return '';
    return new Date(fechaStr).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short'
    });
  };

  const handleOpenEdit = () => {
    setEditTelefono(profile?.telefono || '');
    setEditCorreoPersonal(profile?.correo_personal || '');
    setEditContactoEmergencia(profile?.contacto_emergencia || '');
    setEditParentesco(profile?.parentesco || '');
    setEditTelefonoEmergencia(profile?.telefono_emergencia || '');
    setEditDireccion(profile?.direccion || '');
    setEditNombres(profile?.nombres || '');
    setEditApellidos(profile?.apellidos || '');
    setEditDocumentoIdentidad(profile?.documento_identidad || '');
    setEditTipoGenero(profile?.tipo_genero || '');
    setEditFechaNacimiento(profile?.fecha_nacimiento ? profile.fecha_nacimiento.substring(0, 10) : '');
    setSelectedFile(null);
    setEditError('');
    setIsModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    setEditError('');

    try {
      let nuevaFoto = profile?.foto_perfil;

      // Si hay un archivo seleccionado, subirlo primero
      if (selectedFile) {
        const formData = new FormData();
        formData.append('foto', selectedFile);
        if (esAdmin && !esPropioPerfil && profile?.id) {
          formData.append('empleado_id', profile.id);
        }

        const uploadRes = await api.put('/empleados/perfil/foto', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        nuevaFoto = uploadRes.data.foto_perfil;

        // Solo el perfil propio debe modificar el avatar global de la sesión.
        if (esPropioPerfil) {
          setUser(prev => ({
            ...prev,
            profile: {
              ...prev.profile,
              foto_perfil: nuevaFoto
            }
          }));
        }
        setSelectedFile(null);
      }

      const payload = {
        telefono: editTelefono,
        habilidades: profile?.habilidades,
        fecha_info_personal: profile?.fecha_info_personal || new Date().toISOString(),
        tipo_genero: editTipoGenero,
        fecha_nacimiento: editFechaNacimiento || null,
        correo_personal: editCorreoPersonal,
        contacto_emergencia: editContactoEmergencia,
        parentesco: editParentesco,
        telefono_emergencia: editTelefonoEmergencia,
        direccion: editDireccion,
      };
      if (esAdmin) {
        Object.assign(payload, {
          documento_identidad: editDocumentoIdentidad,
          nombres: editNombres,
          apellidos: editApellidos,
          fecha_ingreso: profile?.fecha_ingreso,
          fecha_terminacion: profile?.fecha_terminacion,
          fecha_soportes: profile?.fecha_soportes,
          fecha_seguridad: profile?.fecha_seguridad,
          superior_inmediato: profile?.superior_inmediato,
          departamento: profile?.departamento,
        });
      }

      await actualizarEmpleado(profile.id, payload);

      setProfile({
        ...profile,
        ...(esAdmin ? {
          nombres: editNombres,
          apellidos: editApellidos,
          documento_identidad: editDocumentoIdentidad,
        } : {}),
        tipo_genero: editTipoGenero,
        fecha_nacimiento: editFechaNacimiento,
        telefono: editTelefono,
        foto_perfil: nuevaFoto,
        correo_personal: editCorreoPersonal,
        contacto_emergencia: editContactoEmergencia,
        parentesco: editParentesco,
        telefono_emergencia: editTelefonoEmergencia,
        direccion: editDireccion,
        fecha_info_personal: profile?.fecha_info_personal || new Date().toISOString()
      });

      toast.success('Perfil actualizado con éxito');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Error al actualizar el perfil';
      setEditError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-on-surface-variant text-sm">Cargando el perfil laboral…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface p-6">
        <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-red-500 mb-3">person_off</span>
          <h1 className="text-xl font-bold mb-2">No fue posible abrir el perfil</h1>
          <p className="text-sm text-on-surface-variant mb-6">{error || 'El perfil no existe o no está disponible.'}</p>
          <button onClick={() => navigate('/directorio')} className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold cursor-pointer">
            Volver al directorio
          </button>
        </div>
      </div>
    );
  }

  const esVistaPublica = !esPropioPerfil && !esAdmin;

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col transition-colors duration-200">
      {/* TopNavBar Shell */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 transition-colors duration-200">
        <div className="flex items-center gap-8">
          <Link to={esAdmin ? "/dashboard" : "/perfil"} className="font-headline-md text-headline-md font-bold text-primary hover:opacity-90 transition-opacity">CoreRRHH</Link>
          <nav className="hidden md:flex gap-2 items-center">
            {esAdmin && (
              <Link className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg text-sm font-bold transition-all" to="/dashboard">
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span>Panel administrativo</span>
              </Link>
            )}
            <Link className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-semibold" to="/directorio">Directorio</Link>
            {!esAdmin && <Link className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-semibold" to="/recursos">Recursos</Link>}
            <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-semibold" href="#" onClick={manejarModuloEnDesarrollo}>Capacitación</a>
            <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-semibold" href="#" onClick={manejarModuloEnDesarrollo}>Nómina</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
          >
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </button>
          <NotificationBell />
          <button
            className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer"
            aria-label="Ir a configuración"
            onClick={() => navigate('/configuracion')}
          >settings</button>
          <button
            type="button"
            onClick={() => navigate('/perfil')}
            title="Ver mi perfil"
            aria-label="Ver mi perfil"
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant cursor-pointer hover:opacity-80 transition-opacity"
          >
              <img
                alt="Foto de mi perfil"
              className="w-full h-full object-cover"
              src={getAvatar(user?.profile)}
            />
          </button>
        </div>
      </header>

      {/* SideNavBar Shell */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-64 p-4 bg-surface-container-low border-r border-outline-variant">
        <div className="mb-8 px-4 py-3 flex items-center gap-3">
          <img src={logoSolo} alt="Logo" className="h-10 w-auto object-contain" />
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold text-on-surface leading-tight">Gimnasio Los Arrayanes</p>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Portal RRHH</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {esAdmin && (
            <Link
              to="/dashboard"
              className="flex items-center gap-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl px-4 py-2.5 transition-colors border border-emerald-500/20 mb-3 hover:bg-emerald-500/20"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="font-label-caps text-label-caps">Panel administrativo</span>
            </Link>
          )}
          <a className="flex items-center gap-3 bg-primary/10 text-primary font-semibold rounded-xl px-4 py-2 transition-colors" href="#">
            <span className="material-symbols-outlined">person</span>
            <span className="font-label-caps text-label-caps">Resumen</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors duration-200 rounded-lg" href="#" onClick={manejarModuloEnDesarrollo}>
            <span className="material-symbols-outlined">description</span>
            <span className="font-label-caps text-label-caps">Documentos</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors duration-200 rounded-lg" href="#" onClick={manejarModuloEnDesarrollo}>
            <span className="material-symbols-outlined">work</span>
            <span className="font-label-caps text-label-caps">Experiencia</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors duration-200 rounded-lg" href="#" onClick={manejarModuloEnDesarrollo}>
            <span className="material-symbols-outlined">trending_up</span>
            <span className="font-label-caps text-label-caps">Desempeño</span>
          </a>
          <Link className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors duration-200 rounded-lg" to="/configuracion">
            <span className="material-symbols-outlined">manage_accounts</span>
            <span className="font-label-caps text-label-caps">Ajustes</span>
          </Link>
        </nav>
        <div className="mt-auto pt-4 border-t border-outline-variant space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors duration-200 rounded-lg" href="mailto:soporte@arrayanes.edu.co">
            <span className="material-symbols-outlined">help</span>
            <span className="font-label-caps text-label-caps">Soporte</span>
          </a>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors duration-200 rounded-lg cursor-pointer text-left focus:outline-none"
          >
            <span className="material-symbols-outlined">logout</span>
              <span className="font-label-caps text-label-caps">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="lg:ml-64 pt-20 min-h-screen">
        <div className="px-8 py-6 max-w-7xl mx-auto">

          {!esPropioPerfil && (
            <button
              onClick={() => navigate('/directorio')}
              className="flex items-center gap-1.5 text-xs text-primary hover:opacity-85 font-bold mb-6 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Volver al directorio
            </button>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-lg p-3 mb-6">
              {error}
            </div>
          )}

          {/* Hero Profile Card */}
          <section className="relative overflow-hidden rounded-2xl bg-surface-container-lowest border border-outline-variant mb-8 group">
            {/* Cover Background */}
            <div className="h-24 w-full bg-gradient-to-r from-emerald-800 to-teal-500 rounded-t-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
            </div>

            {/* Profile Content */}
            <div className="px-8 pb-4 flex flex-col md:flex-row items-end justify-between gap-6 -mt-12 relative z-10 w-full">
              <div className="flex flex-col md:flex-row items-end gap-6">
                <div className="w-32 h-32 rounded-full ring-4 ring-surface-container-lowest shadow-md overflow-hidden bg-surface-container-lowest">
                  <img
                    alt="Perfil del colaborador"
                    className="w-full h-full object-cover"
                    src={getAvatar(profile)}
                  />
                </div>
                <div className="pb-2">
                  <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">
                    {profile?.nombres} {profile?.apellidos}
                  </h1>
                  <p className="text-sm text-on-surface-variant font-medium">
                    {profile?.cargo || 'Colaborador institucional'}
                    {profile?.correo && !datoOculto(profile.correo) ? ` • ${profile.correo}` : ''}
                  </p>
                </div>
              </div>
              {(esPropioPerfil || esAdmin) && (
                <div className="pb-2 self-center md:self-end">
                  <button
                    onClick={handleOpenEdit}
                    className="flex items-center gap-2 px-4 py-2 border border-outline-variant hover:bg-surface-container rounded-xl text-on-surface font-label-caps text-label-caps transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    <span>Editar perfil</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Left Column (2/3) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Información Laboral */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/60">
                <div className="flex items-center gap-3 text-on-surface text-lg font-semibold mb-6">
                  <span className="material-symbols-outlined text-primary text-xl">Apartment</span>
                  <h2>Información Institucional</h2>
                </div>

                {esVistaPublica && (
                  <div className="mb-6 flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary">shield_lock</span>
                    <p>La información salarial, contractual y las fechas de vinculación están protegidas. Solo Gestión Humana puede consultarlas.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Cargo</span>
                    <p className="text-base text-on-surface font-medium">{profile?.cargo || 'Sin asignar'}</p>
                  </div>

                  {!esVistaPublica && (
                    <div>
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Fecha de contratación</span>
                      <p className="text-base text-on-surface font-medium">
                        {profile?.fecha_ingreso ? new Date(profile.fecha_ingreso).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'No registrado'}
                      </p>
                    </div>
                  )}

                  {esAdmin && <>
                  <div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Fecha de terminación</span>
                    <p className="text-base text-on-surface font-medium">
                      {(profile?.contrato_fecha_fin || profile?.fecha_terminacion) ? (() => {
                        const dateStr = profile.contrato_fecha_fin || profile.fecha_terminacion;
                        const dateObj = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00');
                        return dateObj.toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      })() : profile?.tipo_contrato === 'Indefinido' ? 'No aplica (Indefinido)' : 'No registrado'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Tipo de contrato</span>
                    <p className="text-base text-on-surface font-medium">
                      {profile?.tipo_contrato || 'Sin asignar'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Salario</span>
                    <p className="text-base text-on-surface font-medium">
                      {getFormatoMoneda(profile?.salario)}
                    </p>
                  </div>
                  </>}


                  <div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Departamento</span>
                    <p className="text-base text-on-surface font-medium">
                      {profile?.departamento || 'No asignado'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Superior inmediato</span>
                    <p className="text-base text-on-surface font-medium">
                      {profile?.superior_inmediato || 'No registrado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información Personal */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/60">
                <div className="flex items-center gap-3 text-on-surface text-lg font-semibold mb-6">
                  <span className="material-symbols-outlined text-primary text-xl">inbox_text_person</span>
                  <h2>Información personal</h2>
                </div>

                {esPropioPerfil && (
                  <p className="text-sm text-on-surface-variant mb-6">
                    Tú decides qué datos pueden consultar otros colaboradores. Los cambios se guardan de inmediato.
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Nombre completo</span>
                    <p className="text-base text-on-surface font-medium">
                      {profile?.nombres} {profile?.apellidos}
                    </p>
                    <p className="mt-2 text-[11px] text-on-surface-variant">Visible en el directorio institucional.</p>
                  </div>

                  {!esVistaPublica && (
                    <div>
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Documento de identidad</span>
                      <p className="text-base text-on-surface font-medium">{profile?.documento_identidad || 'No registrado'}</p>
                      {esPropioPerfil && <p className="mt-2 text-[11px] text-on-surface-variant">Siempre privado para otros colaboradores.</p>}
                    </div>
                  )}

                  <CampoPerfil
                    etiqueta="Género"
                    valor={profile?.tipo_genero}
                    campoPrivacidad="tipo_genero"
                    esPropioPerfil={esPropioPerfil}
                    preferencias={profile?.privacidad_perfil}
                    guardando={guardandoPrivacidad}
                    onToggle={handlePrivacyToggle}
                  />

                  <CampoPerfil
                    etiqueta="Fecha de nacimiento"
                    valor={datoOculto(profile?.fecha_nacimiento) ? VALOR_OCULTO : (profile?.fecha_nacimiento ? new Date(profile.fecha_nacimiento.includes('T') ? profile.fecha_nacimiento : `${profile.fecha_nacimiento}T12:00:00`).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '')}
                    campoPrivacidad="fecha_nacimiento"
                    esPropioPerfil={esPropioPerfil}
                    preferencias={profile?.privacidad_perfil}
                    guardando={guardandoPrivacidad}
                    onToggle={handlePrivacyToggle}
                  />

                  <CampoPerfil
                    etiqueta="Correo institucional"
                    valor={profile?.correo}
                    campoPrivacidad="correo"
                    esPropioPerfil={esPropioPerfil}
                    preferencias={profile?.privacidad_perfil}
                    guardando={guardandoPrivacidad}
                    onToggle={handlePrivacyToggle}
                  />

                  <CampoPerfil
                    etiqueta="Correo personal"
                    valor={profile?.correo_personal}
                    campoPrivacidad="correo_personal"
                    esPropioPerfil={esPropioPerfil}
                    preferencias={profile?.privacidad_perfil}
                    guardando={guardandoPrivacidad}
                    onToggle={handlePrivacyToggle}
                  />

                  <CampoPerfil
                    etiqueta="Teléfono de contacto"
                    valor={profile?.telefono}
                    campoPrivacidad="telefono"
                    esPropioPerfil={esPropioPerfil}
                    preferencias={profile?.privacidad_perfil}
                    guardando={guardandoPrivacidad}
                    onToggle={handlePrivacyToggle}
                  />

                  <CampoPerfil
                    etiqueta="Dirección"
                    valor={profile?.direccion}
                    campoPrivacidad="direccion"
                    esPropioPerfil={esPropioPerfil}
                    preferencias={profile?.privacidad_perfil}
                    guardando={guardandoPrivacidad}
                    onToggle={handlePrivacyToggle}
                  />
                </div>
              </div>

              {/* Contacto de Emergencia */}
              {!esVistaPublica && <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/60">
                <div className="flex items-center gap-3 text-on-surface text-lg font-semibold mb-6">
                  <span className="material-symbols-outlined text-primary text-xl">siren</span>
                  <h2>Contacto de Emergencia</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Nombre completo</span>
                    <p className="text-base text-on-surface font-medium">
                      {profile?.contacto_emergencia || 'No registrado'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Parentesco</span>
                    <p className="text-base text-on-surface font-medium">
                      {profile?.parentesco || 'No registrado'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Teléfono de contacto</span>
                    <p className="text-base text-on-surface font-medium">
                      {profile?.telefono_emergencia || 'No registrado'}
                    </p>
                  </div>
                </div>
                {esPropioPerfil && <p className="mt-5 text-[11px] text-on-surface-variant">Esta información es confidencial y nunca se comparte en perfiles públicos.</p>}
              </div>}

              {/* Habilidades */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/60">
                <div className="flex items-center gap-3 text-on-surface text-lg font-semibold mb-6">
                  <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                  <h2>Habilidades</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {datoOculto(profile?.habilidades) ? (
                    <span className="text-sm text-on-surface-variant italic">Oculto por el colaborador</span>
                  ) : Array.isArray(profile?.habilidades) && profile.habilidades.length > 0 ? (
                    profile.habilidades.map((hab, index) => (
                      <span key={index} className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-label-caps hover:scale-105 transition-transform cursor-default">
                        {hab}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-outline italic">Sin habilidades registradas</span>
                  )}
                </div>
                {esPropioPerfil && (
                  <button
                    type="button"
                    onClick={() => handlePrivacyToggle('habilidades')}
                    disabled={guardandoPrivacidad === 'habilidades'}
                    className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline disabled:opacity-60 cursor-pointer disabled:cursor-wait"
                  >
                    <span className="material-symbols-outlined text-[15px]">{profile?.privacidad_perfil?.habilidades ? 'visibility' : 'visibility_off'}</span>
                    {guardandoPrivacidad === 'habilidades' ? 'Guardando…' : (profile?.privacidad_perfil?.habilidades ? 'Visible para otros · Ocultar' : 'Oculto para otros · Mostrar')}
                  </button>
                )}
              </div>

            </div>

            {/* Right Column (1/3) */}
            <aside className="space-y-6">

              {/* Acciones Rápidas */}
              {esPropioPerfil && (
                <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-primary">bolt</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Acciones Rápidas</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <button
                        onClick={handleDescargarCertificado}
                        disabled={downloading}
                        className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white text-sm font-medium py-2.5 px-4 rounded-lg shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        {downloading ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                            <span>Generando PDF...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
                            <span>Descargar Certificación Laboral</span>
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => setIsSolicitudModalOpen(true)}
                      className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-extrabold text-sm py-2.5 px-4 rounded-lg border border-primary/30 transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">event_busy</span>
                        <span>Solicitar Permiso / Ausentismo</span>
                      </div>
                      <span className="material-symbols-outlined text-xs group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>

                    <button onClick={manejarModuloEnDesarrollo} className="w-full bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant text-sm font-semibold py-2.5 px-4 rounded-lg border border-outline-variant transition-all cursor-pointer flex items-center gap-3">
                      <span className="material-symbols-outlined text-on-surface-variant">receipt_long</span>
                      <span>Ver Desprendibles de Pago</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mis Solicitudes de Ausentismo */}
              {esPropioPerfil && misSolicitudes.length > 0 && (
                <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant space-y-4">
                  <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">history</span>
                      <h3 className="font-bold text-on-surface text-sm">Mis Solicitudes</h3>
                    </div>
                    <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                      {misSolicitudes.length}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {misSolicitudes.map((sol) => (
                      <div key={sol.id} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60 space-y-1.5 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-on-surface">{sol.tipo_solicitud}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${sol.estado === 'Aprobado' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                            sol.estado === 'Rechazado' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                              'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}>
                            {sol.estado}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant">
                          Fecha: {new Date(sol.fecha_inicio.includes('T') ? sol.fecha_inicio : sol.fecha_inicio + 'T12:00:00').toLocaleDateString('es-CO')}
                        </p>
                        <p className="text-[11px] text-on-surface line-clamp-2" title={sol.motivo}>
                          {sol.motivo}
                        </p>
                        {sol.comentarios_admin && (
                          <p className="text-[10px] text-primary italic bg-primary/5 p-1.5 rounded border border-primary/10">
                            Respuesta: "{sol.comentarios_admin}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estado interno de actualización: no se publica a otros colaboradores. */}
              {!esVistaPublica && <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-6 uppercase tracking-widest">
                  Estado de actualización
                </h3>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      {profile?.fecha_info_personal ? (
                        <div className="w-6 h-6 rounded-full bg-surface-tint flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[14px]">check</span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-outline-variant bg-surface-container-lowest flex items-center justify-center">
                          <span className="material-symbols-outlined text-outline text-[14px]">pending</span>
                        </div>
                      )}
                      <div className={`w-0.5 h-full ${profile?.fecha_info_personal ? 'bg-surface-tint' : 'bg-outline-variant'}`}></div>
                    </div>
                    <div className="pb-4">
                      <p className={`font-label-caps text-label-caps ${profile?.fecha_info_personal ? 'text-primary' : 'text-on-surface-variant'}`}>Información personal</p>
                      <p className="text-[12px] text-on-surface-variant">
                        {profile?.fecha_info_personal ? `Completado el ${getFechaFormateadaStepper(profile.fecha_info_personal)}` : 'Pendiente'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      {profile?.fecha_soportes ? (
                        <div className="w-6 h-6 rounded-full bg-surface-tint flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[14px]">check</span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-outline-variant bg-surface-container-lowest flex items-center justify-center">
                          <span className="material-symbols-outlined text-outline text-[14px]">pending</span>
                        </div>
                      )}
                      <div className={`w-0.5 h-full ${profile?.fecha_soportes ? 'bg-surface-tint' : 'bg-outline-variant'}`}></div>
                    </div>
                    <div className="pb-4">
                      <p className={`font-label-caps text-label-caps ${profile?.fecha_soportes ? 'text-primary' : 'text-on-surface-variant'}`}>Soportes académicos</p>
                      <p className="text-[12px] text-on-surface-variant">
                        {profile?.fecha_soportes ? `Completado el ${getFechaFormateadaStepper(profile.fecha_soportes)}` : 'Pendiente'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      {profile?.fecha_seguridad ? (
                        <div className="w-6 h-6 rounded-full bg-surface-tint flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[14px]">check</span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-primary-fixed-dim bg-surface-container-lowest flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        </div>
                      )}
                      <div className="w-0.5 h-full bg-outline-variant opacity-30"></div>
                    </div>
                    <div className="pb-4">
                      <p className={`font-label-caps text-label-caps ${profile?.fecha_seguridad ? 'text-primary' : 'text-on-surface'}`}>Validación de seguridad</p>
                      <p className="text-[12px] text-on-surface-variant">
                        {profile?.fecha_seguridad ? `Completado el ${getFechaFormateadaStepper(profile.fecha_seguridad)}` : 'Pendiente'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>}

            </aside>
          </div>

          {/* Edit Profile Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                    Editar datos del colaborador
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    aria-label="Cerrar ventana de edición"
                    className="material-symbols-outlined text-on-surface-variant p-1 hover:bg-surface-container rounded-full transition-colors cursor-pointer"
                  >
                    close
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  {editError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-lg p-3">
                      {editError}
                    </div>
                  )}

                  {/* Los nombres y el documento solo los administra Gestión Humana. */}
                  {esAdmin && <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="nombres" className="block font-label-caps text-label-caps text-on-surface-variant uppercase text-xs">
                        Nombres
                      </label>
                      <input
                        id="nombres"
                        type="text"
                        value={editNombres}
                        onChange={(e) => setEditNombres(e.target.value)}
                        placeholder="Nombres"
                        className="w-full bg-surface-container-low border border-outline rounded-lg px-3 py-2 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="apellidos" className="block font-label-caps text-label-caps text-on-surface-variant uppercase text-xs">
                        Apellidos
                      </label>
                      <input
                        id="apellidos"
                        type="text"
                        value={editApellidos}
                        onChange={(e) => setEditApellidos(e.target.value)}
                        placeholder="Apellidos"
                        className="w-full bg-surface-container-low border border-outline rounded-lg px-3 py-2 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="documento_identidad" className="block font-label-caps text-label-caps text-on-surface-variant uppercase text-xs">
                      Documento de identidad
                    </label>
                    <input
                      id="documento_identidad"
                      type="text"
                      value={editDocumentoIdentidad}
                      onChange={(e) => setEditDocumentoIdentidad(e.target.value)}
                      placeholder="Número de documento"
                      className="w-full bg-surface-container-low border border-outline rounded-lg px-3 py-2 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                      required
                    />
                  </div>
                  </>}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="tipo_genero" className="block font-label-caps text-label-caps text-on-surface-variant uppercase text-xs">
                        Género
                      </label>
                      <select
                        id="tipo_genero"
                        value={editTipoGenero}
                        onChange={(e) => setEditTipoGenero(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline rounded-lg px-3 py-2 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                      >
                        <option value="">Seleccione...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="fecha_nacimiento" className="block font-label-caps text-label-caps text-on-surface-variant uppercase text-xs">
                        Fecha de nacimiento
                      </label>
                      <input
                        id="fecha_nacimiento"
                        type="date"
                        value={editFechaNacimiento}
                        onChange={(e) => setEditFechaNacimiento(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="telefono" className="block font-label-caps text-label-caps text-on-surface-variant uppercase text-xs">
                      Teléfono
                    </label>
                    <input
                      id="telefono"
                      type="text"
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value)}
                      placeholder="Ej. +57 300 123 4567"
                      className="w-full bg-surface-container-low border border-outline rounded-lg px-3 py-2 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="correo_personal" className="block font-label-caps text-label-caps text-on-surface-variant uppercase">
                      Correo personal
                    </label>
                    <input
                      id="correo_personal"
                      type="email"
                      value={editCorreoPersonal}
                      onChange={(e) => setEditCorreoPersonal(e.target.value)}
                      placeholder="Ej. personal@correo.com"
                      className="w-full bg-surface-container-low border border-outline rounded-lg px-3 py-2 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="direccion" className="block font-label-caps text-label-caps text-on-surface-variant uppercase">
                      Dirección
                    </label>
                    <input
                      id="direccion"
                      type="text"
                      value={editDireccion}
                      onChange={(e) => setEditDireccion(e.target.value)}
                      placeholder="Dirección de residencia"
                      className="w-full bg-surface-container-low border border-outline rounded-lg px-3 py-2 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>

                  <div className="border-t border-outline-variant pt-2 space-y-2">
                    <h4 className="font-bold text-xs text-primary uppercase">Contacto de emergencia</h4>

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label htmlFor="contacto_emergencia" className="block font-label-caps text-label-caps text-on-surface-variant uppercase">
                          Nombre completo
                        </label>
                        <input
                          id="contacto_emergencia"
                          type="text"
                          value={editContactoEmergencia}
                          onChange={(e) => setEditContactoEmergencia(e.target.value)}
                          placeholder="Nombre completo"
                          className="w-full bg-surface-container-low border border-outline rounded-lg px-3 py-2 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="parentesco" className="block font-label-caps text-label-caps text-on-surface-variant uppercase">
                          Parentesco
                        </label>
                        <input
                          id="parentesco"
                          type="text"
                          value={editParentesco}
                          onChange={(e) => setEditParentesco(e.target.value)}
                          placeholder="Ej. Madre, Cónyuge"
                          className="w-full bg-surface-container-low border border-outline rounded-lg px-3 py-2 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="telefono_emergencia" className="block font-label-caps text-label-caps text-on-surface-variant uppercase">
                          Teléfono de emergencia
                        </label>
                        <input
                          id="telefono_emergencia"
                          type="text"
                          value={editTelefonoEmergencia}
                          onChange={(e) => setEditTelefonoEmergencia(e.target.value)}
                          placeholder="Ej. +57 300 000 0000"
                          className="w-full bg-surface-container-low border border-outline rounded-lg px-3 py-2 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2">
                    <label htmlFor="foto" className="block font-label-caps text-label-caps text-on-surface-variant uppercase">
                      Foto de perfil
                    </label>
                    <input
                      id="foto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="w-full bg-surface-container-low border border-outline rounded-lg px-3 py-2 text-on-surface file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:opacity-90 transition-all text-sm cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-outline-variant rounded-xl hover:bg-surface-container text-on-surface font-label-caps text-label-caps text-sm transition-all cursor-pointer"
                      disabled={submittingEdit}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-xl font-label-caps text-label-caps text-sm transition-all cursor-pointer flex items-center gap-2"
                      disabled={submittingEdit}
                    >
                      {submittingEdit ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                          <span>Guardando…</span>
                        </>
                      ) : (
                        <span>Guardar cambios</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Solicitar Permiso / Ausentismo Laboral */}
          {isSolicitudModalOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">event_busy</span>
                    <h3 className="font-bold text-on-surface text-lg">Solicitud de Permisos</h3>
                  </div>
                  <button
                    onClick={() => setIsSolicitudModalOpen(false)}
                    className="material-symbols-outlined text-on-surface-variant p-1 hover:bg-surface-container rounded-full transition-colors cursor-pointer"
                  >
                    close
                  </button>
                </div>

                <form onSubmit={handleCrearSolicitud} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="block font-bold text-on-surface-variant uppercase tracking-wider">
                      Tipo de Solicitud *
                    </label>
                    <select
                      value={tipoSolicitud}
                      onChange={(e) => setTipoSolicitud(e.target.value)}
                      className="w-full bg-background border border-outline-variant rounded-xl p-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer font-medium"
                    >
                      <option value="Ausentismo Laboral">Ausentismo Laboral (Día / Franja)</option>
                      <option value="Licencia Médica / Incapacidad">Licencia Médica / Incapacidad</option>
                      <option value="Cita Médica">Cita Médica</option>
                      <option value="Permiso Calamidad">Permiso por Calamidad Doméstica</option>
                      <option value="Vacaciones">Vacaciones</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-bold text-on-surface-variant uppercase tracking-wider">
                        Fecha de Inicio / Día *
                      </label>
                      <input
                        type="date"
                        required
                        value={fechaInicioSolicitud}
                        onChange={(e) => setFechaInicioSolicitud(e.target.value)}
                        className="w-full bg-background border border-outline-variant rounded-xl p-2.5 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-on-surface-variant uppercase tracking-wider">
                        Fecha de Fin (Opcional)
                      </label>
                      <input
                        type="date"
                        value={fechaFinSolicitud}
                        onChange={(e) => setFechaFinSolicitud(e.target.value)}
                        className="w-full bg-background border border-outline-variant rounded-xl p-2.5 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-on-surface-variant uppercase tracking-wider">
                      Motivo de la Ausencia *
                    </label>
                    <textarea
                      rows="3"
                      required
                      value={motivoSolicitud}
                      onChange={(e) => setMotivoSolicitud(e.target.value)}
                      placeholder="Describe la razón o justificación de tu solicitud de permiso..."
                      className="w-full bg-background border border-outline-variant rounded-xl p-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                    ></textarea>
                  </div>

                  <div className="space-y-1.5 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
                    <label className="block font-bold text-on-surface flex items-center justify-between">
                      <span>Adjuntar Soporte Documental</span>
                      <span className="text-[10px] text-on-surface-variant font-normal">PDF, JPG, PNG (Máx 10MB)</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf, image/*"
                      onChange={(e) => setArchivoAdjunto(e.target.files[0])}
                      className="w-full text-on-surface text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:opacity-90 transition-all cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsSolicitudModalOpen(false)}
                      className="px-4 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant rounded-xl font-bold transition-all cursor-pointer"
                      disabled={submittingSolicitud}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingSolicitud}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {submittingSolicitud ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">send</span>
                          <span>Enviar Solicitud</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PerfilEmpleado;
