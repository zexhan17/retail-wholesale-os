import React from 'react';
import { Badge } from '../ui/badge';

export const PaymentStatusBadge: React.FC<{ status: 'paid' | 'partial' | 'unpaid' | 'overdue' }> = ({
  status,
}) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">PAID</Badge>;
    case 'partial':
      return <Badge className="bg-blue-500 hover:bg-blue-600">PARTIALLY PAID</Badge>;
    case 'overdue':
      return <Badge variant="destructive">OVERDUE</Badge>;
    case 'unpaid':
    default:
      return <Badge variant="secondary">UNPAID</Badge>;
  }
};

export const StockStatusIndicator: React.FC<{
  current: number;
  reorder: number;
}> = ({ current, reorder }) => {
  if (current === 0) {
    return <span className="text-destructive font-medium flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-destructive" /> Out of Stock</span>;
  }
  if (current <= reorder) {
    return (
      <span className="text-amber-500 font-medium flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Low Stock ({current} left)</span>
    );
  }
  return <span className="text-emerald-500 font-medium flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> In Stock ({current})</span>;
};

export const InvoiceTypeBadge: React.FC<{ type: 'retail' | 'wholesale' }> = ({ type }) => {
  if (type === 'wholesale') {
    return <Badge className="bg-blue-500 hover:bg-blue-600">B2B Wholesale</Badge>;
  }
  return <Badge className="bg-emerald-500 hover:bg-emerald-600">Retail POS</Badge>;
};
