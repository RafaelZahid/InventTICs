
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { SettingsIcon, UserIcon, BellIcon } from './icons';

interface SettingsProps {
    users: User[];
    currentUser: User;
    lowStockThreshold: number;
    onThresholdChange: (newThreshold: number) => void;
}

const Settings: React.FC<SettingsProps> = ({ users, currentUser, lowStockThreshold, onThresholdChange }) => {
    const [threshold, setThreshold] = useState(lowStockThreshold);
    const [feedback, setFeedback] = useState('');
    const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'users'>('general');

    useEffect(() => {
        setThreshold(lowStockThreshold);
    }, [lowStockThreshold]);

    const handleSaveThreshold = (e: React.FormEvent) => {
        e.preventDefault();
        onThresholdChange(threshold);
        setFeedback('¡Umbral de bajo stock guardado exitosamente!');
        setTimeout(() => setFeedback(''), 3000);
    };

    const tabs = [
        { id: 'general', label: 'General', icon: SettingsIcon },
        { id: 'profile', label: 'Mi Perfil', icon: UserIcon },
    ];

    if (currentUser.role === 'admin') {
        tabs.push({ id: 'users', label: 'Usuarios', icon: UserIcon }); // Using UserIcon as a placeholder for Users group
    }

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <SettingsIcon className="w-8 h-8 text-brand-primary" />
                Configuración del Sistema
            </h2>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar de Navegación de Configuración */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <nav className="space-y-1 bg-white p-2 rounded-lg shadow">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-brand-light text-brand-primary'
                                        : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <tab.icon className={`mr-3 h-5 w-5 ${activeTab === tab.id ? 'text-brand-primary' : 'text-slate-400'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Área de Contenido */}
                <div className="flex-grow space-y-6">
                    {/* SECCIÓN GENERAL */}
                    {activeTab === 'general' && (
                        <div className="bg-white p-6 rounded-lg shadow animate-fade-in">
                            <h3 className="text-lg font-medium leading-6 text-slate-900 border-b pb-4 mb-6">Preferencias Generales</h3>
                            <form onSubmit={handleSaveThreshold}>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <BellIcon className="h-5 w-5 text-yellow-500" />
                                            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-slate-700">
                                                Alertas de Inventario
                                            </label>
                                        </div>
                                        <p className="text-sm text-slate-500 mb-4">
                                            Configura cuándo el sistema debe marcar un producto con "Bajo Stock".
                                        </p>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-sm text-slate-600">Alerta cuando sea menor a:</span>
                                            <input
                                                id="lowStockThreshold"
                                                type="number"
                                                min="0"
                                                value={threshold}
                                                onChange={(e) => setThreshold(Number(e.target.value))}
                                                className="w-24 px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary text-center"
                                            />
                                            <span className="text-sm text-slate-600">unidades</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t flex justify-end">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-primary/90 transition-colors"
                                        >
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </div>
                                {feedback && (
                                    <p className="mt-4 text-sm text-green-600 bg-green-50 p-2 rounded text-center animate-fade-in">{feedback}</p>
                                )}
                            </form>
                        </div>
                    )}

                    {/* SECCIÓN PERFIL */}
                    {activeTab === 'profile' && (
                        <div className="bg-white p-6 rounded-lg shadow animate-fade-in">
                             <h3 className="text-lg font-medium leading-6 text-slate-900 border-b pb-4 mb-6">Mi Perfil</h3>
                             <div className="flex items-start gap-6">
                                <div className="h-24 w-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-4xl font-bold ring-4 ring-white shadow-sm">
                                    {currentUser.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="space-y-4 flex-grow">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500">Nombre Completo</label>
                                            <div className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 text-slate-900">
                                                {currentUser.name}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500">Correo Electrónico</label>
                                            <div className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 text-slate-900">
                                                {currentUser.username}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500">Rol del Sistema</label>
                                            <div className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 text-slate-900 capitalize">
                                                {currentUser.role === 'admin' ? 'Administrador' : 'Operador'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500">ID de Usuario</label>
                                            <div className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 text-slate-400 text-xs font-mono">
                                                {currentUser.uid}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        Para actualizar tus datos personales o contraseña, por favor contacta al soporte técnico o al administrador del sistema.
                                    </p>
                                </div>
                             </div>
                        </div>
                    )}

                    {/* SECCIÓN USUARIOS (ADMIN ONLY) */}
                    {activeTab === 'users' && currentUser.role === 'admin' && (
                        <div className="bg-white p-6 rounded-lg shadow animate-fade-in">
                            <div className="flex justify-between items-center border-b pb-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-medium leading-6 text-slate-900">Gestión de Usuarios</h3>
                                    <p className="text-sm text-slate-500 mt-1">Usuarios con acceso al sistema.</p>
                                </div>
                                <button className="bg-slate-100 text-slate-400 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 cursor-not-allowed" disabled title="Funcionalidad de gestión avanzada en desarrollo">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    <span>Agregar</span>
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-slate-500">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Nombre</th>
                                            <th scope="col" className="px-6 py-3">Usuario</th>
                                            <th scope="col" className="px-6 py-3">Rol</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user, idx) => (
                                            <tr key={user.uid || idx} className="bg-white border-b hover:bg-slate-50">
                                                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-brand-light text-brand-primary flex items-center justify-center font-bold text-xs">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    {user.name}
                                                </td>
                                                <td className="px-6 py-4">{user.username}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`capitalize px-2 py-1 rounded-full text-xs font-semibold ${
                                                        user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-slate-400 mt-4 text-center italic">
                                Nota: Esta lista muestra el usuario actual. La gestión completa de multi-usuarios requiere integración de backend adicional.
                            </p>
                        </div>
                    )}
                </div>
            </div>
             <style>{` @keyframes fade-in { 0% { opacity: 0; transform: translateY(5px); } 100% { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fade-in 0.3s ease-out; }`}</style>
        </div>
    );
};

export default Settings;
