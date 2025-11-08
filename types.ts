export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  supplier: string;
  quantity: number;
  cost: number;
  price: number;
  entryDate: string;
  expiryDate: string;
  imageUrl: string;
}

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: 'entrada' | 'salida';
  quantity: number;
  date: string;
  time: string;
  user: string;
  reason: string;
}

export interface User {
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'operator';
}

export type View = 'dashboard' | 'products' | 'movements' | 'reports' | 'settings';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AnalysisSuggestion {
  productName: string;
  reason: string;
}

export interface AnalysisResult {
  highDemand: AnalysisSuggestion[];
  reorder: AnalysisSuggestion[];
}
