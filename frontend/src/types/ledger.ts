export type LedgerTransactionType = 
  | 'invoice' 
  | 'payment_received' 
  | 'credit_note' 
  | 'debit_note' 
  | 'purchase_bill' 
  | 'vendor_payment'
  | 'adjustment';

export interface LedgerEntry {
  id: string;
  partyType: 'customer' | 'supplier';
  partyId: string;
  partyName: string;
  date: string;
  type: LedgerTransactionType;
  referenceId: string;       // Invoice number or Payment ref
  description: string;
  debit: number;             // Amount billed / owed by customer
  credit: number;            // Amount paid by customer
  runningBalance: number;
}
