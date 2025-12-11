
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, Movement } from '../types';
import { IllustrationReportIcon } from './icons';

interface ReportsProps {
  products: Product[];
  movements: Movement[];
}

const Reports: React.FC<ReportsProps> = ({ products, movements }) => {
  // Estado para el manejo de fechas, inicializado en "Hoy"
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  // Helpers para filtros rápidos
  const setFilterToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
  };

  const setFilterLast7Days = () => {
    const today = new Date();
    const last7 = new Date(today);
    last7.setDate(today.getDate() - 7);
    
    setEndDate(today.toISOString().slice(0, 10));
    setStartDate(last7.toISOString().slice(0, 10));
  };

  const setFilterThisMonth = () => {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    setStartDate(firstDay.toISOString().slice(0, 10));
    setEndDate(lastDay.toISOString().slice(0, 10));
  };

  const generatePDF = () => {
    // 1. Filtrar movimientos basados en el rango seleccionado
    const filteredMovements = movements.filter(m => {
        const moveDate = m.date; // Formato YYYY-MM-DD
        return moveDate >= startDate && moveDate <= endDate;
    });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Estadísticas generales (Inventario actual, no depende de fechas históricas)
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalCostValue = products.reduce((sum, p) => sum + (p.quantity * p.cost), 0);
    const totalPriceValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);

    // Header del PDF
    const header = (data: { pageNumber?: number }) => {
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.setFont('helvetica', 'bold');
      doc.text("InvenTICS - Reporte de Inventario", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Periodo del Reporte: Del ${startDate} al ${endDate}`, 14, 33);
    };

    const footer = (data: { pageNumber: number }) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`Página ${data.pageNumber} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    };

    // Inicializar primera página
    header({}); 

    // --- SECCIÓN 1: RESUMEN (Estado Actual) ---
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text("1. Estado Actual del Inventario", 14, 45);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    const summaryText = `
    Este resumen refleja la "foto" actual del almacén al momento de la generación:
    - Productos registrados: ${totalProducts}
    - Unidades totales en existencia: ${totalStock}
    - Valor total (Costo): ${totalCostValue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
    - Valor potencial (Venta): ${totalPriceValue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
    `;
    doc.text(summaryText, 14, 50);

    // Tabla de Productos (Estado Actual)
    autoTable(doc, {
      startY: 75,
      head: [['Nombre', 'Código', 'Categoría', 'Stock', 'Costo', 'Precio', 'Caducidad']],
      body: products.map(p => [
        p.name,
        p.code,
        p.category,
        `${p.quantity} ${p.unit || 'u.'}`,
        `$${p.cost.toFixed(2)}`,
        `$${p.price.toFixed(2)}`,
        p.expiryDate || '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // brand-primary
      styles: { fontSize: 8 },
      didDrawPage: (data) => {
        header(data);
        footer(data);
      }
    });

    // --- SECCIÓN 2: MOVIMIENTOS (Filtrados por Fecha) ---
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    
    // Verificar si hay espacio, si no, nueva página
    if (finalY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        header({});
        doc.text(`2. Movimientos Registrados (${startDate} - ${endDate})`, 14, 45);
        (doc as any).lastAutoTable.finalY = 45; // Reset Y para la tabla
    } else {
        doc.text(`2. Movimientos Registrados (${startDate} - ${endDate})`, 14, finalY);
    }

    if (filteredMovements.length > 0) {
        autoTable(doc, {
          startY: finalY > doc.internal.pageSize.getHeight() - 30 ? 55 : finalY + 5,
          head: [['Fecha', 'Hora', 'Producto', 'Tipo', 'Cant.', 'Usuario', 'Motivo']],
          body: filteredMovements.map(m => [
            m.date,
            m.time,
            m.productName,
            m.type.toUpperCase(),
            m.quantity,
            m.user,
            m.reason
          ]),
          theme: 'grid',
          headStyles: { fillColor: [14, 165, 233] }, // brand-secondary
          styles: { fontSize: 8 },
          didDrawPage: (data) => {
            header(data);
            footer(data);
          }
        });
    } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text("No se encontraron movimientos registrados en el rango de fechas seleccionado.", 14, finalY + 10);
    }

    doc.save(`Reporte_InvenTICS_${startDate}_al_${endDate}.pdf`);
  };

  return (
    <div className="p-6">
       <div className="bg-white p-8 rounded-lg shadow max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Ilustración e Intro */}
                <div className="w-full md:w-1/3 text-center md:text-left">
                     <div className="flex justify-center md:justify-start mb-4">
                        <div className="bg-blue-50 p-4 rounded-full">
                            <IllustrationReportIcon className="w-24 h-24 text-brand-secondary" />
                        </div>
                    </div>
                    <h3 className="font-bold text-2xl text-slate-800">Generar Reporte</h3>
                    <p className="mt-2 text-slate-500 text-sm">
                        Crea un documento PDF con el inventario actual y el historial de movimientos filtrado por fechas.
                    </p>
                </div>

                {/* Controles de Fecha */}
                <div className="w-full md:w-2/3 bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-2">Configuración del Reporte</h4>
                    
                    <div className="mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtros Rápidos</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <button onClick={setFilterToday} className="px-3 py-1 bg-white border border-slate-300 text-slate-600 text-sm rounded hover:bg-brand-light hover:text-brand-primary hover:border-brand-primary transition-colors">
                                Hoy
                            </button>
                            <button onClick={setFilterLast7Days} className="px-3 py-1 bg-white border border-slate-300 text-slate-600 text-sm rounded hover:bg-brand-light hover:text-brand-primary hover:border-brand-primary transition-colors">
                                Últimos 7 días
                            </button>
                            <button onClick={setFilterThisMonth} className="px-3 py-1 bg-white border border-slate-300 text-slate-600 text-sm rounded hover:bg-brand-light hover:text-brand-primary hover:border-brand-primary transition-colors">
                                Este Mes
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Fin</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary text-sm"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={generatePDF}
                        className="w-full bg-brand-secondary text-white px-5 py-3 rounded-md hover:bg-brand-secondary/90 font-bold shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                        </svg>
                        <span>Descargar Reporte PDF</span>
                    </button>
                </div>
            </div>
       </div>
    </div>
  );
};

export default Reports;
