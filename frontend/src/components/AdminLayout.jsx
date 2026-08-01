import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import NotificationBell from './NotificationBell';
import { getAssetUrl } from '../services/api';
import logoSolo from '../assets/LogoSolo.png';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const activePage = location.pathname;

  const manejarModuloEnDesarrollo = (e) => {
    e?.preventDefault();
    toast('Módulo en desarrollo para la Fase 2', { icon: '🚧' });
  };

  const activeUserName = user?.profile
    ? `${user.profile.nombres} ${user.profile.apellidos || ''}`
    : (user?.correo ? user.correo.split('@')[0] : 'Alex Rivera');
  const activeUserRole = user?.profile?.cargo || 'Senior HR Lead';
  const getAvatar = (emp) => {
    if (emp?.foto_perfil) {
      return getAssetUrl(emp.foto_perfil);
    }
    const nombres = emp?.nombres || 'Alex';
    const apellidos = emp?.apellidos || 'Rivera';
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

  const activeUserAvatar = getAvatar(user?.profile);

  // Si el usuario no es administrador (rol_id !== 1), mostramos un layout simplificado o adaptado
  const isAdmin = user?.rol_id === 1;

  return (
    <div className="min-h-screen bg-background text-on-surface flex antialiased font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-outline-variant bg-surface-container-low flex flex-col p-6 shrink-0 z-10 transition-colors duration-200">
        {isAdmin ? (
          <div className="mb-10 flex flex-col">
            <span className="text-2xl font-extrabold text-primary tracking-tight">Admin Center</span>
            <span className="text-[9px] font-extrabold text-on-surface-variant/80 tracking-widest uppercase mt-1">HR Operations</span>
          </div>
        ) : (
          <div className="mb-10 flex items-center gap-3">
            <img src={logoSolo} alt="Logo CoreRRHH" className="h-10 w-auto object-contain" />
            <div className="flex flex-col justify-center">
              <p className="text-sm font-bold text-on-surface leading-tight">Gimnasio Los Arrayanes</p>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Portal RRHH</p>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1.5">
          {isAdmin ? (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${
                  activePage === '/dashboard'
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
                <span>Panel</span>
              </button>

              <button
                onClick={() => navigate('/empleados')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${
                  activePage === '/empleados' || activePage === '/crear-empleado'
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">group</span>
                <span>Colaboradores</span>
              </button>

              <button
                onClick={() => navigate('/contratos')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${
                  activePage === '/contratos'
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">description</span>
                <span>Contratos</span>
              </button>

              <button
                onClick={() => navigate('/solicitudes')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${
                  activePage === '/solicitudes'
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">event_note</span>
                <span>Solicitudes / Ausentismos</span>
              </button>

              <button
                onClick={manejarModuloEnDesarrollo}
                className="flex items-center gap-3 w-full px-4 py-3 text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface rounded-xl transition-all text-xs font-semibold cursor-pointer text-left"
              >
                <span className="material-symbols-outlined text-[20px]">payments</span>
                <span>Nómina</span>
              </button>

              <button
                onClick={() => navigate('/configuracion')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${
                  activePage === '/configuracion'
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                <span>Ajustes</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/perfil')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${
                  activePage.startsWith('/perfil')
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">person</span>
                <span>Mi Perfil</span>
              </button>

              <button
                onClick={() => navigate('/directorio')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${
                  activePage === '/directorio'
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">folder_shared</span>
                <span>Directorio</span>
              </button>
            </>
          )}
        </nav>

        <div className="pt-4 border-t border-outline-variant space-y-1">
          <button
            onClick={manejarModuloEnDesarrollo}
            className="flex items-center gap-3 w-full px-4 py-3 text-on-surface-variant/70 hover:bg-surface-container/50 hover:text-on-surface rounded-xl transition-all text-xs font-semibold cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span>Soporte</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-on-surface-variant/75 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global Navigation Header */}
        <header className="h-16 border-b border-outline-variant bg-surface-container-low flex items-center justify-between px-8 z-10 shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-8">
            <div className="relative w-72">
              <span className="absolute left-3 top-2.5 material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
              <input
                type="text"
                placeholder="Buscar colaboradores..."
                aria-label="Campo de búsqueda de colaboradores"
                className="w-full bg-background border border-outline-variant rounded-lg py-1.5 pl-9 pr-3 text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-outline transition-colors"
                onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim()) { navigate(`/empleados?q=${encodeURIComponent(e.target.value.trim())}`); } }}
              />
            </div>

            <div className="hidden md:flex gap-6 items-center h-full">
              <button
                onClick={() => navigate('/directorio')}
                className={`font-bold h-16 flex items-center px-1 text-sm tracking-wide transition-all cursor-pointer ${
                  activePage === '/directorio'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface border-b-2 border-transparent'
                }`}
              >
                Directorio
              </button>
              <button
                onClick={() => navigate('/recursos')}
                className={`h-16 flex items-center px-1 text-sm tracking-wide transition-all cursor-pointer ${
                  activePage === '/recursos'
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface border-b-2 border-transparent'
                }`}
              >
                Recursos
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button
                className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer"
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
                title={theme === 'light' ? 'Activar Modo Oscuro' : 'Activar Modo Claro'}
              >
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </button>
              <NotificationBell />
            </div>

            <div className="flex items-center gap-3 border-l border-outline-variant pl-6">
              <div className="flex flex-col text-right cursor-pointer" onClick={() => navigate('/perfil')}>
                <span className="text-xs font-bold text-on-surface leading-tight">{activeUserName}</span>
                <span className="text-[10px] text-on-surface-variant font-semibold">{activeUserRole}</span>
              </div>
              <div
                className="w-9 h-9 rounded-full bg-surface-container overflow-hidden ring-2 ring-outline-variant cursor-pointer"
                onClick={() => navigate('/perfil')}
                role="button"
                aria-label="Ver mi perfil"
                title="Ver mi perfil"
              >
                <img
                  alt="Current user avatar"
                  className="w-full h-full object-cover"
                  src={activeUserAvatar}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-background transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
