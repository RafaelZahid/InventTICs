import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface SettingsProps {
    users: User[];
    lowStockThreshold: number;
    onThresholdChange: (newThreshold: number) => void;
}

const Settings: React.FC<SettingsProps> = ({ users, lowStockThreshold, onThresholdChange }) => {
    const [threshold, setThreshold] = useState(lowStockThreshold);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        setThreshold(lowStockThreshold);
    }, [lowStockThreshold]);

    const handleSaveThreshold = (e: React.FormEvent) => {
        e.preventDefault();
        onThresholdChange(threshold);
        setFeedback('¡Umbral de bajo stock guardado exitosamente!');
        setTimeout(() => setFeedback(''), 3000);
    };

    return (
        <div className="p-6 space-y-8">
            {/* Sección de Preferencias de la Aplicación */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold text-lg text-slate-800">Preferencias de la Aplicación</h3>
                <p className="text-sm text-slate-500 mt-1">Ajusta el comportamiento general del sistema.</p>
                <form onSubmit={handleSaveThreshold} className="mt-6 border-t pt-6">
                    <div className="max-w-md">
                        <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-slate-700">
                            Umbral de Bajo Stock
                        </label>
                        <p className="text-xs text-slate-500 mt-1 mb-2">
                            Define la cantidad por debajo de la cual un producto se considera con bajo stock.
                        </p>
                        <div className="flex items-center space-x-3">
                            <input
                                id="lowStockThreshold"
                                type="number"
                                min="0"
                                value={threshold}
                                onChange={(e) => setThreshold(Number(e.target.value))}
                                className="w-32 px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-primary/90"
                            >
                                Guardar
                            </button>
                        </div>
                        {feedback && (
                            <p className="mt-3 text-sm text-green-600 animate-fade-in">{feedback}</p>
                        )}
                    </div>
                </form>
            </div>

            {/* Sección de Gestión de Usuarios */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center">
                    <div>
                       <h3 className="font-bold text-lg text-slate-800">Gestión de Usuarios</h3>
                       <p className="text-sm text-slate-500 mt-1">Visualiza todos los usuarios registrados en el sistema.</p>
                    </div>
                    {/* Nota: Funcionalidad de 'Agregar' deshabilitada en la demo */}
                    <button className="bg-slate-300 text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center space-x-2 cursor-not-allowed" disabled title="La adición de usuarios requiere integración de backend">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        <span>Agregar Usuario</span>
                    </button>
                </div>
                 <div className="overflow-x-auto mt-6 border-t pt-6">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nombre Completo</th>
                                <th scope="col" className="px-6 py-3">Usuario</th>
                                <th scope="col" className="px-6 py-3">Rol</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.username} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                                    <td className="px-6 py-4">{user.username}</td>
                                    <td className="px-6 py-4">
                                        <span className={`capitalize px-2 py-1 rounded text-xs font-semibold ${
                                            user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                                        }`}>{user.role}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <style>{` @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } } .animate-fade-in { animation: fade-in 0.5s ease-out; }`}</style>
        </div>
    );
};

export default Settings;
