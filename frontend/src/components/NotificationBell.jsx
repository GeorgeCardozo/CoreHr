import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerNotificaciones, marcarNotificacionLeida, marcarTodasNotificacionesLeidas } from '../services/api';
import { toast } from 'react-hot-toast';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef(null);

  const fetchNotificaciones = async () => {
    try {
      const data = await obtenerNotificaciones();
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.no_leidas || 0);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
    }
  };

  useEffect(() => {
    fetchNotificaciones();

    // Polling ligero cada 20 segundos para revisar notificaciones en tiempo real
    const interval = setInterval(fetchNotificaciones, 20000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar emergente al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotificaciones();
    }
    setIsOpen(!isOpen);
  };

  const handleMarcarLeida = async (id, enlace) => {
    try {
      await marcarNotificacionLeida(id);
      fetchNotificaciones();
      if (enlace) {
        setIsOpen(false);
        navigate(enlace);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarcarTodas = async () => {
    try {
      setLoading(true);
      await marcarTodasNotificacionesLeidas();
      toast.success('Todas las notificaciones fueron marcadas como leídas.');
      fetchNotificaciones();
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar notificaciones.');
    } finally {
      setLoading(false);
    }
  };

  const formatearTiempo = (fechaStr) => {
    if (!fechaStr) return '';
    const diffMs = new Date() - new Date(fechaStr);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHoras = Math.floor(diffMins / 60);
    if (diffHoras < 24) return `Hace ${diffHoras} h`;
    const diffDias = Math.floor(diffHoras / 24);
    return `Hace ${diffDias} d`;
  };

  const getTipoEstilo = (tipo) => {
    switch (tipo) {
      case 'success':
        return { icon: 'check_circle', color: 'text-emerald-500 bg-emerald-500/10' };
      case 'danger':
        return { icon: 'cancel', color: 'text-rose-500 bg-rose-500/10' };
      case 'warning':
        return { icon: 'warning', color: 'text-amber-500 bg-amber-500/10' };
      default:
        return { icon: 'notifications', color: 'text-primary bg-primary/10' };
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Botón de Campana */}
      <button 
        onClick={handleToggle}
        className="relative material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer select-none flex items-center justify-center"
        title="Bandeja de Notificaciones"
      >
        notifications
        {noLeidas > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {/* Popover Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest border border-outline-variant/80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in text-on-surface">
          {/* Header */}
          <div className="p-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">notifications</span>
              <h3 className="font-bold text-sm text-on-surface">Notificaciones</h3>
              {noLeidas > 0 && (
                <span className="text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                  {noLeidas} nuevas
                </span>
              )}
            </div>
            {notificaciones.length > 0 && (
              <button
                onClick={handleMarcarTodas}
                disabled={loading || noLeidas === 0}
                className="text-[11px] font-bold text-primary hover:underline disabled:opacity-40 cursor-pointer"
              >
                Marcar leídas
              </button>
            )}
          </div>

          {/* Listado */}
          <div className="max-h-96 overflow-y-auto divide-y divide-outline-variant/30 scrollbar-thin">
            {notificaciones.length === 0 ? (
              <div className="py-12 text-center p-4">
                <span className="material-symbols-outlined text-on-surface-variant/40 text-4xl mb-2">notifications_off</span>
                <p className="text-on-surface-variant text-xs font-medium">No tienes notificaciones pendientes</p>
              </div>
            ) : (
              notificaciones.map((n) => {
                const estilo = getTipoEstilo(n.tipo);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarcarLeida(n.id, n.enlace)}
                    className={`p-3.5 flex gap-3 hover:bg-surface-container/50 transition-colors cursor-pointer relative ${
                      !n.leido ? 'bg-primary/5 font-medium' : ''
                    }`}
                  >
                    {!n.leido && (
                      <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-primary"></span>
                    )}

                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${estilo.color}`}>
                      <span className="material-symbols-outlined text-[18px]">{estilo.icon}</span>
                    </div>

                    <div className="flex-1 text-xs space-y-0.5">
                      <div className="flex justify-between items-start">
                        <p className={`text-on-surface tracking-tight ${!n.leido ? 'font-bold' : 'font-semibold'}`}>
                          {n.titulo}
                        </p>
                        <span className="text-[10px] text-on-surface-variant shrink-0 ml-2">
                          {formatearTiempo(n.fecha_creacion)}
                        </span>
                      </div>
                      <p className="text-on-surface-variant leading-relaxed text-[11px]">
                        {n.mensaje}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
