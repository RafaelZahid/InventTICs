import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Product, Movement, AnalysisResult } from '../types';

let chat: Chat | null = null;
let currentProductsJSON: string = '';

const getChatInstance = (products: Product[]): Chat => {
  const newProductsJSON = JSON.stringify(products);
  // Re-create chat instance if products have changed, to provide fresh context.
  if (chat && currentProductsJSON === newProductsJSON) {
    return chat;
  }

  currentProductsJSON = newProductsJSON;

  // FIX: Use named parameter for apiKey as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const inventoryContext = `
    Contexto del inventario actual de InvenTICS:
    ${JSON.stringify(products, null, 2)}
  `;

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

  chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });

  return chat;
};

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

export const getInventoryAnalysis = async (products: Product[], movements: Movement[]): Promise<AnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    
    const contents = `
      Datos de Inventario:
      Productos: ${JSON.stringify(products)}
      Movimientos: ${JSON.stringify(movements)}

      Analiza estos datos y genera las sugerencias.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
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
    console.error("Error getting inventory analysis from Gemini:", error);
    throw new Error("No se pudo obtener el análisis del inventario.");
  }
};
