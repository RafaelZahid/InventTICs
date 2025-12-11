
/**
 * Representa un producto único en el inventario.
 */
export interface Product {
  id?: string; // Identificador único del producto (generado por Firestore)
  name: string; // Nombre comercial del producto
  code: string; // Código de referencia único (SKU)
  category: string; // Categoría a la que pertenece el producto
  supplier: string; // Proveedor del producto
  quantity: number; // Cantidad actual en stock
  unit: 'unidades' | 'kg' | 'g' | 'L' | 'mL' | 'oz'; // Unidad de medida
  presentation?: string; // Descripción del empaque o tamaño, ej: "Bolsa de 1kg", "Botella de 750mL"
  cost: number; // Costo de adquisición por unidad
  price: number; // Precio de venta por unidad
  entryDate: string; // Fecha de ingreso del lote actual (formato YYYY-MM-DD)
  expiryDate: string; // Fecha de caducidad del lote (formato YYYY-MM-DD)
  imageUrl: string; // URL de una imagen representativa del producto
}

/**
 * Representa un movimiento de inventario, ya sea una entrada o una salida.
 */
export interface Movement {
  id?: string; // Identificador único del movimiento (generado por Firestore)
  productId: string; // ID del producto asociado al movimiento
  productName: string; // Nombre del producto para fácil referencia
  type: 'entrada' | 'salida'; // Tipo de movimiento
  quantity: number; // Cantidad de unidades movidas
  date: string; // Fecha del movimiento (formato YYYY-MM-DD)
  time: string; // Hora del movimiento (formato HH:MM:SS)
  user: string; // Usuario que registró el movimiento
  reason: string; // Motivo o descripción del movimiento
}

/**
 * Representa un usuario del sistema, alineado con Firebase.
 */
export interface User {
  uid: string; // Identificador único de Firebase Authentication
  name: string; // Nombre completo del usuario
  username: string; // Correo electrónico usado para el login
  role: 'admin' | 'operator'; // Rol del usuario, determina sus permisos
  password?: string; // Solo se usa durante el registro, no se almacena
}

/**
 * Define las vistas o pantallas principales de la aplicación.
 */
export type View = 'dashboard' | 'products' | 'movements' | 'reports' | 'settings' | 'scanner' | 'image-generator';

/**
 * Representa un mensaje dentro de la conversación del chatbot.
 */
export interface ChatMessage {
  role: 'user' | 'model'; // Quién envió el mensaje: el usuario o el asistente (modelo IA)
  text: string; // Contenido del mensaje
}

/**
 * Representa una sugerencia individual generada por el análisis de IA.
 */
export interface AnalysisSuggestion {
  productName: string; // Nombre del producto sugerido
  reason: string; // Justificación de la sugerencia
}

/**
 * Estructura del resultado completo del análisis de inventario por IA.
 */
export interface AnalysisResult {
  highDemand: AnalysisSuggestion[]; // Lista de productos con potencial alta demanda
  reorder: AnalysisSuggestion[]; // Lista de productos que se sugiere reordenar
}
