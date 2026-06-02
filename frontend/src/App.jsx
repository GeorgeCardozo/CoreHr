import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ListaEmpleados from './pages/ListaEmpleados';
import CrearEmpleado from './pages/CrearEmpleado';
import GestionContratos from './pages/GestionContratos';
import PerfilEmpleado from './pages/PerfilEmpleado';
import { Toaster } from 'react-hot-toast';

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
  const { user, logout } = useAuth();
  const profile = user?.profile;
  const navigate = useNavigate();

  if (user?.rol_id === 2) {
    return <Navigate to="/perfil" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          CoreRRHH Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-300 text-sm hidden sm:inline">
            {user?.correo} <span className="text-xs bg-slate-800 px-2 py-1 rounded ml-1 text-slate-400">{user?.rol_id === 1 ? 'Administrador' : 'Empleado'}</span>
          </span>
          <button
            onClick={logout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-6xl w-full mx-auto space-y-6">
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-2">Bienvenido a CoreRRHH</h2>
          <p className="text-slate-400">
            Has iniciado sesión correctamente. Aquí se gestionará la automatización de contratos y el control de personal de la plataforma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-medium border-b border-slate-800 pb-2">Información del Perfil</h3>
            {profile ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-400">Identificación:</span>
                <span>{profile.documento_identidad}</span>
                <span className="text-slate-400">Nombres:</span>
                <span>{profile.nombres}</span>
                <span className="text-slate-400">Apellidos:</span>
                <span>{profile.apellidos}</span>
                <span className="text-slate-400">Teléfono:</span>
                <span>{profile.telefono || 'No registrado'}</span>
                <span className="text-slate-400">Fecha de Ingreso:</span>
                <span>{new Date(profile.fecha_ingreso).toLocaleDateString()}</span>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No hay información de empleado asociada a esta cuenta de usuario.</p>
            )}
          </div>

          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-medium border-b border-slate-800 pb-2">Acceso a Módulos</h3>
            <p className="text-sm text-slate-400">
              Tu cuenta tiene privilegios de: <strong className="text-slate-200">{user?.rol_id === 1 ? 'Administrador' : 'Empleado'}</strong>.
            </p>
            {user?.rol_id === 1 ? (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg p-3">
                  ✓ Tienes privilegios para crear nuevos empleados y gestionar contratos de trabajo.
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate('/empleados')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg py-2.5 px-4 text-sm transition-colors text-center"
                  >
                    Gestión de Empleados
                  </button>
                  <button
                    onClick={() => navigate('/contratos')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-350 border border-slate-700 font-semibold rounded-lg py-2.5 px-4 text-sm transition-all"
                  >
                    Gestión de Contratos
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-lg p-3">
                ⓘ Puedes consultar el estado de tus contratos de trabajo.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
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
            path="/perfil"
            element={
              <ProtectedRoute>
                <PerfilEmpleado />
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
