import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';

import { useCustomerStore } from '../../store/useCustomerStore';
import { useAppStore } from '../../store/useAppStore';
import { Customer, CustomerType, PaymentTerms } from '../../types/customer';
import { CurrencyText } from '../../components/common/CurrencyText';

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const profile = useAppStore((state) => state.profile);
  const addNotification = useAppStore((state) => state.addNotification);

  const customers = useCustomerStore((state) => state.customers);
  const addCustomer = useCustomerStore((state) => state.addCustomer);
  const updateCustomer = useCustomerStore((state) => state.updateCustomer);
  const recordPayment = useCustomerStore((state) => state.recordPayment);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'retail' | 'wholesale'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newType, setNewType] = useState<CustomerType>('wholesale');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taxId, setTaxId] = useState('');
  const [creditLimit, setCreditLimit] = useState('10000');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('net_30');
  const [tier, setTier] = useState<'standard' | 'silver' | 'gold' | 'platinum'>('gold');

  // Quick Payment Modal
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        c.phone.includes(q) ||
        (c.taxId && c.taxId.toLowerCase().includes(q))
      );
    });
  }, [customers, typeFilter, searchQuery]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setNewType('wholesale');
    setName('');
    setCompanyName('');
    setPhone('');
    setEmail('');
    setTaxId('');
    setCreditLimit('10000');
    setPaymentTerms('net_30');
    setTier('gold');
    setIsAddModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setNewType(c.type);
    setName(c.name);
    setCompanyName(c.companyName || '');
    setPhone(c.phone);
    setEmail(c.email || '');
    setTaxId(c.taxId || '');
    setCreditLimit(c.creditLimit.toString());
    setPaymentTerms(c.paymentTerms);
    setTier(c.tier);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = () => {
    if (!name.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        type: newType,
        name: name.trim(),
        companyName: newType === 'wholesale' ? companyName.trim() || name.trim() : undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        taxId: newType === 'wholesale' ? taxId.trim() : undefined,
        tier,
        creditLimit: newType === 'wholesale' ? parseFloat(creditLimit) || 0 : 0,
        paymentTerms: newType === 'wholesale' ? paymentTerms : 'cod',
      });
      addNotification({
        type: 'success',
        header: 'Customer Updated',
        content: `Updated details for ${name} successfully.`,
      });
    } else {
      addCustomer({
        type: newType,
        name: name.trim(),
        companyName: newType === 'wholesale' ? companyName.trim() || name.trim() : undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        taxId: newType === 'wholesale' ? taxId.trim() : undefined,
        tier,
        creditLimit: newType === 'wholesale' ? parseFloat(creditLimit) || 0 : 0,
        paymentTerms: newType === 'wholesale' ? paymentTerms : 'cod',
        loyaltyPoints: newType === 'retail' ? 0 : undefined,
      });
      addNotification({
        type: 'success',
        header: 'Customer Created',
        content: `${name} registered successfully as a ${newType} account.`,
      });
    }

    setIsAddModalOpen(false);
  };

  const handlePaymentSubmit = () => {
    if (!paymentCustomer) return;
    const amt = parseFloat(paymentAmount) || 0;
    if (amt <= 0) return;

    recordPayment(
      paymentCustomer.id,
      amt,
      paymentReference || `REC-${Date.now().toString().slice(-4)}`,
      paymentMethod
    );

    addNotification({
      type: 'success',
      header: 'Payment Recorded',
      content: `Collected ${profile.currencySymbol}${amt.toFixed(2)} from ${paymentCustomer.name}. Ledger updated.`,
    });

    setPaymentCustomer(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">👥 Customers & Khata Ledger Accounts</h1>
          <p className="text-muted-foreground mt-2">
            Maintain retail loyalty shoppers and wholesale commercial accounts with credit limits and Khata ledger.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          Add New Customer / Account
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="w-full sm:w-72">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, company, phone, tax ID..."
            type="search"
          />
        </div>

        <div className="flex bg-muted p-1 rounded-md">
          <Button
            variant={typeFilter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTypeFilter('all')}
          >
            All
          </Button>
          <Button
            variant={typeFilter === 'wholesale' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTypeFilter('wholesale')}
          >
            📦 Wholesale
          </Button>
          <Button
            variant={typeFilter === 'retail' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTypeFilter('retail')}
          >
            ⚡ Retail
          </Button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Customer / Business Name</th>
                <th className="px-4 py-3 font-medium">Account Type</th>
                <th className="px-4 py-3 font-medium">Phone / Email</th>
                <th className="px-4 py-3 font-medium">Tier & Terms</th>
                <th className="px-4 py-3 font-medium">Khata Outstanding Balance</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No customer records found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{c.companyName || c.name}</div>
                      {c.companyName && <div className="text-xs text-muted-foreground">Contact: {c.name}</div>}
                      {c.taxId && <div className="text-xs text-blue-600">Tax ID: {c.taxId}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.type === 'wholesale' ? 'default' : 'secondary'}>
                        {c.type === 'wholesale' ? 'B2B Wholesale' : 'Retail Walk-in/Loyalty'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div>{c.phone}</div>
                      {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium uppercase text-xs">{c.tier} Tier</div>
                      <div className="text-xs text-muted-foreground">
                        {c.paymentTerms === 'cod' ? 'Cash On Delivery' : c.paymentTerms.toUpperCase().replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={`font-bold text-sm ${c.currentBalance > 0 ? 'text-destructive' : 'text-green-600'}`}
                      >
                        <CurrencyText amount={c.currentBalance} />
                      </div>
                      {c.creditLimit > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Limit: <CurrencyText amount={c.creditLimit} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(c)}>
                          Edit
                        </Button>
                        {c.type === 'wholesale' && (
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/customers/${c.id}/ledger`)}>
                            Ledger
                          </Button>
                        )}
                        {c.currentBalance > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              setPaymentCustomer(c);
                              setPaymentAmount(c.currentBalance.toString());
                            }}
                          >
                            Collect Pay
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
      </div>

      {/* Add / Edit Customer Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Register New Customer / Account'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Account Type</Label>
              <div className="flex bg-muted p-1 rounded-md w-fit">
                <Button
                  type="button"
                  variant={newType === 'wholesale' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setNewType('wholesale')}
                >
                  📦 Wholesale Commercial (B2B)
                </Button>
                <Button
                  type="button"
                  variant={newType === 'retail' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setNewType('retail')}
                >
                  ⚡ Retail Individual Shopper
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{newType === 'wholesale' ? 'Contact Person Name' : 'Full Name'}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Smith" />
              </div>

              {newType === 'wholesale' && (
                <div className="grid gap-2">
                  <Label>Company / Entity Business Name</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Supermarket Corp"
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label>Phone Number</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +1 555-0199" />
              </div>

              <div className="grid gap-2">
                <Label>Email Address</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. billing@acme.com" />
              </div>
            </div>

            {newType === 'wholesale' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Tax Registration ID (GSTIN/VAT)</Label>
                  <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="e.g. TAX-US-998811" />
                </div>

                <div className="grid gap-2">
                  <Label>Credit Limit</Label>
                  <Input
                    value={creditLimit}
                    type="number"
                    onChange={(e) => setCreditLimit(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Payment Terms</Label>
                  <Select value={paymentTerms} onValueChange={(val: any) => setPaymentTerms(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net_30">Net 30 Days</SelectItem>
                      <SelectItem value="net_15">Net 15 Days</SelectItem>
                      <SelectItem value="net_7">Net 7 Days</SelectItem>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSubmit}>Save Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collect Payment Modal */}
      <Dialog open={!!paymentCustomer} onOpenChange={(open) => !open && setPaymentCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Collect Payment from {paymentCustomer?.companyName || paymentCustomer?.name}
            </DialogTitle>
          </DialogHeader>

          {paymentCustomer && (
            <div className="grid gap-4 py-4">
              <div className="text-sm">
                Outstanding Khata Balance:{' '}
                <span className="text-destructive font-bold text-lg">
                  <CurrencyText amount={paymentCustomer.currentBalance} />
                </span>
              </div>

              <div className="grid gap-2">
                <Label>Payment Amount</Label>
                <Input
                  value={paymentAmount}
                  type="number"
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Payment Channel</Label>
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
                <Label>Reference / Cheque Number</Label>
                <Input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. WIRE-88129 or CHQ-4401"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentCustomer(null)}>Cancel</Button>
            <Button onClick={handlePaymentSubmit}>Confirm Payment & Update Khata</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
