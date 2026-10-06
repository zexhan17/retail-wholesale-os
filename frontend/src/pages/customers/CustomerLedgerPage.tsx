import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';

import { useCustomerStore } from '../../store/useCustomerStore';
import { useAppStore } from '../../store/useAppStore';
import { CurrencyText } from '../../components/common/CurrencyText';

export const CustomerLedgerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const profile = useAppStore((state) => state.profile);
  const addNotification = useAppStore((state) => state.addNotification);

  const getCustomerById = useCustomerStore((state) => state.getCustomerById);
  const getCustomerLedger = useCustomerStore((state) => state.getCustomerLedger);
  const recordPayment = useCustomerStore((state) => state.recordPayment);

  const customer = id ? getCustomerById(id) : undefined;
  const ledgerEntries = id ? getCustomerLedger(id) : [];

  // Collect Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 gap-4">
        <p className="text-muted-foreground">Customer not found.</p>
        <Button onClick={() => navigate('/customers')}>Back to Customers</Button>
      </div>
    );
  }

  // Calculate totals
  const totalBilled = ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalPaid = ledgerEntries.reduce((sum, e) => sum + e.credit, 0);

  const handlePaymentSubmit = () => {
    const amt = parseFloat(paymentAmount) || 0;
    if (amt <= 0) return;

    recordPayment(
      customer.id,
      amt,
      paymentReference || `WIRE-${Date.now().toString().slice(-4)}`,
      paymentMethod
    );

    addNotification({
      type: 'success',
      header: 'Payment Recorded',
      content: `Received ${profile.currencySymbol}${amt.toFixed(2)} from ${customer.name}. Khata ledger updated.`,
    });

    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setPaymentReference('');
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📖 Customer Khata Statement</h1>
          <p className="text-muted-foreground mt-2">
            Statement of Account & Khata Ledger for {customer.companyName || customer.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/customers')}>Back</Button>
          <Button variant="outline" onClick={handlePrintStatement}>
            Print Statement
          </Button>
          <Button
            onClick={() => {
              setPaymentAmount(customer.currentBalance > 0 ? customer.currentBalance.toString() : '');
              setIsPaymentModalOpen(true);
            }}
          >
            Collect Payment
          </Button>
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">OUTSTANDING DUE</div>
          <div className={`text-3xl font-bold ${customer.currentBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
            <CurrencyText amount={customer.currentBalance} />
          </div>
          <div className="text-sm text-muted-foreground mt-1">Current Net Balance</div>
        </div>
        
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">CREDIT LIMIT</div>
          <div className="text-3xl font-bold text-blue-600">
            <CurrencyText amount={customer.creditLimit} />
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Available Headroom: <CurrencyText amount={Math.max(0, customer.creditLimit - customer.currentBalance)} />
          </div>
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">TOTAL BILLED (LIFETIME)</div>
          <div className="text-3xl font-bold">
            <CurrencyText amount={totalBilled} />
          </div>
          <div className="text-sm text-muted-foreground mt-1">Total Invoices Generated</div>
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">TOTAL PAID (LIFETIME)</div>
          <div className="text-3xl font-bold text-green-600">
            <CurrencyText amount={totalPaid} />
          </div>
          <div className="text-sm text-muted-foreground mt-1">Cleared Settlements</div>
        </div>
      </div>

      {/* Customer Meta Details */}
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Buyer Name</div>
            <div className="font-semibold">{customer.companyName || customer.name}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact Person</div>
            <div>{customer.name}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tax ID (GSTIN/VAT)</div>
            <div>{customer.taxId || 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Phone</div>
            <div>{customer.phone}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Payment Terms</div>
            <div>{customer.paymentTerms.toUpperCase().replace('_', ' ')}</div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Statement of Account</h2>
          <p className="text-sm text-muted-foreground">Chronological record of invoices billed, payments received, and running balance</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Reference #</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium text-right">Debit (Billed +)</th>
                <th className="px-4 py-3 font-medium text-right">Credit (Paid -)</th>
                <th className="px-4 py-3 font-medium text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No ledger transactions recorded for this account.
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((e, idx) => (
                  <tr key={idx} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3 whitespace-nowrap">{e.date}</td>
                    <td className="px-4 py-3">
                      <Badge variant={e.type === 'invoice' ? 'default' : e.type === 'payment_received' ? 'secondary' : 'outline'} className={e.type === 'payment_received' ? 'bg-green-100 text-green-800' : ''}>
                        {e.type.toUpperCase().replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{e.referenceId}</td>
                    <td className="px-4 py-3">{e.description}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`${e.debit > 0 ? 'font-bold text-destructive' : 'font-normal'}`}>
                        {e.debit > 0 ? <CurrencyText amount={e.debit} /> : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`${e.credit > 0 ? 'font-bold text-green-600' : 'font-normal'}`}>
                        {e.credit > 0 ? <CurrencyText amount={e.credit} /> : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                      <CurrencyText amount={e.runningBalance} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Record Payment Receipt: {customer.companyName || customer.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="text-sm">
              Current Balance Owed:{' '}
              <span className="text-destructive font-bold text-lg">
                <CurrencyText amount={customer.currentBalance} />
              </span>
            </div>

            <div className="grid gap-2">
              <Label>Amount Received</Label>
              <Input
                value={paymentAmount}
                type="number"
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(val) => val && setPaymentMethod(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">BANK WIRE / RTGS</SelectItem>
                  <SelectItem value="cash">CASH</SelectItem>
                  <SelectItem value="cheque">CHEQUE</SelectItem>
                  <SelectItem value="upi">UPI / DIGITAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Bank Slip / Wire / Cheque Reference #</Label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. WIRE-TXN-1002 or CHQ-0992"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button onClick={handlePaymentSubmit}>Confirm Payment & Post to Ledger</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
