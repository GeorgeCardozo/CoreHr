import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import NotificationBell from './NotificationBell';
import CambiarContrasena from './CambiarContrasena';
import EmployeeAvatar from './EmployeeAvatar';
import { obtenerDirectorio } from '../services/api';
import logoSolo from '../assets/LogoSolo.png';

const HeaderSearch = ({ isAdmin }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [directory, setDirectory] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const loadDir = async () => {
      try {
        const data = await obtenerDirectorio();
        setDirectory(data.empleados || []);
      } catch (err) {
        console.error('Error al obtener directorio para búsqueda:', err);
      }
    };
    loadDir();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return directory.filter((emp) => {
      const nombreCompleto = `${emp.nombres || ''} ${emp.apellidos || ''}`.toLowerCase();
      const cargo = (emp.cargo || '').toLowerCase();
      const dept = (emp.departamento || '').toLowerCase();
      return nombreCompleto.includes(q) || cargo.includes(q) || dept.includes(q);
    }).slice(0, 6);
  }, [query, directory]);

  const handleSelectEmployee = (empId) => {
    setIsOpen(false);
    setQuery('');
    navigate(isAdmin ? `/empleados?edit=${empId}` : `/perfil/${empId}`);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      setIsOpen(false);
      navigate(isAdmin ? `/empleados?q=${encodeURIComponent(query.trim())}` : '/directorio');
    }
  };

  return (
    <div ref={containerRef} className="relative w-72 sm:w-80">
      <div className="relative">
        <span className="absolute left-3 top-2 material-symbols-outlined text-on-surface-variant text-[18px]">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleSearchSubmit}
          placeholder={isAdmin ? 'Buscar colaborador para editar...' : 'Buscar en el directorio...'}
          aria-label="Campo de búsqueda de colaboradores"
          className="w-full bg-background border border-outline-variant/70 rounded-xl py-1.5 pl-9 pr-8 text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-2.5 top-2 text-on-surface-variant/60 hover:text-on-surface text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Resultados de Búsqueda Desplegables */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2.5 border-b border-outline-variant/40 flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
            <span>{isAdmin ? 'Editar colaborador' : 'Resultados'} ({filteredResults.length})</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(isAdmin ? `/empleados?q=${encodeURIComponent(query.trim())}` : '/directorio');
              }}
              className="text-primary hover:underline cursor-pointer flex items-center gap-1 font-bold"
            >
              {isAdmin ? 'Ver tabla ↵' : 'Ver directorio ↵'}
            </button>
          </div>

          {filteredResults.length === 0 ? (
            <div className="p-4 text-center text-xs text-on-surface-variant">
              Sin coincidencias para "{query}"
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant/20">
              {filteredResults.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp.id)}
                  className="w-full text-left p-2.5 flex items-center gap-3 hover:bg-surface-container/60 transition-colors group cursor-pointer"
                >
                  <EmployeeAvatar
                    employee={emp}
                    alt={`Foto de perfil de ${emp.nombres}`}
                    className="w-8 h-8 rounded-full shrink-0 ring-1 ring-outline-variant text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                      {emp.nombres} {emp.apellidos}
                    </p>
                    <p className="text-[10px] text-on-surface-variant truncate">
                      {emp.cargo || 'Colaborador'} {emp.departamento ? `· ${emp.departamento}` : ''}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold group-hover:bg-emerald-500/20 transition-colors">
                    <span className="material-symbols-outlined text-[14px]">{isAdmin ? 'edit_square' : 'person'}</span>
                    <span>{isAdmin ? 'Editar' : 'Ver perfil'}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const activePage = location.pathname;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const manejarModuloEnDesarrollo = (e) => {
    e?.preventDefault();
    toast('Módulo en desarrollo para la Fase 2', { icon: '🚧' });
  };

  const activeUserName = user?.profile
    ? `${user.profile.nombres} ${user.profile.apellidos || ''}`
    : (user?.correo ? user.correo.split('@')[0] : 'Usuario');
  const activeUserRole = user?.profile?.cargo || (user?.rol_id === 1 ? 'Gestión Humana' : 'Colaborador');
  // Si el usuario no es administrador (rol_id !== 1), mostramos un layout simplificado o adaptado
  const isAdmin = user?.rol_id === 1;

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface flex antialiased font-sans transition-colors duration-200">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-64 border-r border-outline-variant bg-surface-container-low flex flex-col p-6 shrink-0 z-30 transition-transform duration-300 ease-in-out`}>
        {isAdmin ? (
          <div className="mb-10 flex flex-col">
            <span className="text-2xl font-extrabold text-primary tracking-tight">Centro de administración</span>
            <span className="text-[9px] font-extrabold text-on-surface-variant/80 tracking-widest uppercase mt-1">Operaciones de Recursos Humanos</span>
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
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${activePage === '/dashboard'
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
                <span>Panel</span>
              </button>

              <button
                onClick={() => navigate('/empleados')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${activePage === '/empleados' || activePage === '/crear-empleado'
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">group</span>
                <span>Colaboradores</span>
              </button>

              <button
                onClick={() => navigate('/contratos')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${activePage === '/contratos'
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">description</span>
                <span>Contratos</span>
              </button>

              <button
                onClick={() => navigate('/solicitudes')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${activePage === '/solicitudes'
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
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${activePage === '/configuracion'
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                <span>Ajustes</span>
              </button>

              <button
                onClick={() => navigate('/crear-admin')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${activePage === '/crear-admin'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.08)] font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                <span>Crear Administrador</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/perfil')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${activePage.startsWith('/perfil')
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">person</span>
                <span>Mi Perfil</span>
              </button>

              <button
                onClick={() => navigate('/directorio')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${activePage === '/directorio'
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">folder_shared</span>
                <span>Directorio</span>
              </button>

              <button
                onClick={() => navigate('/recursos')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-semibold cursor-pointer text-left ${activePage === '/recursos'
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container/50 hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
                <span>Recursos</span>
              </button>
            </>
          )}
        </nav>

        <div className="pt-4 border-t border-outline-variant space-y-1">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-3 w-full px-4 py-3 text-on-surface-variant/70 hover:bg-surface-container/50 hover:text-on-surface rounded-xl transition-all text-xs font-semibold cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[20px]">lock_reset</span>
            <span>Cambiar Contraseña</span>
          </button>

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
      <div className="flex-1 flex flex-col min-w-0 md:ml-0">
        {/* Global Navigation Header */}
        <header className="h-16 border-b border-outline-variant bg-surface-container-low flex items-center justify-between px-4 sm:px-8 z-10 shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-4 sm:gap-8">
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-surface-container text-on-surface cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <HeaderSearch isAdmin={isAdmin} />

            <div className="hidden md:flex gap-6 items-center h-full">
              <button
                onClick={() => navigate('/directorio')}
                className={`font-bold h-16 flex items-center px-1 text-sm tracking-wide transition-all cursor-pointer ${activePage === '/directorio'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface border-b-2 border-transparent'
                  }`}
              >
                Directorio
              </button>
              {!isAdmin && (
                <button
                  onClick={() => navigate('/recursos')}
                  className={`h-16 flex items-center px-1 text-sm tracking-wide transition-all cursor-pointer ${activePage === '/recursos'
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface border-b-2 border-transparent'
                    }`}
                >
                  Recursos
                </button>
              )}
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
              <button type="button" className="flex flex-col text-right cursor-pointer" onClick={() => navigate('/perfil')}>
                <span className="text-xs font-bold text-on-surface leading-tight">{activeUserName}</span>
                <span className="text-[10px] text-on-surface-variant font-semibold">{activeUserRole}</span>
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-surface-container overflow-hidden ring-2 ring-outline-variant cursor-pointer"
                onClick={() => navigate('/perfil')}
                aria-label="Ver mi perfil"
                title="Ver mi perfil"
              >
                <EmployeeAvatar
                  employee={user?.profile}
                  alt="Foto del usuario actual"
                  className="w-full h-full text-xs"
                />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-background transition-colors duration-200">
          {children}
        </main>
      </div>

      {/* Modal de Cambio de Contraseña - Voluntario */}
      {showPasswordModal && (
        <CambiarContrasena obligatorio={false} onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
};

export default AdminLayout;
