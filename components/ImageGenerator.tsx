
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { PhotoIcon, SparklesIcon } from './icons';

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const image = await generateImage(prompt, aspectRatio);
            if (image) {
                setGeneratedImage(image);
            } else {
                setError("No se pudo generar la imagen. Intenta con otra descripción.");
            }
        } catch (err) {
            setError("Ocurrió un error inesperado.");
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (generatedImage) {
            const link = document.createElement('a');
            link.href = generatedImage;
            link.download = `inventics-ai-image-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col md:flex-row gap-6">
            {/* Panel de Control */}
            <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-lg h-fit">
                <div className="flex items-center gap-2 mb-6">
                    <div className="bg-brand-primary/10 p-2 rounded-lg">
                        <PhotoIcon className="w-6 h-6 text-brand-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Estudio IA</h2>
                </div>
                
                <form onSubmit={handleGenerate} className="space-y-6">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 mb-2">
                            Descripción de la Imagen
                        </label>
                        <textarea
                            id="prompt"
                            rows={4}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-slate-50 text-slate-900 resize-none"
                            placeholder="Ej: Una estantería moderna llena de productos orgánicos con iluminación suave..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Formato (Relación de Aspecto)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => (
                                <button
                                    key={ratio}
                                    type="button"
                                    onClick={() => setAspectRatio(ratio)}
                                    className={`px-3 py-2 text-sm font-medium rounded-md border ${
                                        aspectRatio === ratio
                                            ? 'bg-brand-primary text-white border-brand-primary'
                                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white py-3 rounded-lg font-bold shadow-md hover:bg-brand-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Generando...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5 text-yellow-300" />
                                Generar Imagen
                            </>
                        )}
                    </button>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                </form>
            </div>

            {/* Panel de Visualización */}
            <div className="w-full md:w-2/3 bg-slate-200 rounded-lg shadow-inner flex flex-col items-center justify-center p-4 min-h-[400px] overflow-hidden relative border border-slate-300">
                {generatedImage ? (
                    <div className="relative group w-full h-full flex items-center justify-center">
                        <img
                            src={generatedImage}
                            alt="Imagen generada por IA"
                            className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
                        />
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={handleDownload}
                                className="bg-white text-slate-800 px-4 py-2 rounded-lg shadow font-semibold hover:bg-slate-100 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Descargar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-400">
                        <div className="mx-auto w-24 h-24 bg-slate-300 rounded-full flex items-center justify-center mb-4">
                            <PhotoIcon className="w-12 h-12 text-slate-500" />
                        </div>
                        <p className="text-lg font-medium">Tu lienzo está vacío</p>
                        <p className="text-sm">Escribe una descripción y presiona "Generar Imagen" para empezar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageGenerator;
