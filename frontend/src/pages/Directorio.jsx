import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { obtenerDirectorio, getAssetUrl } from '../services/api';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import NotificationBell from '../components/NotificationBell';

const Directorio = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para filtros
  const searchParam = new URLSearchParams(location.search).get('q') || '';
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [filtroDepartamento, setFiltroDepartamento] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') || '';
    setSearchTerm(q);
  }, [location.search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroDepartamento]);

  useEffect(() => {
    const fetchDirectorio = async () => {
      try {
        const response = await obtenerDirectorio();
        setEmpleados(response.empleados || []);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar el directorio de colaboradores.');
        toast.error('Error al cargar el directorio');
      } finally {
        setLoading(false);
      }
    };
    fetchDirectorio();
  }, []);

  // Lógica de filtrado en memoria
  const empleadosFiltrados = empleados.filter((emp) => {
    const nombresCompuestos = `${emp.nombres} ${emp.apellidos}`.toLowerCase();
    const matchesSearch = 
      nombresCompuestos.includes(searchTerm.toLowerCase()) ||
      (emp.cargo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.departamento || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = 
      filtroDepartamento === 'Todos' ||
      (emp.departamento || '').toLowerCase().includes(filtroDepartamento.toLowerCase());

    return matchesSearch && matchesDept;
  });

  const totalPages = Math.ceil(empleadosFiltrados.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const empleadosPaginados = empleadosFiltrados.slice(indexOfFirstItem, indexOfLastItem);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const manejarModuloEnDesarrollo = (e) => {
    e.preventDefault();
    toast('Módulo en desarrollo para la Fase 2', { icon: '🚧' });
  };

  // Función para asignar avatar premium basado en foto de perfil real o iniciales SVG dinámicas
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

  // Determinar color de badge por departamento con alto contraste en ambos temas
  const getBadgeStyles = (dept) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('acad')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'; // Académico
    } else if (d.includes('admin')) {
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'; // Administrativo
    } else if (d.includes('direc')) {
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20'; // Directivo
    }
    return 'bg-surface-container text-on-surface-variant border border-outline-variant/60';
  };

  const isAdmin = user?.rol_id === 1;

  const pageContent = (
    <div className="max-w-7xl w-full mx-auto space-y-8 animate-fade-in text-on-surface">
      {/* Title Block */}
      <div>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Directorio de Empleados</h1>
        <p className="text-on-surface-variant mt-1 text-xs font-semibold uppercase tracking-wider">Gimnasio Los Arrayanes Bilingüe • Liderazgo Educativo</p>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-xl transition-colors duration-200">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input 
            type="text" 
            placeholder="Buscar por nombre, cargo o departamento..." 
            className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-outline focus:ring-1 focus:ring-outline text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Department Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none flex-wrap">
          {['Todos', 'Académico', 'Administrativo', 'Directivo'].map((dept) => {
            const isActive = filtroDepartamento === dept;
            return (
              <button
                key={dept}
                onClick={() => setFiltroDepartamento(dept)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? 'bg-primary/10 border border-primary/20 text-primary font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                    : 'bg-background border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {dept === 'Todos' && (
                  <span className="material-symbols-outlined text-[16px]">filter_list</span>
                )}
                {dept}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl p-4">
          {error}
        </div>
      )}

      {/* Loading / Cards Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-on-surface-variant text-sm">Cargando directorio de colaboradores...</p>
        </div>
      ) : empleadosFiltrados.length === 0 ? (
        <div className="py-24 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-8 transition-colors duration-200">
          <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-4">search_off</span>
          <p className="text-on-surface font-medium text-lg">No se encontraron empleados</p>
          <p className="text-on-surface-variant text-sm mt-1">Prueba a modificar los filtros de búsqueda o departamento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {empleadosPaginados.map((emp) => {
            const isJaime = (emp.nombres || '').toLowerCase().includes('jaime');
            const isOnline = !isJaime; 
            
            return (
              <div 
                key={emp.id}
                className="bg-surface-container-lowest border border-outline-variant/60 hover:border-primary/40 rounded-2xl shadow-xl hover:shadow-primary/5 p-6 flex flex-col items-center text-center relative transition-all duration-300 group hover:-translate-y-1"
              >
                {/* Status Indicator */}
                <span className={`absolute top-4 right-4 w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-outline-variant mb-4 group-hover:border-primary/30 transition-colors bg-surface-container shadow-inner">
                  <img 
                    alt={`${emp.nombres} profile picture`}
                    className="w-full h-full object-cover" 
                    src={getAvatar(emp)} 
                  />
                </div>

                <h3 className="text-sm font-bold text-on-surface tracking-tight">
                  {emp.nombres} {emp.apellidos}
                </h3>
                <p className="text-xs text-on-surface-variant font-medium mt-1 mb-3">
                  {emp.cargo || 'Colaborador'}
                </p>

                {/* Badge */}
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase ${getBadgeStyles(emp.departamento)}`}>
                  {emp.departamento || 'General'}
                </span>

                {/* Button */}
                <button 
                  onClick={() => {
                    navigate(`/perfil/${emp.id}`);
                  }}
                  className="bg-primary hover:opacity-90 border border-transparent text-on-primary font-bold py-2.5 px-4 rounded-xl w-full mt-6 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs shadow-sm"
                >
                  <span>Ver Perfil</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Pagination layout */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg border border-outline-variant bg-background hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="text-on-surface-variant text-xs px-1 select-none">
                  ...
                </span>
              );
            }
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer transition-all ${
                  currentPage === page
                    ? 'bg-primary/10 border border-primary/20 text-primary'
                    : 'border border-outline-variant bg-background hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-outline-variant bg-background hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );

  if (isAdmin) {
    return (
      <AdminLayout>
        {pageContent}
      </AdminLayout>
    );
  }

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col transition-colors duration-200">
      {/* TopNavBar Shell */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 transition-colors duration-200">
        <div className="flex items-center gap-8">
          <span className="font-headline-md text-headline-md font-bold text-primary cursor-pointer" onClick={() => navigate('/perfil')}>CoreRRHH</span>
          <nav className="hidden md:flex gap-2 items-center">
            <Link className="text-primary hover:bg-surface-container px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-bold border border-primary/20 bg-primary/10" to="/directorio">Directorio</Link>
            <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-semibold" href="#" onClick={manejarModuloEnDesarrollo}>Beneficios</a>
            <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-semibold" href="#" onClick={manejarModuloEnDesarrollo}>Capacitación</a>
            <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-semibold" href="#" onClick={manejarModuloEnDesarrollo}>Nómina</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer" 
            onClick={toggleTheme}
            title={theme === 'light' ? 'Activar Modo Oscuro' : 'Activar Modo Claro'}
          >
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </button>
          <NotificationBell />
          <button className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-container rounded-full transition-colors cursor-pointer" onClick={() => navigate('/configuracion')}>settings</button>
          <div 
            onClick={logout}
            title="Cerrar Sesión"
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img 
              alt="Employee Profile Avatar" 
              className="w-full h-full object-cover" 
              src={getAvatar(user?.profile)}
            />
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="pt-24 pb-16 px-8 flex-1 max-w-7xl w-full mx-auto">
        {pageContent}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-outline-variant/30 bg-surface-container-lowest transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant">
          <div className="flex items-center gap-6">
            <span className="font-bold text-sm text-primary">CoreRRHH</span>
            <span>© 2026 Gimnasio Los Arrayanes Bilingüe. All rights reserved.</span>
          </div>
          <div className="flex gap-4 font-semibold">
            <a href="#" className="hover:text-primary transition-colors" onClick={manejarModuloEnDesarrollo}>Soporte</a>
            <a href="#" className="hover:text-primary transition-colors" onClick={manejarModuloEnDesarrollo}>Privacidad</a>
            <a href="#" className="hover:text-primary transition-colors" onClick={manejarModuloEnDesarrollo}>Términos</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Directorio;
