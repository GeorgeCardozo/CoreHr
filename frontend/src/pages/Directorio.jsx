import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerDirectorio } from '../services/api';
import { toast } from 'react-hot-toast';
import defaultAvatar from '../assets/default_avatar.png';
import AdminLayout from '../components/AdminLayout';

const Directorio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroDepartamento, setFiltroDepartamento] = useState('Todos');

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

  const manejarModuloEnDesarrollo = (e) => {
    e.preventDefault();
    toast('Módulo en desarrollo para la Fase 2', { icon: '🚧' });
  };

  // Función para asignar avatar premium basado en foto de perfil real o fallback
  const getAvatar = (emp) => {
    if (emp?.foto_perfil) {
      return `http://localhost:3000${emp.foto_perfil}`;
    }
    return defaultAvatar;
  };

  // Determinar color de badge por departamento
  const getBadgeStyles = (dept) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('acad')) {
      return 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]'; // Académico
    } else if (d.includes('admin')) {
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'; // Administrativo
    } else if (d.includes('direc')) {
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'; // Directivo
    }
    return 'bg-slate-800/50 text-slate-400 border border-slate-700/50';
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl w-full mx-auto space-y-8 animate-fade-in text-slate-200">
        {/* Title Block */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Directorio de Empleados</h1>
          <p className="text-slate-450 mt-1 text-xs font-semibold uppercase tracking-wider">Gimnasio Los Arrayanes Bilingüe • Liderazgo Educativo</p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-[#0e1320] p-4 rounded-2xl border border-slate-850/80 shadow-xl">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">
              search
            </span>
            <input 
              type="text" 
              placeholder="Buscar por nombre, cargo o departamento..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-white placeholder-slate-550 focus:outline-none focus:border-slate-750 focus:ring-1 focus:ring-slate-750 text-sm transition-all"
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
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                      : 'bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-900'
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
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-4">
            {error}
          </div>
        )}

        {/* Loading / Cards Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-slate-450 text-sm">Cargando directorio de colaboradores...</p>
          </div>
        ) : empleadosFiltrados.length === 0 ? (
          <div className="py-24 text-center bg-[#0e1320] border border-slate-850/80 rounded-2xl p-8">
            <span className="material-symbols-outlined text-slate-500 text-5xl mb-4">search_off</span>
            <p className="text-slate-350 font-medium text-lg">No se encontraron empleados</p>
            <p className="text-slate-500 text-sm mt-1">Prueba a modificar los filtros de búsqueda o departamento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {empleadosFiltrados.map((emp) => {
              const isJaime = (emp.nombres || '').toLowerCase().includes('jaime');
              const isOnline = !isJaime; // Jaime Reyes is represented as offline (gray dot) in mockup
              
              return (
                <div 
                  key={emp.id}
                  className="bg-[#0e1320] border border-slate-850/80 hover:border-emerald-500/30 rounded-2xl shadow-xl hover:shadow-emerald-500/5 p-6 flex flex-col items-center text-center relative transition-all duration-300 group hover:-translate-y-1"
                >
                  {/* Status Indicator */}
                  <span className={`absolute top-4 right-4 w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                  
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-800 mb-4 group-hover:border-emerald-500/30 transition-colors bg-slate-900 shadow-inner">
                    <img 
                      alt={`${emp.nombres} profile picture`}
                      className="w-full h-full object-cover" 
                      src={getAvatar(emp)} 
                    />
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {emp.nombres} {emp.apellidos}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1 mb-3">
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
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-300 font-bold py-2.5 px-4 rounded-xl w-full mt-6 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                  >
                    <span>Ver Perfil</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Static Pagination layout to match Mockup */}
        {!loading && empleadosFiltrados.length > 0 && (
          <div className="flex justify-center items-center gap-2 pt-6">
            <button className="w-8 h-8 rounded-lg border border-slate-850 bg-slate-950 hover:bg-slate-900 text-slate-400 flex items-center justify-center transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-450 flex items-center justify-center font-bold text-xs">
              1
            </button>
            <button className="w-8 h-8 rounded-lg border border-slate-850 bg-slate-950 hover:bg-slate-900 text-slate-400 flex items-center justify-center transition-colors text-xs cursor-pointer">
              2
            </button>
            <button className="w-8 h-8 rounded-lg border border-slate-850 bg-slate-950 hover:bg-slate-900 text-slate-400 flex items-center justify-center transition-colors text-xs cursor-pointer">
              3
            </button>
            <span className="text-slate-500 text-xs px-1">...</span>
            <button className="w-8 h-8 rounded-lg border border-slate-850 bg-slate-950 hover:bg-slate-900 text-slate-400 flex items-center justify-center transition-colors text-xs cursor-pointer">
              12
            </button>
            <button className="w-8 h-8 rounded-lg border border-slate-850 bg-slate-950 hover:bg-slate-900 text-slate-400 flex items-center justify-center transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Directorio;
