
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Product, Movement, AnalysisResult } from '../types';

// Lista de modelos disponibles para rotación en caso de saturación (Fallback Strategy)
const AVAILABLE_MODELS = [
    'gemini-flash-lite-latest', // Opción 1: Más rápido y ligero
    'gemini-2.5-flash',         // Opción 2: Estándar balanceado
    'gemini-2.0-flash-exp'      // Opción 3: Experimental (Respaldo)
];

// Variable para almacenar la instancia del chat actual
let chat: Chat | null = null;
// Almacena el modelo actual en uso
let currentModelIndex = 0;
// Almacena el estado de los productos con el que se inicializó el chat
let currentProductsJSON: string = '';

// Helper para obtener la API Key con múltiples fallbacks
const getApiKey = (): string => {
  let key = '';

  // 1. Entorno Node/Server
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    key = process.env.API_KEY;
  }

  // 2. Entorno Vite Client-side
  if (!key) {
    try {
      // @ts-ignore
      if (import.meta && import.meta.env) {
          // @ts-ignore
          if (import.meta.env.VITE_API_KEY) key = import.meta.env.VITE_API_KEY;
          // @ts-ignore
          else if (import.meta.env.API_KEY) key = import.meta.env.API_KEY;
          // @ts-ignore
          else if (import.meta.env.VITE_APY_KEY) key = import.meta.env.VITE_APY_KEY;
      }
    } catch (e) {
      console.warn("Error accediendo a import.meta.env", e);
    }
  }
  return key;
};

/**
 * Inicializa el chat con un modelo específico.
 */
const initializeChat = (apiKey: string, products: Product[], modelName: string): Chat => {
  const ai = new GoogleGenAI({ apiKey });
  
  const inventoryContext = `
    Contexto del inventario actual de InvenTICS:
    ${JSON.stringify(products.map(p => ({
        name: p.name,
        qty: p.quantity,
        price: p.price,
        unit: p.unit
    })), null, 2)}
  `;

  const systemInstruction = `
    Eres NutriBot, el asistente de InvenTICS.
    Tu objetivo: Ayudar con consultas sobre el inventario.
    
    Reglas:
    1. Responde preguntas sobre cantidades, precios y productos basándote SOLO en el contexto JSON provisto.
    2. Si un producto no está en la lista, di que no existe en el inventario.
    3. Sé breve y directo.
    
    ${inventoryContext}
  `;

  return ai.chats.create({
    model: modelName,
    config: {
      systemInstruction: systemInstruction,
    },
  });
};

/**
 * Envía un mensaje intentando rotar modelos si ocurre un error 429.
 */
export const sendMessageToGemini = async (message: string, products: Product[]): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "Error: Falta API Key.";

    const newProductsJSON = JSON.stringify(products);
    
    // Intentamos recorrer los modelos disponibles si fallan
    for (let i = 0; i < AVAILABLE_MODELS.length; i++) {
        // Calculamos el índice del modelo a probar (empezando por el actual o rotando)
        const modelIndex = (currentModelIndex + i) % AVAILABLE_MODELS.length;
        const modelToUse = AVAILABLE_MODELS[modelIndex];

        try {
            // Si el chat no existe, o los productos cambiaron, o estamos reintentando con otro modelo:
            if (!chat || currentProductsJSON !== newProductsJSON || i > 0) {
                console.log(`🔄 Iniciando chat con modelo: ${modelToUse}`);
                chat = initializeChat(apiKey, products, modelToUse);
                currentProductsJSON = newProductsJSON;
                currentModelIndex = modelIndex; // Actualizamos el modelo preferido si este funciona
            }

            const response = await chat!.sendMessage({ message });
            return response.text;

        } catch (error: any) {
            console.warn(`⚠️ Fallo con modelo ${modelToUse}:`, error.message);

            // Si es un error de cuota (429) o sobrecarga (503), intentamos el siguiente modelo
            if (error.status === 429 || error.status === 503 || error.message?.includes('429') || error.message?.includes('quota')) {
                // Continuar al siguiente modelo en el bucle
                chat = null; // Forzar reinicialización en la siguiente vuelta
                continue;
            }

            // Si es otro tipo de error, nos rendimos
            return "Tuve un problema técnico no relacionado con la capacidad. Intenta reformular.";
        }
    }

    return "😓 Mis servidores están muy ocupados en todos los canales gratuitos. Por favor, espera 1 minuto.";
};

/**
 * Solicita análisis con rotación de modelos.
 */
export const getInventoryAnalysis = async (products: Product[], movements: Movement[]): Promise<AnalysisResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing");
  
  const ai = new GoogleGenAI({ apiKey });
  const simpleProducts = products.map(p => ({ n: p.name, q: p.quantity }));
  const simpleMovements = movements.slice(0, 50).map(m => ({ n: m.productName, t: m.type, q: m.quantity }));

  // Intentar con cada modelo hasta que uno funcione
  for (const modelName of AVAILABLE_MODELS) {
      try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Analiza: Prod: ${JSON.stringify(simpleProducts)}, Movs: ${JSON.stringify(simpleMovements)}. Devuelve JSON con highDemand y reorder (productName, reason max 10 words).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                type: Type.OBJECT,
                properties: {
                    highDemand: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                        productName: { type: Type.STRING },
                        reason: { type: Type.STRING },
                        },
                    },
                    },
                    reorder: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                        productName: { type: Type.STRING },
                        reason: { type: Type.STRING },
                        },
                    },
                    },
                },
                },
            },
        });
        
        return JSON.parse(response.text.trim());

      } catch (error: any) {
          console.warn(`Análisis falló con ${modelName}, intentando siguiente...`);
          if (error.status === 429 || error.toString().includes('429')) {
              continue;
          }
          // Si no es error de cuota, probablemente es error de parseo o datos, salimos
          break;
      }
  }

  throw new Error("Sistema saturado temporalmente.");
};

/**
 * Genera una imagen simulada (Las imágenes usan modelos específicos, sin fallback simple).
 */
export const generateSimulatedScanImage = async (productName: string): Promise<string | null> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `POV holding "${productName}" package in supermarket. Focus on QR code. Photorealistic.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Modelo optimizado para imágenes
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } },
    });

    for (const part of response.candidates![0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.warn("Simulated image generation failed:", error);
    return null;
  }
};

export const generateProductImageByName = async (productName: string): Promise<string | null> => {
    try {
        const apiKey = getApiKey();
        if (!apiKey) return null;
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Professional product photo of ${productName}, white background, studio light.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } },
        });

        for (const part of response.candidates![0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        return null;
    }
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string | null> => {
    try {
        const apiKey = getApiKey();
        if (!apiKey) return null;
        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: aspectRatio as any } },
        });

        for (const part of response.candidates![0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        return null;
    }
};
