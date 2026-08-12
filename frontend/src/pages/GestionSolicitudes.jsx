import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { obtenerSolicitudes, actualizarEstadoSolicitud, obtenerAdjuntoSolicitud } from '../services/api';
import { toast } from 'react-hot-toast';
import EmployeeAvatar from '../components/EmployeeAvatar';

const GestionSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Estado para modal de aprobación/rechazo
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [modalAccion, setModalAccion] = useState(null); // 'Aprobar' o 'Rechazar'
  const [comentariosAdmin, setComentariosAdmin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Estado para vista previa de soporte
  const [previewFile, setPreviewFile] = useState(null);

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      const res = await obtenerSolicitudes();
      setSolicitudes(res.solicitudes || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar la lista de solicitudes.');
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const handleAbrirModal = (solicitud, accion) => {
    setSelectedSolicitud(solicitud);
    setModalAccion(accion);
    setComentariosAdmin(solicitud.comentarios_admin || '');
  };

  const handleConfirmarAccion = async (e) => {
    e.preventDefault();
    if (!selectedSolicitud || !modalAccion) return;

    const nuevoEstado = modalAccion === 'Aprobar' ? 'Aprobado' : 'Rechazado';
    setSubmitting(true);

    try {
      await actualizarEstadoSolicitud(selectedSolicitud.id, {
        estado: nuevoEstado,
        comentarios_admin: comentariosAdmin
      });

      toast.success(`Solicitud marcada como ${nuevoEstado} exitosamente.`);
      setSelectedSolicitud(null);
      setModalAccion(null);
      setComentariosAdmin('');
      fetchSolicitudes();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error al actualizar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrado dinámico
  const solicitudesFiltradas = solicitudes.filter(sol => {
    const nombreCompleto = `${sol.nombres || ''} ${sol.apellidos || ''}`.toLowerCase();
    const doc = (sol.documento_identidad || '').toLowerCase();
    const motivo = (sol.motivo || '').toLowerCase();
    const tipo = (sol.tipo_solicitud || '').toLowerCase();

    const matchesSearch = 
      nombreCompleto.includes(searchTerm.toLowerCase()) ||
      doc.includes(searchTerm.toLowerCase()) ||
      motivo.includes(searchTerm.toLowerCase()) ||
      tipo.includes(searchTerm.toLowerCase());

    const matchesEstado = 
      filtroEstado === 'Todos' || 
      sol.estado === filtroEstado;

    return matchesSearch && matchesEstado;
  });

  const totalPendientes = solicitudes.filter(s => s.estado === 'Pendiente').length;
  const totalAprobados = solicitudes.filter(s => s.estado === 'Aprobado').length;
  const totalRechazados = solicitudes.filter(s => s.estado === 'Rechazado').length;

  const abrirAdjunto = async (solicitud) => {
    try {
      const blob = await obtenerAdjuntoSolicitud(solicitud.archivo_url);
      const url = URL.createObjectURL(blob);
      setPreviewFile({
        url,
        isPdf: solicitud.archivo_adjunto?.toLowerCase().endsWith('.pdf'),
      });
    } catch (err) {
      console.error(err);
      toast.error('No se pudo cargar el soporte adjunto.');
    }
  };

  const cerrarAdjunto = () => {
    if (previewFile?.url) URL.revokeObjectURL(previewFile.url);
    setPreviewFile(null);
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    const d = new Date(fechaStr.includes('T') ? fechaStr : fechaStr + 'T12:00:00');
    return d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in text-on-surface">
        
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Gestión de Ausentismos y Permisos</h1>
            <p className="text-on-surface-variant mt-1 text-xs font-semibold uppercase tracking-wider">
              Control e inspección de solicitudes laborales con soporte documental
            </p>
          </div>

          <button 
            onClick={fetchSolicitudes}
            className="self-start md:self-auto flex items-center gap-2 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Actualizar</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Recibidas</span>
              <span className="material-symbols-outlined text-primary text-xl">inbox</span>
            </div>
            <p className="text-2xl font-black text-on-surface">{solicitudes.length}</p>
          </div>

          <div className="bg-surface-container-lowest border border-amber-500/30 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            {totalPendientes > 0 && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            )}
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pendientes</span>
              <span className="material-symbols-outlined text-amber-500 text-xl">pending_actions</span>
            </div>
            <p className="text-2xl font-black text-amber-500">{totalPendientes}</p>
          </div>

          <div className="bg-surface-container-lowest border border-emerald-500/30 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Aprobadas</span>
              <span className="material-symbols-outlined text-emerald-500 text-xl">task_alt</span>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalAprobados}</p>
          </div>

          <div className="bg-surface-container-lowest border border-rose-500/30 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Rechazadas</span>
              <span className="material-symbols-outlined text-rose-500 text-xl">cancel</span>
            </div>
            <p className="text-2xl font-black text-rose-500">{totalRechazados}</p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-xl">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input 
              type="text" 
              placeholder="Buscar por colaborador, documento o motivo..." 
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-outline-variant rounded-xl text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {['Todos', 'Pendiente', 'Aprobado', 'Rechazado'].map((est) => {
              const isActive = filtroEstado === est;
              return (
                <button
                  key={est}
                  onClick={() => setFiltroEstado(est)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? 'bg-primary/10 border border-primary/20 text-primary font-extrabold shadow-sm' 
                      : 'bg-background border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {est}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-xl p-4">
            {error}
          </div>
        )}

        {/* Main Content Table / Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-on-surface-variant text-sm">Cargando solicitudes...</p>
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div className="py-24 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-8">
            <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-4">event_busy</span>
            <p className="text-on-surface font-medium text-lg">No hay solicitudes registradas</p>
            <p className="text-on-surface-variant text-sm mt-1">Modifica los parámetros de búsqueda o espera nuevas peticiones de colaboradores.</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/60 bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Colaborador</th>
                    <th className="py-4 px-6">Tipo / Ausentismo</th>
                    <th className="py-4 px-6">Fechas</th>
                    <th className="py-4 px-6">Motivo & Soporte</th>
                    <th className="py-4 px-6">Estado</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40 text-xs">
                  {solicitudesFiltradas.map((sol) => {
                    const isPdf = sol.archivo_adjunto?.toLowerCase().endsWith('.pdf');

                    return (
                      <tr key={sol.id} className="hover:bg-surface-container/30 transition-colors">
                        {/* Colaborador */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <EmployeeAvatar
                              employee={sol}
                              alt={`Foto de perfil de ${sol.nombres}`}
                              className="w-10 h-10 rounded-full border border-outline-variant shrink-0 text-xs"
                            />
                            <div>
                              <p className="font-bold text-on-surface text-sm">
                                {sol.nombres} {sol.apellidos}
                              </p>
                              <p className="text-[11px] text-on-surface-variant">
                                Doc: {sol.documento_identidad || 'N/A'} • {sol.cargo || 'Colaborador'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Tipo de Ausentismo */}
                        <td className="py-4 px-6">
                          <span className="inline-block px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-bold text-[11px]">
                            {sol.tipo_solicitud}
                          </span>
                        </td>

                        {/* Fechas */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <p className="font-bold text-on-surface">
                            {formatearFecha(sol.fecha_inicio)}
                          </p>
                          {sol.fecha_fin && sol.fecha_fin !== sol.fecha_inicio && (
                            <p className="text-[10px] text-on-surface-variant mt-0.5">
                              hasta {formatearFecha(sol.fecha_fin)}
                            </p>
                          )}
                        </td>

                        {/* Motivo & Soporte */}
                        <td className="py-4 px-6 min-w-[240px] max-w-md">
                          <p className="text-on-surface font-medium text-xs mb-1.5" title={sol.motivo}>
                            {sol.motivo}
                          </p>
                          {sol.archivo_adjunto ? (
                            <button
                              onClick={() => abrirAdjunto(sol)}
                              className="inline-flex items-center gap-1.5 text-primary hover:underline font-bold text-[11px] cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {isPdf ? 'picture_as_pdf' : 'image'}
                              </span>
                              <span>Ver Soporte Adjunto</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-on-surface-variant italic">Sin soporte adjunto</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          {sol.estado === 'Aprobado' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-[12px]">check_circle</span>
                              <span>Aprobado</span>
                            </span>
                          )}
                          {sol.estado === 'Rechazado' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-[12px]">cancel</span>
                              <span>Rechazado</span>
                            </span>
                          )}
                          {sol.estado === 'Pendiente' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-[12px]">hourglass_top</span>
                              <span>Pendiente</span>
                            </span>
                          )}

                          {sol.comentarios_admin && (
                            <p className="text-[10px] text-on-surface-variant mt-1.5 italic max-w-xs" title={sol.comentarios_admin}>
                              " {sol.comentarios_admin} "
                            </p>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {sol.estado === 'Pendiente' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleAbrirModal(sol, 'Aprobar')}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                <span className="material-symbols-outlined text-[14px]">check</span>
                                <span>Aprobar</span>
                              </button>

                              <button
                                onClick={() => handleAbrirModal(sol, 'Rechazar')}
                                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                                <span>Rechazar</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end pr-2" title={`Ciclo Completado (${sol.estado})`}>
                              <span className="material-symbols-outlined text-primary/70 text-[22px] select-none">
                                verified
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal para Aprobar / Rechazar */}
        {selectedSolicitud && modalAccion && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className={`material-symbols-outlined ${modalAccion === 'Aprobar' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {modalAccion === 'Aprobar' ? 'verified' : 'gavel'}
                  </span>
                  <span>{modalAccion} Solicitud</span>
                </h3>
                <button 
                  onClick={() => setSelectedSolicitud(null)}
                  className="material-symbols-outlined text-on-surface-variant p-1 hover:bg-surface-container rounded-full transition-colors cursor-pointer"
                >
                  close
                </button>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-2 text-xs">
                <p><strong className="text-on-surface">Colaborador:</strong> {selectedSolicitud.nombres} {selectedSolicitud.apellidos}</p>
                <p><strong className="text-on-surface">Tipo:</strong> {selectedSolicitud.tipo_solicitud}</p>
                <p><strong className="text-on-surface">Fecha:</strong> {formatearFecha(selectedSolicitud.fecha_inicio)}</p>
                <p><strong className="text-on-surface">Motivo:</strong> {selectedSolicitud.motivo}</p>
              </div>

              <form onSubmit={handleConfirmarAccion} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Comentarios del Administrador (Opcional)
                  </label>
                  <textarea
                    rows="3"
                    value={comentariosAdmin}
                    onChange={(e) => setComentariosAdmin(e.target.value)}
                    placeholder={modalAccion === 'Aprobar' ? 'Ej. Permiso concedido en nómina.' : 'Ej. Falta adjuntar comprobante válido.'}
                    className="w-full bg-background border border-outline-variant rounded-xl p-3 text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSolicitud(null)}
                    className="px-4 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-5 py-2 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                      modalAccion === 'Aprobar' 
                        ? 'bg-emerald-700 hover:bg-emerald-800' 
                        : 'bg-rose-700 hover:bg-rose-800'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <span>Confirmar {modalAccion}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Previsualización de Soporte Documental */}
        {previewFile && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-3xl w-full h-[85vh] flex flex-col p-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-outline-variant pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">attachment</span>
                  <h3 className="font-bold text-on-surface text-base">Comprobante de Ausentismo Adjunto</h3>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-bold"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    <span>Abrir Completo</span>
                  </a>
                  <button 
                    onClick={cerrarAdjunto}
                    className="material-symbols-outlined text-on-surface-variant p-1 hover:bg-surface-container rounded-full transition-colors cursor-pointer"
                  >
                    close
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-surface-container-low rounded-xl overflow-hidden flex items-center justify-center border border-outline-variant p-2">
                {previewFile.isPdf ? (
                  <iframe 
                    src={previewFile.url} 
                    className="w-full h-full rounded-lg"
                    title="Vista previa del comprobante PDF"
                  />
                ) : (
                  <img 
                    src={previewFile.url} 
                    alt="Soporte documental adjunto"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                  />
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default GestionSolicitudes;
