import React, { useState, useEffect } from 'react';
import { Product, Movement, AnalysisResult } from '../types';
import { getInventoryAnalysis } from '../services/geminiService';
import { SparklesIcon } from './icons';

interface DashboardProps {
  products: Product[];
  movements: Movement[];
}

const StatCard: React.FC<{ title: string; value: string | number; description: string; }> = ({ title, value, description }) => (
    <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
);

const AnalysisCard: React.FC<{ products: Product[]; movements: Movement[] }> = ({ products, movements }) => {
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            setIsAnalyzing(true);
            setError(null);
            try {
                const result = await getInventoryAnalysis(products, movements);
                setAnalysis(result);
            } catch (err) {
                setError("No se pudieron obtener las sugerencias de la IA en este momento.");
            } finally {
                setIsAnalyzing(false);
            }
        };
        fetchAnalysis();
    }, [products, movements]);

    const renderContent = () => {
        if (isAnalyzing) {
            return (
                 <div className="flex flex-col items-center justify-center h-48">
                    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-500">Analizando inventario...</p>
                </div>
            );
        }
        if (error) {
            return <p className="text-center text-red-600 p-4">{error}</p>;
        }
        if (analysis) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                    <div>
                        <h4 className="font-semibold text-brand-secondary mb-2">📈 Potencial Alta Demanda</h4>
                        <ul className="space-y-3">
                           {analysis.highDemand.map((item, index) => (
                               <li key={`demand-${index}`} className="bg-sky-50 p-3 rounded-md">
                                   <p className="font-semibold text-sm text-sky-800">{item.productName}</p>
                                   <p className="text-xs text-sky-600 italic">"{item.reason}"</p>
                               </li>
                           ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-amber-600 mb-2">📦 Sugerencias de Reorden</h4>
                         <ul className="space-y-3">
                           {analysis.reorder.map((item, index) => (
                               <li key={`reorder-${index}`} className="bg-amber-50 p-3 rounded-md">
                                   <p className="font-semibold text-sm text-amber-800">{item.productName}</p>
                                   <p className="text-xs text-amber-600 italic">"{item.reason}"</p>
                               </li>
                           ))}
                        </ul>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="mt-8 bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center space-x-2">
                <SparklesIcon className="w-6 h-6 text-brand-primary" />
                <h3 className="font-bold text-lg text-slate-800">Análisis y Sugerencias IA</h3>
            </div>
            {renderContent()}
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ products, movements }) => {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const outOfStock = products.filter(p => p.quantity === 0).length;
  const recentMovements = movements.slice(0, 5);

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total de Productos" value={totalProducts} description="Tipos de productos distintos" />
        <StatCard title="Unidades en Stock" value={totalStock.toLocaleString()} description="Suma de todas las unidades" />
        <StatCard title="Productos Agotados" value={outOfStock} description="Productos con cero unidades" />
      </div>

      <AnalysisCard products={products} movements={movements} />

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold text-lg">Movimientos Recientes</h3>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3">Producto</th>
                <th scope="col" className="px-6 py-3">Tipo</th>
                <th scope="col" className="px-6 py-3">Cantidad</th>
                <th scope="col" className="px-6 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recentMovements.map(movement => (
                <tr key={movement.id} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{movement.productName}</td>
                  <td className="px-6 py-4">
                     <span className={`capitalize px-2 py-1 rounded text-xs font-semibold ${
                        movement.type === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                     }`}>{movement.type}</span>
                  </td>
                  <td className="px-6 py-4">{movement.quantity}</td>
                  <td className="px-6 py-4">{movement.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;