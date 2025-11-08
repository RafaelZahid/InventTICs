import React, { useState } from 'react';
import { LogoIcon } from './icons';

interface LoginProps {
  onLogin: (username: string, password_param: string) => boolean;
  onNavigateToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = onLogin(username, password);
    if (!success) {
      setError('Credenciales inválidas. Inténtalo de nuevo.');
    }
  };
  
  const inputClasses = "w-full px-3 py-2 mt-1 border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-slate-50 focus:bg-white text-slate-900 transition-colors duration-200";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center min-h-screen bg-white px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="flex justify-start mb-6">
              <LogoIcon />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Bienvenido a InvenTICS</h1>
          <p className="mt-2 text-slate-600">Inicia sesión para gestionar tu inventario.</p>
          
          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">Usuario</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClasses}
                placeholder="admin / operador"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClasses}
                placeholder="admin / operador"
              />
            </div>
            {error && <p className="text-sm text-center text-red-600">{error}</p>}
            <div>
              <button type="submit" className="w-full px-4 py-2 font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
                Iniciar Sesión
              </button>
            </div>
          </form>
          <p className="mt-8 text-sm text-center text-slate-600">
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
          src="https://images.unsplash.com/photo-1578575437130-5278ce68242d?q=80&w=2070&auto=format&fit=crop" 
          alt="Almacén con inventario organizado" 
        />
        <div className="absolute inset-0 bg-brand-dark/60"></div>
         <div className="absolute bottom-0 left-0 p-12 text-white">
            <h2 className="text-4xl font-bold mt-4 leading-tight">Tu inventario, bajo control inteligente.</h2>
            <p className="mt-4 text-lg text-slate-200 max-w-lg">La solución definitiva para optimizar tu inventario y potenciar tu logística con la ayuda de la IA.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;