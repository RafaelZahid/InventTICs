import React, { useState } from 'react';
import { Movement } from '../types';

interface MovementsProps {
    movements: Movement[];
}

const ITEMS_PER_PAGE = 10;

const Movements: React.FC<MovementsProps> = ({ movements }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(movements.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentMovements = movements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div className="p-6">
       <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold text-lg">Historial de Movimientos</h3>
        <p className="text-sm text-slate-500 mb-4">Aquí se muestra un registro de todas las entradas y salidas de productos del inventario.</p>
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
              {currentMovements.map(movement => (
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
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
            <span className="text-sm text-slate-600">
              Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, movements.length)} de {movements.length} movimientos
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