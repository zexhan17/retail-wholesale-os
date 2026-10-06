export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms: string;
  totalPurchased: number;
  outstandingBalance: number;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitCost: number;
  taxRate: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  status: 'ordered' | 'received' | 'partial' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  paidAmount: number;
  notes?: string;
}
