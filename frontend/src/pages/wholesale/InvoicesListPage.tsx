import React, { useState, useMemo } from 'react';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Input from '@cloudscape-design/components/input';
import Select from '@cloudscape-design/components/select';
import Modal from '@cloudscape-design/components/modal';
import FormField from '@cloudscape-design/components/form-field';
import SegmentedControl from '@cloudscape-design/components/segmented-control';
import Pagination from '@cloudscape-design/components/pagination';

import { useSalesStore } from '../../store/useSalesStore';
import { useAppStore } from '../../store/useAppStore';
import { Invoice } from '../../types/invoice';
import { CurrencyText } from '../../components/common/CurrencyText';
import { InvoiceTypeBadge, PaymentStatusBadge } from '../../components/common/StatusBadge';
import { PrintTaxInvoice } from '../../components/print/PrintTaxInvoice';
import { PrintThermalReceipt } from '../../components/print/PrintThermalReceipt';

export const InvoicesListPage: React.FC = () => {
  const profile = useAppStore((state) => state.profile);
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const addNotification = useAppStore((state) => state.addNotification);

  const invoices = useSalesStore((state) => state.invoices);
  const recordInvoicePayment = useSalesStore((state) => state.recordInvoicePayment);
  const processSalesReturn = useSalesStore((state) => state.processSalesReturn);

  // Filters
  const [channelFilter, setChannelFilter] = useState<'all' | 'retail' | 'wholesale'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // View / Print Modal
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  // Payment Recording Modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'card' | 'upi'>('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');

  // Return Modal
  const [returnModalInvoice, setReturnModalInvoice] = useState<Invoice | null>(null);

  // Filtered List
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (channelFilter !== 'all' && inv.type !== channelFilter) return false;
      if (statusFilter !== 'all' && inv.paymentStatus !== statusFilter) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerPhone && inv.customerPhone.includes(q))
      );
    });
  }, [invoices, channelFilter, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Handle Recording Payment
  const handleRecordPaymentSubmit = () => {
    if (!paymentModalInvoice) return;
    const amt = parseFloat(paymentAmount) || 0;
    if (amt <= 0) return;

    recordInvoicePayment(paymentModalInvoice.id, {
      method: paymentMethod,
      amount: amt,
      reference: paymentReference,
      date: new Date().toISOString(),
    });

    addNotification({
      type: 'success',
      header: 'Payment Recorded',
      content: `Recorded payment of ${profile.currencySymbol}${amt.toFixed(2)} for invoice #${paymentModalInvoice.invoiceNumber}`,
    });

    setPaymentModalInvoice(null);
    setPaymentAmount('');
    setPaymentReference('');
  };

  // Handle Return Submit
  const handleReturnSubmit = () => {
    if (!returnModalInvoice) return;
    processSalesReturn(returnModalInvoice.id, returnModalInvoice.items, returnModalInvoice.grandTotal);
    addNotification({
      type: 'success',
      header: 'Return Processed',
      content: `All items on invoice #${returnModalInvoice.invoiceNumber} returned to inventory.`,
    });
    setReturnModalInvoice(null);
  };

  return (
    <SpaceBetween size="l">
      {/* Header */}
      <Header
        variant="h1"
        description="Unified ledger of all retail counter sales and wholesale commercial invoices."
      >
        📄 Invoices & Sales History
      </Header>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          background: isDark ? '#1e293b' : '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <Input
            value={searchQuery}
            onChange={({ detail }) => setSearchQuery(detail.value)}
            placeholder="Search by Invoice # or Customer name..."
            type="search"
          />
        </div>

        <SegmentedControl
          selectedId={channelFilter}
          onChange={({ detail }) => setChannelFilter(detail.selectedId as any)}
          options={[
            { id: 'all', text: 'All Channels' },
            { id: 'retail', text: '⚡ Retail POS' },
            { id: 'wholesale', text: '📦 Wholesale B2B' },
          ]}
        />

        <div style={{ width: '180px' }}>
          <Select
            selectedOption={{
              label:
                statusFilter === 'all'
                  ? 'All Statuses'
                  : statusFilter.toUpperCase(),
              value: statusFilter,
            }}
            onChange={({ detail }) => setStatusFilter(detail.selectedOption.value as string)}
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'PAID', value: 'paid' },
              { label: 'PARTIAL', value: 'partial' },
              { label: 'UNPAID', value: 'unpaid' },
            ]}
          />
        </div>
      </div>

      {/* Invoices Table */}
      <Table
        columnDefinitions={[
          {
            id: 'invoiceNumber',
            header: 'Invoice #',
            cell: (inv) => <span style={{ fontWeight: 600 }}>{inv.invoiceNumber}</span>,
          },
          {
            id: 'channel',
            header: 'Channel',
            cell: (inv) => <InvoiceTypeBadge type={inv.type} />,
          },
          {
            id: 'customer',
            header: 'Customer',
            cell: (inv) => (
              <div>
                <div style={{ fontWeight: 500 }}>{inv.customerName}</div>
                {inv.customerPhone && (
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{inv.customerPhone}</div>
                )}
              </div>
            ),
          },
          {
            id: 'date',
            header: 'Date',
            cell: (inv) => (
              <div>
                <div>{inv.date}</div>
                {inv.dueDate && (
                  <div style={{ fontSize: '11px', color: '#dc2626' }}>Due: {inv.dueDate}</div>
                )}
              </div>
            ),
          },
          {
            id: 'items',
            header: 'Items',
            cell: (inv) => `${inv.items.length} line(s)`,
          },
          {
            id: 'grandTotal',
            header: 'Total Amount',
            cell: (inv) => (
              <span style={{ fontWeight: 'bold' }}>
                <CurrencyText amount={inv.grandTotal} />
              </span>
            ),
          },
          {
            id: 'paidDue',
            header: 'Paid / Due',
            cell: (inv) => (
              <div style={{ fontSize: '12px' }}>
                <div>Paid: <CurrencyText amount={inv.paidAmount} /></div>
                {inv.dueAmount > 0 && (
                  <div style={{ color: '#dc2626', fontWeight: 600 }}>
                    Due: <CurrencyText amount={inv.dueAmount} />
                  </div>
                )}
              </div>
            ),
          },
          {
            id: 'status',
            header: 'Payment Status',
            cell: (inv) => <PaymentStatusBadge status={inv.paymentStatus} />,
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (inv) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="inline-link"
                  onClick={() => setActiveInvoice(inv)}
                >
                  View / Print
                </Button>
                {inv.dueAmount > 0 && (
                  <Button
                    variant="inline-link"
                    onClick={() => {
                      setPaymentModalInvoice(inv);
                      setPaymentAmount(inv.dueAmount.toString());
                    }}
                  >
                    Receive Pay
                  </Button>
                )}
                {inv.status !== 'returned' && (
                  <Button
                    variant="inline-link"
                    onClick={() => setReturnModalInvoice(inv)}
                  >
                    Return
                  </Button>
                )}
              </SpaceBetween>
            ),
          },
        ]}
        items={paginatedInvoices}
        pagination={
          <Pagination
            currentPageIndex={currentPage}
            pagesCount={totalPages}
            onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
          />
        }
        empty={<Box textAlign="center" padding="l">No invoices match selected criteria.</Box>}
      />

      {/* Invoice View / Print Modal */}
      <Modal
        visible={!!activeInvoice}
        onDismiss={() => setActiveInvoice(null)}
        header={`Invoice #${activeInvoice?.invoiceNumber}`}
        size={activeInvoice?.type === 'wholesale' ? 'large' : 'medium'}
        footer={
          <Box float="right">
            <Button onClick={() => setActiveInvoice(null)}>Close</Button>
          </Box>
        }
      >
        {activeInvoice && (
          activeInvoice.type === 'wholesale' ? (
            <PrintTaxInvoice invoice={activeInvoice} onClose={() => setActiveInvoice(null)} />
          ) : (
            <PrintThermalReceipt invoice={activeInvoice} onClose={() => setActiveInvoice(null)} />
          )
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        visible={!!paymentModalInvoice}
        onDismiss={() => setPaymentModalInvoice(null)}
        header={`Record Payment for #${paymentModalInvoice?.invoiceNumber}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setPaymentModalInvoice(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleRecordPaymentSubmit}>
                Confirm Payment Receipt
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        {paymentModalInvoice && (
          <SpaceBetween size="m">
            <div>
              <strong>Customer:</strong> {paymentModalInvoice.customerName} |{' '}
              <strong>Balance Due:</strong>{' '}
              <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                <CurrencyText amount={paymentModalInvoice.dueAmount} />
              </span>
            </div>

            <FormField label="Payment Amount Received">
              <Input
                value={paymentAmount}
                onChange={({ detail }) => setPaymentAmount(detail.value)}
                type="number"
              />
            </FormField>

            <FormField label="Payment Channel / Method">
              <Select
                selectedOption={{ label: paymentMethod.toUpperCase(), value: paymentMethod }}
                onChange={({ detail }) => setPaymentMethod(detail.selectedOption.value as any)}
                options={[
                  { label: 'BANK TRANSFER / WIRE', value: 'bank_transfer' },
                  { label: 'CASH', value: 'cash' },
                  { label: 'CARD / POS SLIP', value: 'card' },
                  { label: 'UPI / DIGITAL', value: 'upi' },
                ]}
              />
            </FormField>

            <FormField label="Bank Reference # / Cheque No.">
              <Input
                value={paymentReference}
                onChange={({ detail }) => setPaymentReference(detail.value)}
                placeholder="e.g. WIRE-998822 or CHQ-0012"
              />
            </FormField>
          </SpaceBetween>
        )}
      </Modal>

      {/* Sales Return Modal */}
      <Modal
        visible={!!returnModalInvoice}
        onDismiss={() => setReturnModalInvoice(null)}
        header={`Confirm Sales Return for #${returnModalInvoice?.invoiceNumber}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setReturnModalInvoice(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleReturnSubmit}>
                Process Return & Restock Goods
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        {returnModalInvoice && (
          <SpaceBetween size="m">
            <Box color="text-body-secondary">
              Processing this return will restock all {returnModalInvoice.items.length} line items back into product inventory.
            </Box>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, textAlign: 'left' }}>
                  <th style={{ padding: '6px' }}>Item</th>
                  <th style={{ padding: '6px', textAlign: 'center' }}>Qty Restocked</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {returnModalInvoice.items.map((i) => (
                  <tr key={i.id} style={{ borderBottom: `1px solid ${isDark ? '#1e293b' : '#f3f4f6'}` }}>
                    <td style={{ padding: '6px' }}>{i.productName}</td>
                    <td style={{ padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                      {i.quantity} ({i.unitName})
                    </td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>
                      <CurrencyText amount={i.total} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SpaceBetween>
        )}
      </Modal>
    </SpaceBetween>
  );
};
