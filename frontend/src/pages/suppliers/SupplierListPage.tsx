import React, { useState } from 'react';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Input from '@cloudscape-design/components/input';
import Modal from '@cloudscape-design/components/modal';
import FormField from '@cloudscape-design/components/form-field';
import Grid from '@cloudscape-design/components/grid';

import { usePurchaseStore } from '../../store/usePurchaseStore';
import { useAppStore } from '../../store/useAppStore';
import { CurrencyText } from '../../components/common/CurrencyText';
import { Supplier } from '../../types/purchase';

export const SupplierListPage: React.FC = () => {
  const addNotification = useAppStore((state) => state.addNotification);
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const suppliers = usePurchaseStore((state) => state.suppliers);
  const addSupplier = usePurchaseStore((state) => state.addSupplier);
  const updateSupplier = usePurchaseStore((state) => state.updateSupplier);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      s.phone.includes(q)
    );
  });

  const openCreateModal = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setTaxId('');
    setPaymentTerms('Net 30');
    setIsAddModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contactPerson || '');
    setPhone(s.phone);
    setEmail(s.email || '');
    setAddress(s.address || '');
    setTaxId(s.taxId || '');
    setPaymentTerms(s.paymentTerms);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = () => {
    if (!name.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name: name.trim(),
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        taxId: taxId.trim() || undefined,
        paymentTerms: paymentTerms.trim(),
      });
      addNotification({
        type: 'success',
        header: 'Supplier Updated',
        content: `Updated ${name} successfully.`,
      });
    } else {
      addSupplier({
        name: name.trim(),
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        taxId: taxId.trim() || undefined,
        paymentTerms: paymentTerms.trim(),
      });
      addNotification({
        type: 'success',
        header: 'Supplier Registered',
        content: `${name} added to vendor directory.`,
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <SpaceBetween size="l">
      {/* Header */}
      <Header
        variant="h1"
        description="Vendor directory, accounts payable tracking, and purchase procurement."
        actions={
          <Button variant="primary" iconName="add-plus" onClick={openCreateModal}>
            Add New Supplier
          </Button>
        }
      >
        🏭 Suppliers & Vendors (Accounts Payable)
      </Header>

      {/* Search Bar */}
      <div
        style={{
          background: isDark ? '#1e293b' : '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        }}
      >
        <div style={{ maxWidth: '400px' }}>
          <Input
            value={searchQuery}
            onChange={({ detail }) => setSearchQuery(detail.value)}
            placeholder="Search suppliers by name, contact, phone..."
            type="search"
          />
        </div>
      </div>

      {/* Table */}
      <Table
        columnDefinitions={[
          {
            id: 'name',
            header: 'Supplier / Vendor',
            cell: (s) => (
              <div>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                {s.contactPerson && (
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Contact: {s.contactPerson}</div>
                )}
              </div>
            ),
          },
          {
            id: 'contact',
            header: 'Contact Info',
            cell: (s) => (
              <div>
                <div>{s.phone}</div>
                {s.email && <div style={{ fontSize: '11px', color: '#6b7280' }}>{s.email}</div>}
              </div>
            ),
          },
          {
            id: 'terms',
            header: 'Payment Terms',
            cell: (s) => s.paymentTerms,
          },
          {
            id: 'totalPurchased',
            header: 'Total Purchases',
            cell: (s) => (
              <span style={{ fontWeight: 500 }}>
                <CurrencyText amount={s.totalPurchased} />
              </span>
            ),
          },
          {
            id: 'balance',
            header: 'Payable Balance',
            cell: (s) => (
              <span
                style={{
                  fontWeight: 'bold',
                  color: s.outstandingBalance > 0 ? '#dc2626' : '#16a34a',
                }}
              >
                <CurrencyText amount={s.outstandingBalance} />
              </span>
            ),
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (s) => (
              <Button variant="inline-link" onClick={() => openEditModal(s)}>
                Edit
              </Button>
            ),
          },
        ]}
        items={filteredSuppliers}
        empty={<Box textAlign="center" padding="l">No suppliers registered.</Box>}
      />

      {/* Add / Edit Supplier Modal */}
      <Modal
        visible={isAddModalOpen}
        onDismiss={() => setIsAddModalOpen(false)}
        header={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Add New Supplier / Vendor'}
        size="medium"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddSubmit}>
                Save Supplier
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Supplier Company Name">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="e.g. Apex Agri Imports" />
          </FormField>

          <Grid
            gridDefinition={[
              { colspan: { default: 12, m: 6 } },
              { colspan: { default: 12, m: 6 } },
            ]}
          >
            <FormField label="Contact Person">
              <Input value={contactPerson} onChange={({ detail }) => setContactPerson(detail.value)} />
            </FormField>
            <FormField label="Phone Number">
              <Input value={phone} onChange={({ detail }) => setPhone(detail.value)} />
            </FormField>
          </Grid>

          <Grid
            gridDefinition={[
              { colspan: { default: 12, m: 6 } },
              { colspan: { default: 12, m: 6 } },
            ]}
          >
            <FormField label="Email">
              <Input value={email} onChange={({ detail }) => setEmail(detail.value)} />
            </FormField>
            <FormField label="Payment Terms">
              <Input value={paymentTerms} onChange={({ detail }) => setPaymentTerms(detail.value)} placeholder="e.g. Net 30" />
            </FormField>
          </Grid>

          <FormField label="Address">
            <Input value={address} onChange={({ detail }) => setAddress(detail.value)} />
          </FormField>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
};
