import React, { useState, useEffect } from 'react';
import { Movement } from '../types';

interface MovementsProps {
    movements: Movement[];
    onOpenMovementModal: () => void;
}

const ITEMS_PER_PAGE = 10;

const Movements: React.FC<MovementsProps> = ({ movements, onOpenMovementModal }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);
  
  const filteredMovements = movements.filter(movement => {
    if (!startDate && !endDate) return true;
    // Evitar crear fechas inválidas si el string está vacío
    const movementDate = new Date(movement.date + 'T00:00:00'); 
    
    if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        if (movementDate < start) return false;
    }
    if (endDate) {
        const end = new Date(endDate + 'T00:00:00');
        if (movementDate > end) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredMovements.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentMovements = filteredMovements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const clearFilters = () => {
      setStartDate('');
      setEndDate('');
  }

  return (
    <div className="p-6">
       <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <div>
                <h3 className="font-bold text-lg">Historial de Movimientos</h3>
                <p className="text-sm text-slate-500">Aquí se muestra un registro de todas las entradas y salidas de productos del inventario.</p>
            </div>
            <button
                onClick={onOpenMovementModal}
                className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-primary/90 text-sm font-semibold flex items-center space-x-2 transition-transform duration-200 hover:scale-105"
                title="Registrar una nueva entrada o salida de producto"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <span>Registrar Movimiento</span>
            </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-slate-50 rounded-lg border">
            <h4 className="text-sm font-semibold text-slate-700">Filtrar por fecha:</h4>
            <div className="flex-grow sm:flex-grow-0">
                <label htmlFor="startDate" className="sr-only">Desde</label>
                <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-brand-primary focus:border-brand-primary bg-white text-slate-900" />
            </div>
            <span className="text-slate-500">-</span>
            <div className="flex-grow sm:flex-grow-0">
                <label htmlFor="endDate" className="sr-only">Hasta</label>
                <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-brand-primary focus:border-brand-primary bg-white text-slate-900" />
            </div>
            {(startDate || endDate) && (
                <button onClick={clearFilters} className="px-3 py-1.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100">
                    Limpiar
                </button>
            )}
        </div>

         <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3">Producto</th>
                <th scope="col" className="px-6 py-3">Tipo</th>
                <th scope="col" className="px-6 py-3">Cantidad</th>
                <th scope="col" className="px-6 py-3">Fecha</th>
                <th scope="col" className="px-6 py-3">Hora</th>
                <th scope="col" className="px-6 py-3">Usuario</th>
                <th scope="col" className="px-6 py-3">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {currentMovements.length > 0 ? currentMovements.map(movement => (
                <tr key={movement.id} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{movement.productName}</td>
                  <td className="px-6 py-4">
                     <span className={`capitalize px-2 py-1 rounded text-xs font-semibold ${
                        movement.type === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                     }`}>{movement.type}</span>
                  </td>
                  <td className="px-6 py-4">{movement.quantity}</td>
                  <td className="px-6 py-4">{movement.date}</td>
                  <td className="px-6 py-4">{movement.time}</td>
                  <td className="px-6 py-4">{movement.user}</td>
                  <td className="px-6 py-4">{movement.reason}</td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={7} className="text-center py-10">
                        <p className="font-semibold text-slate-700">No se encontraron movimientos</p>
                        <p className="text-sm text-slate-500">Intenta ajustar los filtros de fecha o registra un nuevo movimiento.</p>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
            <span className="text-sm text-slate-600">
              Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredMovements.length)} de {filteredMovements.length} movimientos
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                Anterior
              </button>
              <span className="text-sm font-medium text-slate-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                Siguiente
              </button>
            </div>
          </div>
        )}

       </div>
    </div>
  );
};

export default Movements;