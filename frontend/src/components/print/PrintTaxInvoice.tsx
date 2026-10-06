import React, { useRef } from 'react';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { Invoice } from '../../types/invoice';
import { useAppStore } from '../../store/useAppStore';
import { PrintService } from '../../services/printService';

interface PrintTaxInvoiceProps {
  invoice: Invoice;
  onClose?: () => void;
}

export const PrintTaxInvoice: React.FC<PrintTaxInvoiceProps> = ({ invoice, onClose }) => {
  const profile = useAppStore((state) => state.profile);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const rawCurrency = profile.currencySymbol;
  const currencySymbol = rawCurrency && rawCurrency !== '$' ? `${rawCurrency} ` : '';
  const currencyHeaderSuffix = rawCurrency && rawCurrency !== '$' ? ` (${rawCurrency})` : '';

  const handlePrint = () => {
    if (invoiceRef.current) {
      PrintService.printElement(invoiceRef.current, `Tax-Invoice-${invoice.invoiceNumber}`, 'a4');
    } else {
      window.print();
    }
  };

  return (
    <div>
      <Box margin={{ bottom: 'm' }}>
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="primary" iconName="download" onClick={handlePrint}>
            Print / Save as PDF (A4 Format)
          </Button>
          {onClose && <Button onClick={onClose}>Close</Button>}
        </SpaceBetween>
      </Box>

      {/* Formal A4 Document Container */}
      <div
        ref={invoiceRef}
        id="tax-invoice-a4-container"
        style={{
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '36px',
          background: '#ffffff',
          color: '#1e293b',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '13px',
          lineHeight: '1.5',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
        }}
      >
        {/* Header: Company & Tax Invoice Badge */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #0972d3',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', color: '#0972d3', fontWeight: 800 }}>
              {profile.storeName}
            </h1>
            <div style={{ color: '#475569', fontSize: '12px' }}>{profile.tagline}</div>
            <div style={{ marginTop: '6px' }}>{profile.address}</div>
            <div>
              <strong>Phone:</strong> {profile.phone} | <strong>Email:</strong> {profile.email}
            </div>
            {profile.taxNumber && (
              <div>
                <strong>GSTIN / Tax ID:</strong> {profile.taxNumber}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                background: '#0972d3',
                color: '#ffffff',
                padding: '6px 14px',
                fontWeight: 'bold',
                fontSize: '15px',
                borderRadius: '4px',
                display: 'inline-block',
                letterSpacing: '1px',
              }}
            >
              TAX INVOICE
            </div>
            <div style={{ marginTop: '8px' }}>
              <strong>Invoice #:</strong> {invoice.invoiceNumber}
            </div>
            <div>
              <strong>Date:</strong> {invoice.date}
            </div>
            {invoice.dueDate && (
              <div>
                <strong>Payment Due:</strong> {invoice.dueDate}
              </div>
            )}
          </div>
        </div>

        {/* Bill To & Dispatch Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '20px',
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div>
            <div style={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>
              Billed To (Customer):
            </div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', marginTop: '4px' }}>
              {invoice.customerName}
            </div>
            {invoice.customerTaxId && (
              <div>
                <strong>Buyer Tax / GSTIN:</strong> {invoice.customerTaxId}
              </div>
            )}
            {invoice.customerPhone && <div>Phone: {invoice.customerPhone}</div>}
            {invoice.billingAddress && <div>Address: {invoice.billingAddress}</div>}
          </div>

          <div>
            <div style={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', fontSize: '11px' }}>
              Invoice Details:
            </div>
            <div style={{ marginTop: '4px' }}>
              <strong>Payment Status:</strong>{' '}
              <span
                style={{
                  color: invoice.paymentStatus === 'paid' ? '#16a34a' : '#d97706',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}
              >
                {invoice.paymentStatus}
              </span>
            </div>
            <div>
              <strong>Transaction Channel:</strong> Wholesale Commercial
            </div>
            <div>
              <strong>Currency:</strong> {profile.currencyCode}{currencyHeaderSuffix}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '20px',
          }}
        >
          <thead>
            <tr
              style={{
                background: '#f1f5f9',
                borderTop: '1px solid #cbd5e1',
                borderBottom: '2px solid #cbd5e1',
                textAlign: 'left',
              }}
            >
              <th style={{ padding: '8px' }}>#</th>
              <th style={{ padding: '8px' }}>Product & Description</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Unit Type</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Rate{currencyHeaderSuffix}</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Tax %</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Tax{currencyHeaderSuffix}</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Amount{currencyHeaderSuffix}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr
                key={item.id}
                style={{
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <td style={{ padding: '8px', color: '#64748b' }}>{idx + 1}</td>
                <td style={{ padding: '8px' }}>
                  <div style={{ fontWeight: 600 }}>{item.productName}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>SKU: {item.sku}</div>
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{item.unitName}</td>
                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                  {item.quantity}
                </td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{item.taxRate}%</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{item.taxAmount.toFixed(2)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                  {item.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial Summary & Bank Information */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          <div>
            {profile.bankDetails && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#0972d3' }}>
                  Bank Wire / Transfer Information:
                </div>
                <div>Bank: {profile.bankDetails.bankName}</div>
                <div>A/C Name: {profile.bankDetails.accountHolder}</div>
                <div>A/C No: {profile.bankDetails.accountNumber}</div>
                <div>Routing/IFSC: {profile.bankDetails.routingOrIfsc}</div>
              </div>
            )}

            {invoice.notes && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#475569' }}>
                <strong>Remarks / Terms:</strong> {invoice.notes}
              </div>
            )}
          </div>

          <div
            style={{
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Subtotal:</span>
              <span>
                {currencySymbol}
                {invoice.subtotal.toFixed(2)}
              </span>
            </div>
            {invoice.discountTotal > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  color: '#16a34a',
                }}
              >
                <span>Total Discount:</span>
                <span>
                  -{currencySymbol}
                  {invoice.discountTotal.toFixed(2)}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Total Tax:</span>
              <span>
                {currencySymbol}
                {invoice.taxTotal.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '2px solid #0972d3',
                paddingTop: '8px',
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#0972d3',
              }}
            >
              <span>Grand Total:</span>
              <span>
                {currencySymbol}
                {invoice.grandTotal.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '6px',
                fontSize: '12px',
              }}
            >
              <span>Amount Paid:</span>
              <span>
                {currencySymbol}
                {invoice.paidAmount.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '4px',
                fontSize: '13px',
                fontWeight: 'bold',
                color: invoice.dueAmount > 0 ? '#dc2626' : '#16a34a',
              }}
            >
              <span>Balance Due:</span>
              <span>
                {currencySymbol}
                {invoice.dueAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Authorized Signatory Footer */}
        <div
          style={{
            marginTop: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '20px',
            borderTop: '1px solid #cbd5e1',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            This is a computer generated invoice and conforms to commercial standards.
          </div>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ borderBottom: '1px solid #475569', marginBottom: '4px', height: '40px' }} />
            <div style={{ fontWeight: 'bold' }}>Authorized Signatory</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>For {profile.storeName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
