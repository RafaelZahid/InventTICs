import React, { useState } from 'react';
import { Product } from '../types';
import { EmptyBoxIcon } from './icons';

interface ProductsProps {
    products: Product[];
}

const ITEMS_PER_PAGE = 5;

const Products: React.FC<ProductsProps> = ({ products }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  if (products.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="bg-white p-12 rounded-lg shadow max-w-lg mx-auto mt-10">
          <div className="flex justify-center mb-6">
            <EmptyBoxIcon className="w-24 h-24 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Tu inventario está vacío</h3>
          <p className="mt-2 text-slate-500">
            Parece que aún no has añadido ningún producto. ¡Empieza por agregar el primero para llevar el control!
          </p>
          <button 
            className="mt-6 bg-brand-primary text-white px-5 py-2.5 rounded-md hover:bg-brand-primary/90 text-sm font-semibold flex items-center justify-center mx-auto space-x-2 transition-colors duration-200"
            title="Añadir un nuevo producto al inventario."
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span>Agregar Nuevo Producto</span>
          </button>
        </div>
      </div>
    );
  }
  
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProducts = products.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div className="p-6">
       <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold text-lg">Gestión de Productos</h3>
        <p className="text-sm text-slate-500 mb-4">Visualiza y administra todos los productos en tu inventario.</p>
         <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3">Producto</th>
                <th scope="col" className="px-6 py-3">Código</th>
                <th scope="col" className="px-6 py-3">Categoría</th>
                <th scope="col" className="px-6 py-3">Stock</th>
                <th scope="col" className="px-6 py-3">Precio Venta</th>
                <th scope="col" className="px-6 py-3">Fecha Caducidad</th>
                <th scope="col" className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map(product => (
                <tr key={product.id} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap flex items-center">
                    <img className="w-10 h-10 rounded-full mr-4" src={product.imageUrl} alt={product.name} />
                    {product.name}
                  </td>
                  <td className="px-6 py-4">{product.code}</td>
                  <td className="px-6 py-4">{product.category}</td>
                  <td className="px-6 py-4 font-semibold">{product.quantity}</td>
                  <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">{product.expiryDate}</td>
                  <td className="px-6 py-4">
                     <span className={`capitalize px-2 py-1 rounded text-xs font-semibold ${
                        product.quantity > 20 ? 'bg-green-100 text-green-700' : product.quantity > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                     }`}>
                        {product.quantity > 20 ? 'En Stock' : product.quantity > 0 ? 'Bajo Stock' : 'Agotado'}
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
            <span className="text-sm text-slate-600">
              Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, products.length)} de {products.length} productos
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

export default Products;