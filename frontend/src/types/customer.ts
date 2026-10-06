export type CustomerType = 'retail' | 'wholesale';

export type PaymentTerms = 'cod' | 'net_7' | 'net_15' | 'net_30' | 'net_60';

export interface Customer {
  id: string;
  type: CustomerType;
  name: string;             // Person or Business name
  companyName?: string;     // For B2B wholesale
  phone: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  taxId?: string;           // GSTIN / VAT / TIN number
  tier: 'standard' | 'silver' | 'gold' | 'platinum';
  creditLimit: number;      // Maximum allowed outstanding balance (e.g. 50000)
  currentBalance: number;   // Current outstanding amount owed (positive = owes money, negative = advance credit)
  paymentTerms: PaymentTerms;
  loyaltyPoints?: number;   // For retail shoppers
  notes?: string;
  createdAt: string;
}
