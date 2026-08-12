import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import AdminLayout from './components/AdminLayout';
import CambiarContrasena from './components/CambiarContrasena';
import { formatDateOnlyEsCo } from './utils/dateOnly';

const Login = lazy(() => import('./pages/Login'));
const ListaEmpleados = lazy(() => import('./pages/ListaEmpleados'));
const CrearEmpleado = lazy(() => import('./pages/CrearEmpleado'));
const GestionContratos = lazy(() => import('./pages/GestionContratos'));
const PerfilEmpleado = lazy(() => import('./pages/PerfilEmpleado'));
const Directorio = lazy(() => import('./pages/Directorio'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Recursos = lazy(() => import('./pages/Recursos'));
const GestionSolicitudes = lazy(() => import('./pages/GestionSolicitudes'));
const CrearAdmin = lazy(() => import('./pages/CrearAdmin'));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant text-sm">Cargando módulo…</div>
);

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

const EmployeeRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <RouteFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.rol_id !== 2) return <Navigate to="/dashboard" replace />;

  return children;
};

// Se monta a nivel global para que la contraseña temporal se solicite a todos
// los roles, incluso en vistas que no utilizan el layout administrativo.
const PasswordChangeGate = () => {
  const { user } = useAuth();
  return user?.debe_cambiar_contrasena ? <CambiarContrasena obligatorio /> : null;
};

// Panel principal
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
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 shadow-xl transition-colors duration-200">
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
            Bienvenido al centro de administración
          </h2>
          <p className="text-on-surface-variant text-xs mt-1 font-semibold uppercase tracking-wider">
            Sistema de operaciones de Recursos Humanos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 shadow-xl space-y-4 transition-colors duration-200">
            <h3 className="text-xs font-extrabold text-on-surface-variant tracking-widest uppercase border-b border-outline-variant pb-2">Información del perfil</h3>
            {profile ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-on-surface-variant font-semibold">Identificación:</span>
                <span>{profile.documento_identidad}</span>
                <span className="text-on-surface-variant font-semibold">Nombres:</span>
                <span>{profile.nombres}</span>
                <span className="text-on-surface-variant font-semibold">Apellidos:</span>
                <span>{profile.apellidos}</span>
                <span className="text-on-surface-variant font-semibold">Teléfono:</span>
                <span>{profile.telefono || 'No registrado'}</span>
                <span className="text-on-surface-variant font-semibold">Fecha de ingreso:</span>
                <span>{formatDateOnlyEsCo(profile.fecha_ingreso)}</span>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic">No hay información de empleado asociada a esta cuenta de usuario.</p>
            )}
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 shadow-xl space-y-4 transition-colors duration-200">
            <h3 className="text-xs font-extrabold text-on-surface-variant tracking-widest uppercase border-b border-outline-variant pb-2">Acceso a Módulos</h3>
            <p className="text-xs text-on-surface-variant">
              Tu cuenta tiene privilegios de: <strong className="text-primary font-bold">Administrador</strong>.
            </p>
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-primary text-xs rounded-lg p-3 font-semibold">
                ✓ Tienes privilegios para crear nuevos empleados y gestionar contratos de trabajo.
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/empleados')}
                  className="flex-1 bg-primary hover:bg-primary/90 text-on-primary font-extrabold rounded-lg py-2.5 px-4 text-xs transition-colors text-center cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                >
                  Gestión de Empleados
                </button>
                <button
                  onClick={() => navigate('/contratos')}
                  className="flex-1 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant font-bold rounded-lg py-2.5 px-4 text-xs transition-all cursor-pointer"
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
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <Router>
          <Suspense fallback={<RouteFallback />}>
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
              path="/recursos"
              element={
                <EmployeeRoute>
                  <Recursos />
                </EmployeeRoute>
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
            <Route
              path="/solicitudes"
              element={
                <AdminRoute>
                  <GestionSolicitudes />
                </AdminRoute>
              }
            />
            <Route
              path="/configuracion"
              element={
                <ProtectedRoute>
                  <Configuracion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/crear-admin"
              element={
                <AdminRoute>
                  <CrearAdmin />
                </AdminRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <PasswordChangeGate />
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
