import React, { useState } from 'react';
import { Plus, X, Check, FileText } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';

import { useProductStore } from '../../store/useProductStore';
import { useCustomerStore } from '../../store/useCustomerStore';
import { useSalesStore } from '../../store/useSalesStore';
import { useAppStore } from '../../store/useAppStore';
import { calculateItemPrice } from '../../services/pricingEngine';
import { CurrencyText } from '../../components/common/CurrencyText';
import { PrintTaxInvoice } from '../../components/print/PrintTaxInvoice';
import { Invoice, InvoiceItem } from '../../types/invoice';

interface DraftWholesaleItem {
  id: string;
  productId: string;
  unitType: 'primary' | 'packaging';
  quantity: number;
  discountPercentage: number;
}

export const WholesaleBillingPage: React.FC = () => {
  const profile = useAppStore((state) => state.profile);
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">📦 Wholesale B2B Billing & Invoicing</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Issue official B2B Tax Invoices with tiered slab pricing, carton-to-unit conversions, and Khata credit control.
          </p>
        </div>
        <Button
          onClick={handleGenerateInvoice}
          disabled={calculatedItems.length === 0 || !activeCustomer}
          className="shrink-0"
        >
          <FileText className="mr-2 h-4 w-4" />
          Generate Tax Invoice ({profile.currencySymbol}{grandTotal.toFixed(2)})
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buyer Account & Terms</CardTitle>
          <CardDescription>Select corporate buyer and configure payment credit terms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Wholesale B2B Account</Label>
              <Select value={selectedCustomerId} onValueChange={(val) => val && setSelectedCustomerId(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select wholesale customer" />
                </SelectTrigger>
                <SelectContent>
                  {wholesaleCustomers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName || c.name} (Tax ID: {c.taxId || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Credit Terms</Label>
              <Select
                value={paymentTerms}
                onValueChange={(term) => {
                  if (term) { setPaymentTerms(term);
                  const days = term === 'net_30' ? 30 : term === 'net_15' ? 15 : term === 'net_7' ? 7 : 0;
                  const d = new Date();
                  d.setDate(d.getDate() + days);
                  setDueDate(d.toISOString().split('T')[0]); }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net_30">Net 30 Days</SelectItem>
                  <SelectItem value="net_15">Net 15 Days</SelectItem>
                  <SelectItem value="net_7">Net 7 Days</SelectItem>
                  <SelectItem value="cod">Cash on Delivery (COD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Invoice Date / Due Date</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {activeCustomer && (
            <div className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-md border p-4 ${isCreditExceeded ? 'bg-destructive/10 border-destructive/20' : 'bg-primary/5 border-primary/20'}`}>
              <div>
                <strong className="text-foreground">Khata Ledger Status:</strong> Current Balance:{' '}
                <span className="font-bold">
                  <CurrencyText amount={customerCurrentBalance} />
                </span>{' '}
                | Credit Limit:{' '}
                <span className="font-bold">
                  <CurrencyText amount={customerCreditLimit} />
                </span>
                <div className="mt-1 text-xs text-muted-foreground">
                  Available Credit Line:{' '}
                  <CurrencyText amount={Math.max(0, customerCreditLimit - customerCurrentBalance)} />
                </div>
              </div>
              {isCreditExceeded && (
                <div className="bg-destructive/20 text-destructive text-sm font-medium px-3 py-1.5 rounded-md border border-destructive/30">
                  Credit Limit Exceeded
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Invoice Line Items ({draftItems.length})</CardTitle>
            <CardDescription>Automatic bulk tiered price slabs and packaging multipliers apply</CardDescription>
          </div>
          <Button onClick={handleAddLineItem} variant="outline" size="sm" className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Add Line Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {draftItems.map((item, index) => {
            const prod = products.find((p) => p.id === item.productId);
            const calc = prod
              ? calculateItemPrice(prod, item.quantity, item.unitType, 'wholesale', item.discountPercentage)
              : null;

            return (
              <div
                key={item.id}
                className="rounded-md border bg-card p-4 shadow-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 space-y-2">
                    <Label>Item #{index + 1} - Product</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(val) => handleUpdateItem(item.id, { productId: val as string })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Unit of Sale</Label>
                    <Select
                      value={item.unitType}
                      onValueChange={(val) => val && handleUpdateItem(item.id, { unitType: val as 'primary' | 'packaging' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="packaging">
                          {prod?.packagingUnit || 'Carton'} (x{prod?.packagingMultiplier || 1})
                        </SelectItem>
                        <SelectItem value="primary">
                          {prod?.primaryUnit || 'Piece'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    />
                  </div>

                  <div className="md:col-span-1 space-y-2">
                    <Label>Discount %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discountPercentage}
                      onChange={(e) => handleUpdateItem(item.id, { discountPercentage: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Line Total (Tax Incl.)</Label>
                    <div className="pt-1">
                      <div className="text-base font-bold text-primary">
                        <CurrencyText amount={calc?.total || 0} />
                      </div>
                      <div className="text-xs font-medium text-green-600 mt-0.5">
                        {calc?.appliedTierLabel || 'Standard Price'}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-1 flex items-center justify-end pt-6 md:pt-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={draftItems.length === 1}
                      onClick={() => handleRemoveLineItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {calc && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-dashed pt-3 text-xs text-muted-foreground">
                    <span>
                      Deduction from stock:{' '}
                      <strong className="text-foreground">
                        {calc.totalPrimaryUnits} {prod?.primaryUnit}s
                      </strong>
                    </span>
                    <span>
                      Effective rate: <strong className="text-foreground">{profile.currencySymbol}{calc.unitPrice.toFixed(2)}</strong> per{' '}
                      {item.unitType === 'packaging' ? prod?.packagingUnit : prod?.primaryUnit}
                    </span>
                    <span>
                      Tax ({prod?.taxRate}%): <strong className="text-foreground">{profile.currencySymbol}{calc.taxAmount.toFixed(2)}</strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Payment & Khata Posting</CardTitle>
              <CardDescription>Choose how this wholesale invoice is recorded in accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2 rounded-md bg-muted p-1 w-fit">
                <button
                  className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${settlementType === 'credit' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setSettlementType('credit')}
                >
                  📖 Post to Khata (Credit / Due)
                </button>
                <button
                  className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${settlementType === 'full_wire' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setSettlementType('full_wire')}
                >
                  🏦 Paid in Full (Bank Wire)
                </button>
                <button
                  className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${settlementType === 'partial' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setSettlementType('partial')}
                >
                  🪙 Partial Advance Payment
                </button>
              </div>

              {settlementType === 'partial' && (
                <div className="space-y-2">
                  <Label>Advance Paid Amount</Label>
                  <Input
                    type="number"
                    value={partialPaidAmount}
                    onChange={(e) => setPartialPaidAmount(e.target.value)}
                  />
                </div>
              )}

              {settlementType !== 'credit' && (
                <div className="space-y-2">
                  <Label>Bank Wire / Payment Reference #</Label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. WIRE-TXN-99884 or CHQ-00192"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Invoice Notes / Dispatch Instructions</Label>
                <Input
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="e.g. Delivery via dock #4, pallet shrink-wrapped"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-5">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Invoice Total Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold">
                  <CurrencyText amount={subtotal} />
                </span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between items-center text-sm text-green-600">
                  <span>Discount:</span>
                  <span>
                    -<CurrencyText amount={discountTotal} />
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Tax Total (GST / VAT):</span>
                <span className="font-semibold">
                  <CurrencyText amount={taxTotal} />
                </span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-primary pt-3 text-xl font-bold text-primary">
                <span>GRAND TOTAL:</span>
                <span>
                  <CurrencyText amount={grandTotal} />
                </span>
              </div>

              <div className="pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleGenerateInvoice}
                  disabled={calculatedItems.length === 0 || !activeCustomer}
                >
                  <Check className="mr-2 h-5 w-5" />
                  Create Tax Invoice & Open PDF Print
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!generatedInvoice} onOpenChange={(open) => !open && setGeneratedInvoice(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>B2B Tax Invoice Created</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/30">
            {generatedInvoice && (
              <PrintTaxInvoice
                invoice={generatedInvoice}
                onClose={() => setGeneratedInvoice(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
