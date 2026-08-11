import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import logoSolo from '../assets/LogoSolo.png';

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginGoogle } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(correo, contrasena);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface m-0 p-0 min-h-screen w-full flex">
      <main className="flex min-h-screen w-full">
        {/* Left Pane: Institutional Identity */}
        <section className="hidden lg:flex lg:w-1/2 bg-primary relative items-center justify-center p-12 overflow-hidden">
          {/* Background Abstract Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-secondary-container blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-fixed blur-[100px]"></div>
          </div>
          
          {/* Glassmorphism Overlay Card */}
          <div className="glass-card rounded-xl p-12 max-w-xl z-10 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[24px]">school</span>
              </div>
              <span className="font-label-caps text-label-caps text-on-primary tracking-widest uppercase">Portal Institucional</span>
            </div>
            <h1 className="font-display-quote text-display-quote text-on-primary italic mb-6 leading-tight">
              "Empowering Education & Talent"
            </h1>
            <div className="pt-6 border-t border-white/20">
              <p className="font-body-md text-body-md text-on-primary/80 tracking-wide">
                Gimnasio Los Arrayanes Bilingüe
              </p>
            </div>
          </div>
          
          {/* Footer Logo in Left Pane */}
          <div className="absolute bottom-12 left-12 flex items-center gap-2">
            <span className="font-headline-md text-headline-md font-bold text-on-primary">CoreRRHH</span>
          </div>
        </section>

        {/* Right Pane: Functional Login */}
        <section className="w-full lg:w-1/2 bg-surface-container-lowest flex flex-col items-center justify-center px-6 lg:px-24">
          <div className="w-full max-w-md space-y-10">
            
            {/* Brand & Header */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                <img 
                  alt="Logo CoreRRHH" 
                  className="w-12 h-12 rounded-lg object-contain bg-white p-1 border border-outline-variant/60 shadow-sm" 
                  src={logoSolo}
                />
                <div className="flex flex-col">
                  <span className="font-headline-md text-headline-md text-primary leading-none">CoreRRHH</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant mt-1">Gimnasio Los Arrayanes</span>
                </div>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Bienvenido de nuevo</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Inicie sesión para gestionar su talento institucional.</p>
            </div>

            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-lg p-3">
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase ml-1" htmlFor="email">
                  Correo Institucional
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 bg-surface-bright border border-surface-dim rounded-lg text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200" 
                    id="email" 
                    name="email" 
                    placeholder="usuario@arrayanes.edu.co" 
                    type="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase" htmlFor="password">
                    Contraseña
                  </label>
                  <a
                    className="font-label-caps text-label-caps text-tertiary-container hover:text-primary transition-colors"
                    href="mailto:soporte@arrayanes.edu.co?subject=Restablecimiento%20de%20contrase%C3%B1a%20CoreRRHH"
                  >
                    ¿Olvidó su contraseña?
                  </a>
                </div>
              
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input 
                    className="block w-full pl-10 pr-12 py-3 bg-surface-bright border border-surface-dim rounded-lg text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••••••" 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                  />
                  <button 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button 
                className="w-full bg-primary text-on-primary font-headline-md text-headline-md py-4 rounded-lg hover:bg-primary-container transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-primary/10 cursor-pointer flex items-center justify-center gap-2" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    <span>Validando...</span>
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>

              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    setError('');
                    setLoading(true);
                    await loginGoogle(credentialResponse.credential);
                    console.log("¡Bienvenido al sistema con Google!");
                    navigate('/dashboard');
                  } catch (error) {
                    console.error("Error al iniciar sesión con Google:", error);
                    setError(error.response?.data?.error || error.response?.data?.message || error.message || "Error al autenticar con Google");
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => {
                  console.error('El inicio de sesión con Google falló');
                  setError('El inicio de sesión con Google falló. Inténtelo de nuevo.');
                }}
              />

            </form>

            {/* Footer Disclaimer */}
            <div className="pt-8 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                ¿Problemas para acceder? Contacte a{' '}
                <a className="text-primary font-semibold hover:underline decoration-2 underline-offset-4" href="mailto:soporte@arrayanes.edu.co">
                  Soporte TI
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
