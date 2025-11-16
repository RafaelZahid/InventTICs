import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '../types';

interface ScannerProps {
    products: Product[];
    onOpenMovementModal: (productId: string) => void;
}

const Scanner: React.FC<ScannerProps> = ({ products, onOpenMovementModal }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(true);

    const handleScan = useCallback((data: string) => {
        if (data) {
            setIsScanning(false);
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
                     setError('Ocurrió un error durante el escaneo.');
                     console.error(e);
                     setIsScanning(false);
                     return;
                }
            }
            animationFrameId = requestAnimationFrame(scan);
        };

        const startCamera = async () => {
            if (!barcodeDetector) {
                setError('Este navegador no soporta la detección de códigos QR.');
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
                    message = 'Permiso para acceder a la cámara denegado. Habilítalo en la configuración de tu navegador.'
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


    const handleReset = () => {
        setScannedProduct(null);
        setError(null);
        setIsScanning(true);
    };

    const handleRegisterMovement = () => {
        if (scannedProduct) {
            onOpenMovementModal(scannedProduct.id);
        }
    };
    
    return (
        <div className="p-6 bg-slate-50 min-h-full flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl text-center">
                <h2 className="text-2xl font-bold text-slate-800">Escanear Código QR de Producto</h2>
                
                {isScanning && (
                    <>
                        <p className="mt-2 text-slate-500">Apunta la cámara al código QR de un producto para identificarlo.</p>
                        <div className="mt-6 relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden border-4 border-slate-200">
                             <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                 <div className="w-64 h-64 border-2 border-solid rounded-lg" style={{ borderColor: '#1e3a8a' }}></div>
                             </div>
                        </div>
                        {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
                    </>
                )}
                
                {!isScanning && (scannedProduct || error) && (
                     <div className="mt-6 animate-fade-in">
                        {scannedProduct ? (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h3 className="text-lg font-bold text-green-800">Producto Encontrado</h3>
                                <div className="mt-4 flex items-center text-left space-x-4">
                                    <img src={scannedProduct.imageUrl || `https://placehold.co/400x400/eeeeee/cccccc?text=${scannedProduct.name.charAt(0)}`} alt={scannedProduct.name} className="w-24 h-24 rounded-md object-cover flex-shrink-0" />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-slate-900">{scannedProduct.name}</p>
                                        {scannedProduct.presentation && <p className="text-sm text-slate-500">{scannedProduct.presentation}</p>}
                                        <p className="text-sm text-slate-600">Código: {scannedProduct.code}</p>
                                        <p className="text-sm text-slate-600">Stock actual: <span className="font-bold">{scannedProduct.quantity} {scannedProduct.unit || 'unidades'}</span></p>
                                    </div>
                                </div>
                                 <div className="mt-6 flex justify-center space-x-4">
                                     <button onClick={handleReset} className="px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Escanear Otro</button>
                                     <button onClick={handleRegisterMovement} className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-primary/90">Registrar Movimiento</button>
                                 </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <h3 className="text-lg font-bold text-red-800">Error al Escanear</h3>
                                <p className="mt-2 text-red-700">{error}</p>
                                <button onClick={handleReset} className="mt-4 px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Intentar de Nuevo</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
             <style>{` @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } } .animate-fade-in { animation: fade-in 0.3s ease-out; }`}</style>
        </div>
    );
};

export default Scanner;