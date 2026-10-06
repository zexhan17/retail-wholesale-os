export type InvoiceType = 'retail' | 'wholesale';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';
export type InvoiceStatus = 'draft' | 'completed' | 'cancelled' | 'returned';

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'credit_ledger';

export interface PaymentEntry {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  date: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unitType: 'primary' | 'packaging'; // e.g. "Piece" vs "Carton"
  unitName: string;                  // Display name e.g. "Pcs" or "Carton (24 pcs)"
  packagingMultiplier: number;       // Multiplier to convert to primary units
  quantity: number;                  // Input quantity in selected unitType
  totalPrimaryUnits: number;         // Actual inventory deduction amount
  unitPrice: number;                 // Applied selling price per selected unit
  costPrice: number;                 // Base purchase cost for margin calculation
  discountPercentage: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  batchId?: string;
  batchNumber?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  date: string;
  dueDate?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerTaxId?: string;
  billingAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  status: InvoiceStatus;
  payments: PaymentEntry[];
  cashierName?: string;
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
}
