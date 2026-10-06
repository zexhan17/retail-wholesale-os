import React, { useState } from 'react';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import SegmentedControl from '@cloudscape-design/components/segmented-control';
import { Invoice } from '../../types/invoice';
import { useAppStore } from '../../store/useAppStore';
import { PrintService, ThermalPaperWidth } from '../../services/printService';
import { CurrencyText } from '../common/CurrencyText';

interface PrintThermalReceiptProps {
  invoice: Invoice;
  onClose?: () => void;
}

export const PrintThermalReceipt: React.FC<PrintThermalReceiptProps> = ({ invoice, onClose }) => {
  const profile = useAppStore((state) => state.profile);
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const [paperFormat, setPaperFormat] = useState<ThermalPaperWidth>('80mm');

  const handlePrint = () => {
    PrintService.printReceipt(invoice, profile, paperFormat);
  };

  const is58mm = paperFormat === '58mm';
  const paperWidthPx = is58mm ? '220px' : '280px';

  // Check for cash tendered in payment references
  const cashPayment = invoice.payments.find((p) => p.method === 'cash');
  let changeGiven = 0;
  if (cashPayment && cashPayment.reference?.includes('Paid:')) {
    const match = cashPayment.reference.match(/[\d.]+/);
    if (match) {
      const tendered = parseFloat(match[0]);
      if (tendered > invoice.grandTotal) {
        changeGiven = tendered - invoice.grandTotal;
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
      {/* Print Controls Bar */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          background: isDark ? '#0f172a' : '#f8fafc',
          padding: '10px 14px',
          borderRadius: '8px',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#94a3b8' : '#475569' }}>Roll Format:</span>
          <SegmentedControl
            selectedId={paperFormat}
            onChange={({ detail }) => setPaperFormat(detail.selectedId as ThermalPaperWidth)}
            options={[
              { id: '80mm', text: '80mm (Standard)' },
              { id: '58mm', text: '58mm (Compact)' },
            ]}
          />
        </div>

        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="primary" iconName="download" onClick={handlePrint}>
            🖨️ Print Receipt ({paperFormat})
          </Button>
          {onClose && <Button onClick={onClose}>Done</Button>}
        </SpaceBetween>
      </div>

      {/* Realistic Thermal Receipt Paper Container */}
      <div
        id="thermal-receipt-container"
        style={{
          width: paperWidthPx,
          maxWidth: '100%',
          margin: '0 auto',
          padding: is58mm ? '12px 10px' : '16px 14px',
          background: '#ffffff',
          color: '#000000',
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: is58mm ? '10px' : '11px',
          lineHeight: '1.35',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          border: '1px solid #cbd5e1',
          borderRadius: '2px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: is58mm ? '14px' : '16px', fontWeight: 800, letterSpacing: '0.5px' }}>
            {profile.storeName}
          </div>
          {profile.tagline && (
            <div style={{ fontSize: is58mm ? '9px' : '10px', color: '#475569', marginTop: '1px' }}>
              {profile.tagline}
            </div>
          )}
          <div style={{ fontSize: is58mm ? '9px' : '10px', color: '#334155', marginTop: '2px' }}>
            {profile.address}
          </div>
          <div style={{ fontSize: is58mm ? '9px' : '10px' }}>Tel: {profile.phone}</div>
          {profile.taxNumber && (
            <div style={{ fontSize: is58mm ? '9px' : '10px' }}>Tax ID: {profile.taxNumber}</div>
          )}
        </div>

        <div style={{ borderTop: '1px dashed #4b5563', margin: '6px 0' }} />

        {/* Invoice Meta */}
        <div style={{ fontSize: is58mm ? '10px' : '11px' }}>
          <div><strong>Receipt #:</strong> {invoice.invoiceNumber}</div>
          <div><strong>Date:</strong> {new Date(invoice.createdAt || invoice.date).toLocaleString()}</div>
          <div><strong>Customer:</strong> {invoice.customerName}</div>
          {invoice.cashierName && <div><strong>Cashier:</strong> {invoice.cashierName}</div>}
        </div>

        <div style={{ borderTop: '1px dashed #4b5563', margin: '6px 0' }} />

        {/* Item Rows */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: is58mm ? '10px' : '11px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #111827', textAlign: 'left' }}>
              <th style={{ paddingBottom: '3px' }}>Item</th>
              <th style={{ textAlign: 'right', paddingBottom: '3px' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px dotted #e2e8f0' }}>
                <td style={{ padding: '3px 0', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 600 }}>{item.productName}</div>
                  <div style={{ fontSize: is58mm ? '9px' : '10px', color: '#4b5563' }}>
                    {item.quantity} x {profile.currencySymbol && profile.currencySymbol !== '$' ? `${profile.currencySymbol} ` : ''}{item.unitPrice.toFixed(2)}
                    {item.unitName && ` [${item.unitName}]`}
                    {item.discountPercentage > 0 && ` (-${item.discountPercentage}%)`}
                  </div>
                </td>
                <td style={{ textAlign: 'right', padding: '3px 0', verticalAlign: 'top', fontWeight: 600 }}>
                  <CurrencyText amount={item.total} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '1px dashed #4b5563', margin: '6px 0' }} />

        {/* Totals */}
        <div style={{ fontSize: is58mm ? '10px' : '11px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span><CurrencyText amount={invoice.subtotal} /></span>
          </div>
          {invoice.discountTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
              <span>Total Discount:</span>
              <span>-<CurrencyText amount={invoice.discountTotal} /></span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tax (Estimated):</span>
            <span><CurrencyText amount={invoice.taxTotal} /></span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 800,
              fontSize: is58mm ? '13px' : '14px',
              borderTop: '1px solid #111827',
              marginTop: '4px',
              paddingTop: '4px',
            }}
          >
            <span>TOTAL:</span>
            <span><CurrencyText amount={invoice.grandTotal} /></span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #4b5563', margin: '6px 0' }} />

        {/* Payments / Tender */}
        <div style={{ fontSize: is58mm ? '10px' : '11px' }}>
          {invoice.payments.map((p, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ textTransform: 'uppercase' }}>Paid via {p.method}:</span>
              <span><CurrencyText amount={p.amount} /></span>
            </div>
          ))}
          {changeGiven > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
              <span>Change Returned:</span>
              <span><CurrencyText amount={changeGiven} /></span>
            </div>
          )}
          {invoice.dueAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: 'bold' }}>
              <span>Balance Due:</span>
              <span><CurrencyText amount={invoice.dueAmount} /></span>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px dashed #4b5563', margin: '10px 0 6px 0' }} />

        {/* Barcode Simulation */}
        <div style={{ textAlign: 'center', margin: '6px 0' }}>
          <div
            style={{
              display: 'inline-block',
              letterSpacing: is58mm ? '3px' : '4px',
              fontWeight: 'bold',
              fontSize: is58mm ? '12px' : '14px',
            }}
          >
            ||| | |||| | |||||| || | ||
          </div>
          <div style={{ fontSize: is58mm ? '9px' : '10px' }}>{invoice.invoiceNumber}</div>
        </div>

        <div style={{ textAlign: 'center', fontSize: is58mm ? '9px' : '10px', marginTop: '6px', color: '#475569' }}>
          <div>{profile.receiptFooterMessage || 'Thank you for shopping with us!'}</div>
          <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '3px' }}>
            Powered by OmniStore OS
          </div>
        </div>
      </div>
    </div>
  );
};
