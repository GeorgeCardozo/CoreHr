import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { actualizarEmpleado } from '../services/api';
import { toast } from 'react-hot-toast';

const PerfilEmpleado = () => {
  const { user, logout } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para modal de edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTelefono, setEditTelefono] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Cargar datos del perfil en tiempo real al entrar a la página
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/empleados/perfil');
        setProfile(response.data.perfil);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la información de perfil.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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

  const handleOpenEdit = () => {
    setEditTelefono(profile?.telefono || '');
    setEditError('');
    setIsModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    setEditError('');

    try {
      const payload = {
        documento_identidad: profile.documento_identidad,
        nombres: profile.nombres,
        apellidos: profile.apellidos,
        telefono: editTelefono,
        fecha_ingreso: profile.fecha_ingreso
      };

      await actualizarEmpleado(profile.id, payload);
      
      setProfile({
        ...profile,
        telefono: editTelefono
      });

      toast.success('Perfil actualizado con éxito');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Error al actualizar el teléfono';
      setEditError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmittingEdit(false);
    }
  };

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
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      {/* TopNavBar Shell */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-8">
          <span className="font-headline-md text-headline-md font-bold text-primary">CoreRRHH</span>
          <nav className="hidden md:flex gap-6 items-center">
            <a className="text-on-surface-variant font-label-caps text-label-caps hover:text-primary transition-colors" href="#" onClick={manejarModuloEnDesarrollo}>Directorio</a>
            <a className="text-on-surface-variant font-label-caps text-label-caps hover:text-primary transition-colors" href="#" onClick={manejarModuloEnDesarrollo}>Beneficios</a>
            <a className="text-on-surface-variant font-label-caps text-label-caps hover:text-primary transition-colors" href="#" onClick={manejarModuloEnDesarrollo}>Capacitación</a>
            <a className="text-on-surface-variant font-label-caps text-label-caps hover:text-primary transition-colors" href="#" onClick={manejarModuloEnDesarrollo}>Nómina</a>
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
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUNouRX3sUIktEVbkXImzXNPrcsnh9g-9pWEYMKi2VvBn4VE32pTEomgAAtJDnFwgnWAnWAHW6q9CLcfn4RSWFb8VNky5Kg7uavq_aGR6UmmYnXr5-YgLVr-b_31CIzVp3TvNX1w-t1QbL_fPrbwRdfRzyCHwM3K-xj6hD69FarJza_EwIrZGoyU4AGgqZ5QlTK6qf_NpgXkbhy2-t1toQue4_09D4hWiyXZUEO57X2U0-tY6MpiwIkqw3hNo9nyA-2iDDE-IcJtf4"
            />
          </div>
        </div>
      </header>

      {/* SideNavBar Shell */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-64 p-4 bg-surface-container-low border-r border-outline-variant">
        <div className="mb-8 p-4 bg-primary-container rounded-2xl text-on-primary-container">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined">school</span>
            <span className="font-label-caps text-label-caps">Gimnasio Los Arrayanes</span>
          </div>
          <p className="font-headline-md text-headline-md font-bold">Portal</p>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-bold" href="#">
            <span className="material-symbols-outlined">person</span>
            <span className="font-label-caps text-label-caps">Resumen</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="#" onClick={manejarModuloEnDesarrollo}>
            <span className="material-symbols-outlined">description</span>
            <span className="font-label-caps text-label-caps">Documentos</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="#" onClick={manejarModuloEnDesarrollo}>
            <span className="material-symbols-outlined">work</span>
            <span className="font-label-caps text-label-caps">Experiencia</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="#" onClick={manejarModuloEnDesarrollo}>
            <span className="material-symbols-outlined">trending_up</span>
            <span className="font-label-caps text-label-caps">Desempeño</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="#" onClick={manejarModuloEnDesarrollo}>
            <span className="material-symbols-outlined">manage_accounts</span>
            <span className="font-label-caps text-label-caps">Ajustes</span>
          </a>
        </nav>
        <div className="mt-auto pt-4 border-t border-outline-variant space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">help</span>
            <span className="font-label-caps text-label-caps">Soporte</span>
          </a>
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all cursor-pointer text-left focus:outline-none"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-caps text-label-caps">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-lg p-3 mb-6">
              {error}
            </div>
          )}

          {/* Hero Profile Card */}
          <section className="relative overflow-hidden rounded-2xl bg-surface-container-lowest border border-outline-variant mb-8 group">
            {/* Cover Background */}
            <div className="h-48 w-full bg-gradient-to-r from-primary via-secondary to-surface-tint relative">
              <img 
                className="w-full h-full object-cover mix-blend-overlay opacity-60" 
                alt="Vista panorámica de la institución"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWp294QNaJgIlnp0p7eWXHwlPXHCRIPhRfpzJzptFvBAWNZnanksppKuLcqsDGNTgevyN6Vwyjo_vtyzYuEWM7UXr5YHNT8mWIzm_xITeUns-eUa8g0JCMKE0_W6mie32xW0u2qCyKzGWu0fCvO_Vj74iAsntMWUZoCt0yXCCG_Dd8gxHe1cw4-2zU-D81K6HgvpcJLr608y23T2JmH1o09mISaz3kDl39t6qEMHbCQs7mXWqUIsCjbV6PyRVXBMDevNpCWR8SvLn_"
              />
            </div>
            
            {/* Profile Content */}
            <div className="px-8 pb-8 flex flex-col md:flex-row items-end justify-between gap-6 -mt-16 relative z-10 w-full">
              <div className="flex flex-col md:flex-row items-end gap-6">
                <div className="w-32 h-32 rounded-full border-4 border-surface p-1 bg-surface-container-lowest overflow-hidden shadow-xl">
                  <img 
                    alt="Perfil del colaborador" 
                    className="w-full h-full object-cover rounded-full" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl6XMWYT4xKNtN2Tl4ZBzeL3iCCY--9x4VMcVeb4PJPQa226l1RB7VjAYIznd9fizOprYzpwTaQrB0GdfoXU9s_K3aPDEMwyk18Qajtkml7iu2xTfPe9F-VIiCF5MZEI5mirSpog411GvUUHx6JPwMukd5gM79BNIfkIbX5tvo6nlW_Wr6-cP2LvTuli9WI1tLlGWVq6WQuRNCuZkbUDy_3ZhstvuBdI0f9djNlLhLazLIYPuNkpfYeNwiaszfHWWb5Glmj21_8HKJ"
                  />
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="font-headline-lg text-headline-lg text-on-surface">
                      {profile?.nombres} {profile?.apellidos}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-[12px] font-bold">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      Gimnasio Los Arrayanes Bilingüe
                    </span>
                  </div>
                  <p className="font-body-lg text-body-lg text-on-surface-variant">
                    {profile?.cargo || 'Colaborador Institucional'}
                  </p>
                </div>
              </div>
              <div className="pb-2 self-center md:self-end">
                <button 
                  onClick={handleOpenEdit}
                  className="flex items-center gap-2 px-4 py-2 border border-outline-variant hover:bg-surface-container rounded-xl text-on-surface font-label-caps text-label-caps transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  <span>Editar Perfil</span>
                </button>
              </div>
            </div>
          </section>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Información Laboral */}
              <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-primary">badge</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Información Laboral</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Fecha de Contratación</p>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-outline">calendar_today</span>
                      <p className="font-body-md text-body-md text-on-surface font-semibold">
                        {profile?.fecha_ingreso ? new Date(profile.fecha_ingreso).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'No registrado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Tipo de Contrato</p>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-outline">contract</span>
                      <p className="font-body-md text-body-md text-on-surface font-semibold">
                        {profile?.tipo_contrato || 'Sin asignar'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Departamento</p>
                    <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-md text-label-caps font-semibold">
                      Académico - STEM
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Superior Inmediato</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-variant"></div>
                      <p className="font-body-md text-body-md text-on-surface">Dra. Marta Rivera</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Teléfono de Contacto</p>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-outline">phone</span>
                      <p className="font-body-md text-body-md text-on-surface font-semibold">
                        {profile?.telefono || 'No registrado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Habilidades */}
              <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Habilidades</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-label-caps hover:scale-105 transition-transform cursor-default">Node.js</span>
                  <span className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-label-caps hover:scale-105 transition-transform cursor-default">Inglés B2</span>
                  <span className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-label-caps hover:scale-105 transition-transform cursor-default">Google Workspace</span>
                  <span className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-label-caps hover:scale-105 transition-transform cursor-default">EdTech</span>
                  <span className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-label-caps hover:scale-105 transition-transform cursor-default">Python for Education</span>
                  <span className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-label-caps hover:scale-105 transition-transform cursor-default">Design Thinking</span>
                </div>
              </div>

            </div>

            {/* Right Column (1/3) */}
            <aside className="space-y-6">
              
              {/* Acciones Rápidas */}
              <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-primary">bolt</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Acciones Rápidas</h2>
                </div>
                
                <div className="space-y-4">
                  <button 
                    onClick={handleDescargarCertificado}
                    disabled={downloading || !profile?.cargo}
                    className="w-full group relative overflow-hidden bg-gradient-to-br from-primary to-secondary p-px rounded-xl transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    <div className="bg-primary/10 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center justify-center gap-3 py-4 px-6 bg-transparent text-white font-label-caps text-label-caps">
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
                    </div>
                  </button>
                  
                  <button onClick={manejarModuloEnDesarrollo} className="w-full flex items-center gap-3 p-4 border border-outline-variant rounded-xl hover:bg-surface-container transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-on-surface-variant">receipt_long</span>
                    <span className="font-label-caps text-label-caps text-on-surface">Ver Desprendibles de Pago</span>
                  </button>
                  
                  <button onClick={manejarModuloEnDesarrollo} className="w-full flex items-center gap-3 p-4 border border-outline-variant rounded-xl hover:bg-surface-container transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-on-surface-variant">event_available</span>
                    <span className="font-label-caps text-label-caps text-on-surface">Solicitar Vacaciones</span>
                  </button>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-6 uppercase tracking-widest">
                  Actualización de Datos 2024
                </h3>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-surface-tint flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[14px]">check</span>
                      </div>
                      <div className="w-0.5 h-full bg-surface-tint"></div>
                    </div>
                    <div className="pb-4">
                      <p className="font-label-caps text-label-caps text-primary">Información Personal</p>
                      <p className="text-[12px] text-on-surface-variant">Completado el 12 de Feb</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-surface-tint flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[14px]">check</span>
                      </div>
                      <div className="w-0.5 h-full bg-outline-variant"></div>
                    </div>
                    <div className="pb-4">
                      <p className="font-label-caps text-label-caps text-primary">Soportes Académicos</p>
                      <p className="text-[12px] text-on-surface-variant">Cargado hace 2 días</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full border-2 border-primary-fixed-dim bg-surface-container-lowest flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      </div>
                      <div className="w-0.5 h-full bg-outline-variant opacity-30"></div>
                    </div>
                    <div className="pb-4">
                      <p className="font-label-caps text-label-caps text-on-surface">Validación de Seguridad</p>
                      <p className="text-[12px] text-on-surface-variant">Pendiente por el usuario</p>
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
                Actualizar Datos de Contacto
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="material-symbols-outlined text-on-surface-variant p-1 hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              >
                close
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {editError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-lg p-3">
                  {editError}
                </div>
              )}
              
              <div className="space-y-1">
                <label htmlFor="telefono" className="block font-label-caps text-label-caps text-on-surface-variant uppercase">
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
