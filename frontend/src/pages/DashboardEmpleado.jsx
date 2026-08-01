import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { getAssetUrl } from '../services/api';

const DashboardEmpleado = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const profile = user?.profile;

  const getAvatar = (emp) => {
    if (emp?.foto_perfil) return getAssetUrl(emp.foto_perfil);
    const nombres = emp?.nombres || 'C';
    const apellidos = emp?.apellidos || 'Colaborador';
    const iniciales = `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
    const colores = [
      '#008080', '#004d40', '#0f766e', '#0369a1', '#1d4ed8',
      '#6d28d9', '#a21caf', '#be185d', '#b91c1c', '#c2410c'
    ];
    const index = (iniciales.charCodeAt(0) + (iniciales.charCodeAt(1) || 0)) % colores.length;
    const color = colores[index];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="${color}" /><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit','Inter',sans-serif" font-size="38" font-weight="bold" fill="#ffffff">${iniciales}</text></svg>`.trim().replace(/\s+/g, ' ');
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const nombreCompleto = profile
    ? `${profile.nombres} ${profile.apellidos}`
    : (user?.correo ? user.correo.split('@')[0] : 'Colaborador');

  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? 'Buenos días' : horaActual < 18 ? 'Buenas tardes' : 'Buenas noches';

  const accesosRapidos = [
    {
      id: 'perfil',
      titulo: 'Mi Perfil',
      descripcion: 'Ver y editar tu información laboral y personal',
      icono: 'person',
      ruta: '/perfil',
      color: 'from-emerald-600 to-teal-500',
      bgLight: 'bg-emerald-500/10 border-emerald-500/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'directorio',
      titulo: 'Directorio',
      descripcion: 'Encuentra a tus compañeros de trabajo',
      icono: 'folder_shared',
      ruta: '/directorio',
      color: 'from-blue-600 to-indigo-500',
      bgLight: 'bg-blue-500/10 border-blue-500/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'recursos',
      titulo: 'Recursos',
      descripcion: 'Accede a documentos y recursos institucionales',
      icono: 'library_books',
      ruta: '/recursos',
      color: 'from-violet-600 to-purple-500',
      bgLight: 'bg-violet-500/10 border-violet-500/20',
      textColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      id: 'certificado',
      titulo: 'Certificación Laboral',
      descripcion: 'Descarga tu certificado de trabajo',
      icono: 'picture_as_pdf',
      ruta: '/perfil',
      color: 'from-rose-600 to-pink-500',
      bgLight: 'bg-rose-500/10 border-rose-500/20',
      textColor: 'text-rose-600 dark:text-rose-400',
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Hero de bienvenida */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-600 p-8 shadow-xl">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_70%_50%,white_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-lg shrink-0">
              <img
                src={getAvatar(profile)}
                alt="Tu avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-emerald-200 text-sm font-semibold uppercase tracking-wider mb-1">
                {saludo} 👋
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {nombreCompleto}
              </h1>
              <p className="text-emerald-100/80 text-sm mt-1">
                {profile?.cargo || 'Colaborador Institucional'}
                {profile?.departamento ? ` · ${profile.departamento}` : ''}
              </p>
            </div>
            <button
              onClick={() => navigate('/perfil')}
              className="shrink-0 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer"
            >
              Ver mi perfil →
            </button>
          </div>
        </div>

        {/* Info rápida del contrato */}
        {profile && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: 'Cargo',
                value: profile.cargo || 'Sin asignar',
                icon: 'work',
              },
              {
                label: 'Departamento',
                value: profile.departamento || 'Sin asignar',
                icon: 'apartment',
              },
              {
                label: 'Tipo de Contrato',
                value: profile.tipo_contrato || 'Sin contrato',
                icon: 'description',
              },
              {
                label: 'Ingreso',
                value: profile.fecha_ingreso
                  ? new Date(profile.fecha_ingreso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
                  : 'No registrado',
                icon: 'calendar_today',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 flex flex-col gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-primary text-[18px]">{item.icon}</span>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-semibold text-on-surface leading-tight">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Accesos rápidos */}
        <div>
          <h2 className="text-xs font-extrabold text-on-surface-variant uppercase tracking-widest mb-4">
            Accesos Rápidos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accesosRapidos.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.ruta)}
                className="group relative overflow-hidden bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 text-left shadow-sm hover:shadow-lg hover:border-outline/50 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className={`inline-flex w-11 h-11 rounded-xl items-center justify-center border ${item.bgLight} mb-3`}>
                  <span className={`material-symbols-outlined text-[22px] ${item.textColor}`}>
                    {item.icono}
                  </span>
                </div>
                <p className="font-bold text-on-surface text-sm mb-1">{item.titulo}</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">{item.descripcion}</p>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant/50 text-[20px] group-hover:text-primary group-hover:translate-x-1 transition-all">
                  arrow_forward
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Enlace a solicitudes */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 text-[20px]">event_note</span>
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm">Mis Solicitudes</p>
                <p className="text-xs text-on-surface-variant">Ausentismos, permisos y novedades</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/perfil')}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Ver en mi perfil →
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default DashboardEmpleado;
