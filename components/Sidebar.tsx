import React from 'react';
import { View, User } from '../types';
import { DashboardIcon, ProductIcon, MovementIcon, ReportIcon, SettingsIcon, LogoutIcon, LogoIcon } from './icons';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
  currentUser: User;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; title: string; }> = ({ icon, label, isActive, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive ? 'bg-brand-primary text-white' : 'text-slate-200 hover:bg-brand-dark/50 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-4">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout, currentUser }) => {
  return (
    <div className="bg-brand-dark text-white w-64 min-h-screen p-4 flex flex-col fixed">
      <div className="flex items-center mb-8">
        <LogoIcon className="h-10 w-10 text-brand-primary" />
        <h1 className="text-xl font-bold ml-2">InvenTICS</h1>
      </div>
      <nav className="flex-grow space-y-2">
        <NavItem icon={<DashboardIcon className="w-5 h-5"/>} label="Panel de Control" isActive={currentView === 'dashboard'} onClick={() => onViewChange('dashboard')} title="Ver el resumen general del inventario" />
        <NavItem icon={<ProductIcon className="w-5 h-5"/>} label="Productos" isActive={currentView === 'products'} onClick={() => onViewChange('products')} title="Gestionar la lista de productos" />
        <NavItem icon={<MovementIcon className="w-5 h-5"/>} label="Movimientos" isActive={currentView === 'movements'} onClick={() => onViewChange('movements')} title="Consultar el historial de entradas y salidas" />
        <NavItem icon={<ReportIcon className="w-5 h-5"/>} label="Reportes" isActive={currentView === 'reports'} onClick={() => onViewChange('reports')} title="Generar reportes en PDF del inventario" />
        {currentUser.role === 'admin' && (
          <NavItem icon={<SettingsIcon className="w-5 h-5"/>} label="Configuración" isActive={currentView === 'settings'} onClick={() => onViewChange('settings')} title="Ajustar la configuración del sistema" />
        )}
      </nav>
      <div className="mt-auto">
         <NavItem icon={<LogoutIcon className="w-5 h-5"/>} label="Cerrar Sesión" isActive={false} onClick={onLogout} title="Salir de tu cuenta" />
      </div>
    </div>
  );
};

export default Sidebar;