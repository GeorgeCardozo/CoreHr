import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { toast } from 'react-hot-toast';
import { enviarMensajeChat, crearSolicitud, obtenerSolicitudes } from '../services/api';
import { formatDateOnlyEsCo } from '../utils/dateOnly';

const Recursos = () => {
  const { user } = useAuth();

  // Estados de navegación interna
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' o 'solicitudes'

  // Estados del Chat de IA
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ia',
      text: `Hola, ${user?.profile?.nombres || 'Colaborador'}. Esta guía te orienta sobre los trámites disponibles en CoreRRHH.

No reemplaza la orientación de Gestión Humana ni emite conceptos legales o de nómina.`,
      fuente: 'Guía operativa interna',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Estados de Gestión de Solicitudes
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudesLoading, setSolicitudesLoading] = useState(false);
  const [showModalNueva, setShowModalNueva] = useState(false);

  const [nuevaSolicitudData, setNuevaSolicitudData] = useState({
    tipo_solicitud: 'Vacaciones',
    fecha_inicio: '',
    fecha_fin: '',
    motivo: ''
  });

  // Sugerencias de consultas frecuentes
  const sugerencias = [
    {
      titulo: 'Certificación laboral',
      pregunta: '¿Cómo descargo mi certificación laboral?',
      icono: 'picture_as_pdf',
      descripcion: 'Descarga inmediata desde tu perfil.'
    },
    {
      titulo: 'Vacaciones y permisos',
      pregunta: '¿Cómo radico una solicitud de vacaciones o permiso?',
      icono: 'event_available',
      descripcion: 'Registro y seguimiento de solicitudes.'
    },
    {
      titulo: 'Soportes de solicitud',
      pregunta: '¿Cómo adjunto un soporte a una solicitud?',
      icono: 'attach_file',
      descripcion: 'PDF, JPG, PNG o WEBP protegidos.'
    },
    {
      titulo: 'Actualización de perfil',
      pregunta: '¿Qué datos puedo actualizar en mi perfil?',
      icono: 'person_edit',
      descripcion: 'Datos personales y de contacto.'
    },
    {
      titulo: 'Datos reservados',
      pregunta: 'Tengo una consulta sobre mi contrato o salario.',
      icono: 'lock',
      descripcion: 'Canaliza la consulta con Gestión Humana.'
    },
    {
      titulo: 'Estado de solicitudes',
      pregunta: '¿Dónde consulto el estado de mis solicitudes?',
      icono: 'assignment_turned_in',
      descripcion: 'Revisa la bandeja de solicitudes.'
    }
  ];

  // Auto-scroll en el chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Cargar solicitudes
  const cargarSolicitudes = async () => {
    setSolicitudesLoading(true);
    try {
      const res = await obtenerSolicitudes();
      setSolicitudes(res.solicitudes || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar la bandeja de solicitudes.');
    } finally {
      setSolicitudesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'solicitudes') {
      cargarSolicitudes();
    }
  }, [activeTab]);

  // Enviar mensaje al Asistente de IA
  const handleSendMessage = async (e, textoPersonalizado = '') => {
    e?.preventDefault();
    const query = (textoPersonalizado || inputText).trim();
    if (!query) return;

    // Agregar mensaje del usuario
    const userMsg = {
      id: `user-${messages.length}-${query.length}`,
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textoPersonalizado) setInputText('');
    setChatLoading(true);

    try {
      const res = await enviarMensajeChat(query);
      const iaMsg = {
        id: `ia-${messages.length}-${res.respuesta?.length || 0}`,
        sender: 'ia',
        text: res.respuesta,
        fuente: res.fuente || 'Guía operativa interna',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, iaMsg]);
    } catch (err) {
      console.error(err);
      const errMsg = {
        id: `error-${messages.length}`,
        sender: 'ia',
        text: 'Lo siento, no pude procesar tu solicitud en este momento. Por favor intenta de nuevo más tarde.',
        fuente: 'Error',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // Crear una nueva solicitud (Empleado)
  const handleCrearSolicitud = async (e) => {
    e.preventDefault();
    if (!nuevaSolicitudData.fecha_inicio || !nuevaSolicitudData.fecha_fin || !nuevaSolicitudData.motivo) {
      toast.error('Por favor completa todos los campos.');
      return;
    }

    try {
      await crearSolicitud(nuevaSolicitudData);
      toast.success('Solicitud enviada exitosamente.');
      setShowModalNueva(false);
      setNuevaSolicitudData({
        tipo_solicitud: 'Vacaciones',
        fecha_inicio: '',
        fecha_fin: '',
        motivo: ''
      });
      cargarSolicitudes();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error al enviar la solicitud.');
    }
  };

  const renderMarkdown = (text) => (
    <p className="whitespace-pre-wrap text-xs text-on-surface-variant/90 leading-relaxed font-medium">{text || ''}</p>
  );

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-outline-variant/60 pb-5 gap-4">
          <div>
            <h1 className="text-xl font-black text-on-surface tracking-tight uppercase">Centro de recursos del colaborador</h1>
            <p className="text-[11px] text-on-surface-variant font-semibold tracking-wider uppercase mt-1">
              Guía de trámites y seguimiento de tus solicitudes.
            </p>
          </div>

          {/* Navegación interna (Pestañas) */}
          <div className="flex bg-surface-container border border-outline-variant/50 rounded-xl p-1 shadow-inner select-none self-start">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/40'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm">smart_toy</span>
              Guía de trámites
            </button>
            <button
              onClick={() => setActiveTab('solicitudes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'solicitudes'
                  ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/40'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
              Mis solicitudes
            </button>
          </div>
        </div>

        {/* CONTENIDO TAB 1: ASISTENTE DE IA */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda: Sugerencias */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xs font-black text-on-surface-variant tracking-wider uppercase">Temas Frecuentes de Consulta</h2>
              <div className="grid grid-cols-1 gap-3">
                {sugerencias.map((sug, i) => (
                  <button
                    key={i}
                    onClick={(e) => handleSendMessage(e, sug.pregunta)}
                    className="flex items-start gap-3 bg-surface-container-lowest border border-outline-variant/60 hover:border-primary/50 rounded-xl p-3.5 shadow-sm text-left transition-all duration-200 cursor-pointer hover:shadow-md group"
                  >
                    <span className="material-symbols-outlined text-primary/80 group-hover:text-primary p-2 bg-primary/5 rounded-lg border border-primary/10 transition-colors">
                      {sug.icono}
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">{sug.titulo}</h4>
                      <p className="text-[10px] text-on-surface-variant/80 font-medium leading-normal">{sug.descripcion}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Columna Derecha: El Chat */}
            <div className="lg:col-span-2">
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-xl flex flex-col h-[560px] overflow-hidden">
                {/* Cabecera del Chat */}
                <div className="bg-surface-container px-6 py-3.5 border-b border-outline-variant/60 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <span className="material-symbols-outlined text-primary text-sm animate-pulse">smart_toy</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-on-surface">Asistente CoreRRHH</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span className="text-[9px] font-extrabold text-emerald-500 tracking-wider uppercase">Operando en Colombia</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold text-on-surface-variant/50 tracking-wider uppercase select-none bg-surface-container-highest px-2 py-0.5 rounded border border-outline-variant/40">
                    CST Legislación
                  </span>
                </div>

                {/* Historial de Mensajes */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background/20">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 shadow-sm space-y-1.5 ${
                          msg.sender === 'user'
                            ? 'bg-primary text-white rounded-tr-none'
                            : 'bg-surface-container border border-outline-variant/50 rounded-tl-none text-on-surface'
                        }`}
                      >
                        {msg.sender === 'ia' ? (
                          renderMarkdown(msg.text)
                        ) : (
                          <p className="text-xs font-medium leading-relaxed">{msg.text}</p>
                        )}
                        <div className="flex justify-between items-center text-[9px] opacity-40 select-none">
                          <span>{msg.sender === 'ia' ? `Fuente: ${msg.fuente}` : 'Colaborador'}</span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Indicador de Escritura */}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-surface-container border border-outline-variant/50 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Formulario de Entrada */}
                <form
                  onSubmit={(e) => handleSendMessage(e)}
                  className="p-4 border-t border-outline-variant/60 bg-surface-container flex gap-3 items-center"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Pregunta sobre horas extras, incapacidades o liquidaciones en Colombia..."
                    className="flex-1 bg-background border border-outline-variant rounded-xl py-2.5 px-4 text-xs text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !inputText.trim()}
                    className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO TAB 2: GESTION DE SOLICITUDES */}
        {activeTab === 'solicitudes' && (
          <div className="space-y-6">
            {/* Header del Gestor de Solicitudes */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-md flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-xs font-black text-on-surface-variant tracking-wider uppercase">Bandeja de Solicitudes Laborales</h2>
                <p className="text-[10px] text-on-surface-variant/80 font-medium leading-normal mt-0.5">
                  Registra tus solicitudes de descanso o reporta novedades a Gestión Humana.
                </p>
              </div>

              <button
                onClick={() => setShowModalNueva(true)}
                className="flex items-center gap-2 bg-primary text-white hover:bg-primary-hover text-xs font-bold py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Nueva solicitud
              </button>
            </div>

            {/* Listado de Solicitudes */}
            {solicitudesLoading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-on-surface-variant font-medium mt-3">Cargando bandeja de solicitudes...</p>
              </div>
            ) : solicitudes.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl py-16 text-center space-y-3">
                <span className="material-symbols-outlined text-slate-500 text-4xl">inbox</span>
                <p className="text-xs text-on-surface-variant font-medium">No se han encontrado solicitudes en la bandeja.</p>
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/60 bg-surface-container text-on-surface-variant text-[10px] font-black uppercase tracking-wider">
                        <th className="py-4 px-6">Tipo</th>
                        <th className="py-4 px-6">Periodo</th>
                        <th className="py-4 px-6">Motivo</th>
                        <th className="py-4 px-6">Estado</th>
                        <th className="py-4 px-6">Respuesta de Gestión Humana</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40 text-xs">
                      {solicitudes.map((sol) => (
                        <tr key={sol.id} className="hover:bg-surface-container/20 transition-colors">
                          <td className="py-4 px-6">
                            <span className="font-extrabold text-on-surface">{sol.tipo_solicitud}</span>
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant font-medium">
                            <div className="flex flex-col gap-0.5">
                              <span>Desde: {formatDateOnlyEsCo(sol.fecha_inicio)}</span>
                              <span>Hasta: {formatDateOnlyEsCo(sol.fecha_fin)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant max-w-xs truncate font-medium" title={sol.motivo}>
                            {sol.motivo}
                          </td>
                          <td className="py-4 px-6">
                            {sol.estado === 'Pendiente' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-400"></span>
                                Pendiente
                              </span>
                            )}
                            {sol.estado === 'Aprobado' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-emerald-400"></span>
                                Aprobado
                              </span>
                            )}
                            {sol.estado === 'Rechazado' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-rose-400"></span>
                                Rechazado
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant/80 font-medium italic max-w-xs truncate">
                            {sol.comentarios_admin || '- Sin comentarios -'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL CREAR NUEVA SOLICITUD (Empleado) */}
        {showModalNueva && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
                <h3 className="text-sm font-black text-on-surface uppercase tracking-tight">Crear Nueva Solicitud</h3>
                <button
                  onClick={() => setShowModalNueva(false)}
                  className="material-symbols-outlined text-on-surface-variant hover:text-on-surface cursor-pointer rounded-full p-1 hover:bg-surface-container transition-colors"
                >
                  close
                </button>
              </div>

              <form onSubmit={handleCrearSolicitud} className="space-y-4">
                {/* Tipo de Solicitud */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase">Tipo de Petición *</label>
                  <select
                    value={nuevaSolicitudData.tipo_solicitud}
                    onChange={(e) => setNuevaSolicitudData({ ...nuevaSolicitudData, tipo_solicitud: e.target.value })}
                    className="w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors cursor-pointer font-bold"
                  >
                    <option value="Vacaciones">Vacaciones</option>
                    <option value="Permiso">Permiso Personal / Licencia</option>
                    <option value="Incapacidad Médica">Incapacidad Médica</option>
                    <option value="Licencia Maternidad/Paternidad">Maternidad / Paternidad</option>
                  </select>
                </div>

                {/* Rango de Fechas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase">Desde *</label>
                    <input
                      type="date"
                      required
                      value={nuevaSolicitudData.fecha_inicio}
                      onChange={(e) => setNuevaSolicitudData({ ...nuevaSolicitudData, fecha_inicio: e.target.value })}
                      className="w-full bg-background border border-outline-variant rounded-lg py-2 px-3 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase">Hasta *</label>
                    <input
                      type="date"
                      required
                      value={nuevaSolicitudData.fecha_fin}
                      onChange={(e) => setNuevaSolicitudData({ ...nuevaSolicitudData, fecha_fin: e.target.value })}
                      className="w-full bg-background border border-outline-variant rounded-lg py-2 px-3 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Motivo */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-on-surface-variant tracking-widest uppercase">Explicación o Motivo *</label>
                  <textarea
                    required
                    rows={4}
                    value={nuevaSolicitudData.motivo}
                    onChange={(e) => setNuevaSolicitudData({ ...nuevaSolicitudData, motivo: e.target.value })}
                    placeholder="Por favor, describe brevemente la razón de tu solicitud o los detalles pertinentes."
                    className="w-full bg-background border border-outline-variant rounded-lg py-2 px-3 text-xs text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors resize-none font-medium"
                  ></textarea>
                </div>

                {/* Footer del Modal */}
                <div className="flex justify-end gap-3 border-t border-outline-variant/60 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModalNueva(false)}
                    className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-all cursor-pointer border border-outline-variant/40"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-primary text-white hover:bg-primary-hover rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Enviar Solicitud
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default Recursos;
