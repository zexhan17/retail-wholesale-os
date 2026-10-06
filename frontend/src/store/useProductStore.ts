import { create } from 'zustand';
import { Product } from '../types/product';
import { StorageService } from '../services/storage';

interface ProductState {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, deltaQuantity: number, reason: string) => void;
  deductStock: (productId: string, primaryUnitsToDeduct: number) => void;
  restockStock: (productId: string, primaryUnitsToAdd: number) => void;
  getProductById: (id: string) => Product | undefined;
  getProductByBarcode: (barcode: string) => Product | undefined;
  getLowStockCount: () => number;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: StorageService.loadProducts(),

  addProduct: (productData) => {
    const id = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id,
    };
    const updated = [newProduct, ...get().products];
    StorageService.saveProducts(updated);
    set({ products: updated });
    return newProduct;
  },

  updateProduct: (id, updates) => {
    const updated = get().products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    StorageService.saveProducts(updated);
    set({ products: updated });
  },

  deleteProduct: (id) => {
    const updated = get().products.filter((p) => p.id !== id);
    StorageService.saveProducts(updated);
    set({ products: updated });
  },

  adjustStock: (id, deltaQuantity, _reason) => {
    const updated = get().products.map((p) => {
      if (p.id === id) {
        const newStock = Math.max(0, p.stockQuantity + deltaQuantity);
        return { ...p, stockQuantity: newStock };
      }
      return p;
    });
    StorageService.saveProducts(updated);
    set({ products: updated });
  },

  deductStock: (productId, primaryUnitsToDeduct) => {
    const updated = get().products.map((p) => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.stockQuantity - primaryUnitsToDeduct);
        return { ...p, stockQuantity: newStock };
      }
      return p;
    });
    StorageService.saveProducts(updated);
    set({ products: updated });
  },

  restockStock: (productId, primaryUnitsToAdd) => {
    const updated = get().products.map((p) => {
      if (p.id === productId) {
        return { ...p, stockQuantity: p.stockQuantity + primaryUnitsToAdd };
      }
      return p;
    });
    StorageService.saveProducts(updated);
    set({ products: updated });
  },

  getProductById: (id) => get().products.find((p) => p.id === id),

  getProductByBarcode: (code) => {
    const cleanCode = code.trim().toLowerCase();
    return get().products.find(
      (p) =>
        p.barcode.toLowerCase() === cleanCode ||
        p.sku.toLowerCase() === cleanCode ||
        p.id.toLowerCase() === cleanCode
    );
  },

  getLowStockCount: () => {
    return get().products.filter((p) => p.stockQuantity <= p.reorderLevel).length;
  },
}));
