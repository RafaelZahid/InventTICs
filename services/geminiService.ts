
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Product, Movement, AnalysisResult } from '../types';

// Variable para almacenar la instancia del chat y evitar reinicializaciones innecesarias.
let chat: Chat | null = null;
// Almacena el estado de los productos con el que se inicializó el chat para detectar cambios.
let currentProductsJSON: string = '';

// Helper para obtener la API Key con múltiples fallbacks
const getApiKey = (): string => {
  let key = '';

  // 1. Entorno Node/Server (Prioridad estándar)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    key = process.env.API_KEY;
  }

  // 2. Entorno Vite Client-side (Vercel)
  if (!key) {
    try {
      // @ts-ignore
      if (import.meta && import.meta.env) {
          // @ts-ignore
          if (import.meta.env.VITE_API_KEY) key = import.meta.env.VITE_API_KEY;
          // @ts-ignore
          else if (import.meta.env.API_KEY) key = import.meta.env.API_KEY;
          // @ts-ignore - Fallback para posible error de dedo mencionado (APY)
          else if (import.meta.env.VITE_APY_KEY) key = import.meta.env.VITE_APY_KEY;
      }
    } catch (e) {
      console.warn("Error accediendo a import.meta.env", e);
    }
  }

  // Debugging para Vercel (Solo visible en consola F12)
  if (!key) {
    console.error("CRÍTICO: No se encontró ninguna API Key. Verifica VITE_API_KEY en Vercel y haz REDEPLOY.");
  } else {
    // Log seguro para verificar que cargó (muestra solo los últimos 4 caracteres)
    console.log(`API Key cargada correctamente: ...${key.slice(-4)}`);
  }

  return key;
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
      throw new Error("Falta la API Key. Configura VITE_API_KEY en las variables de entorno.");
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

  // CAMBIO: Usamos 'gemini-flash-lite-latest' para evitar saturar la cuota del modelo estándar
  // y obtener respuestas más rápidas.
  chat = ai.chats.create({
    model: 'gemini-flash-lite-latest',
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
  } catch (error: any) {
    console.error("Error detallado Gemini:", error);
    
    // Resetear chat por si la sesión expiró o falló
    chat = null; 
    currentProductsJSON = '';

    const errorStr = error.toString().toLowerCase();
    const errorMsg = error.message ? error.message.toLowerCase() : "";

    // Manejo específico del error 429 (Quota Exceeded)
    if (error.status === 429 || errorStr.includes("429") || errorMsg.includes("quota") || errorMsg.includes("too many requests")) {
        return "⏳ Límite de velocidad alcanzado. Espera unos segundos...";
    }

    // Mensajes de error amigables según el tipo de fallo
    if (errorMsg.includes("api key")) {
        return "Error de configuración: No detecto la API Key (VITE_API_KEY).";
    }
    if (error.status === 400 || errorStr.includes("400")) {
        return "No pude entender esa solicitud. Intenta reformular la pregunta.";
    }
    
    return "Tuve un problema de conexión con el servidor de IA. Intenta de nuevo en unos segundos.";
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

    // CAMBIO: Usamos 'gemini-flash-lite-latest' para el análisis también.
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
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
  } catch (error: any) {
    console.error("Error getting inventory analysis:", error);
    // Si es error de cuota, lanzamos un mensaje específico que el componente pueda ignorar o mostrar suavemente
    if (error.status === 429 || error.toString().includes('429')) {
        throw new Error("Sistema saturado temporalmente.");
    }
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
    
    const prompt = `POV holding "${productName}" package in supermarket. Focus on QR code. Photorealistic.`;

    // Las imágenes deben seguir usando un modelo de imagen específico.
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
    // Fail silently on image generation errors (quota, etc) to fallback to static images
    console.warn("Simulated image generation failed (likely quota):", error);
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
        console.warn("Product image generation failed (likely quota):", error);
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
        console.error("Custom image generation failed:", error);
        return null;
    }
};
