import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Product, User, Movement } from '../types';
import { EmptyBoxIcon, PencilIcon, TrashIcon, CloseIcon, ExclamationTriangleIcon, ChevronDownIcon, QrCodeIcon, ShareIcon } from './icons';

interface ProductsProps {
    products: Product[];
    movements: Movement[];
    onAddProduct: (product: Omit<Product, 'id'>) => Promise<{ success: boolean; message: string }>;
    onEditProduct: (productId: string, data: Omit<Product, 'id'>) => Promise<{ success: boolean; message: string }>;
    onDeleteProduct: (productId: string) => Promise<{ success: boolean; message: string }>;
    currentUser: User;
    lowStockThreshold: number;
}

const ITEMS_PER_PAGE = 5;

// Modal para mostrar el código QR de un producto
const QrCodeModal: React.FC<{ product: Product; onClose: () => void; }> = ({ product, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && product.id) {
            QRCode.toCanvas(canvasRef.current, product.id, { width: 256, errorCorrectionLevel: 'H' }, (error) => {
                if (error) console.error("Error generating QR code:", error);
            });
        }
    }, [product.id]);

    const handlePrint = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL("image/png");
        const windowContent = `
            <!DOCTYPE html>
            <html>
                <head><title>Imprimir QR - ${product.name}</title></head>
                <body style="text-align:center; font-family: sans-serif;">
                    <h2>${product.name}</h2>
                    <p>${product.code}</p>
                    <img src="${dataUrl}" style="width: 80%; max-width: 400px; margin: auto;"/>
                    <script>setTimeout(() => { window.print(); window.close(); }, 250);</script>
                </body>
            </html>
        `;
        const printWin = window.open("", "_blank");
        printWin?.document.write(windowContent);
        printWin?.document.close();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800" aria-label="Cerrar modal">
                   <CloseIcon className="h-6 w-6" />
                </button>
                <h3 className="text-lg font-medium text-slate-900 mb-1">{product.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{product.code}</p>
                <canvas ref={canvasRef} className="mx-auto rounded-md border" />
                <div className="mt-6 flex justify-center space-x-4">
                    <button onClick={handlePrint} className="px-4 py-2 text-sm font-semibold bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 w-28">Imprimir</button>
                </div>
            </div>
        </div>
    );
};

