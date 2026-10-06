import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSalesStore } from '../../store/useSalesStore';
import { useAppStore } from '../../store/useAppStore';
import { Invoice } from '../../types/invoice';
import { CurrencyText } from '../../components/common/CurrencyText';
import { InvoiceTypeBadge, PaymentStatusBadge } from '../../components/common/StatusBadge';
import { PrintTaxInvoice } from '../../components/print/PrintTaxInvoice';
import { PrintThermalReceipt } from '../../components/print/PrintThermalReceipt';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';

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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">📄 Invoices & Sales History</h1>
        <p className="text-muted-foreground mt-2">Unified ledger of all retail counter sales and wholesale commercial invoices.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Invoice # or Customer name..."
                type="search"
                className="pl-9"
              />
            </div>

            <div className="flex items-center rounded-md border border-input p-1 bg-muted/50">
              <button
                onClick={() => setChannelFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${channelFilter === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                All Channels
              </button>
              <button
                onClick={() => setChannelFilter('retail')}
                className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${channelFilter === 'retail' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                ⚡ Retail POS
              </button>
              <button
                onClick={() => setChannelFilter('wholesale')}
                className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${channelFilter === 'wholesale' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                📦 Wholesale B2B
              </button>
            </div>

            <div className="w-[180px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">All Statuses</option>
                <option value="paid">PAID</option>
                <option value="partial">PARTIAL</option>
                <option value="unpaid">UNPAID</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total Amount</th>
                <th className="px-4 py-3 font-medium">Paid / Due</th>
                <th className="px-4 py-3 font-medium">Payment Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No invoices match selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <InvoiceTypeBadge type={inv.type} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{inv.customerName}</div>
                      {inv.customerPhone && (
                        <div className="text-xs text-muted-foreground">{inv.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>{inv.date}</div>
                      {inv.dueDate && (
                        <div className="text-xs text-destructive">Due: {inv.dueDate}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{inv.items.length} line(s)</td>
                    <td className="px-4 py-3 font-bold">
                      <CurrencyText amount={inv.grandTotal} />
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div>Paid: <CurrencyText amount={inv.paidAmount} /></div>
                      {inv.dueAmount > 0 && (
                        <div className="text-destructive font-semibold">
                          Due: <CurrencyText amount={inv.dueAmount} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={inv.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveInvoice(inv)}
                        >
                          View / Print
                        </Button>
                        {inv.dueAmount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
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
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setReturnModalInvoice(inv)}
                          >
                            Return
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Invoice View / Print Modal */}
      <Dialog open={!!activeInvoice} onOpenChange={(open) => !open && setActiveInvoice(null)}>
        <DialogContent className={activeInvoice?.type === 'wholesale' ? 'max-w-4xl' : 'max-w-md'}>
          <DialogHeader>
            <DialogTitle>Invoice #{activeInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {activeInvoice && (
              activeInvoice.type === 'wholesale' ? (
                <PrintTaxInvoice invoice={activeInvoice} onClose={() => setActiveInvoice(null)} />
              ) : (
                <PrintThermalReceipt invoice={activeInvoice} onClose={() => setActiveInvoice(null)} />
              )
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveInvoice(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={!!paymentModalInvoice} onOpenChange={(open) => !open && setPaymentModalInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment for #{paymentModalInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          
          {paymentModalInvoice && (
            <div className="grid gap-4 py-4">
              <div className="text-sm">
                <strong>Customer:</strong> {paymentModalInvoice.customerName} |{' '}
                <strong>Balance Due:</strong>{' '}
                <span className="text-destructive font-bold">
                  <CurrencyText amount={paymentModalInvoice.dueAmount} />
                </span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment-amount">Payment Amount Received</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment-method">Payment Channel / Method</Label>
                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="bank_transfer">BANK TRANSFER / WIRE</option>
                  <option value="cash">CASH</option>
                  <option value="card">CARD / POS SLIP</option>
                  <option value="upi">UPI / DIGITAL</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment-reference">Bank Reference # / Cheque No.</Label>
                <Input
                  id="payment-reference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. WIRE-998822 or CHQ-0012"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentModalInvoice(null)}>Cancel</Button>
            <Button onClick={handleRecordPaymentSubmit}>Confirm Payment Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sales Return Modal */}
      <Dialog open={!!returnModalInvoice} onOpenChange={(open) => !open && setReturnModalInvoice(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Confirm Sales Return for #{returnModalInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>
              Processing this return will restock all {returnModalInvoice?.items.length} line items back into product inventory.
            </DialogDescription>
          </DialogHeader>
          
          {returnModalInvoice && (
            <div className="py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium text-center">Qty Restocked</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {returnModalInvoice.items.map((i) => (
                    <tr key={i.id}>
                      <td className="py-2">{i.productName}</td>
                      <td className="py-2 text-center font-bold">
                        {i.quantity} ({i.unitName})
                      </td>
                      <td className="py-2 text-right">
                        <CurrencyText amount={i.total} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnModalInvoice(null)}>Cancel</Button>
            <Button onClick={handleReturnSubmit}>Process Return & Restock Goods</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
