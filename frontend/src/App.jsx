import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ListaEmpleados from './pages/ListaEmpleados';
import CrearEmpleado from './pages/CrearEmpleado';
import GestionContratos from './pages/GestionContratos';
import PerfilEmpleado from './pages/PerfilEmpleado';
import Directorio from './pages/Directorio';
import { Toaster } from 'react-hot-toast';
import AdminLayout from './components/AdminLayout';

// Componente para proteger rutas privadas generales
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente para proteger rutas exclusivas de Administrador
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando privilegios...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.rol_id !== 1) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Componente Dashboard (Home)
const Dashboard = () => {
  const { user } = useAuth();
  const profile = user?.profile;
  const navigate = useNavigate();

  if (user?.rol_id === 2) {
    return <Navigate to="/perfil" replace />;
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-[#0e1320] border border-slate-850/80 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Bienvenido a Admin Center
          </h2>
          <p className="text-slate-450 text-xs mt-1 font-semibold uppercase tracking-wider">
            SISTEMA DE OPERACIONES DE RECURSOS HUMANOS
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0e1320] border border-slate-850/80 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-extrabold text-slate-500 tracking-widest uppercase border-b border-slate-850 pb-2">Información del Perfil</h3>
            {profile ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-slate-500 font-semibold">Identificación:</span>
                <span>{profile.documento_identidad}</span>
                <span className="text-slate-500 font-semibold">Nombres:</span>
                <span>{profile.nombres}</span>
                <span className="text-slate-500 font-semibold">Apellidos:</span>
                <span>{profile.apellidos}</span>
                <span className="text-slate-500 font-semibold">Teléfono:</span>
                <span>{profile.telefono || 'No registrado'}</span>
                <span className="text-slate-500 font-semibold">Fecha de Ingreso:</span>
                <span>{new Date(profile.fecha_ingreso).toLocaleDateString()}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No hay información de empleado asociada a esta cuenta de usuario.</p>
            )}
          </div>

          <div className="bg-[#0e1320] border border-slate-850/80 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-extrabold text-slate-500 tracking-widest uppercase border-b border-slate-850 pb-2">Acceso a Módulos</h3>
            <p className="text-xs text-slate-400">
              Tu cuenta tiene privilegios de: <strong className="text-emerald-450">Administrador</strong>.
            </p>
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs rounded-lg p-3">
                ✓ Tienes privilegios para crear nuevos empleados y gestionar contratos de trabajo.
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/empleados')}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-extrabold rounded-lg py-2.5 px-4 text-xs transition-colors text-center cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                >
                  Gestión de Empleados
                </button>
                <button
                  onClick={() => navigate('/contratos')}
                  className="flex-1 bg-slate-950 hover:bg-slate-900 text-slate-350 border border-slate-850 hover:border-slate-750 font-bold rounded-lg py-2.5 px-4 text-xs transition-all cursor-pointer"
                >
                  Gestión de Contratos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          
          {/* Rutas Privadas / Protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil/:id?"
            element={
              <ProtectedRoute>
                <PerfilEmpleado />
              </ProtectedRoute>
            }
          />
          <Route
            path="/directorio"
            element={
              <ProtectedRoute>
                <Directorio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empleados"
            element={
              <AdminRoute>
                <ListaEmpleados />
              </AdminRoute>
            }
          />
          <Route
            path="/crear-empleado"
            element={
              <AdminRoute>
                <CrearEmpleado />
              </AdminRoute>
            }
          />
          <Route
            path="/contratos"
            element={
              <AdminRoute>
                <GestionContratos />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
