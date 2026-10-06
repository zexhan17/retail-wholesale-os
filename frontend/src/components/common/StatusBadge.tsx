import React from 'react';
import Badge from '@cloudscape-design/components/badge';
import StatusIndicator, { StatusIndicatorProps } from '@cloudscape-design/components/status-indicator';

export const PaymentStatusBadge: React.FC<{ status: 'paid' | 'partial' | 'unpaid' | 'overdue' }> = ({
  status,
}) => {
  switch (status) {
    case 'paid':
      return <Badge color="green">PAID</Badge>;
    case 'partial':
      return <Badge color="blue">PARTIALLY PAID</Badge>;
    case 'overdue':
      return <Badge color="red">OVERDUE</Badge>;
    case 'unpaid':
    default:
      return <Badge color="grey">UNPAID</Badge>;
  }
};

export const StockStatusIndicator: React.FC<{
  current: number;
  reorder: number;
}> = ({ current, reorder }) => {
  if (current === 0) {
    return <StatusIndicator type="error">Out of Stock</StatusIndicator>;
  }
  if (current <= reorder) {
    return (
      <StatusIndicator type="warning">
        Low Stock ({current} left)
      </StatusIndicator>
    );
  }
  return <StatusIndicator type="success">In Stock ({current})</StatusIndicator>;
};

export const InvoiceTypeBadge: React.FC<{ type: 'retail' | 'wholesale' }> = ({ type }) => {
  if (type === 'wholesale') {
    return <Badge color="blue">B2B Wholesale</Badge>;
  }
  return <Badge color="green">Retail POS</Badge>;
};
