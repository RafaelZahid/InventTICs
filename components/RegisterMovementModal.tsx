import React, { useState, useEffect } from 'react';
import { Product, User, Movement } from '../types';

// Modal component for registering movement
const RegisterMovementModal: React.FC<{
    products: Product[];
    currentUser: User;
    initialProductId?: string;
    onClose: () => void;
    onRegister: (movement: Omit<Movement, 'id' | 'date' | 'time' | 'productName'>) => Promise<{ success: boolean, message: string }>;
}> = ({ products, currentUser, initialProductId, onClose, onRegister }) => {
    const [productId, setProductId] = useState(initialProductId || (products.length > 0 ? products[0].id : ''));
    const [type, setType] = useState<'entrada' | 'salida'>('salida');
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if(initialProductId) {
            setProductId(initialProductId)
        }
    }, [initialProductId]);

    const selectedProduct = products.find(p => p.id === productId);
    const productUnit = selectedProduct?.unit || 'unidades';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        if (!productId || quantity <= 0) {
            setError('Por favor, completa todos los campos correctamente.');
            setIsSubmitting(false);
            return;
        }

        const newMovement = {
            productId: productId!,
            type,
            quantity,
            reason,
            user: currentUser.username
        };
        
        const result = await onRegister(newMovement);

        if (result.success) {
            // El cierre ahora se maneja en App.tsx para asegurar que el estado se limpie.
            // No es necesario mostrar mensaje de éxito aquí porque el modal se cierra.
        } else {
            setError(result.message);
            setIsSubmitting(false);
        }
    };

    const inputClasses = "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-slate-50 focus:bg-white text-slate-900 transition-colors duration-200 disabled:bg-slate-200";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800" aria-label="Cerrar modal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 className="text-xl font-bold mb-4">Registrar Nuevo Movimiento</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="product" className="block text-sm font-medium text-slate-700">Producto</label>
                        <select id="product" value={productId} onChange={e => setProductId(e.target.value)} className={inputClasses + ' mt-1'} disabled={isSubmitting}>
                            {products.map(p => (
                                <option key={p.id} value={p.id!}>
                                    {p.name} {p.presentation ? `- ${p.presentation}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-slate-700">Tipo de Movimiento</label>
                            <select id="type" value={type} onChange={e => setType(e.target.value as 'entrada' | 'salida')} className={inputClasses + ' mt-1'} disabled={isSubmitting}>
                                <option value="entrada">Entrada</option>
                                <option value="salida">Salida</option>
                            </select>
                        </div>
                        <div>
                             <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Cantidad</label>
                             <div className="relative mt-1">
                                <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(Math.max(0.01, Number(e.target.value)))} min="0.01" step="any" className={inputClasses + " pr-20 !mt-0"} disabled={isSubmitting} />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-slate-500 pointer-events-none capitalize">{productUnit}</span>
                             </div>
                        </div>
                     </div>
                    <div>
                         <label htmlFor="reason" className="block text-sm font-medium text-slate-700">Motivo</label>
                         <input type="text" id="reason" value={reason} required className={inputClasses + ' mt-1'} placeholder="Ej: Venta a cliente, Pedido a proveedor" disabled={isSubmitting} />
                    </div>
                     {error && <p className="text-sm text-center text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}
                     {success && <p className="text-sm text-center text-green-600 bg-green-50 p-2 rounded-md">{success}</p>}
                    <div className="pt-2 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300" disabled={isSubmitting}>Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-primary/90 disabled:bg-slate-400 flex items-center" disabled={isSubmitting}>
                          {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                          Registrar
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
            `}</style>
        </div>
    );
};

export default RegisterMovementModal;