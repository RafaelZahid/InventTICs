
import React, { useState, useEffect, useRef } from 'react';
import { User, Product } from '../types';
import { UserIcon, BellIcon, ExclamationTriangleIcon } from './icons';

interface HeaderProps {
  title: string;
  currentUser: User;
  lowStockProducts: Product[];
}

const Header: React.FC<HeaderProps> = ({ title, currentUser, lowStockProducts }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const hasNotifications = lowStockProducts.length > 0;

  return (
    <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 capitalize">{title.replace('-', ' ')}</h2>
        <div className="flex items-center">
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setIsNotificationsOpen(prev => !prev)}
              className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors duration-200" 
              title="Ver notificaciones de stock bajo"
            >
              <BellIcon className="w-6 h-6 text-slate-600" />
            </button>
            {hasNotifications && (
              <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 rounded-full border-2 border-white text-white text-xs flex items-center justify-center font-bold">
                {lowStockProducts.length}
              </span>
            )}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 animate-fade-in-down origin-top-right z-30">
                <div className="p-3 border-b border-slate-200">
                  <h4 className="font-semibold text-sm text-slate-800">Notificaciones de Stock Bajo</h4>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {hasNotifications ? (
                    <ul>
                      {lowStockProducts.map(product => (
                        <li key={product.id} className="flex items-center p-3 border-b border-slate-100 hover:bg-slate-50">
                           <div className="flex-shrink-0 mr-3">
                            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{product.name}</p>
                            <p className="text-xs text-slate-500">
                              Quedan <span className="font-bold text-red-600">{product.quantity}</span> unidades.
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 p-4 text-center">No hay notificaciones nuevas.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="ml-6 flex items-center" title={`Usuario: ${currentUser.name} (${currentUser.role})`}>
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center ring-2 ring-white">
              <UserIcon className="w-6 h-6 text-slate-500" />
            </div>
            <div className="ml-3">
              <p className="font-semibold text-sm">{currentUser.name}</p>
              <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.2s ease-out;
        }
      `}</style>
    </header>
  );
};

export default Header;