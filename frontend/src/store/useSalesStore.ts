import { create } from 'zustand';
import { Invoice, InvoiceItem, PaymentEntry } from '../types/invoice';
import { StorageService } from '../services/storage';
import { useProductStore } from './useProductStore';
import { useCustomerStore } from './useCustomerStore';
import { useAppStore } from './useAppStore';

interface SalesState {
  invoices: Invoice[];
  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'createdAt'>) => Invoice;
  recordInvoicePayment: (invoiceId: string, payment: Omit<PaymentEntry, 'id'>) => void;
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoicesByCustomer: (customerId: string) => Invoice[];
  processSalesReturn: (invoiceId: string, returnedItems: InvoiceItem[], refundAmount: number) => void;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  invoices: StorageService.loadInvoices(),

  createInvoice: (data) => {
    const id = `inv-${Date.now()}`;
    const newInvoice: Invoice = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };

    // 1. Deduct Inventory Stock
    newInvoice.items.forEach((item) => {
      useProductStore.getState().deductStock(item.productId, item.totalPrimaryUnits);
    });

    // 2. If Wholesale with credit balance or unpaid amount, post to Customer Ledger
    if (newInvoice.customerId && newInvoice.dueAmount > 0) {
      useCustomerStore.getState().addLedgerEntry({
        partyType: 'customer',
        partyId: newInvoice.customerId,
        partyName: newInvoice.customerName,
        date: newInvoice.date,
        type: 'invoice',
        referenceId: newInvoice.invoiceNumber,
        description: `${newInvoice.type === 'wholesale' ? 'Wholesale Tax Invoice' : 'Retail Sale'} #${newInvoice.invoiceNumber}`,
        debit: newInvoice.grandTotal,
        credit: newInvoice.paidAmount,
      });
    }

    // 3. If Cash payment received, record to cash drawer
    const cashPaid = newInvoice.payments
      .filter((p) => p.method === 'cash')
      .reduce((sum, p) => sum + p.amount, 0);
    if (cashPaid > 0) {
      useAppStore.getState().recordCashSale(cashPaid);
    }

    const updatedInvoices = [newInvoice, ...get().invoices];
    StorageService.saveInvoices(updatedInvoices);
    set({ invoices: updatedInvoices });

    return newInvoice;
  },

  recordInvoicePayment: (invoiceId, paymentData) => {
    const paymentId = `pay-${Date.now()}`;
    const payment: PaymentEntry = { ...paymentData, id: paymentId };

    const updated = get().invoices.map((inv) => {
      if (inv.id === invoiceId) {
        const newPaid = Number((inv.paidAmount + payment.amount).toFixed(2));
        const newDue = Math.max(0, Number((inv.grandTotal - newPaid).toFixed(2)));
        const newStatus = newDue === 0 ? 'paid' : 'partial';

        return {
          ...inv,
          paidAmount: newPaid,
          dueAmount: newDue,
          paymentStatus: newStatus as any,
          payments: [...inv.payments, payment],
        };
      }
      return inv;
    });

    StorageService.saveInvoices(updated);
    set({ invoices: updated });

    const targetInvoice = get().invoices.find((inv) => inv.id === invoiceId);
    if (targetInvoice && targetInvoice.customerId) {
      useCustomerStore.getState().recordPayment(
        targetInvoice.customerId,
        payment.amount,
        payment.reference || targetInvoice.invoiceNumber,
        payment.method
      );
    }
  },

  getInvoiceById: (id) => get().invoices.find((inv) => inv.id === id),

  getInvoicesByCustomer: (customerId) =>
    get().invoices.filter((inv) => inv.customerId === customerId),

  processSalesReturn: (invoiceId, returnedItems, refundAmount) => {
    // 1. Restock items back to inventory
    returnedItems.forEach((item) => {
      useProductStore.getState().restockStock(item.productId, item.totalPrimaryUnits);
    });

    // 2. Mark invoice as returned or adjust
    const updated = get().invoices.map((inv) => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: 'returned' as const,
          notes: `${inv.notes || ''} [Returned items on ${new Date().toISOString().split('T')[0]}]`,
        };
      }
      return inv;
    });

    StorageService.saveInvoices(updated);
    set({ invoices: updated });
  },
}));
