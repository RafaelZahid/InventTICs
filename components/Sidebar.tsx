import React, { useState } from 'react';
import { View, User } from '../types';
import { DashboardIcon, ProductIcon, MovementIcon, ReportIcon, SettingsIcon, LogoutIcon, LogoIcon, QrCodeIcon } from './icons';

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

const LogoutConfirmationModal: React.FC<{
    onClose: () => void;
    onConfirm: () => void;
}> = ({ onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center animate-fade-in">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
                    <LogoutIcon className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Cerrar Sesión</h3>
                <p className="mt-2 text-sm text-slate-500">¿Estás seguro de que deseas salir de tu cuenta?</p>
                <div className="mt-6 flex justify-center space-x-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 w-24">Cancelar</button>
                    <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-brand-secondary rounded-md hover:bg-brand-secondary/90 w-28">Cerrar Sesión</button>
                </div>
            </div>
             <style>{` @keyframes fade-in { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } } .animate-fade-in { animation: fade-in 0.2s ease-out; }`}</style>
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout, currentUser }) => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <div className="bg-brand-dark text-white w-64 min-h-screen p-4 flex flex-col fixed">
      <div className="flex items-center mb-8">
        <LogoIcon className="h-10 w-10 text-brand-primary" />
        <h1 className="text-xl font-bold ml-2">InvenTICS</h1>
      </div>
      <nav className="flex-grow space-y-2">
        <NavItem icon={<DashboardIcon className="w-5 h-5"/>} label="Panel de Control" isActive={currentView === 'dashboard'} onClick={() => onViewChange('dashboard')} title="Ver el resumen general del inventario" />
        <NavItem icon={<ProductIcon className="w-5 h-5"/>} label="Productos" isActive={currentView === 'products'} onClick={() => onViewChange('products')} title="Gestionar la lista de productos" />
        <NavItem icon={<QrCodeIcon className="w-5 h-5"/>} label="Escanear QR" isActive={currentView === 'scanner'} onClick={() => onViewChange('scanner')} title="Escanear un producto usando la cámara" />
        <NavItem icon={<MovementIcon className="w-5 h-5"/>} label="Movimientos" isActive={currentView === 'movements'} onClick={() => onViewChange('movements')} title="Consultar el historial de entradas y salidas" />
        <NavItem icon={<ReportIcon className="w-5 h-5"/>} label="Reportes" isActive={currentView === 'reports'} onClick={() => onViewChange('reports')} title="Generar reportes en PDF del inventario" />
        {currentUser.role === 'admin' && (
          <NavItem icon={<SettingsIcon className="w-5 h-5"/>} label="Configuración" isActive={currentView === 'settings'} onClick={() => onViewChange('settings')} title="Ajustar la configuración del sistema" />
        )}
      </nav>
      <div className="mt-auto">
         <NavItem icon={<LogoutIcon className="w-5 h-5"/>} label="Cerrar Sesión" isActive={false} onClick={() => setIsLogoutModalOpen(true)} title="Salir de tu cuenta" />
      </div>
      {isLogoutModalOpen && <LogoutConfirmationModal onClose={() => setIsLogoutModalOpen(false)} onConfirm={onLogout} />}
    </div>
  );
};

export default Sidebar;