export type OperatingMode = 'hybrid' | 'retail_only' | 'wholesale_only';

export interface BusinessProfile {
  storeName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;         // GSTIN / VAT / Sales Tax ID
  currencySymbol: string;    // e.g. "$", "₹", "£", "€"
  currencyCode: string;      // e.g. "USD", "INR", "EUR"
  operatingMode: OperatingMode;
  receiptFooterMessage: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    routingOrIfsc: string;
  };
}
