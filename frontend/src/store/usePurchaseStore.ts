import { create } from 'zustand';
import { Supplier, PurchaseOrder } from '../types/purchase';
import { StorageService } from '../services/storage';
import { useProductStore } from './useProductStore';

interface PurchaseState {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalPurchased' | 'outstandingBalance'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  createPurchaseOrder: (poData: Omit<PurchaseOrder, 'id'>) => PurchaseOrder;
  receivePurchaseOrder: (poId: string) => void;
  getSupplierById: (id: string) => Supplier | undefined;
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  suppliers: StorageService.loadSuppliers(),
  purchaseOrders: StorageService.loadPurchaseOrders(),

  addSupplier: (data) => {
    const id = `sup-${Date.now()}`;
    const newSupplier: Supplier = {
      ...data,
      id,
      totalPurchased: 0,
      outstandingBalance: 0,
    };
    const updated = [newSupplier, ...get().suppliers];
    StorageService.saveSuppliers(updated);
    set({ suppliers: updated });
    return newSupplier;
  },

  updateSupplier: (id, updates) => {
    const updated = get().suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s));
    StorageService.saveSuppliers(updated);
    set({ suppliers: updated });
  },

  createPurchaseOrder: (poData) => {
    const id = `po-${Date.now()}`;
    const newPO: PurchaseOrder = {
      ...poData,
      id,
    };
    const updated = [newPO, ...get().purchaseOrders];
    StorageService.savePurchaseOrders(updated);
    set({ purchaseOrders: updated });
    return newPO;
  },

  receivePurchaseOrder: (poId) => {
    const po = get().purchaseOrders.find((p) => p.id === poId);
    if (!po || po.status === 'received') return;

    // 1. Inward stock to products
    po.items.forEach((item) => {
      useProductStore.getState().restockStock(item.productId, item.quantity);
    });

    // 2. Update PO status
    const updatedPOs = get().purchaseOrders.map((p) =>
      p.id === poId ? { ...p, status: 'received' as const } : p
    );
    StorageService.savePurchaseOrders(updatedPOs);
    set({ purchaseOrders: updatedPOs });

    // 3. Update supplier statistics
    const updatedSuppliers = get().suppliers.map((s) => {
      if (s.id === po.supplierId) {
        return {
          ...s,
          totalPurchased: Number((s.totalPurchased + po.grandTotal).toFixed(2)),
          outstandingBalance: Number(
            (s.outstandingBalance + (po.grandTotal - po.paidAmount)).toFixed(2)
          ),
        };
      }
      return s;
    });
    StorageService.saveSuppliers(updatedSuppliers);
    set({ suppliers: updatedSuppliers });
  },

  getSupplierById: (id) => get().suppliers.find((s) => s.id === id),
}));
