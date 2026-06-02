import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PerfilEmpleado = () => {
  const { user, logout } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      
      {/* Header Corporativo */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Portal del Colaborador
          </h1>
          <p className="text-slate-500 text-xs hidden sm:block">CoreRRHH - Gimnasio Los Arrayanes Bilingüe</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-300 text-sm hidden md:inline">
            {profile?.correo} <span className="text-xs bg-slate-800 px-2.5 py-1 rounded ml-1 text-slate-400">Empleado</span>
          </span>
          <button
            onClick={logout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3.5 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 sm:p-8 max-w-4xl w-full mx-auto space-y-6">
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Tarjeta de Presentación Premium (Bento Grid / Glassmorphism) */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md">
          
          {/* Cover / Banner de fondo */}
          <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-slate-950 h-32 relative">
            <div className="absolute -bottom-10 left-8">
              <div className="bg-slate-900 border-4 border-slate-950 text-emerald-400 text-4xl font-bold h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg">
                {profile?.nombres ? profile.nombres[0] : 'U'}
              </div>
            </div>
          </div>

          {/* Información del Perfil */}
          <div className="pt-14 pb-8 px-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">
                {profile?.nombres} {profile?.apellidos}
              </h2>
              <p className="text-emerald-400 text-sm font-medium mt-1">
                {profile?.cargo || 'Colaborador Institucional'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-b border-slate-800/60 py-6">
              
              {/* Sección Datos Personales */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-1.5">
                  Información Personal
                </h3>
                <div className="grid grid-cols-3 gap-y-2.5 text-sm">
                  <span className="text-slate-500 col-span-1">Documento:</span>
                  <span className="col-span-2 font-mono text-slate-200">{profile?.documento_identidad}</span>
                  
                  <span className="text-slate-500 col-span-1">Email:</span>
                  <span className="col-span-2 text-slate-200 break-all">{profile?.correo}</span>

                  <span className="text-slate-500 col-span-1">Teléfono:</span>
                  <span className="col-span-2 text-slate-200">{profile?.telefono || 'No registrado'}</span>

                  <span className="text-slate-500 col-span-1">Ingreso:</span>
                  <span className="col-span-2 text-slate-200">
                    {profile?.fecha_ingreso ? new Date(profile.fecha_ingreso).toLocaleDateString() : 'No registrado'}
                  </span>
                </div>
              </div>

              {/* Sección Datos del Contrato */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-1.5">
                  Condiciones Laborales
                </h3>
                <div className="grid grid-cols-3 gap-y-2.5 text-sm">
                  <span className="text-slate-500 col-span-1">Contrato:</span>
                  <span className="col-span-2 text-slate-200">
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-350">
                      {profile?.tipo_contrato || 'Sin asignar'}
                    </span>
                  </span>

                  <span className="text-slate-500 col-span-1">Salario:</span>
                  <span className="col-span-2 font-semibold text-emerald-400 font-mono">
                    {getFormatoMoneda(profile?.salario)}
                  </span>

                  <span className="text-slate-500 col-span-1">Inicio:</span>
                  <span className="col-span-2 text-slate-200 font-mono">
                    {profile?.contrato_fecha_inicio ? new Date(profile.contrato_fecha_inicio).toLocaleDateString() : 'No registrado'}
                  </span>

                  <span className="text-slate-500 col-span-1">Estado:</span>
                  <span className="col-span-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      profile?.contrato_estado === 'Activo' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                    }`}>
                      {profile?.contrato_estado || 'Inactivo'}
                    </span>
                  </span>
                </div>
              </div>

            </div>

            {/* Panel de Descarga del Certificado */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl">
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Certificación de Vínculo Laboral</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Genera instantáneamente un PDF certificado firmado por Recursos Humanos del Gimnasio Los Arrayanes Bilingüe.
                </p>
              </div>
              <button
                onClick={handleDescargarCertificado}
                disabled={downloading || !profile?.cargo}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-sm rounded-xl py-3 px-6 shadow-lg shadow-emerald-950/30 hover:shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none cursor-pointer flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white"></div>
                    <span>Generando PDF...</span>
                  </>
                ) : (
                  <>
                    <span>📄</span>
                    <span>Descargar Certificado Laboral</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default PerfilEmpleado;
