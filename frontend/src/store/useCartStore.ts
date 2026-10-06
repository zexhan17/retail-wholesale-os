import { create } from 'zustand';
import { Product } from '../types/product';
import { InvoiceItem, PaymentMethod } from '../types/invoice';
import { Customer } from '../types/customer';
import { calculateItemPrice } from '../services/pricingEngine';

export interface HeldCart {
  id: string;
  timestamp: string;
  customer: Customer | null;
  items: InvoiceItem[];
  note: string;
}

interface CartState {
  customer: Customer | null;
  items: InvoiceItem[];
  overallDiscountPercentage: number;
  heldCarts: HeldCart[];
  setCustomer: (customer: Customer | null) => void;
  addItem: (product: Product, quantity?: number, unitType?: 'primary' | 'packaging') => void;
  updateItemQuantity: (itemId: string, newQuantity: number) => void;
  updateItemUnitType: (itemId: string, newUnitType: 'primary' | 'packaging', product: Product) => void;
  updateItemDiscount: (itemId: string, discount: number, product: Product) => void;
  removeItem: (itemId: string) => void;
  setOverallDiscount: (discount: number) => void;
  clearCart: () => void;
  holdCurrentCart: (note?: string) => void;
  recallHeldCart: (heldId: string) => void;
  discardHeldCart: (heldId: string) => void;
  getTotals: () => {
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    itemCount: number;
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  customer: null,
  items: [],
  overallDiscountPercentage: 0,
  heldCarts: [],

  setCustomer: (customer) => set({ customer }),

  addItem: (product, quantity = 1, unitType = 'primary') => {
    const existingIndex = get().items.findIndex(
      (item) => item.productId === product.id && item.unitType === unitType
    );

    if (existingIndex > -1) {
      const existing = get().items[existingIndex];
      const newQty = existing.quantity + quantity;
      get().updateItemQuantity(existing.id, newQty);
      return;
    }

    const calc = calculateItemPrice(product, quantity, unitType, 'retail', 0);
    const unitName =
      unitType === 'packaging'
        ? `${product.packagingUnit} (${product.packagingMultiplier} ${product.primaryUnit}s)`
        : product.primaryUnit;

    const newItem: InvoiceItem = {
      id: `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unitType,
      unitName,
      packagingMultiplier: product.packagingMultiplier,
      quantity,
      totalPrimaryUnits: calc.totalPrimaryUnits,
      unitPrice: calc.unitPrice,
      costPrice: product.costPrice * (unitType === 'packaging' ? product.packagingMultiplier : 1),
      discountPercentage: 0,
      taxRate: product.taxRate,
      taxAmount: calc.taxAmount,
      subtotal: calc.subtotal,
      total: calc.total,
    };

    set((state) => ({ items: [...state.items, newItem] }));
  },

  updateItemQuantity: (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      get().removeItem(itemId);
      return;
    }

    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id === itemId) {
          const calc = calculateItemPrice(
            {
              retailPrice: item.unitPrice / (item.unitType === 'packaging' ? item.packagingMultiplier : 1),
              wholesaleTiers: [],
              packagingMultiplier: item.packagingMultiplier,
              taxRate: item.taxRate,
            } as any,
            newQuantity,
            item.unitType,
            'retail',
            item.discountPercentage
          );

          return {
            ...item,
            quantity: newQuantity,
            totalPrimaryUnits: newQuantity * (item.unitType === 'packaging' ? item.packagingMultiplier : 1),
            subtotal: calc.subtotal,
            taxAmount: calc.taxAmount,
            total: calc.total,
          };
        }
        return item;
      });
      return { items: updated };
    });
  },

  updateItemUnitType: (itemId, newUnitType, product) => {
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id === itemId) {
          const calc = calculateItemPrice(product, item.quantity, newUnitType, 'retail', item.discountPercentage);
          const unitName =
            newUnitType === 'packaging'
              ? `${product.packagingUnit} (${product.packagingMultiplier} ${product.primaryUnit}s)`
              : product.primaryUnit;

          return {
            ...item,
            unitType: newUnitType,
            unitName,
            packagingMultiplier: product.packagingMultiplier,
            unitPrice: calc.unitPrice,
            totalPrimaryUnits: calc.totalPrimaryUnits,
            subtotal: calc.subtotal,
            taxAmount: calc.taxAmount,
            total: calc.total,
          };
        }
        return item;
      });
      return { items: updated };
    });
  },

  updateItemDiscount: (itemId, discount, product) => {
    set((state) => {
      const updated = state.items.map((item) => {
        if (item.id === itemId) {
          const calc = calculateItemPrice(product, item.quantity, item.unitType, 'retail', discount);
          return {
            ...item,
            discountPercentage: discount,
            taxAmount: calc.taxAmount,
            subtotal: calc.subtotal,
            total: calc.total,
          };
        }
        return item;
      });
      return { items: updated };
    });
  },

  removeItem: (itemId) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== itemId) }));
  },

  setOverallDiscount: (discount) => set({ overallDiscountPercentage: discount }),

  clearCart: () => set({ items: [], overallDiscountPercentage: 0, customer: null }),

  holdCurrentCart: (note) => {
    const { items, customer, heldCarts } = get();
    if (items.length === 0) return;

    const newHeld: HeldCart = {
      id: `hold-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customer,
      items: [...items],
      note: note || `Cart with ${items.length} item(s)`,
    };

    set({
      heldCarts: [...heldCarts, newHeld],
      items: [],
      customer: null,
      overallDiscountPercentage: 0,
    });
  },

  recallHeldCart: (heldId) => {
    const held = get().heldCarts.find((h) => h.id === heldId);
    if (!held) return;

    set((state) => ({
      items: held.items,
      customer: held.customer,
      heldCarts: state.heldCarts.filter((h) => h.id !== heldId),
    }));
  },

  discardHeldCart: (heldId) => {
    set((state) => ({
      heldCarts: state.heldCarts.filter((h) => h.id !== heldId),
    }));
  },

  getTotals: () => {
    const { items, overallDiscountPercentage } = get();
    const rawSubtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const itemDiscount = items.reduce(
      (sum, i) => sum + (i.subtotal * (i.discountPercentage || 0)) / 100,
      0
    );
    const billDiscount = ((rawSubtotal - itemDiscount) * overallDiscountPercentage) / 100;
    const discountTotal = Number((itemDiscount + billDiscount).toFixed(2));
    const taxTotal = Number(items.reduce((sum, i) => sum + i.taxAmount, 0).toFixed(2));
    const grandTotal = Number((rawSubtotal - discountTotal + taxTotal).toFixed(2));
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    return {
      subtotal: Number(rawSubtotal.toFixed(2)),
      discountTotal,
      taxTotal,
      grandTotal,
      itemCount,
    };
  },
}));
