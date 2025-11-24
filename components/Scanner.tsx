
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '../types';
import { QrCodeIcon, ProductIcon, SparklesIcon } from './icons';
import { generateSimulatedScanImage, generateProductImageByName } from '../services/geminiService';

interface ScannerProps {
    products: Product[];
    onOpenMovementModal: (productId: string) => void;
}

const Scanner: React.FC<ScannerProps> = ({ products, onOpenMovementModal }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [simulationImage, setSimulationImage] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);

    // Estado para mantener el producto que se está simulando para asegurar congruencia
    const [pendingSimulatedProduct, setPendingSimulatedProduct] = useState<Product | null>(null);

    // Estados para la generación de imagen del producto resultado
    const [generatedProductImage, setGeneratedProductImage] = useState<string | null>(null);
    const [isGeneratingProductResult, setIsGeneratingProductResult] = useState(false);

    // Resetear el estado de error de imagen cuando cambia el producto escaneado
    useEffect(() => {
        setImageError(false);
        setGeneratedProductImage(null);
        
        // Si hay un producto escaneado, generar su imagen
        if (scannedProduct) {
            const fetchImage = async () => {
                setIsGeneratingProductResult(true);
                const img = await generateProductImageByName(scannedProduct.name);
                setGeneratedProductImage(img);
                setIsGeneratingProductResult(false);
            };
            fetchImage();
        }
    }, [scannedProduct]);

    const handleScan = useCallback((data: string) => {
        if (data) {
            setIsScanning(false);
            setIsSimulating(false);
            const product = products.find(p => p.id === data);
            if (product) {
                setScannedProduct(product);
                setError(null);
            } else {
                setScannedProduct(null);
                setError(`Producto no encontrado. Código QR escaneado: ${data}`);
            }
        }
    }, [products]);

    // Lógica para el escáner REAL (Cámara)
    useEffect(() => {
        if (!isScanning) return;

        let stream: MediaStream | null = null;
        let animationFrameId: number;

        // @ts-ignore - BarcodeDetector might not be in the default TS DOM lib
        let barcodeDetector: BarcodeDetector | null = null;
        if ('BarcodeDetector' in window) {
             // @ts-ignore
             barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        }
        
        const scan = async () => {
            if (videoRef.current && barcodeDetector && videoRef.current.readyState >= 2) { 
                try {
                    const barcodes = await barcodeDetector.detect(videoRef.current);
                    if (barcodes.length > 0 && barcodes[0].rawValue) {
                        handleScan(barcodes[0].rawValue);
                        return; // Stop scanning loop
                    }
                } catch (e) {
                     // Ignorar errores de detección vacía
                }
            }
            animationFrameId = requestAnimationFrame(scan);
        };

        const startCamera = async () => {
            if (!barcodeDetector) {
                setError('Este navegador no soporta la detección nativa de códigos QR. Usa la opción "Escanear Código".');
                setIsScanning(false);
                return;
            }
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadeddata = () => {
                        videoRef.current?.play();
                        animationFrameId = requestAnimationFrame(scan);
                    }
                }
            } catch (err) {
                console.error("Error accessing camera: ", err);
                let message = 'No se pudo acceder a la cámara.';
                if (err instanceof Error && err.name === 'NotAllowedError') {
                    message = 'Permiso para acceder a la cámara denegado.'
                }
                setError(message);
                setIsScanning(false);
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isScanning, handleScan]);

    // Lógica para la SIMULACIÓN (Timer)
    useEffect(() => {
        if (!isSimulating) return;

        const timer = setTimeout(() => {
            // Usamos el producto que seleccionamos AL INICIO de la simulación
            if (pendingSimulatedProduct && pendingSimulatedProduct.id) {
                handleScan(pendingSimulatedProduct.id);
            } else {
                setError("Error de simulación: No se pudo recuperar el producto.");
                setIsSimulating(false);
            }
        }, 4000); // 4 segundos de animación visual

        return () => clearTimeout(timer);
    }, [isSimulating, pendingSimulatedProduct, handleScan]);


    const handleReset = () => {
        setScannedProduct(null);
        setError(null);
        setIsScanning(false);
        setIsSimulating(false);
        setImageError(false);
        setSimulationImage(null);
        setGeneratedProductImage(null);
        setPendingSimulatedProduct(null);
    };

    const handleStopScanning = () => {
        setIsScanning(false);
        setIsSimulating(false);
        setIsGeneratingImage(false);
        setError(null);
        setPendingSimulatedProduct(null);
    }

    const handleRegisterMovement = () => {
        if (scannedProduct && scannedProduct.id) {
            onOpenMovementModal(scannedProduct.id);
        }
    };
    
    const startSimulation = async () => {
        setError(null);
        setScannedProduct(null);
        setPendingSimulatedProduct(null);
        
        if (products.length === 0) {
            setError("No hay productos en el inventario para simular.");
            return;
        }

        // 1. Seleccionar el producto PRIMERO
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        setPendingSimulatedProduct(randomProduct);

        // 2. Iniciar Generación de Imagen pasando el nombre del producto seleccionado
        setIsGeneratingImage(true);
        const generatedImage = await generateSimulatedScanImage(randomProduct.name);
        
        // 3. Establecer imagen y comenzar animación
        if (generatedImage) {
            setSimulationImage(generatedImage);
        } else {
            // Fallback si la IA falla (usar estática)
            setSimulationImage("https://images.unsplash.com/photo-1604719312566-b7cb60936928?q=80&w=2070&auto=format&fit=crop");
        }
        
        setIsGeneratingImage(false);
        setIsSimulating(true);
    };

    const renderProductImage = () => {
        if (!scannedProduct) return null;

        // 1. Mostrar Skeleton Loading mientras se genera la imagen del resultado
        if (isGeneratingProductResult) {
            return (
                <div className="w-full h-full bg-slate-100 animate-pulse flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-xs text-slate-400 font-medium">Generando foto...</span>
                </div>
            );
        }

        // 2. Mostrar la imagen generada por IA si existe
        if (generatedProductImage) {
            return (
                 <div className="relative w-full h-full group">
                    <img 
                        src={generatedProductImage} 
                        alt={`IA generada de ${scannedProduct.name}`} 
                        className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-1 right-1">
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-secondary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-secondary"></span>
                        </span>
                    </div>
                 </div>
            );
        }

        // 3. Fallback a la imagen guardada en base de datos si existe
        const hasImage = scannedProduct.imageUrl && scannedProduct.imageUrl.trim() !== '';
        if (hasImage && !imageError) {
            return (
                <img 
                    src={scannedProduct.imageUrl} 
                    alt={scannedProduct.name} 
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover" 
                />
            );
        }

        // 4. Fallback final: Icono genérico
        return (
             <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                <ProductIcon className="w-8 h-8 mb-1" />
                <span className="text-xs font-bold text-slate-300">{scannedProduct.name.charAt(0).toUpperCase()}</span>
             </div>
        );
    };
    
    return (
        <div className="p-6 bg-slate-50 min-h-full flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Lectura de Código QR</h2>
                
                {/* Estado Inicial: Botones para activar */}
                {!isScanning && !isSimulating && !isGeneratingImage && !scannedProduct && !error && (
                    <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
                        <div className="bg-slate-100 p-6 rounded-full mb-6">
                             <QrCodeIcon className="w-20 h-20 text-slate-400" />
                        </div>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            Selecciona el método de entrada para identificar el producto.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <button 
                                onClick={() => { setError(null); setIsScanning(true); }}
                                className="bg-white border-2 border-brand-primary text-brand-primary px-6 py-3 rounded-lg font-bold shadow hover:bg-brand-primary/5 transition-transform transform hover:scale-105 flex items-center justify-center gap-3"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                </svg>
                                Usar Cámara Web
                            </button>
                            
                            <button 
                                onClick={startSimulation}
                                className="bg-brand-primary text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-brand-primary/90 transition-transform transform hover:scale-105 flex items-center justify-center gap-3"
                            >
                                <SparklesIcon className="w-6 h-6 text-yellow-300" />
                                Escanear Código
                            </button>
                        </div>
                    </div>
                )}

                {/* Estado: Generando Imagen IA (Disfrazado de carga técnica) */}
                {isGeneratingImage && (
                    <div className="py-12 animate-fade-in flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h3 className="text-xl font-bold text-slate-800">Iniciando escáner...</h3>
                        <p className="text-slate-500 mt-2">Calibrando óptica y enfoque...</p>
                    </div>
                )}

                {/* Estado: Escaneando (Cámara Real) */}
                {isScanning && (
                    <div className="animate-fade-in">
                        <p className="mb-4 text-slate-500">Apunta la cámara al código QR.</p>
                        <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden border-4 border-slate-200 shadow-inner">
                             <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                 <div className="w-64 h-64 border-2 border-solid rounded-lg relative" style={{ borderColor: 'rgba(255, 255, 255, 0.7)' }}>
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-brand-secondary -mt-1 -ml-1"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-brand-secondary -mt-1 -mr-1"></div>
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-brand-secondary -mb-1 -ml-1"></div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-brand-secondary -mb-1 -mr-1"></div>
                                 </div>
                             </div>
                        </div>
                        <div className="mt-4">
                            <button onClick={handleStopScanning} className="text-red-600 hover:text-red-700 font-medium text-sm underline">
                                Cancelar cámara
                            </button>
                        </div>
                    </div>
                )}

                {/* Estado: Simulando (Imagen Generada por IA) */}
                {isSimulating && (
                    <div className="animate-fade-in">
                        <p className="mb-4 text-brand-primary font-medium animate-pulse flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Escaneando superficie...
                        </p>
                        <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden border-4 border-brand-primary shadow-xl group">
                             {/* Imagen Generada por IA */}
                             <img 
                                src={simulationImage || "https://images.unsplash.com/photo-1604719312566-b7cb60936928?q=80&w=2070&auto=format&fit=crop"} 
                                alt="Simulación de escaneo" 
                                className="w-full h-full object-cover"
                             />
                             {/* Overlay oscuro para resaltar el láser */}
                             <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                             
                             {/* Linea de escaneo láser animada */}
                             <div className="absolute inset-0 overflow-hidden">
                                <div className="w-full h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] absolute top-0 animate-scan-line"></div>
                             </div>

                             {/* Marco de enfoque técnico */}
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                 <div className="w-64 h-64 border-2 border-white/60 rounded-lg relative">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-400 -mt-1 -ml-1"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-400 -mt-1 -mr-1"></div>
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-400 -mb-1 -ml-1"></div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-400 -mb-1 -mr-1"></div>
                                 </div>
                             </div>
                             
                             {/* Texto técnico en pantalla */}
                             <div className="absolute bottom-4 right-4 text-white text-xs font-mono bg-black/60 px-2 py-1 rounded">
                                 REC ● [LIVE]
                             </div>
                        </div>
                        <div className="mt-4">
                            <button onClick={handleStopScanning} className="text-slate-500 hover:text-slate-700 font-medium text-sm underline">
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Estado: Resultado o Error */}
                {!isScanning && !isSimulating && !isGeneratingImage && (scannedProduct || error) && (
                     <div className="mt-6 animate-fade-in">
                        {scannedProduct ? (
                            <div className="p-6 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-4">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-green-800 mb-2">Producto Identificado</h3>
                                <div className="mt-4 flex flex-col sm:flex-row items-center text-left bg-white p-4 rounded-md border border-green-100">
                                    <div className="w-24 h-24 flex-shrink-0 mb-3 sm:mb-0 sm:mr-4 border rounded-md overflow-hidden relative">
                                        {renderProductImage()}
                                    </div>
                                    <div className="flex-grow w-full text-center sm:text-left">
                                        <p className="font-bold text-lg text-slate-900">{scannedProduct.name}</p>
                                        {scannedProduct.presentation && <p className="text-sm text-slate-500">{scannedProduct.presentation}</p>}
                                        <div className="flex justify-center sm:justify-start space-x-4 mt-1 text-sm text-slate-600">
                                            <span>Código: <span className="font-mono bg-slate-100 px-1 rounded">{scannedProduct.code}</span></span>
                                            <span>Stock: <span className="font-bold text-brand-dark">{scannedProduct.quantity} {scannedProduct.unit || 'unidades'}</span></span>
                                        </div>
                                    </div>
                                </div>
                                 <div className="mt-6 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                                     <button onClick={handleReset} className="px-4 py-2 text-sm font-semibold bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 shadow-sm">Escanear Siguiente</button>
                                     <button onClick={handleRegisterMovement} className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-primary/90 shadow-md">Registrar Movimiento</button>
                                 </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                                <h3 className="text-lg font-bold text-red-800">Lectura Fallida</h3>
                                <p className="mt-2 text-red-700 mb-4">{error}</p>
                                <button onClick={handleReset} className="px-6 py-2 text-sm font-semibold bg-white border border-red-200 text-red-700 rounded-md hover:bg-red-50">Intentar de Nuevo</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
             <style>{` 
                @keyframes fade-in { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } } 
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
                @keyframes scan-line {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan-line {
                    animation: scan-line 2s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default Scanner;
