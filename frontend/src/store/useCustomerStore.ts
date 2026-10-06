import { create } from 'zustand';
import { Customer } from '../types/customer';
import { LedgerEntry } from '../types/ledger';
import { StorageService } from '../services/storage';

interface CustomerState {
  customers: Customer[];
  ledgerEntries: LedgerEntry[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'currentBalance'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  getCustomerById: (id: string) => Customer | undefined;
  adjustBalance: (customerId: string, deltaBalance: number) => void;
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'runningBalance'>) => LedgerEntry;
  getCustomerLedger: (customerId: string) => LedgerEntry[];
  recordPayment: (customerId: string, amount: number, reference: string, method: string) => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: StorageService.loadCustomers(),
  ledgerEntries: StorageService.loadLedger(),

  addCustomer: (data) => {
    const id = `cust-${Date.now()}`;
    const newCustomer: Customer = {
      ...data,
      id,
      currentBalance: 0,
      createdAt: new Date().toISOString(),
    };
    const updatedCustomers = [newCustomer, ...get().customers];
    StorageService.saveCustomers(updatedCustomers);
    set({ customers: updatedCustomers });
    return newCustomer;
  },

  updateCustomer: (id, updates) => {
    const updated = get().customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
    StorageService.saveCustomers(updated);
    set({ customers: updated });
  },

  getCustomerById: (id) => get().customers.find((c) => c.id === id),

  adjustBalance: (customerId, deltaBalance) => {
    const updated = get().customers.map((c) => {
      if (c.id === customerId) {
        return { ...c, currentBalance: Number((c.currentBalance + deltaBalance).toFixed(2)) };
      }
      return c;
    });
    StorageService.saveCustomers(updated);
    set({ customers: updated });
  },

  addLedgerEntry: (entryData) => {
    const customer = get().customers.find((c) => c.id === entryData.partyId);
    const prevBalance = customer ? customer.currentBalance : 0;
    const newBalance = Number((prevBalance + entryData.debit - entryData.credit).toFixed(2));

    const id = `led-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newEntry: LedgerEntry = {
      ...entryData,
      id,
      runningBalance: newBalance,
    };

    const updatedLedger = [newEntry, ...get().ledgerEntries];
    StorageService.saveLedger(updatedLedger);
    set({ ledgerEntries: updatedLedger });

    // Update customer current balance
    get().adjustBalance(entryData.partyId, entryData.debit - entryData.credit);

    return newEntry;
  },

  getCustomerLedger: (customerId) => {
    return get().ledgerEntries.filter((e) => e.partyId === customerId);
  },

  recordPayment: (customerId, amount, reference, method) => {
    const customer = get().customers.find((c) => c.id === customerId);
    if (!customer) return;

    get().addLedgerEntry({
      partyType: 'customer',
      partyId: customerId,
      partyName: customer.companyName || customer.name,
      date: new Date().toISOString().split('T')[0],
      type: 'payment_received',
      referenceId: reference || `REC-${Date.now().toString().slice(-4)}`,
      description: `Payment received via ${method.toUpperCase()}`,
      debit: 0,
      credit: amount,
    });
  },
}));
