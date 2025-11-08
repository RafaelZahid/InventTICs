import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Movements from './components/Movements';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Chatbot from './components/Chatbot';
import Login from './components/Login';
import Register from './components/Register';
import { View, User, Product, Movement } from './types';
import { MOCK_PRODUCTS } from './constants';
import { MOCK_MOVEMENTS } from './constants';

const App: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<'login' | 'register' | 'loggedIn'>('login');
  const [users, setUsers] = useState<User[]>([
    { name: 'Admin User', username: 'admin', password: 'admin', role: 'admin' },
    { name: 'Operator User', username: 'operador', password: 'operador', role: 'operator' },
  ]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [movements, setMovements] = useState<Movement[]>(MOCK_MOVEMENTS);

  const handleLogin = (username: string, password_param: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password_param);
    if (user) {
      setCurrentUser(user);
      setAuthStatus('loggedIn');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthStatus('login');
  };

  const handleRegister = (newUser: User): { success: boolean, message: string } => {
    if (users.some(u => u.username === newUser.username)) {
      return { success: false, message: 'El nombre de usuario ya existe.' };
    }
    setUsers(prevUsers => [...prevUsers, newUser]);
    return { success: true, message: '¡Usuario registrado con éxito! Serás redirigido al login.' };
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard products={products} movements={movements} />;
      case 'products':
        return <Products products={products} />;
      case 'movements':
        return <Movements movements={movements} />;
      case 'reports':
        return <Reports products={products} movements={movements} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard products={products} movements={movements} />;
    }
  };

  if (authStatus === 'login') {
    return <Login onLogin={handleLogin} onNavigateToRegister={() => setAuthStatus('register')} />;
  }

  if (authStatus === 'register') {
    return <Register onRegister={handleRegister} onNavigateToLogin={() => setAuthStatus('login')} />;
  }

  if (!currentUser) {
    // Should not happen if authStatus is 'loggedIn', but as a fallback
    setAuthStatus('login');
    return null; 
  }

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <Header title={currentView} currentUser={currentUser} />
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>
      <Chatbot products={products} />
    </div>
  );
};

export default App;