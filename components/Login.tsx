import React, { useState } from 'react';
import { LogoIcon } from './icons';

interface LoginProps {
  onLogin: (username: string, password_param: string) => Promise<boolean>;
  onNavigateToRegister: () => void;
  onPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
}

const ForgotPasswordModal: React.FC<{
    onClose: () => void;
    onSubmit: (email: string) => Promise<{ success: boolean; message: string }>;
}> = ({ onClose, onSubmit }) => {
    const [email, setEmail] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const result = await onSubmit(email);
        setFeedback(result.message);
        setIsLoading(false);
        setIsSubmitted(true);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800" aria-label="Cerrar modal">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 className="text-xl font-bold mb-4">Restablecer Contraseña</h2>
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <p className="text-sm text-slate-600">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
                      <div>
                          <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700">Correo Electrónico</label>
                          <input
                              id="reset-email"
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full px-3 py-2 mt-1 border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
                          />
                      </div>
                      <div className="pt-2">
                        <button type="submit" className="w-full px-4 py-2 font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-primary/90 flex items-center justify-center disabled:bg-slate-400" disabled={isLoading}>
                           {isLoading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                           Enviar Enlace
                        </button>
                      </div>
                  </form>
                ) : (
                    <div>
                        <p className="text-sm text-slate-600">{feedback}</p>
                        <button onClick={onClose} className="mt-4 w-full px-4 py-2 font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-primary/90">Cerrar</button>
                    </div>
                )}
            </div>
        </div>
    );
};


const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToRegister, onPasswordReset }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const success = await onLogin(username, password);
    if (!success) {
      setError('Correo electrónico o contraseña incorrectos.');
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full px-3 py-2 mt-1 border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-slate-50 focus:bg-white text-slate-900 transition-colors duration-200";

  return (
    <>
      <div className="min-h-screen lg:grid lg:grid-cols-2">
        <div className="flex items-center justify-center min-h-screen bg-white px-4 py-12">
          <div className="w-full max-w-sm">
            <div className="flex justify-start mb-6">
              <LogoIcon />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Iniciar Sesión</h1>
            <p className="mt-2 text-slate-600">Bienvenido de nuevo. Ingresa a tu cuenta de InvenTICS.</p>
          
            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700">Correo Electrónico</label>
                <input id="username" type="email" required value={username} onChange={(e) => setUsername(e.target.value)} className={inputClasses} placeholder="ejemplo@correo.com" />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">Contraseña</label>
                  <button type="button" onClick={() => setIsForgotPasswordOpen(true)} className="text-sm font-medium text-brand-primary hover:underline">¿Olvidaste tu contraseña?</button>
                </div>
                <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} placeholder="••••••••" />
              </div>
              
              {error && <p className="text-sm text-center text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}
              
              <div className="pt-2">
                <button type="submit" title="Acceder a tu cuenta" className="w-full px-4 py-2 font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary flex items-center justify-center disabled:bg-slate-400" disabled={isLoading}>
                   {isLoading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                   {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                </button>
              </div>
            </form>

            <p className="mt-6 text-sm text-center text-slate-600">
              ¿No tienes una cuenta?{' '}
              <button onClick={onNavigateToRegister} className="font-medium text-brand-primary hover:underline">
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>

        <div className="hidden lg:block relative">
          <img 
            className="absolute inset-0 w-full h-full object-cover" 
            src="https://images.unsplash.com/photo-1586788224249-535723739504?q=80&w=2070&auto=format&fit=crop" 
            alt="Persona trabajando en un almacén" 
          />
          <div className="absolute inset-0 bg-brand-dark/60"></div>
          <div className="absolute bottom-0 left-0 p-12 text-white">
              <h2 className="text-4xl font-bold mt-4 leading-tight">Control total de tu inventario.</h2>
              <p className="mt-4 text-lg text-slate-200 max-w-lg">Inicia sesión para acceder a análisis, reportes y una gestión simplificada de tus productos.</p>
          </div>
        </div>
      </div>

      {isForgotPasswordOpen && (
        <ForgotPasswordModal
            onClose={() => setIsForgotPasswordOpen(false)}
            onSubmit={onPasswordReset}
        />
      )}
      <style>{` @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } } .animate-fade-in { animation: fade-in 0.2s ease-out; }`}</style>
    </>
  );
};

export default Login;
