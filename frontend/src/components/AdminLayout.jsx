import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import defaultAvatar from '../assets/default_avatar.png';
import { toast } from 'react-hot-toast';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
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
  const activeUserAvatar = user?.profile?.foto_perfil
    ? `http://localhost:3000${user.profile.foto_perfil}`
    : defaultAvatar;

  // Si el usuario no es administrador (rol_id !== 1), mostramos un layout simplificado o adaptado
  const isAdmin = user?.rol_id === 1;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex antialiased font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-850 bg-[#0e1320] flex flex-col p-6 shrink-0 z-10">
        <div className="mb-10 flex flex-col">
          <span className="text-2xl font-extrabold text-emerald-400 tracking-tight">Admin Center</span>
          <span className="text-[9px] font-extrabold text-slate-500 tracking-widest uppercase mt-1">HR Operations</span>
        </div>

        <nav className="flex-1 space-y-1.5">
          {isAdmin ? (
            <>
              <button 
                onClick={() => navigate('/dashboard')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-medium cursor-pointer text-left ${
                  activePage === '/dashboard' 
                    ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
                <span>Panel</span>
              </button>

              <button 
                onClick={() => navigate('/empleados')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-medium cursor-pointer text-left ${
                  activePage === '/empleados' || activePage === '/crear-empleado'
                    ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">group</span>
                <span>Colaboradores</span>
              </button>

              <button 
                onClick={() => navigate('/contratos')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-medium cursor-pointer text-left ${
                  activePage === '/contratos'
                    ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">description</span>
                <span>Contratos</span>
              </button>

              <button 
                onClick={manejarModuloEnDesarrollo}
                className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-slate-800/30 hover:text-white rounded-xl transition-all text-xs font-medium cursor-pointer text-left"
              >
                <span className="material-symbols-outlined text-[20px]">payments</span>
                <span>Nómina</span>
              </button>

              <button 
                onClick={manejarModuloEnDesarrollo}
                className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-slate-800/30 hover:text-white rounded-xl transition-all text-xs font-medium cursor-pointer text-left"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                <span>Ajustes</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('/perfil')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-medium cursor-pointer text-left ${
                  activePage.startsWith('/perfil')
                    ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">person</span>
                <span>Mi Perfil</span>
              </button>

              <button 
                onClick={() => navigate('/directorio')}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-xs font-medium cursor-pointer text-left ${
                  activePage === '/directorio'
                    ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] font-bold'
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">folder_shared</span>
                <span>Directorio</span>
              </button>
            </>
          )}
        </nav>

        <div className="pt-4 border-t border-slate-850 space-y-1">
          <button 
            onClick={manejarModuloEnDesarrollo}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:bg-slate-800/30 hover:text-slate-350 rounded-xl transition-all text-xs font-medium cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span>Soporte</span>
          </button>

          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all text-xs font-medium cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global Navigation Header */}
        <header className="h-16 border-b border-slate-800 bg-[#0e1320] flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-8">
            <div className="relative w-72">
              <span className="absolute left-3 top-2.5 material-symbols-outlined text-slate-500 text-[18px]">search</span>
              <input 
                type="text" 
                placeholder="Buscar colaboradores, archivos, tareas..."
                className="w-full bg-[#0b0f19] border border-slate-800 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-300 placeholder-slate-550 focus:outline-none focus:border-slate-700 transition-colors"
              />
            </div>
            
            <div className="hidden md:flex gap-6 items-center h-full">
              <button 
                onClick={() => navigate('/directorio')}
                className={`font-bold h-16 flex items-center px-1 text-sm tracking-wide transition-all cursor-pointer ${
                  activePage === '/directorio'
                    ? 'text-emerald-450 border-b-2 border-emerald-500'
                    : 'text-slate-450 hover:text-white border-b-2 border-transparent'
                }`}
              >
                Directorio
              </button>
              <button 
                onClick={manejarModuloEnDesarrollo}
                className="text-slate-450 hover:text-white h-16 flex items-center px-1 text-sm tracking-wide transition-all cursor-pointer border-b-2 border-transparent"
              >
                Recursos
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button className="material-symbols-outlined text-slate-400 p-2 hover:bg-slate-800/60 rounded-full transition-colors cursor-pointer" onClick={manejarModuloEnDesarrollo}>notifications</button>
              <button className="material-symbols-outlined text-slate-400 p-2 hover:bg-slate-800/60 rounded-full transition-colors cursor-pointer" onClick={manejarModuloEnDesarrollo}>mail</button>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
              <div className="flex flex-col text-right cursor-pointer" onClick={() => navigate('/perfil')}>
                <span className="text-xs font-bold text-white leading-tight">{activeUserName}</span>
                <span className="text-[10px] text-slate-450 font-semibold">{activeUserRole}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 overflow-hidden ring-2 ring-slate-800 cursor-pointer" onClick={() => navigate('/perfil')}>
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
        <main className="flex-1 p-8 overflow-y-auto bg-[#0b0f19]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