// Modal para capturar foto desde la cámara
const CameraCaptureModal: React.FC<{
    onClose: () => void;
    onCapture: (dataUrl: string) => void;
}> = ({ onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                 if (err instanceof Error && err.name === 'NotAllowedError') {
                    setCameraError('Permiso para la cámara denegado. Habilítalo en tu navegador.');
                } else {
                    setCameraError('No se pudo acceder a la cámara.');
                }
            }
        };
        startCamera();
        return () => {
            streamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            onCapture(dataUrl);
            onClose();
        }
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] animate-fade-in" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 text-center relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800" aria-label="Cerrar cámara">
                   <CloseIcon className="h-6 w-6" />
                </button>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Capturar Foto del Producto</h3>
                {cameraError ? (
                    <div className="p-4 bg-red-50 text-red-700 rounded-md">{cameraError}</div>
                ) : (
                    <>
                        <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-md bg-slate-200 border"></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        <div className="mt-6 flex justify-center space-x-4">
                            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancelar</button>
                            <button onClick={handleCapture} className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-primary/90">Capturar</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

// Modal para agregar o editar un producto
const ProductFormModal: React.FC<{
    mode: 'add' | 'edit';
    productToEdit?: Product | null;
    nextProductCode?: string;
    onClose: () => void;
    onSubmit: (data: Omit<Product, 'id'>, productId?: string) => Promise<{ success: boolean; message: string }>;
}> = ({ mode, productToEdit, nextProductCode, onClose, onSubmit }) => {
    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: '', code: mode === 'add' ? nextProductCode || '' : '', category: '', supplier: '', 
        presentation: '', quantity: 0, unit: 'unidades',
        cost: 0, price: 0,
        entryDate: new Date().toISOString().slice(0, 10),
        expiryDate: '', imageUrl: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    
    useEffect(() => {
        if (mode === 'edit' && productToEdit) {
            setFormData({
                name: productToEdit.name,
                code: productToEdit.code,
                category: productToEdit.category,
                supplier: productToEdit.supplier,
                presentation: productToEdit.presentation || '',
                quantity: productToEdit.quantity,
                unit: productToEdit.unit || 'unidades',
                cost: productToEdit.cost,
                price: productToEdit.price,
                entryDate: productToEdit.entryDate,
                expiryDate: productToEdit.expiryDate,
                imageUrl: productToEdit.imageUrl,
            });
        }
    }, [mode, productToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numValue = (name === 'quantity' || name === 'cost' || name === 'price') ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, [name]: numValue }));
    };

    const handlePhotoTaken = (dataUrl: string) => {
      setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
      setIsCameraOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.name || !formData.category) {
            setError('Nombre y categoría son campos obligatorios.');
            return;
        }
        setIsSubmitting(true);
        const result = await onSubmit(formData, mode === 'edit' ? productToEdit?.id : undefined);
        if (!result.success) {
            setError(result.message);
            setIsSubmitting(false);
        } else {
            onClose(); // Close modal on success
        }
    };

    const inputClasses = "w-full px-3 py-2 mt-1 border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-slate-50 focus:bg-white text-slate-900 transition-colors duration-200";

    return (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800" aria-label="Cerrar modal">
                   <CloseIcon className="h-6 w-6" />
                </button>
                <h2 className="text-xl font-bold mb-4">{mode === 'add' ? 'Agregar Nuevo Producto' : 'Editar Producto'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700">Nombre</label><input name="name" type="text" required value={formData.name} onChange={handleChange} className={inputClasses} /></div>
                        <div><label className="block text-sm font-medium text-slate-700">Código ID</label><input name="code" type="text" required value={formData.code} readOnly className={inputClasses + " bg-slate-100 cursor-not-allowed"} title="El código se genera automáticamente."/></div>
                        <div><label className="block text-sm font-medium text-slate-700">Categoría</label><input name="category" type="text" required value={formData.category} onChange={handleChange} className={inputClasses} /></div>
                        <div><label className="block text-sm font-medium text-slate-700">Proveedor</label><input name="supplier" type="text" value={formData.supplier} onChange={handleChange} className={inputClasses} /></div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700">Presentación / Tamaño</label>
                          <input name="presentation" type="text" value={formData.presentation} onChange={handleChange} className={inputClasses} placeholder="Ej: Bolsa de 1kg, Botella 750mL"/>
                          <p className="mt-1 text-xs text-slate-500">Describe el empaque o tamaño de una unidad.</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Cantidad Inicial en Stock</label>
                            <input name="quantity" type="number" min="0" step="any" value={formData.quantity} onChange={handleChange} className={inputClasses} title={mode === 'edit' ? "Cambiar el stock aquí generará un movimiento automático." : "Stock inicial al agregar el producto."} />
                             <p className="mt-1 text-xs text-slate-500">{mode === 'edit' ? "El cambio de stock aquí generará un movimiento automático." : "Cantidad inicial del producto al registrarlo."}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Unidad de Medida del Stock</label>
                            <select name="unit" value={formData.unit} onChange={handleChange} className={inputClasses} disabled={mode === 'edit'} title={mode === 'edit' ? "La unidad no se puede cambiar después de crear el producto." : ""}>
                                <option value="unidades">Unidades</option>
                                <option value="kg">Kilogramos (kg)</option>
                                <option value="g">Gramos (g)</option>
                                <option value="L">Litros (L)</option>
                                <option value="mL">Mililitros (mL)</option>
                                <option value="oz">Onzas (oz)</option>
                            </select>
                            <p className="mt-1 text-xs text-slate-500">Unidad para contar el stock. Si usas 'unidades', detalla el tamaño en 'Presentación'.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">Costo (Unitario)</label>
                            <input name="cost" type="number" min="0" step="0.01" value={formData.cost} onChange={handleChange} className={inputClasses} />
                            <p className="mt-1 text-xs text-slate-500">Costo de compra del producto por unidad/kg/L.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Precio (Venta)</label>
                            <input name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} className={inputClasses} />
                            <p className="mt-1 text-xs text-slate-500">Precio de venta al público por unidad/kg/L.</p>
                        </div>
                        <div><label className="block text-sm font-medium text-slate-700">Fecha de Caducidad</label><input name="expiryDate" type="date" value={formData.expiryDate} onChange={handleChange} className={inputClasses} /></div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Imagen del Producto</label>
                        <div className="mt-1 flex items-center space-x-4">
                             <img src={formData.imageUrl || 'https://placehold.co/400x400/eeeeee/cccccc?text=Foto'} alt="Vista previa del producto" className="w-20 h-20 rounded-md object-cover bg-slate-100" />
                             <button type="button" onClick={() => setIsCameraOpen(true)} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
                                 Tomar Foto
                             </button>
                        </div>
                     </div>
                    {error && <p className="text-sm text-center text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}
                    <div className="pt-2 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-primary/90 disabled:bg-slate-400 flex items-center" disabled={isSubmitting}>
                         {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                         {mode === 'add' ? 'Agregar Producto' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
             <style>{` @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } } .animate-fade-in { animation: fade-in 0.2s ease-out; }`}</style>
        </div>
        {isCameraOpen && <CameraCaptureModal onClose={() => setIsCameraOpen(false)} onCapture={handlePhotoTaken} />}
        </>
    );
};

// Modal for confirming product deletion
const DeleteConfirmationModal: React.FC<{
    product: Product;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ product, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Eliminar Producto</h3>
                <p className="mt-2 text-sm text-slate-500">¿Estás seguro de que deseas eliminar <strong>{product.name}</strong>? Esta acción no se puede deshacer.</p>
                <div className="mt-6 flex justify-center space-x-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 w-24">Cancelar</button>
                    <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 w-24">Eliminar</button>
                </div>
            </div>
        </div>
    );
};


const Products: React.FC<ProductsProps> = ({ products, movements, onAddProduct, onEditProduct, onDeleteProduct, currentUser, lowStockThreshold }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productForQr, setProductForQr] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [modalState, setModalState] = useState<{ mode: 'add' | 'edit' | null; product: Product | null }>({ mode: null, product: null });
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState({ entryDate: false, expiryDate: false });
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const columnSelectorRef = useRef<HTMLDivElement>(null);

  const getNextProductCode = () => {
      if (!products || products.length === 0) return '001';
      const existingCodes = products.map(p => parseInt(p.code, 10)).filter(n => !isNaN(n));
      if (existingCodes.length === 0) return '001';
      const maxCode = Math.max(...existingCodes);
      return (maxCode + 1).toString().padStart(3, '0');
  };

  useEffect(() => {
    if (feedback) {
        const timer = setTimeout(() => setFeedback(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
      setCurrentPage(1);
      setExpandedProductId(null); // Collapse rows on search
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) {
        setIsColumnSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleToggleMovements = (productId: string) => {
    setExpandedProductId(prevId => (prevId === productId ? null : productId));
  };

  const handleFormSubmit = async (data: Omit<Product, 'id'>, productId?: string) => {
      const result = await (productId ? onEditProduct(productId, data) : onAddProduct(data));
      setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
      if (result.success) {
          setModalState({ mode: null, product: null });
      }
      return result;
  };

  const handleDeleteConfirm = async () => {
      if (productToDelete && productToDelete.id) {
          const result = await onDeleteProduct(productToDelete.id);
          setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
          setProductToDelete(null);
      }
  };

  const handleShare = async (product: Product) => {
    const shareData = {
        title: `InvenTICS Product: ${product.name}`,
        text: `Product: ${product.name}\nCode: ${product.code}\nCategory: ${product.category}\nStock: ${product.quantity}\nPrice: $${product.price.toFixed(2)}`,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            setFeedback({ type: 'success', message: '¡Producto compartido con éxito!' });
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                console.error('Error sharing:', err);
                setFeedback({ type: 'error', message: 'No se pudo compartir el producto.' });
            }
        }
    } else {
        // Fallback for browsers that do not support Web Share API
        try {
            await navigator.clipboard.writeText(shareData.text);
            setFeedback({ type: 'success', message: 'Detalles del producto copiados al portapapeles.' });
        } catch (err) {
            console.error('Failed to copy: ', err);
            setFeedback({ type: 'error', message: 'No se pudieron copiar los detalles.' });
        }
    }
  };

  const getStatusInfo = (quantity: number) => {
    if (quantity === 0) {
      return { text: 'Agotado', className: 'bg-red-100 text-red-700' };
    }
    if (quantity < lowStockThreshold) {
      return { text: 'Bajo Stock', className: 'bg-yellow-100 text-yellow-700' };
    }
    return { text: 'En Stock', className: 'bg-green-100 text-green-700' };
  };

  const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (products.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="bg-white p-12 rounded-lg shadow max-w-lg mx-auto mt-10">
          <div className="flex justify-center mb-6"> <EmptyBoxIcon className="w-24 h-24 text-slate-300" /> </div>
          <h3 className="text-xl font-bold text-slate-800">Tu inventario está vacío</h3>
          <p className="mt-2 text-slate-500">
            {currentUser.role === 'admin' 
                ? '¡Empieza por agregar tu primer producto para llevar el control!' 
                : 'Contacta a un administrador para agregar nuevos productos.'
            }
          </p>
          {currentUser.role === 'admin' && (
            <button onClick={() => setModalState({ mode: 'add', product: null })} className="mt-6 bg-brand-primary text-white px-5 py-2.5 rounded-md hover:bg-brand-primary/90 text-sm font-semibold flex items-center justify-center mx-auto space-x-2 transition-colors duration-200" title="Añadir un nuevo producto al inventario">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              <span>Agregar Nuevo Producto</span>
            </button>
          )}
        </div>
        {modalState.mode && <ProductFormModal mode={modalState.mode} nextProductCode={getNextProductCode()} onClose={() => setModalState({ mode: null, product: null })} onSubmit={handleFormSubmit} />}
      </div>
    );
  }
  
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const baseCols = currentUser.role === 'admin' ? 7 : 6;
  const tableCols = baseCols + (columnVisibility.entryDate ? 1 : 0) + (columnVisibility.expiryDate ? 1 : 0);

  return (
    <div className="p-6">
       <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <h3 className="font-bold text-lg">Gestión de Productos</h3>
          <p className="text-sm text-slate-500">Visualiza, busca y administra todos los productos en tu inventario.</p>
        </div>
        <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
            <div className="flex items-center gap-4">
                <div className="relative w-full max-w-md">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre, código o categoría..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-white text-slate-900 placeholder:text-slate-400"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
                <div className="relative" ref={columnSelectorRef}>
                    <button onClick={() => setIsColumnSelectorOpen(prev => !prev)} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2">
                        Columnas <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    {isColumnSelectorOpen && (
                        <div className="absolute top-full mt-2 w-56 bg-white rounded-md shadow-lg border z-10">
                            <label className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-sm">
                                <input type="checkbox" checked={columnVisibility.entryDate} onChange={() => setColumnVisibility(prev => ({...prev, entryDate: !prev.entryDate}))} />
                                Fecha de Ingreso
                            </label>
                            <label className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-sm">
                                <input type="checkbox" checked={columnVisibility.expiryDate} onChange={() => setColumnVisibility(prev => ({...prev, expiryDate: !prev.expiryDate}))} />
                                Fecha de Caducidad
                            </label>
                        </div>
                    )}
                </div>
            </div>
            {currentUser.role === 'admin' && (
                <button onClick={() => setModalState({ mode: 'add', product: null })} className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-primary/90 text-sm font-semibold flex items-center space-x-2 transition-transform duration-200 hover:scale-105" title="Añadir un nuevo producto al inventario">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <span>Agregar Producto</span>
                </button>
            )}
        </div>
        {feedback && (
          <div className={`p-3 mb-4 rounded-md text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {feedback.message}
          </div>
        )}
         <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3">Producto</th>
                <th scope="col" className="px-6 py-3">Código</th>
                <th scope="col" className="px-6 py-3">Stock</th>
                <th scope="col" className="px-6 py-3">Precio</th>
                {columnVisibility.entryDate && <th scope="col" className="px-6 py-3">F. Ingreso</th>}
                {columnVisibility.expiryDate && <th scope="col" className="px-6 py-3">F. Caducidad</th>}
                <th scope="col" className="px-6 py-3">Estado</th>
                {currentUser.role === 'admin' && <th scope="col" className="px-6 py-3 text-right">Acciones</th>}
                <th scope="col" className="px-1 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.length > 0 ? (
                currentProducts.map(product => {
                  const status = getStatusInfo(product.quantity);
                  const isLowStock = product.quantity > 0 && product.quantity < lowStockThreshold;
                  const isExpanded = expandedProductId === product.id;
                  const productMovements = movements.filter(m => m.productId === product.id).slice(0, 5);

                  return (
                    <React.Fragment key={product.id}>
                      <tr 
                        className={`border-b transition-colors duration-150 ${
                          isLowStock ? 'bg-yellow-50 hover:bg-yellow-100' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap flex items-center">
                          <img className="w-10 h-10 rounded-full mr-4 object-cover" src={product.imageUrl || `https://placehold.co/400x400/eeeeee/cccccc?text=${product.name.charAt(0)}`} alt={product.name} />
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            {product.presentation && <p className="text-xs text-slate-600 font-medium">{product.presentation}</p>}
                            <p className="text-xs text-slate-500">{product.category}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">{product.code}</td>
                        <td className="px-6 py-4 font-semibold">{product.quantity} <span className="text-xs text-slate-500 font-normal">{product.unit || 'unidades'}</span></td>
                        <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                        {columnVisibility.entryDate && <td className="px-6 py-4">{product.entryDate}</td>}
                        {columnVisibility.expiryDate && <td className="px-6 py-4">{product.expiryDate}</td>}
                        <td className="px-6 py-4">
                           <div className="flex items-center space-x-2">
                              <span className={`capitalize px-2 py-1 rounded text-xs font-semibold ${status.className}`}>
                                {status.text}
                              </span>
                              {isLowStock && (
                                <span title="Este producto tiene bajo stock">
                                  <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                                </span>
                              )}
                           </div>
                        </td>
                        {currentUser.role === 'admin' && (
                          <td className="px-6 py-4 text-right space-x-3">
                              <button onClick={() => handleShare(product)} title="Compartir producto" className="text-slate-400 hover:text-blue-500">
                                <ShareIcon className="w-5 h-5" />
                              </button>
                              <button onClick={() => setProductForQr(product)} title="Generar código QR" className="text-slate-400 hover:text-brand-primary">
                                <QrCodeIcon className="w-5 h-5" />
                              </button>
                              <button onClick={() => setModalState({ mode: 'edit', product })} title="Editar producto" className="text-slate-400 hover:text-brand-secondary">
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button onClick={() => setProductToDelete(product)} title="Eliminar producto" className="text-slate-400 hover:text-red-600">
                                <TrashIcon className="w-5 h-5" />
                              </button>
                          </td>
                        )}
                        <td className="px-1 py-4 text-center">
                            <button onClick={() => handleToggleMovements(product.id!)} title={isExpanded ? "Ocultar movimientos" : "Ver movimientos recientes"} className="p-1 rounded-full hover:bg-slate-200">
                                <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50">
                            <td colSpan={tableCols} className="p-4">
                                <h4 className="font-semibold text-sm mb-2 text-slate-700">Últimos 5 Movimientos</h4>
                                {productMovements.length > 0 ? (
                                    <table className="w-full text-xs bg-white rounded shadow-inner">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Tipo</th>
                                                <th className="px-4 py-2 text-left">Cantidad</th>
                                                <th className="px-4 py-2 text-left">Fecha</th>
                                                <th className="px-4 py-2 text-left">Motivo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productMovements.map(m => (
                                                <tr key={m.id} className="border-b last:border-b-0">
                                                    <td className="px-4 py-2">
                                                        <span className={`capitalize font-semibold ${m.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>{m.type}</span>
                                                    </td>
                                                    <td className="px-4 py-2">{m.quantity}</td>
                                                    <td className="px-4 py-2">{m.date}</td>
                                                    <td className="px-4 py-2 text-slate-600">{m.reason}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-center text-sm text-slate-500 py-4">No hay movimientos recientes para este producto.</p>
                                )}
                            </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={tableCols} className="text-center py-10">
                    <p className="font-semibold text-slate-700">No se encontraron productos</p>
                    <p className="text-sm text-slate-500">Intenta con un término de búsqueda diferente.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
            <span className="text-sm text-slate-600">Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length)} de {filteredProducts.length} productos</span>
            <div className="flex items-center space-x-2">
              <button onClick={goToPreviousPage} disabled={currentPage === 1} className="px-3 py-1 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
              <span className="text-sm font-medium text-slate-700">Página {currentPage} de {totalPages}</span>
              <button onClick={goToNextPage} disabled={currentPage === totalPages} className="px-3 py-1 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
            </div>
          </div>
        )}
       </div>
       {modalState.mode && <ProductFormModal mode={modalState.mode} productToEdit={modalState.product} nextProductCode={modalState.mode === 'add' ? getNextProductCode() : undefined} onClose={() => setModalState({ mode: null, product: null })} onSubmit={handleFormSubmit} />}
       {productToDelete && <DeleteConfirmationModal product={productToDelete} onClose={() => setProductToDelete(null)} onConfirm={handleDeleteConfirm} />}
       {productForQr && <QrCodeModal product={productForQr} onClose={() => setProductForQr(null)} />}
    </div>
  );
};

export default Products;