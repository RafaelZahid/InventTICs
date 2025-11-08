

import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, Movement } from '../types';
import { IllustrationReportIcon } from './icons';

interface ReportsProps {
  products: Product[];
  movements: Movement[];
}

const Reports: React.FC<ReportsProps> = ({ products, movements }) => {

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalCostValue = products.reduce((sum, p) => sum + (p.quantity * p.cost), 0);
    const totalPriceValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);

    const header = (data: { pageNumber?: number }) => {
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.setFont('helvetica', 'bold');
      doc.text("InvenTICS - Reporte de Inventario", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de Generación: ${new Date().toLocaleString()}`, 14, 30);
    };

    const footer = (data: { pageNumber: number }) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`Página ${data.pageNumber} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    };

    header({}); 
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Resumen General del Inventario", 14, 45);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryText = `
    - Número total de productos distintos: ${totalProducts}
    - Cantidad total de unidades en stock: ${totalStock}
    - Valor total del inventario (costo): ${totalCostValue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
    - Valor total del inventario (venta): ${totalPriceValue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
    `;
    doc.text(summaryText, 14, 52);

    autoTable(doc, {
      startY: 80,
      head: [['Nombre', 'Código', 'Categoría', 'Stock', 'Costo', 'Precio', 'Caducidad']],
      body: products.map(p => [
        p.name,
        p.code,
        p.category,
        p.quantity,
        `$${p.cost.toFixed(2)}`,
        `$${p.price.toFixed(2)}`,
        p.expiryDate
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      didDrawPage: (data) => {
        header(data);
        footer(data);
      }
    });

    autoTable(doc, {
      head: [['Producto', 'Tipo', 'Cantidad', 'Fecha', 'Usuario', 'Motivo']],
      body: movements.slice(0, 30).map(m => [
        m.productName,
        m.type,
        m.quantity,
        m.date,
        m.user,
        m.reason
      ]),
      theme: 'grid',
      headStyles: { fillColor: [14, 165, 233] },
      alternateRowStyles: { fillColor: [240, 249, 255] },
      didDrawPage: (data) => {
        header(data);
        footer(data);
      }
    });

    doc.save(`Reporte_Inventario_InvenTICS_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="p-6">
       <div className="bg-white p-8 rounded-lg shadow text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <IllustrationReportIcon className="w-32 h-32" />
            </div>
            <h3 className="font-bold text-2xl">Generación de Reportes</h3>
            <p className="mt-2 text-slate-600 max-w-xl mx-auto">
                Genera un reporte completo en formato PDF del estado actual de tu inventario. El documento incluirá un resumen, una lista detallada de productos y los últimos movimientos registrados.
            </p>
             <button 
                onClick={generatePDF}
                className="mt-8 bg-brand-secondary text-white px-5 py-2.5 rounded-md hover:bg-brand-secondary/90 text-sm font-semibold flex items-center justify-center mx-auto space-x-2 transition-colors duration-200"
                title="Crea y descarga un archivo PDF con el reporte del inventario."
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              <span>Generar y Descargar Reporte PDF</span>
            </button>
       </div>
    </div>
  );
};

export default Reports;