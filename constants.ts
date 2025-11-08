import { Product, Movement } from './types';

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Queso Oaxaca', code: 'LDS-QO-001', category: 'Quesos', supplier: 'Lácteos de Chiapas', quantity: 120, cost: 85.50, price: 159.99, entryDate: '2023-10-15', expiryDate: '2024-01-15', imageUrl: 'https://placehold.co/400x400/10b981/white?text=Queso' },
  { id: 'p2', name: 'Yogurt Griego Natural', code: 'LDS-YG-002', category: 'Yogures', supplier: 'Probióticos del Norte', quantity: 250, cost: 12.00, price: 24.99, entryDate: '2023-10-20', expiryDate: '2023-11-30', imageUrl: 'https://placehold.co/400x400/0ea5e9/white?text=Yogurt' },
  { id: 'p3', name: 'Leche Entera 1L', code: 'LDS-LE-003', category: 'Leches', supplier: 'Establo San Juan', quantity: 40, cost: 18.50, price: 28.00, entryDate: '2023-10-25', expiryDate: '2023-11-10', imageUrl: 'https://placehold.co/400x400/f59e0b/white?text=Leche' },
  { id: 'p4', name: 'Queso Manchego', code: 'LDS-QM-004', category: 'Quesos', supplier: 'Lácteos de Chiapas', quantity: 0, cost: 95.00, price: 189.50, entryDate: '2023-10-15', expiryDate: '2024-02-20', imageUrl: 'https://placehold.co/400x400/10b981/white?text=Queso' },
  { id: 'p5', name: 'Crema Ácida 200ml', code: 'LDS-CA-005', category: 'Cremas', supplier: 'Establo San Juan', quantity: 150, cost: 9.00, price: 16.50, entryDate: '2023-10-22', expiryDate: '2023-11-25', imageUrl: 'https://placehold.co/400x400/6366f1/white?text=Crema' },
  { id: 'p6', name: 'Yogurt de Fresa Bebible', code: 'LDS-YF-006', category: 'Yogures', supplier: 'Probióticos del Norte', quantity: 30, cost: 8.50, price: 15.00, entryDate: '2023-10-18', expiryDate: '2023-11-15', imageUrl: 'https://placehold.co/400x400/ec4899/white?text=Yogurt' },
];

export const MOCK_MOVEMENTS: Movement[] = [
  { id: 'm1', productId: 'p1', productName: 'Queso Oaxaca', type: 'entrada', quantity: 80, date: '2023-10-15', time: '09:30:15', user: 'admin', reason: 'Pedido a Lácteos de Chiapas' },
  { id: 'm2', productId: 'p3', productName: 'Leche Entera 1L', type: 'salida', quantity: 200, date: '2023-10-26', time: '14:05:40', user: 'operador1', reason: 'Venta a Supermercado La Principal' },
  { id: 'm3', productId: 'p2', productName: 'Yogurt Griego Natural', type: 'salida', quantity: 50, date: '2023-10-27', time: '11:20:00', user: 'operador2', reason: 'Venta a Tienda Delis' },
  { id: 'm4', productId: 'p3', productName: 'Leche Entera 1L', type: 'entrada', quantity: 400, date: '2023-10-25', time: '10:00:00', user: 'admin', reason: 'Pedido a Establo San Juan' },
  { id: 'm5', productId: 'p5', productName: 'Crema Ácida 200ml', type: 'salida', quantity: 30, date: '2023-10-28', time: '16:45:12', user: 'operador1', reason: 'Venta a cliente' },
];