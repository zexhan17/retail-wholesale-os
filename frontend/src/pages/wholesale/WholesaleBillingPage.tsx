import React, { useState } from 'react';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Grid from '@cloudscape-design/components/grid';
import FormField from '@cloudscape-design/components/form-field';
import Select, { SelectProps } from '@cloudscape-design/components/select';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';
import Modal from '@cloudscape-design/components/modal';
import Box from '@cloudscape-design/components/box';
import DatePicker from '@cloudscape-design/components/date-picker';
import SegmentedControl from '@cloudscape-design/components/segmented-control';

import { useProductStore } from '../../store/useProductStore';
import { useCustomerStore } from '../../store/useCustomerStore';
import { useSalesStore } from '../../store/useSalesStore';
import { useAppStore } from '../../store/useAppStore';
import { calculateItemPrice } from '../../services/pricingEngine';
import { CurrencyText } from '../../components/common/CurrencyText';
import { PrintTaxInvoice } from '../../components/print/PrintTaxInvoice';
import { Invoice, InvoiceItem } from '../../types/invoice';
import { Customer } from '../../types/customer';

interface DraftWholesaleItem {
  id: string;
  productId: string;
  unitType: 'primary' | 'packaging';
  quantity: number;
  discountPercentage: number;
}

export const WholesaleBillingPage: React.FC = () => {
  const profile = useAppStore((state) => state.profile);
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const addNotification = useAppStore((state) => state.addNotification);

  const products = useProductStore((state) => state.products);
  const customers = useCustomerStore((state) => state.customers);
  const createInvoice = useSalesStore((state) => state.createInvoice);

  const wholesaleCustomers = customers.filter((c) => c.type === 'wholesale');

  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    wholesaleCustomers[0]?.id || ''
  );
  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Billing meta
  const todayStr = new Date().toISOString().split('T')[0];
  const [invoiceDate, setInvoiceDate] = useState(todayStr);
  const [paymentTerms, setPaymentTerms] = useState<string>('net_30');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [invoiceNotes, setInvoiceNotes] = useState('Payment via Bank Wire / RTGS. Goods inspected.');

  // Items in draft invoice
  const [draftItems, setDraftItems] = useState<DraftWholesaleItem[]>([
    {
      id: 'd-1',
      productId: products[0]?.id || '',
      unitType: 'packaging',
      quantity: 10,
      discountPercentage: 0,
    },
  ]);

  // Payment Settlement Selection
  const [settlementType, setSettlementType] = useState<'credit' | 'full_wire' | 'partial'>('credit');
  const [partialPaidAmount, setPartialPaidAmount] = useState<string>('0');
  const [paymentReference, setPaymentReference] = useState('');

  // Generated Invoice for modal
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);

  // Calculate detailed items
  const calculatedItems: InvoiceItem[] = draftItems
    .map((draft) => {
      const prod = products.find((p) => p.id === draft.productId);
      if (!prod) return null;

      const calc = calculateItemPrice(
        prod,
        draft.quantity,
        draft.unitType,
        'wholesale',
        draft.discountPercentage
      );

      const unitName =
        draft.unitType === 'packaging'
          ? `${prod.packagingUnit} (${prod.packagingMultiplier} ${prod.primaryUnit}s)`
          : prod.primaryUnit;

      return {
        id: draft.id,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unitType: draft.unitType,
        unitName,
        packagingMultiplier: prod.packagingMultiplier,
        quantity: draft.quantity,
        totalPrimaryUnits: calc.totalPrimaryUnits,
        unitPrice: calc.unitPrice,
        costPrice: prod.costPrice * (draft.unitType === 'packaging' ? prod.packagingMultiplier : 1),
        discountPercentage: draft.discountPercentage,
        taxRate: prod.taxRate,
        taxAmount: calc.taxAmount,
        subtotal: calc.subtotal,
        total: calc.total,
        batchNumber: prod.batches?.[0]?.batchNumber,
      } as InvoiceItem;
    })
    .filter(Boolean) as InvoiceItem[];

  // Totals
  const subtotal = calculatedItems.reduce((sum, i) => sum + i.subtotal, 0);
  const discountTotal = calculatedItems.reduce(
    (sum, i) => sum + (i.subtotal * i.discountPercentage) / 100,
    0
  );
  const taxTotal = calculatedItems.reduce((sum, i) => sum + i.taxAmount, 0);
  const grandTotal = Number((subtotal - discountTotal + taxTotal).toFixed(2));

  // Credit calculation
  const customerCurrentBalance = activeCustomer?.currentBalance || 0;
  const customerCreditLimit = activeCustomer?.creditLimit || 0;
  const projectedBalance = customerCurrentBalance + (settlementType === 'full_wire' ? 0 : grandTotal);
  const isCreditExceeded = customerCreditLimit > 0 && projectedBalance > customerCreditLimit;

  // Add line item
  const handleAddLineItem = () => {
    const unselected = products.find((p) => !draftItems.some((d) => d.productId === p.id));
    const nextProd = unselected || products[0];
    setDraftItems([
      ...draftItems,
      {
        id: `d-${Date.now()}`,
        productId: nextProd.id,
        unitType: 'packaging',
        quantity: 1,
        discountPercentage: 0,
      },
    ]);
  };

  const handleRemoveLineItem = (id: string) => {
    setDraftItems(draftItems.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<DraftWholesaleItem>) => {
    setDraftItems(draftItems.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  // Submit Invoice
  const handleGenerateInvoice = () => {
    if (!activeCustomer || calculatedItems.length === 0) return;

    let paidAmount = 0;
    let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    const payments = [];

    if (settlementType === 'full_wire') {
      paidAmount = grandTotal;
      paymentStatus = 'paid';
      payments.push({
        id: `pay-${Date.now()}`,
        method: 'bank_transfer' as const,
        amount: grandTotal,
        reference: paymentReference || 'WIRE-SETTLED',
        date: invoiceDate,
      });
    } else if (settlementType === 'partial') {
      const part = parseFloat(partialPaidAmount) || 0;
      paidAmount = Math.min(grandTotal, part);
      paymentStatus = paidAmount === grandTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
      if (paidAmount > 0) {
        payments.push({
          id: `pay-${Date.now()}`,
          method: 'bank_transfer' as const,
          amount: paidAmount,
          reference: paymentReference || 'PARTIAL-ADVANCE',
          date: invoiceDate,
        });
      }
    }

    const dueAmount = Number((grandTotal - paidAmount).toFixed(2));
    const invoiceNum = `INV-WHL-${Date.now().toString().slice(-6)}`;

    const newInvoice = createInvoice({
      invoiceNumber: invoiceNum,
      type: 'wholesale',
      date: invoiceDate,
      dueDate,
      customerId: activeCustomer.id,
      customerName: activeCustomer.companyName || activeCustomer.name,
      customerPhone: activeCustomer.phone,
      customerTaxId: activeCustomer.taxId,
      billingAddress: activeCustomer.address
        ? `${activeCustomer.address.street}, ${activeCustomer.address.city}, ${activeCustomer.address.state || ''}`
        : undefined,
      items: calculatedItems,
      subtotal,
      discountTotal,
      taxTotal,
      roundOff: 0,
      grandTotal,
      paidAmount,
      dueAmount,
      paymentStatus,
      status: 'completed',
      payments,
      notes: invoiceNotes,
      cashierName: 'Wholesale Accounts Desk',
    });

    setGeneratedInvoice(newInvoice);
    addNotification({
      type: 'success',
      header: 'Tax Invoice Created',
      content: `Wholesale Invoice #${newInvoice.invoiceNumber} created and posted to Khata ledger.`,
    });
  };

  return (
    <SpaceBetween size="l">
      {/* Header */}
      <Header
        variant="h1"
        description="Issue official B2B Tax Invoices with tiered slab pricing, carton-to-unit conversions, and Khata credit control."
        actions={
          <Button
            variant="primary"
            iconName="file"
            disabled={calculatedItems.length === 0 || !activeCustomer}
            onClick={handleGenerateInvoice}
          >
            Generate Tax Invoice ({profile.currencySymbol}{grandTotal.toFixed(2)})
          </Button>
        }
      >
        📦 Wholesale B2B Billing & Invoicing
      </Header>

      {/* Customer Account & Terms Panel */}
      <Container
        header={
          <Header variant="h2" description="Select corporate buyer and configure payment credit terms">
            Buyer Account & Terms
          </Header>
        }
      >
        <Grid
          gridDefinition={[
            { colspan: { default: 12, m: 4 } },
            { colspan: { default: 12, m: 4 } },
            { colspan: { default: 12, m: 4 } },
          ]}
        >
          {/* Customer Dropdown */}
          <FormField label="Wholesale B2B Account">
            <Select
              selectedOption={
                activeCustomer
                  ? {
                      label: activeCustomer.companyName || activeCustomer.name,
                      value: activeCustomer.id,
                      description: `Tax ID: ${activeCustomer.taxId || 'N/A'} • Tier: ${activeCustomer.tier.toUpperCase()}`,
                    }
                  : null
              }
              onChange={({ detail }) => setSelectedCustomerId(detail.selectedOption.value as string)}
              options={wholesaleCustomers.map((c) => ({
                label: c.companyName || c.name,
                value: c.id,
                description: `Tax ID: ${c.taxId || 'N/A'} • Balance: ${profile.currencySymbol}${c.currentBalance}`,
              }))}
              placeholder="Select wholesale customer"
            />
          </FormField>

          {/* Payment Terms */}
          <FormField label="Credit Terms">
            <Select
              selectedOption={{
                label:
                  paymentTerms === 'net_30'
                    ? 'Net 30 Days'
                    : paymentTerms === 'net_15'
                    ? 'Net 15 Days'
                    : paymentTerms === 'net_7'
                    ? 'Net 7 Days'
                    : 'Cash on Delivery (COD)',
                value: paymentTerms,
              }}
              onChange={({ detail }) => {
                const term = detail.selectedOption.value as string;
                setPaymentTerms(term);
                const days = term === 'net_30' ? 30 : term === 'net_15' ? 15 : term === 'net_7' ? 7 : 0;
                const d = new Date();
                d.setDate(d.getDate() + days);
                setDueDate(d.toISOString().split('T')[0]);
              }}
              options={[
                { label: 'Net 30 Days', value: 'net_30' },
                { label: 'Net 15 Days', value: 'net_15' },
                { label: 'Net 7 Days', value: 'net_7' },
                { label: 'Cash on Delivery (COD)', value: 'cod' },
              ]}
            />
          </FormField>

          {/* Dates */}
          <FormField label="Invoice Date / Due Date">
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <DatePicker
                  value={invoiceDate}
                  onChange={({ detail }) => setInvoiceDate(detail.value)}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div style={{ flex: 1 }}>
                <DatePicker
                  value={dueDate}
                  onChange={({ detail }) => setDueDate(detail.value)}
                  placeholder="Due Date"
                />
              </div>
            </div>
          </FormField>
        </Grid>

        {/* Credit Limit & Khata Status Indicator */}
        {activeCustomer && (
          <Box margin={{ top: 'm' }}>
            <div
              style={{
                background: isCreditExceeded
                  ? (isDark ? '#450a0a' : '#fef2f2')
                  : (isDark ? '#1e3a5f' : '#f0f9ff'),
                border: `1px solid ${isCreditExceeded ? (isDark ? '#dc2626' : '#ef4444') : (isDark ? '#2563eb' : '#bae6fd')}`,
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <strong>Khata Ledger Status:</strong> Current Balance:{' '}
                <span style={{ fontWeight: 'bold' }}>
                  <CurrencyText amount={customerCurrentBalance} />
                </span>{' '}
                | Credit Limit:{' '}
                <span style={{ fontWeight: 'bold' }}>
                  <CurrencyText amount={customerCreditLimit} />
                </span>
                <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '2px' }}>
                  Available Credit Line:{' '}
                  <CurrencyText amount={Math.max(0, customerCreditLimit - customerCurrentBalance)} />
                </div>
              </div>

              {isCreditExceeded && (
                <Alert type="error" header="Credit Limit Exceeded">
                  This invoice ({profile.currencySymbol}{grandTotal.toFixed(2)}) will exceed the customer's credit limit!
                </Alert>
              )}
            </div>
          </Box>
        )}
      </Container>

      {/* Invoice Line Items Builder */}
      <Container
        header={
          <Header
            variant="h2"
            description="Automatic bulk tiered price slabs and packaging multipliers apply"
            actions={
              <Button onClick={handleAddLineItem} iconName="add-plus">
                Add Line Item
              </Button>
            }
          >
            Invoice Line Items ({draftItems.length})
          </Header>
        }
      >
        <SpaceBetween size="m">
          {draftItems.map((item, index) => {
            const prod = products.find((p) => p.id === item.productId);
            const calc = prod
              ? calculateItemPrice(prod, item.quantity, item.unitType, 'wholesale', item.discountPercentage)
              : null;

            return (
              <div
                key={item.id}
                style={{
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  padding: '14px',
                  background: isDark ? '#1e293b' : '#ffffff',
                }}
              >
                <Grid
                  gridDefinition={[
                    { colspan: { default: 12, s: 6, m: 4 } },
                    { colspan: { default: 6, s: 3, m: 2 } },
                    { colspan: { default: 6, s: 3, m: 2 } },
                    { colspan: { default: 6, s: 3, m: 1 } },
                    { colspan: { default: 6, s: 3, m: 2 } },
                    { colspan: { default: 12, s: 12, m: 1 } },
                  ]}
                >
                  {/* Product Picker */}
                  <FormField label={`Item #${index + 1} - Product`}>
                    <Select
                      selectedOption={
                        prod
                          ? {
                              label: prod.name,
                              value: prod.id,
                              description: `Stock: ${prod.stockQuantity} ${prod.primaryUnit}s • Base: ${profile.currencySymbol}${prod.retailPrice}`,
                            }
                          : null
                      }
                      onChange={({ detail }) =>
                        handleUpdateItem(item.id, { productId: detail.selectedOption.value as string })
                      }
                      options={products.map((p) => ({
                        label: p.name,
                        value: p.id,
                        description: `Stock: ${p.stockQuantity} ${p.primaryUnit}s • 1 ${p.packagingUnit} = ${p.packagingMultiplier} ${p.primaryUnit}s`,
                      }))}
                    />
                  </FormField>

                  {/* Unit Type (Pcs vs Carton) */}
                  <FormField label="Unit of Sale">
                    <Select
                      selectedOption={{
                        label:
                          item.unitType === 'packaging'
                            ? `${prod?.packagingUnit || 'Carton'} (x${prod?.packagingMultiplier || 1})`
                            : prod?.primaryUnit || 'Piece',
                        value: item.unitType,
                      }}
                      onChange={({ detail }) =>
                        handleUpdateItem(item.id, {
                          unitType: detail.selectedOption.value as 'primary' | 'packaging',
                        })
                      }
                      options={[
                        {
                          label: `${prod?.packagingUnit || 'Carton'} (x${prod?.packagingMultiplier || 1})`,
                          value: 'packaging',
                        },
                        { label: prod?.primaryUnit || 'Piece', value: 'primary' },
                      ]}
                    />
                  </FormField>

                  {/* Quantity */}
                  <FormField label="Quantity">
                    <Input
                      value={item.quantity.toString()}
                      type="number"
                      onChange={({ detail }) =>
                        handleUpdateItem(item.id, { quantity: Math.max(1, parseInt(detail.value) || 1) })
                      }
                    />
                  </FormField>

                  {/* Discount */}
                  <FormField label="Discount %">
                    <Input
                      value={item.discountPercentage.toString()}
                      type="number"
                      onChange={({ detail }) =>
                        handleUpdateItem(item.id, {
                          discountPercentage: Math.max(0, Math.min(100, parseFloat(detail.value) || 0)),
                        })
                      }
                    />
                  </FormField>

                  {/* Line Total & Applied Slab */}
                  <FormField label="Line Total (Tax Incl.)">
                    <div style={{ paddingTop: '8px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0972d3' }}>
                        <CurrencyText amount={calc?.total || 0} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 500 }}>
                        {calc?.appliedTierLabel || 'Standard Price'}
                      </div>
                    </div>
                  </FormField>

                  {/* Remove Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '16px' }}>
                    <Button
                      variant="inline-icon"
                      iconName="close"
                      disabled={draftItems.length === 1}
                      onClick={() => handleRemoveLineItem(item.id)}
                    />
                  </div>
                </Grid>

                {/* Slab Info Notice */}
                {calc && (
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      color: '#475569',
                      display: 'flex',
                      gap: '8px 16px',
                      flexWrap: 'wrap',
                      borderTop: '1px dashed #e2e8f0',
                      paddingTop: '6px',
                    }}
                  >
                    <span>
                      Deduction from stock:{' '}
                      <strong>
                        {calc.totalPrimaryUnits} {prod?.primaryUnit}s
                      </strong>
                    </span>
                    <span>
                      Effective rate: <strong>{profile.currencySymbol}{calc.unitPrice.toFixed(2)}</strong> per{' '}
                      {item.unitType === 'packaging' ? prod?.packagingUnit : prod?.primaryUnit}
                    </span>
                    <span>
                      Tax ({prod?.taxRate}%): <strong>{profile.currencySymbol}{calc.taxAmount.toFixed(2)}</strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </SpaceBetween>
      </Container>

      {/* Settlement & Grand Summary Grid */}
      <Grid
        gridDefinition={[
          { colspan: { default: 12, m: 7 } },
          { colspan: { default: 12, m: 5 } },
        ]}
      >
        {/* Payment Settlement Config */}
        <Container
          header={
            <Header variant="h2" description="Choose how this wholesale invoice is recorded in accounts">
              Payment & Khata Posting
            </Header>
          }
        >
          <SpaceBetween size="m">
            <SegmentedControl
              selectedId={settlementType}
              onChange={({ detail }) => setSettlementType(detail.selectedId as any)}
              options={[
                { id: 'credit', text: '📖 Post to Khata (Credit / Due)' },
                { id: 'full_wire', text: '🏦 Paid in Full (Bank Wire)' },
                { id: 'partial', text: '🪙 Partial Advance Payment' },
              ]}
            />

            {settlementType === 'partial' && (
              <FormField label="Advance Paid Amount">
                <Input
                  value={partialPaidAmount}
                  onChange={({ detail }) => setPartialPaidAmount(detail.value)}
                  type="number"
                />
              </FormField>
            )}

            {settlementType !== 'credit' && (
              <FormField label="Bank Wire / Payment Reference #">
                <Input
                  value={paymentReference}
                  onChange={({ detail }) => setPaymentReference(detail.value)}
                  placeholder="e.g. WIRE-TXN-99884 or CHQ-00192"
                />
              </FormField>
            )}

            <FormField label="Invoice Notes / Dispatch Instructions">
              <Input
                value={invoiceNotes}
                onChange={({ detail }) => setInvoiceNotes(detail.value)}
                placeholder="e.g. Delivery via dock #4, pallet shrink-wrapped"
              />
            </FormField>
          </SpaceBetween>
        </Container>

        {/* Invoice Summary */}
        <Container
          header={
            <Header variant="h2">
              Invoice Total Summary
            </Header>
          }
        >
          <SpaceBetween size="s">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>
                <CurrencyText amount={subtotal} />
              </span>
            </div>
            {discountTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                <span>Discount:</span>
                <span>
                  -<CurrencyText amount={discountTotal} />
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Tax Total (GST / VAT):</span>
              <span style={{ fontWeight: 600 }}>
                <CurrencyText amount={taxTotal} />
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '2px solid #0972d3',
                paddingTop: '8px',
                fontWeight: 'bold',
                fontSize: '22px',
                color: '#0972d3',
              }}
            >
              <span>GRAND TOTAL:</span>
              <span>
                <CurrencyText amount={grandTotal} />
              </span>
            </div>

            <Box margin={{ top: 'm' }}>
              <Button
                fullWidth
                variant="primary"
                onClick={handleGenerateInvoice}
                disabled={calculatedItems.length === 0 || !activeCustomer}
                iconName="check"
              >
                Create Tax Invoice & Open PDF Print
              </Button>
            </Box>
          </SpaceBetween>
        </Container>
      </Grid>

      {/* Generated Tax Invoice Printable Modal */}
      <Modal
        visible={!!generatedInvoice}
        onDismiss={() => setGeneratedInvoice(null)}
        header="B2B Tax Invoice Created"
        size="large"
        footer={
          <Box float="right">
            <Button onClick={() => setGeneratedInvoice(null)}>Close</Button>
          </Box>
        }
      >
        {generatedInvoice && (
          <PrintTaxInvoice
            invoice={generatedInvoice}
            onClose={() => setGeneratedInvoice(null)}
          />
        )}
      </Modal>
    </SpaceBetween>
  );
};
