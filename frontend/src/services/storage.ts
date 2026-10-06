import {
  initialBusinessProfile,
  initialCustomers,
  initialInvoices,
  initialLedgerEntries,
  initialProducts,
  initialPurchaseOrders,
  initialSuppliers,
} from './mockData';
import { Product } from '../types/product';
import { Customer } from '../types/customer';
import { Invoice } from '../types/invoice';
import { Supplier, PurchaseOrder } from '../types/purchase';
import { LedgerEntry } from '../types/ledger';
import { BusinessProfile } from '../types/settings';

const STORAGE_KEYS = {
  PROFILE: 'omnistore_profile_v1',
  PRODUCTS: 'omnistore_products_v1',
  CUSTOMERS: 'omnistore_customers_v1',
  INVOICES: 'omnistore_invoices_v1',
  LEDGER: 'omnistore_ledger_v1',
  SUPPLIERS: 'omnistore_suppliers_v1',
  PURCHASE_ORDERS: 'omnistore_po_v1',
  DRAWER: 'omnistore_drawer_v1',
};

export interface AppBackupPayload {
  version: string;
  timestamp: string;
  profile: BusinessProfile;
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  ledger: LedgerEntry[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
}

export const StorageService = {
  loadProfile(): BusinessProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      const parsed = data ? JSON.parse(data) : initialBusinessProfile;
      if (parsed && parsed.currencySymbol === '$') {
        parsed.currencySymbol = '';
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return initialBusinessProfile;
    }
  },
  saveProfile(profile: BusinessProfile) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  loadProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : initialProducts;
    } catch {
      return initialProducts;
    }
  },
  saveProducts(products: Product[]) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  loadCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : initialCustomers;
    } catch {
      return initialCustomers;
    }
  },
  saveCustomers(customers: Customer[]) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  loadInvoices(): Invoice[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return data ? JSON.parse(data) : initialInvoices;
    } catch {
      return initialInvoices;
    }
  },
  saveInvoices(invoices: Invoice[]) {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  },

  loadLedger(): LedgerEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEDGER);
      return data ? JSON.parse(data) : initialLedgerEntries;
    } catch {
      return initialLedgerEntries;
    }
  },
  saveLedger(ledger: LedgerEntry[]) {
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(ledger));
  },

  loadSuppliers(): Supplier[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      return data ? JSON.parse(data) : initialSuppliers;
    } catch {
      return initialSuppliers;
    }
  },
  saveSuppliers(suppliers: Supplier[]) {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  },

  loadPurchaseOrders(): PurchaseOrder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS);
      return data ? JSON.parse(data) : initialPurchaseOrders;
    } catch {
      return initialPurchaseOrders;
    }
  },
  savePurchaseOrders(orders: PurchaseOrder[]) {
    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(orders));
  },

  exportFullBackup(): AppBackupPayload {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      profile: this.loadProfile(),
      products: this.loadProducts(),
      customers: this.loadCustomers(),
      invoices: this.loadInvoices(),
      ledger: this.loadLedger(),
      suppliers: this.loadSuppliers(),
      purchaseOrders: this.loadPurchaseOrders(),
    };
  },

  restoreBackup(backup: AppBackupPayload): boolean {
    if (!backup || !backup.products || !backup.invoices) {
      throw new Error('Invalid backup file schema.');
    }
    this.saveProfile(backup.profile);
    this.saveProducts(backup.products);
    this.saveCustomers(backup.customers);
    this.saveInvoices(backup.invoices);
    this.saveLedger(backup.ledger);
    this.saveSuppliers(backup.suppliers);
    this.savePurchaseOrders(backup.purchaseOrders);
    return true;
  },

  resetToDemo(): void {
    localStorage.clear();
  },
};
