import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { actualizarEmpleado } from '../services/api';
import { toast } from 'react-hot-toast';
import defaultAvatar from '../assets/default_avatar.png';

const PerfilEmpleado = () => {
  const { user, setUser, logout } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para modal de edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTelefono, setEditTelefono] = useState('');
  const [editCorreoPersonal, setEditCorreoPersonal] = useState('');
  const [editContactoEmergencia, setEditContactoEmergencia] = useState('');
  const [editParentesco, setEditParentesco] = useState('');
  const [editTelefonoEmergencia, setEditTelefonoEmergencia] = useState('');
  const [editNombres, setEditNombres] = useState('');
  const [editApellidos, setEditApellidos] = useState('');
  const [editDocumentoIdentidad, setEditDocumentoIdentidad] = useState('');
  const [editTipoGenero, setEditTipoGenero] = useState('');
  const [editFechaNacimiento, setEditFechaNacimiento] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Cargar datos del perfil en tiempo real al entrar a la página
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const url = id ? `/empleados/perfil/${id}` : '/empleados/perfil';
        const response = await api.get(url);
        setProfile(response.data.perfil);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la información de perfil.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleDescargarCertificado = async () => {
    setDownloading(true);
    setError('');

    try {
      // Hacer la petición GET configurando responseType como 'blob'
      const response = await api.get('/empleados/certificado', {
        responseType: 'blob'
      });

      // Crear URL temporal para el blob del PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Crear elemento de descarga y forzar el clic
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certificado_laboral.pdf');
      document.body.appendChild(link);
      link.click();
      
      // Limpiar el DOM y liberar el recurso
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Error al generar el certificado laboral en PDF. Asegúrate de tener un contrato activo.');
    } finally {
      setDownloading(false);
    }
  };

  const getFormatoMoneda = (valor) => {
    if (valor === null || valor === undefined) return 'No registrado';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const manejarModuloEnDesarrollo = (e) => {
    e.preventDefault();
    toast('Módulo en desarrollo para la Fase 2', { icon: '🚧' });
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

        const uploadRes = await api.put('/empleados/perfil/foto', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        nuevaFoto = uploadRes.data.foto_perfil;

        // Actualizar el contexto de autenticación en tiempo real
        setUser(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            foto_perfil: nuevaFoto
          }
        }));
        setSelectedFile(null);
      }

      const payload = {
        documento_identidad: editDocumentoIdentidad,
        nombres: editNombres,
        apellidos: editApellidos,
        telefono: editTelefono,
        fecha_ingreso: profile?.fecha_ingreso,
        fecha_terminacion: profile?.fecha_terminacion,
        habilidades: profile?.habilidades,
        fecha_info_personal: profile?.fecha_info_personal || new Date().toISOString(),
        fecha_soportes: profile?.fecha_soportes,
        fecha_seguridad: profile?.fecha_seguridad,
        superior_inmediato: profile?.superior_inmediato,
        departamento: profile?.departamento,
        tipo_genero: editTipoGenero,
        fecha_nacimiento: editFechaNacimiento || null,
        correo_personal: editCorreoPersonal,
        contacto_emergencia: editContactoEmergencia,
        parentesco: editParentesco,
        telefono_emergencia: editTelefonoEmergencia
      };

      await actualizarEmpleado(profile.id, payload);
      
      setProfile({
        ...profile,
        nombres: editNombres,
        apellidos: editApellidos,
        documento_identidad: editDocumentoIdentidad,
        tipo_genero: editTipoGenero,
        fecha_nacimiento: editFechaNacimiento,
        telefono: editTelefono,
        foto_perfil: nuevaFoto,
        correo_personal: editCorreoPersonal,
        contacto_emergencia: editContactoEmergencia,
        parentesco: editParentesco,
        telefono_emergencia: editTelefonoEmergencia,
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

  const esPropioPerfil = (!id) || (profile && user && profile.usuario_id === user.id);
  const esAdmin = user && user.rol_id === 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-slate-400 text-sm">Cargando tu perfil laboral...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* TopNavBar Shell */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100/50">
        <div className="flex items-center gap-8">
          <span className="font-headline-md text-headline-md font-bold text-primary">CoreRRHH</span>
          <nav className="hidden md:flex gap-2 items-center">
            <Link className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium" to="/directorio">Directorio</Link>
            <a className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium" href="#" onClick={manejarModuloEnDesarrollo}>Beneficios</a>
            <a className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium" href="#" onClick={manejarModuloEnDesarrollo}>Capacitación</a>
            <a className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium" href="#" onClick={manejarModuloEnDesarrollo}>Nómina</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer" onClick={manejarModuloEnDesarrollo}>notifications</button>
          <button className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer" onClick={manejarModuloEnDesarrollo}>settings</button>
          <div 
            onClick={logout}
            title="Cerrar Sesión"
            className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border border-outline-variant cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img 
              alt="Employee Profile Avatar" 
              className="w-full h-full object-cover" 
              src={user?.profile?.foto_perfil ? `http://localhost:3000${user.profile.foto_perfil}` : defaultAvatar}
            />
          </div>
        </div>
      </header>

      {/* SideNavBar Shell */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-64 p-4 bg-surface-container-low border-r border-outline-variant">
        <div className="mb-8 px-4 py-3 flex items-center gap-3">
          <img src="/src/assets/LogoSolo.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold text-slate-800 leading-tight">Gimnasio Los Arrayanes</p>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Portal RRHH</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-3 bg-emerald-50 text-emerald-800 font-semibold rounded-xl px-4 py-2 transition-colors" href="#">
            <span className="material-symbols-outlined">person</span>
            <span className="font-label-caps text-label-caps">Resumen</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 rounded-lg" href="#" onClick={manejarModuloEnDesarrollo}>
            <span className="material-symbols-outlined">description</span>
            <span className="font-label-caps text-label-caps">Documentos</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 rounded-lg" href="#" onClick={manejarModuloEnDesarrollo}>
            <span className="material-symbols-outlined">work</span>
            <span className="font-label-caps text-label-caps">Experiencia</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 rounded-lg" href="#" onClick={manejarModuloEnDesarrollo}>
            <span className="material-symbols-outlined">trending_up</span>
            <span className="font-label-caps text-label-caps">Desempeño</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 rounded-lg" href="#" onClick={manejarModuloEnDesarrollo}>
            <span className="material-symbols-outlined">manage_accounts</span>
            <span className="font-label-caps text-label-caps">Ajustes</span>
          </a>
        </nav>
        <div className="mt-auto pt-4 border-t border-outline-variant space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 rounded-lg" href="#">
            <span className="material-symbols-outlined">help</span>
            <span className="font-label-caps text-label-caps">Soporte</span>
          </a>
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-200 rounded-lg cursor-pointer text-left focus:outline-none"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-caps text-label-caps">Cerrar Sesión</span>
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
              Volver al Directorio
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
                <div className="w-32 h-32 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-white">
                  <img 
                    alt="Perfil del colaborador" 
                    className="w-full h-full object-cover" 
                    src={profile?.foto_perfil ? `http://localhost:3000${profile.foto_perfil}` : defaultAvatar}
                  />
                </div>
                <div className="pb-2">
                  <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">
                    {profile?.nombres} {profile?.apellidos}
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">
                    {profile?.cargo || 'Colaborador Institucional'} • {profile?.correo}
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
                    <span>Editar Perfil</span>
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
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-slate-800 text-lg font-semibold mb-6">
                  <span className="material-symbols-outlined text-primary text-xl">Apartment</span>
                  <h2>Información Laboral</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fecha de Contratación</span>
                    <p className="text-base text-slate-900">
                      {profile?.fecha_ingreso ? new Date(profile.fecha_ingreso).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'No registrado'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fecha de Terminación</span>
                    <p className="text-base text-slate-900">
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
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tipo de Contrato</span>
                    <p className="text-base text-slate-900">
                      {profile?.tipo_contrato || 'Sin asignar'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Salario</span>
                    <p className="text-base text-slate-900">
                      {getFormatoMoneda(profile?.salario)}
                    </p>
                  </div>
                  
                  
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Departamento</span>
                    <p className="text-base text-slate-900">
                      {profile?.departamento || 'No asignado'}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Superior Inmediato</span>
                    <p className="text-base text-slate-900">
                      {profile?.superior_inmediato || 'No registrado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información Personal */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-slate-800 text-lg font-semibold mb-6">
                  <span className="material-symbols-outlined text-primary text-xl">Inbox_Text_Person</span>
                  <h2>Información Personal</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nombre Completo</span>
                    <p className="text-base text-slate-900">
                      {profile?.nombres} {profile?.apellidos}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Documento de Identidad</span>
                    <p className="text-base text-slate-900">
                      {profile?.documento_identidad || 'No registrado'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Género</span>
                    <p className="text-base text-slate-900">
                      {profile?.tipo_genero || 'Sin asignar'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fecha de Nacimiento</span>
                    <p className="text-base text-slate-900">
                      {profile?.fecha_nacimiento ? new Date(profile.fecha_nacimiento).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'No registrado'}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Correo Personal</span>
                    <p className="text-base text-slate-900">
                      {profile?.correo_personal || 'No registrado'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Teléfono de Contacto</span>
                    <p className="text-base text-slate-900">
                      {profile?.telefono || 'No registrado'}
                    </p>
                  </div>
                </div>
              </div>
         
              {/* Contacto de Emergencia */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-slate-800 text-lg font-semibold mb-6">
                  <span className="material-symbols-outlined text-primary text-xl">siren</span>
                  <h2>Contacto de Emergencia</h2>
                </div>
        
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">                                    
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nombre Completo</span>
                    <p className="text-base text-slate-900">
                      {profile?.contacto_emergencia || 'No registrado'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Parentesco</span>
                    <p className="text-base text-slate-900">
                      {profile?.parentesco || 'No registrado'}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Teléfono de Contacto</span>
                    <p className="text-base text-slate-900">
                      {profile?.telefono_emergencia || 'No registrado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Habilidades */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-slate-800 text-lg font-semibold mb-6">
                  <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                  <h2>Habilidades</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {profile?.habilidades && profile.habilidades.length > 0 ? (
                    profile.habilidades.map((hab, index) => (
                      <span key={index} className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-label-caps hover:scale-105 transition-transform cursor-default">
                        {hab}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-outline italic">Sin habilidades registradas</span>
                  )}
                </div>
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
                    <button 
                      onClick={handleDescargarCertificado}
                      disabled={downloading || !profile?.cargo}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2.5 px-4 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-3"
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
                    
                    <button onClick={manejarModuloEnDesarrollo} className="w-full bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 px-4 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-500">receipt_long</span>
                      <span>Ver Desprendibles de Pago</span>
                    </button>
                    
                    <button onClick={manejarModuloEnDesarrollo} className="w-full bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 px-4 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-500">event_available</span>
                      <span>Solicitar Vacaciones</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Progress Stepper */}
              <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-6 uppercase tracking-widest">
                  Actualización de Datos 2024
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
                      <p className={`font-label-caps text-label-caps ${profile?.fecha_info_personal ? 'text-primary' : 'text-on-surface-variant'}`}>Información Personal</p>
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
                      <p className={`font-label-caps text-label-caps ${profile?.fecha_soportes ? 'text-primary' : 'text-on-surface-variant'}`}>Soportes Académicos</p>
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
                      <p className={`font-label-caps text-label-caps ${profile?.fecha_seguridad ? 'text-primary' : 'text-on-surface'}`}>Validación de Seguridad</p>
                      <p className="text-[12px] text-on-surface-variant">
                        {profile?.fecha_seguridad ? `Completado el ${getFechaFormateadaStepper(profile.fecha_seguridad)}` : 'Pendiente'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </aside>
          </div>
          
      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                Editar Datos del Colaborador
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
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
              
              {/* Datos Personales Básicos */}
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
                  Documento de Identidad
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
                    Fecha de Nacimiento
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
                  Correo Personal
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

              <div className="border-t border-outline-variant pt-2 space-y-2">
                <h4 className="font-bold text-xs text-primary uppercase">Contacto de Emergencia</h4>
                
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label htmlFor="contacto_emergencia" className="block font-label-caps text-label-caps text-on-surface-variant uppercase">
                      Nombre Completo
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
                      Teléfono de Emergencia
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
                  Foto de Perfil
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
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
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
