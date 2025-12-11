
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Product, Movement, AnalysisResult } from '../types';

// Variable para almacenar la instancia del chat y evitar reinicializaciones innecesarias.
let chat: Chat | null = null;
// Almacena el estado de los productos con el que se inicializó el chat para detectar cambios.
let currentProductsJSON: string = '';

/**
 * Obtiene o crea una instancia del chat con el modelo de IA.
 * La instancia se reutiliza si los datos de los productos no han cambiado,
 * para mantener el contexto y optimizar el rendimiento.
 * @param {Product[]} products - El estado actual de los productos del inventario.
 * @returns {Chat} La instancia del chat lista para ser usada.
 */
const getChatInstance = (products: Product[]): Chat => {
  const newProductsJSON = JSON.stringify(products);
  // Si el chat ya existe y los productos no han cambiado, reutiliza la instancia existente.
  if (chat && currentProductsJSON === newProductsJSON) {
    return chat;
  }

  currentProductsJSON = newProductsJSON;

  const ai = new GoogleGenAI({ apiKey: import.env.VITE.API_KEY });

  // Proporciona el estado actual del inventario como contexto al modelo.
  const inventoryContext = `
    Contexto del inventario actual de InvenTICS:
    ${JSON.stringify(products, null, 2)}
  `;

  // Define las instrucciones del sistema para guiar el comportamiento del asistente de IA.
  const systemInstruction = `
    Eres un asistente virtual experto para el sistema de inventario "InvenTICS".
    Tu nombre es NutriBot. Eres profesional, claro y empático.
    Tu objetivo es ayudar a los operadores del área de logística y almacén.
    Responde en ESPAÑOL. Usa mensajes cortos y útiles.

    Tus capacidades son:
    1.  Responder preguntas sobre el uso del sistema. Por ejemplo: "¿Cómo registro un producto?".
    2.  Consultar el estado del inventario ACTUAL usando el contexto proporcionado. Por ejemplo: "¿Cuántas unidades quedan de Creatina Monohidratada?".
    3.  Explicar procedimientos internos básicos.

    IMPORTANTE: Para preguntas sobre el estado del inventario, basa TUS RESPUESTAS EXCLUSIVAMENTE en el contexto JSON del inventario que te he proporcionado al inicio de esta conversación. No inventes información de productos. Si te preguntan por un producto que no está en la lista, indica que no se encontró en el inventario actual.

    ${inventoryContext}
  `;

  // Crea una nueva sesión de chat con el modelo y la configuración especificada.
  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });

  return chat;
};

/**
 * Envía un mensaje del usuario al modelo de IA y devuelve la respuesta.
 * @param {string} message - El mensaje del usuario.
 * @param {Product[]} products - El estado actual de los productos para contextualizar la conversación.
 * @returns {Promise<string>} La respuesta de texto del modelo de IA.
 */
export const sendMessageToGemini = async (message: string, products: Product[]): Promise<string> => {
  try {
    const chatInstance = getChatInstance(products);
    const response = await chatInstance.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    return "Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, intenta de nuevo más tarde.";
  }
};

/**
 * Solicita un análisis del inventario al modelo de IA.
 * El modelo analiza los productos y movimientos para generar sugerencias
 * sobre alta demanda y necesidad de reorden.
 * @param {Product[]} products - La lista actual de productos.
 * @param {Movement[]} movements - El historial reciente de movimientos.
 * @returns {Promise<AnalysisResult>} Un objeto con las listas de sugerencias.
 */
export const getInventoryAnalysis = async (products: Product[], movements: Movement[]): Promise<AnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Instrucción detallada para el modelo sobre cómo realizar el análisis y en qué formato responder.
    const systemInstruction = `
      Eres un analista de inventarios experto para el sistema 'InvenTICS'. Tu tarea es analizar los datos de productos y movimientos para identificar tendencias clave y ofrecer sugerencias accionables.

      Contexto:
      - Productos: Un array de objetos JSON con los detalles de cada producto en stock.
      - Movimientos: Un array de objetos JSON con el historial de entradas y salidas. Una 'salida' representa una venta o uso del producto.

      Tu Tarea Específica:
      1.  **Identifica Productos de Alta Demanda:** Analiza los movimientos de 'salida' recientes. Los productos con un alto volumen o frecuencia de salidas son candidatos. Identifica 2 o 3 productos.
      2.  **Identifica Productos para Reordenar:** Busca productos que combinen un bajo nivel de 'quantity' actual con una actividad de 'salida' constante o reciente. Estos son prioritarios para reordenar y evitar quiebres de stock. Identifica 2 o 3 productos.

      Formato de Salida:
      Debes devolver un objeto JSON que se ajuste estrictamente al esquema proporcionado. Para cada sugerencia, proporciona el nombre exacto del producto y una razón CONCISA (máximo 15 palabras) que justifique tu elección, basada en los datos.
    `;
    
    // Contenido que se envía al modelo, incluyendo los datos a analizar.
    const contents = `
      Datos de Inventario:
      Productos: ${JSON.stringify(products)}
      Movimientos: ${JSON.stringify(movements)}

      Analiza estos datos y genera las sugerencias.
    `;

    // Llamada a la API de Gemini para generar el contenido.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json", // Se espera una respuesta en formato JSON.
        responseSchema: { // Define la estructura JSON esperada.
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
  } catch (error)
  {
    console.error("Error getting inventory analysis from Gemini:", error);
    // Lanza un error para ser manejado por el componente que llama.
    throw new Error("No se pudo obtener el análisis del inventario.");
  }
};

/**
 * Genera una imagen simulada de un escaneo de producto específico.
 * @param {string} productName - El nombre del producto que se simulará escanear.
 * @returns {Promise<string | null>} La URL de la imagen en base64 o null si falla.
 */
export const generateSimulatedScanImage = async (productName: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `A realistic first-person point-of-view (POV) photo of a hand holding a package of "${productName}" in a supermarket aisle. The camera is closely focused on a QR code label printed on the packaging. The background shows blurred supermarket shelves. High quality, photorealistic, commercial style.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Usamos el modelo Flash Image
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates![0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating simulated image:", error);
    return null;
  }
};

/**
 * Genera una imagen de producto específica basada en su nombre para la ficha de resultado.
 * @param {string} productName - El nombre del producto.
 * @returns {Promise<string | null>} La URL de la imagen en base64.
 */
export const generateProductImageByName = async (productName: string): Promise<string | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Una fotografía profesional de producto de ${productName}, aislada sobre fondo blanco de estudio, alta resolución, iluminación cinematográfica publicitaria, realista, estilo comercial.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                },
            },
        });

        for (const part of response.candidates![0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating product image:", error);
        return null;
    }
};

/**
 * Genera una imagen personalizada basada en un prompt y configuración.
 * @param {string} prompt - La descripción de la imagen.
 * @param {string} aspectRatio - La relación de aspecto ("1:1", "16:9", etc).
 * @returns {Promise<string | null>} La imagen en base64.
 */
export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio as any, 
                },
            },
        });

        for (const part of response.candidates![0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating custom image:", error);
        return null;
    }
};
