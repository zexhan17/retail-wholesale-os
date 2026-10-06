import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Grid from '@cloudscape-design/components/grid';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table from '@cloudscape-design/components/table';
import Modal from '@cloudscape-design/components/modal';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Select from '@cloudscape-design/components/select';
import Badge from '@cloudscape-design/components/badge';

import { useCustomerStore } from '../../store/useCustomerStore';
import { useAppStore } from '../../store/useAppStore';
import { CurrencyText } from '../../components/common/CurrencyText';

export const CustomerLedgerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const profile = useAppStore((state) => state.profile);
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
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
      <Container>
        <Box textAlign="center" padding="l">
          <p>Customer not found.</p>
          <Button onClick={() => navigate('/customers')}>Back to Customers</Button>
        </Box>
      </Container>
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
    <SpaceBetween size="l">
      {/* Header */}
      <Header
        variant="h1"
        description={`Statement of Account & Khata Ledger for ${customer.companyName || customer.name}`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => navigate('/customers')}>Back to Directory</Button>
            <Button iconName="download" onClick={handlePrintStatement}>
              Print Statement
            </Button>
            <Button
              variant="primary"
              iconName="add-plus"
              onClick={() => {
                setPaymentAmount(customer.currentBalance > 0 ? customer.currentBalance.toString() : '');
                setIsPaymentModalOpen(true);
              }}
            >
              Collect Payment
            </Button>
          </SpaceBetween>
        }
      >
        📖 Customer Khata Statement
      </Header>

      {/* Account Info Cards */}
      <Grid
        gridDefinition={[
          { colspan: { default: 12, s: 6, m: 3 } },
          { colspan: { default: 12, s: 6, m: 3 } },
          { colspan: { default: 12, s: 6, m: 3 } },
          { colspan: { default: 12, s: 6, m: 3 } },
        ]}
      >
        <Container>
          <Box color="text-label" fontSize="heading-xs">OUTSTANDING DUE</Box>
          <Box
            fontSize="display-l"
            fontWeight="bold"
            color={customer.currentBalance > 0 ? 'text-status-error' : 'text-status-success'}
            margin={{ top: 'xs' }}
          >
            <CurrencyText amount={customer.currentBalance} />
          </Box>
          <Box fontSize="body-s" color="text-body-secondary" margin={{ top: 'xs' }}>
            Current Net Balance
          </Box>
        </Container>

        <Container>
          <Box color="text-label" fontSize="heading-xs">CREDIT LIMIT</Box>
          <Box fontSize="display-l" fontWeight="bold" color="text-status-info" margin={{ top: 'xs' }}>
            <CurrencyText amount={customer.creditLimit} />
          </Box>
          <Box fontSize="body-s" color="text-body-secondary" margin={{ top: 'xs' }}>
            Available Headroom: <CurrencyText amount={Math.max(0, customer.creditLimit - customer.currentBalance)} />
          </Box>
        </Container>

        <Container>
          <Box color="text-label" fontSize="heading-xs">TOTAL BILLED (LIFETIME)</Box>
          <Box fontSize="display-l" fontWeight="bold" margin={{ top: 'xs' }}>
            <CurrencyText amount={totalBilled} />
          </Box>
          <Box fontSize="body-s" color="text-body-secondary" margin={{ top: 'xs' }}>
            Total Invoices Generated
          </Box>
        </Container>

        <Container>
          <Box color="text-label" fontSize="heading-xs">TOTAL PAID (LIFETIME)</Box>
          <Box fontSize="display-l" fontWeight="bold" color="text-status-success" margin={{ top: 'xs' }}>
            <CurrencyText amount={totalPaid} />
          </Box>
          <Box fontSize="body-s" color="text-body-secondary" margin={{ top: 'xs' }}>
            Cleared Settlements
          </Box>
        </Container>
      </Grid>

      {/* Customer Meta Details */}
      <Container>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Buyer Name</div>
            <div style={{ fontWeight: 600 }}>{customer.companyName || customer.name}</div>
          </div>
          <div>
            <div style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Contact Person</div>
            <div>{customer.name}</div>
          </div>
          <div>
            <div style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Tax ID (GSTIN/VAT)</div>
            <div>{customer.taxId || 'N/A'}</div>
          </div>
          <div>
            <div style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Phone</div>
            <div>{customer.phone}</div>
          </div>
          <div>
            <div style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Payment Terms</div>
            <div>{customer.paymentTerms.toUpperCase().replace('_', ' ')}</div>
          </div>
        </div>
      </Container>

      {/* Ledger Table */}
      <Table
        header={
          <Header variant="h2" description="Chronological record of invoices billed, payments received, and running balance">
            Statement of Account
          </Header>
        }
        columnDefinitions={[
          {
            id: 'date',
            header: 'Date',
            cell: (e) => e.date,
          },
          {
            id: 'type',
            header: 'Type',
            cell: (e) => (
              <Badge color={e.type === 'invoice' ? 'blue' : e.type === 'payment_received' ? 'green' : 'grey'}>
                {e.type.toUpperCase().replace('_', ' ')}
              </Badge>
            ),
          },
          {
            id: 'ref',
            header: 'Reference #',
            cell: (e) => <span style={{ fontWeight: 600 }}>{e.referenceId}</span>,
          },
          {
            id: 'desc',
            header: 'Description',
            cell: (e) => e.description,
          },
          {
            id: 'debit',
            header: 'Debit (Billed +)',
            cell: (e) => (
              <span style={{ fontWeight: e.debit > 0 ? 'bold' : 'normal', color: e.debit > 0 ? '#dc2626' : undefined }}>
                {e.debit > 0 ? <CurrencyText amount={e.debit} /> : '-'}
              </span>
            ),
          },
          {
            id: 'credit',
            header: 'Credit (Paid -)',
            cell: (e) => (
              <span style={{ fontWeight: e.credit > 0 ? 'bold' : 'normal', color: e.credit > 0 ? '#16a34a' : undefined }}>
                {e.credit > 0 ? <CurrencyText amount={e.credit} /> : '-'}
              </span>
            ),
          },
          {
            id: 'balance',
            header: 'Running Balance',
            cell: (e) => (
              <span style={{ fontWeight: 'bold' }}>
                <CurrencyText amount={e.runningBalance} />
              </span>
            ),
          },
        ]}
        items={ledgerEntries}
        empty={<Box textAlign="center" padding="l">No ledger transactions recorded for this account.</Box>}
      />

      {/* Collect Payment Modal */}
      <Modal
        visible={isPaymentModalOpen}
        onDismiss={() => setIsPaymentModalOpen(false)}
        header={`Record Payment Receipt: ${customer.companyName || customer.name}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handlePaymentSubmit}>
                Confirm Payment & Post to Ledger
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <div>
            Current Balance Owed:{' '}
            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
              <CurrencyText amount={customer.currentBalance} />
            </span>
          </div>

          <FormField label="Amount Received">
            <Input
              value={paymentAmount}
              type="number"
              onChange={({ detail }) => setPaymentAmount(detail.value)}
            />
          </FormField>

          <FormField label="Payment Method">
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

          <FormField label="Bank Slip / Wire / Cheque Reference #">
            <Input
              value={paymentReference}
              onChange={({ detail }) => setPaymentReference(detail.value)}
              placeholder="e.g. WIRE-TXN-1002 or CHQ-0992"
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
};
