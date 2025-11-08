
import React from 'react';
import { User } from '../types';
import { UserIcon } from './icons';

interface HeaderProps {
  title: string;
  currentUser: User;
}

const Header: React.FC<HeaderProps> = ({ title, currentUser }) => {
  return (
    <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 capitalize">{title.replace('-', ' ')}</h2>
        <div className="flex items-center">
          <div className="relative">
            <button className="p-2 bg-slate-100 rounded-full hover:bg-slate-200" title="Ver notificaciones">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
            <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
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
    </header>
  );
};

export default Header;