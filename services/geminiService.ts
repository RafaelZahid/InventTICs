
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Product, Movement, AnalysisResult } from '../types';

// Variable para almacenar la instancia del chat y evitar reinicializaciones innecesarias.
let chat: Chat | null = null;
// Almacena el estado de los productos con el que se inicializó el chat para detectar cambios.
let currentProductsJSON: string = '';

// Helper para obtener la API Key.
// Prioriza process.env.API_KEY según las reglas, pero mantiene compatibilidad con Vite client-side.
const getApiKey = (): string => {
  // 1. Prioridad: Entorno estándar (Node/Server o DefinePlugin)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }

  // 2. Fallback: Vite (Client-side)
  try {
    // @ts-ignore
    if (import.meta && import.meta.env) {
        // @ts-ignore
        if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
        // @ts-ignore
        if (import.meta.env.API_KEY) return import.meta.env.API_KEY;
    }
  } catch (e) {
    console.warn("No se pudo acceder a import.meta.env");
  }

  return '';
};

/**
 * Obtiene o crea una instancia del chat con el modelo de IA.
 */
const getChatInstance = (products: Product[]): Chat => {
  const newProductsJSON = JSON.stringify(products);
  
  // Si el chat ya existe y los productos no han cambiado, reutiliza la instancia.
  if (chat && currentProductsJSON === newProductsJSON) {
    return chat;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
      throw new Error("API Key no encontrada. Configura VITE_API_KEY en tu archivo .env");
  }

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

  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });

  currentProductsJSON = newProductsJSON;
  return chat;
};

/**
 * Envía un mensaje del usuario al modelo de IA y devuelve la respuesta.
 */
export const sendMessageToGemini = async (message: string, products: Product[]): Promise<string> => {
  try {
    const chatInstance = getChatInstance(products);
    const response = await chatInstance.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    
    // CRÍTICO: Si hay un error, reseteamos el chat para forzar una nueva conexión la próxima vez.
    chat = null; 
    currentProductsJSON = '';

    return "Lo siento, tuve un problema de conexión. Por favor, intenta preguntarme de nuevo.";
  }
};

/**
 * Solicita un análisis del inventario al modelo de IA.
 */
export const getInventoryAnalysis = async (products: Product[], movements: Movement[]): Promise<AnalysisResult> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");
    
    const ai = new GoogleGenAI({ apiKey });

    // Simplificamos los datos enviados para evitar exceder límites de tokens en inventarios grandes
    const simpleProducts = products.map(p => ({ n: p.name, q: p.quantity }));
    const simpleMovements = movements.slice(0, 50).map(m => ({ n: m.productName, t: m.type, q: m.quantity }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error getting inventory analysis:", error);
    throw new Error("Análisis no disponible.");
  }
};

/**
 * Genera una imagen simulada de un escaneo de producto específico.
 */
export const generateSimulatedScanImage = async (productName: string): Promise<string | null> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    
    // Prompt optimizado para velocidad y consistencia
    const prompt = `POV holding "${productName}" package in supermarket. Focus on QR code. Photorealistic.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "16:9" },
      },
    });

    for (const part of response.candidates![0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating simulated image:", error);
    return null;
  }
};

/**
 * Genera una imagen de producto específica basada en su nombre.
 */
export const generateProductImageByName = async (productName: string): Promise<string | null> => {
    try {
        const apiKey = getApiKey();
        if (!apiKey) return null;

        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Professional product photo of ${productName}, white background, studio light.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio: "1:1" },
            },
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

/**
 * Genera una imagen personalizada.
 */
export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string | null> => {
    try {
        const apiKey = getApiKey();
        if (!apiKey) return null;

        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio: aspectRatio as any },
            },
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
