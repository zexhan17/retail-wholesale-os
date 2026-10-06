import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Input from '@cloudscape-design/components/input';
import Modal from '@cloudscape-design/components/modal';
import FormField from '@cloudscape-design/components/form-field';
import Grid from '@cloudscape-design/components/grid';
import Select from '@cloudscape-design/components/select';
import SegmentedControl from '@cloudscape-design/components/segmented-control';
import Badge from '@cloudscape-design/components/badge';

import { useCustomerStore } from '../../store/useCustomerStore';
import { useAppStore } from '../../store/useAppStore';
import { Customer, CustomerType, PaymentTerms } from '../../types/customer';
import { CurrencyText } from '../../components/common/CurrencyText';

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const profile = useAppStore((state) => state.profile);
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
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
    <SpaceBetween size="l">
      {/* Header */}
      <Header
        variant="h1"
        description="Maintain retail loyalty shoppers and wholesale commercial accounts with credit limits and Khata ledger."
        actions={
          <Button variant="primary" iconName="add-plus" onClick={openCreateModal}>
            Add New Customer / Account
          </Button>
        }
      >
        👥 Customers & Khata Ledger Accounts
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
            placeholder="Search by customer, company name, phone, or Tax ID..."
            type="search"
          />
        </div>

        <SegmentedControl
          selectedId={typeFilter}
          onChange={({ detail }) => setTypeFilter(detail.selectedId as any)}
          options={[
            { id: 'all', text: 'All Customers' },
            { id: 'wholesale', text: '📦 Wholesale Accounts' },
            { id: 'retail', text: '⚡ Retail Shoppers' },
          ]}
        />
      </div>

      {/* Customers Table */}
      <Table
        columnDefinitions={[
          {
            id: 'name',
            header: 'Customer / Business Name',
            cell: (c) => (
              <div>
                <div style={{ fontWeight: 600 }}>{c.companyName || c.name}</div>
                {c.companyName && <div style={{ fontSize: '11px', color: '#6b7280' }}>Contact: {c.name}</div>}
                {c.taxId && <div style={{ fontSize: '11px', color: '#0972d3' }}>Tax ID: {c.taxId}</div>}
              </div>
            ),
          },
          {
            id: 'type',
            header: 'Account Type',
            cell: (c) => (
              <Badge color={c.type === 'wholesale' ? 'blue' : 'green'}>
                {c.type === 'wholesale' ? 'B2B Wholesale' : 'Retail Walk-in/Loyalty'}
              </Badge>
            ),
          },
          {
            id: 'contact',
            header: 'Phone / Email',
            cell: (c) => (
              <div>
                <div>{c.phone}</div>
                {c.email && <div style={{ fontSize: '11px', color: '#6b7280' }}>{c.email}</div>}
              </div>
            ),
          },
          {
            id: 'tier',
            header: 'Tier & Terms',
            cell: (c) => (
              <div>
                <div style={{ fontWeight: 500, textTransform: 'uppercase', fontSize: '12px' }}>
                  {c.tier} Tier
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  {c.paymentTerms === 'cod' ? 'Cash On Delivery' : c.paymentTerms.toUpperCase().replace('_', ' ')}
                </div>
              </div>
            ),
          },
          {
            id: 'balance',
            header: 'Khata Outstanding Balance',
            cell: (c) => (
              <div>
                <div
                  style={{
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: c.currentBalance > 0 ? '#dc2626' : '#16a34a',
                  }}
                >
                  <CurrencyText amount={c.currentBalance} />
                </div>
                {c.creditLimit > 0 && (
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    Limit: <CurrencyText amount={c.creditLimit} />
                  </div>
                )}
              </div>
            ),
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (c) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="inline-link"
                  onClick={() => openEditModal(c)}
                >
                  Edit
                </Button>
                {c.type === 'wholesale' && (
                  <Button
                    variant="inline-link"
                    onClick={() => navigate(`/customers/${c.id}/ledger`)}
                  >
                    View Khata Ledger
                  </Button>
                )}
                {c.currentBalance > 0 && (
                  <Button
                    variant="inline-link"
                    onClick={() => {
                      setPaymentCustomer(c);
                      setPaymentAmount(c.currentBalance.toString());
                    }}
                  >
                    Collect Pay
                  </Button>
                )}
              </SpaceBetween>
            ),
          },
        ]}
        items={filteredCustomers}
        empty={<Box textAlign="center" padding="l">No customer records found.</Box>}
      />

      {/* Add / Edit Customer Modal */}
      <Modal
        visible={isAddModalOpen}
        onDismiss={() => setIsAddModalOpen(false)}
        header={editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Register New Customer / Account'}
        size="large"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddSubmit}>
                Save Customer
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Account Type">
            <SegmentedControl
              selectedId={newType}
              onChange={({ detail }) => setNewType(detail.selectedId as CustomerType)}
              options={[
                { id: 'wholesale', text: '📦 Wholesale Commercial (B2B)' },
                { id: 'retail', text: '⚡ Retail Individual Shopper' },
              ]}
            />
          </FormField>

          <Grid
            gridDefinition={[
              { colspan: { default: 12, m: 6 } },
              { colspan: { default: 12, m: 6 } },
            ]}
          >
            <FormField label={newType === 'wholesale' ? 'Contact Person Name' : 'Full Name'}>
              <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="e.g. John Smith" />
            </FormField>

            {newType === 'wholesale' && (
              <FormField label="Company / Entity Business Name">
                <Input
                  value={companyName}
                  onChange={({ detail }) => setCompanyName(detail.value)}
                  placeholder="e.g. Acme Supermarket Corp"
                />
              </FormField>
            )}

            <FormField label="Phone Number">
              <Input value={phone} onChange={({ detail }) => setPhone(detail.value)} placeholder="e.g. +1 555-0199" />
            </FormField>

            <FormField label="Email Address">
              <Input value={email} onChange={({ detail }) => setEmail(detail.value)} placeholder="e.g. billing@acme.com" />
            </FormField>
          </Grid>

          {newType === 'wholesale' && (
            <Grid
              gridDefinition={[
                { colspan: { default: 12, m: 4 } },
                { colspan: { default: 6, m: 4 } },
                { colspan: { default: 6, m: 4 } },
              ]}
            >
              <FormField label="Tax Registration ID (GSTIN/VAT)">
                <Input value={taxId} onChange={({ detail }) => setTaxId(detail.value)} placeholder="e.g. TAX-US-998811" />
              </FormField>

              <FormField label="Credit Limit">
                <Input
                  value={creditLimit}
                  type="number"
                  onChange={({ detail }) => setCreditLimit(detail.value)}
                />
              </FormField>

              <FormField label="Payment Terms">
                <Select
                  selectedOption={{
                    label:
                      paymentTerms === 'net_30'
                        ? 'Net 30 Days'
                        : paymentTerms === 'net_15'
                        ? 'Net 15 Days'
                        : paymentTerms === 'net_7'
                        ? 'Net 7 Days'
                        : 'Cash on Delivery',
                    value: paymentTerms,
                  }}
                  onChange={({ detail }) => setPaymentTerms(detail.selectedOption.value as any)}
                  options={[
                    { label: 'Net 30 Days', value: 'net_30' },
                    { label: 'Net 15 Days', value: 'net_15' },
                    { label: 'Net 7 Days', value: 'net_7' },
                    { label: 'Cash on Delivery', value: 'cod' },
                  ]}
                />
              </FormField>
            </Grid>
          )}
        </SpaceBetween>
      </Modal>

      {/* Collect Payment Modal */}
      <Modal
        visible={!!paymentCustomer}
        onDismiss={() => setPaymentCustomer(null)}
        header={`Collect Payment from ${paymentCustomer?.companyName || paymentCustomer?.name}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setPaymentCustomer(null)}>Cancel</Button>
              <Button variant="primary" onClick={handlePaymentSubmit}>
                Confirm Payment & Update Khata
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        {paymentCustomer && (
          <SpaceBetween size="m">
            <div>
              Outstanding Khata Balance:{' '}
              <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                <CurrencyText amount={paymentCustomer.currentBalance} />
              </span>
            </div>

            <FormField label="Payment Amount">
              <Input
                value={paymentAmount}
                type="number"
                onChange={({ detail }) => setPaymentAmount(detail.value)}
              />
            </FormField>

            <FormField label="Payment Channel">
              <Select
                selectedOption={{ label: paymentMethod.toUpperCase(), value: paymentMethod }}
                onChange={({ detail }) => setPaymentMethod(detail.selectedOption.value as string)}
                options={[
                  { label: 'BANK WIRE / RTGS', value: 'bank_transfer' },
                  { label: 'CASH', value: 'cash' },
                  { label: 'CHEQUE', value: 'cheque' },
                  { label: 'UPI / DIGITAL', value: 'upi' },
                ]}
              />
            </FormField>

            <FormField label="Reference / Cheque Number">
              <Input
                value={paymentReference}
                onChange={({ detail }) => setPaymentReference(detail.value)}
                placeholder="e.g. WIRE-88129 or CHQ-4401"
              />
            </FormField>
          </SpaceBetween>
        )}
      </Modal>
    </SpaceBetween>
  );
};
