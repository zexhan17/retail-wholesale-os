import React, { useState } from 'react';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Grid from '@cloudscape-design/components/grid';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Select from '@cloudscape-design/components/select';
import Modal from '@cloudscape-design/components/modal';
import Box from '@cloudscape-design/components/box';
import Alert from '@cloudscape-design/components/alert';

import { useAppStore } from '../../store/useAppStore';
import { StorageService } from '../../services/storage';
import { BusinessProfile, OperatingMode } from '../../types/settings';

export const SettingsPage: React.FC = () => {
  const profile = useAppStore((state) => state.profile);
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const updateProfile = useAppStore((state) => state.updateProfile);
  const addNotification = useAppStore((state) => state.addNotification);

  // Profile Form State
  const [storeName, setStoreName] = useState(profile.storeName);
  const [tagline, setTagline] = useState(profile.tagline);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [address, setAddress] = useState(profile.address);
  const [taxNumber, setTaxNumber] = useState(profile.taxNumber);
  const [currencySymbol, setCurrencySymbol] = useState(profile.currencySymbol);
  const [currencyCode, setCurrencyCode] = useState(profile.currencyCode);
  const [operatingMode, setOperatingMode] = useState<OperatingMode>(profile.operatingMode);
  const [receiptFooterMessage, setReceiptFooterMessage] = useState(profile.receiptFooterMessage);

  // Bank Info
  const [bankName, setBankName] = useState(profile.bankDetails?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(profile.bankDetails?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState(profile.bankDetails?.accountHolder || '');
  const [routingOrIfsc, setRoutingOrIfsc] = useState(profile.bankDetails?.routingOrIfsc || '');

  // Reset Confirmation Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleSaveProfile = () => {
    const updated: BusinessProfile = {
      storeName: storeName.trim(),
      tagline: tagline.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      taxNumber: taxNumber.trim(),
      currencySymbol: currencySymbol.trim() === '$' ? '' : currencySymbol.trim(),
      currencyCode: currencyCode.trim() || 'USD',
      operatingMode,
      receiptFooterMessage: receiptFooterMessage.trim(),
      bankDetails: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
        routingOrIfsc: routingOrIfsc.trim(),
      },
    };

    updateProfile(updated);
    addNotification({
      type: 'success',
      header: 'Configuration Saved',
      content: 'Store profile, tax details, and print headers updated successfully.',
    });
  };

  // Download JSON Backup
  const handleExportBackup = () => {
    const data = StorageService.exportFullBackup();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnistore_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addNotification({
      type: 'success',
      header: 'Backup Downloaded',
      content: 'Complete database JSON file exported safely to your device.',
    });
  };

  // Import JSON Backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        StorageService.restoreBackup(parsed);
        addNotification({
          type: 'success',
          header: 'Backup Restored',
          content: 'Database restored successfully! Reloading...',
        });
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        addNotification({
          type: 'error',
          header: 'Restore Failed',
          content: 'Invalid or corrupt backup JSON file.',
        });
      }
    };
    reader.readAsText(file);
  };

  // Reset to Demo
  const handleConfirmReset = () => {
    StorageService.resetToDemo();
    setIsResetModalOpen(false);
    window.location.reload();
  };

  return (
    <SpaceBetween size="l">
      {/* Header */}
      <Header
        variant="h1"
        description="Configure your shop details, currency, tax rules, and manage persistent database backups."
        actions={
          <Button variant="primary" onClick={handleSaveProfile} iconName="check">
            Save Changes
          </Button>
        }
      >
        ⚙️ Settings & Database Management
      </Header>

      {/* Profile & Tax Config */}
      <Container
        header={
          <Header variant="h2" description="Store identity rendered on thermal receipts and formal B2B tax invoices">
            Store Profile & Tax Credentials
          </Header>
        }
      >
        <SpaceBetween size="m">
          <Grid
            gridDefinition={[
              { colspan: { default: 12, m: 6 } },
              { colspan: { default: 12, m: 6 } },
            ]}
          >
            <FormField label="Store / Business Legal Name">
              <Input value={storeName} onChange={({ detail }) => setStoreName(detail.value)} />
            </FormField>

            <FormField label="Store Tagline / Slogan">
              <Input value={tagline} onChange={({ detail }) => setTagline(detail.value)} />
            </FormField>

            <FormField label="Phone Number">
              <Input value={phone} onChange={({ detail }) => setPhone(detail.value)} />
            </FormField>

            <FormField label="Email Address">
              <Input value={email} onChange={({ detail }) => setEmail(detail.value)} />
            </FormField>
          </Grid>

          <FormField label="Business Physical Address">
            <Input value={address} onChange={({ detail }) => setAddress(detail.value)} />
          </FormField>

          <Grid
            gridDefinition={[
              { colspan: { default: 12, m: 4 } },
              { colspan: { default: 6, m: 4 } },
              { colspan: { default: 6, m: 4 } },
            ]}
          >
            <FormField label="Tax Registration ID (GSTIN / VAT / EIN)">
              <Input value={taxNumber} onChange={({ detail }) => setTaxNumber(detail.value)} />
            </FormField>

            <FormField
              label="Currency Symbol"
              description="Leave empty for no symbol, or enter ₹, €, £ (dollar sign is disabled)"
            >
              <Input
                value={currencySymbol}
                onChange={({ detail }) => setCurrencySymbol(detail.value)}
                placeholder="₹, €, £ (or leave empty)"
              />
            </FormField>

            <FormField label="Currency Code">
              <Input
                value={currencyCode}
                onChange={({ detail }) => setCurrencyCode(detail.value)}
                placeholder="USD, INR, EUR"
              />
            </FormField>
          </Grid>

          <FormField label="Receipt Footer Message">
            <Input
              value={receiptFooterMessage}
              onChange={({ detail }) => setReceiptFooterMessage(detail.value)}
              placeholder="e.g. Thank you for shopping with us!"
            />
          </FormField>
        </SpaceBetween>
      </Container>

      {/* Bank Details for Wholesale Invoicing */}
      <Container
        header={
          <Header variant="h2" description="Printed on B2B Wholesale Tax Invoices for client wire / RTGS payments">
            Bank Wire Transfer Details
          </Header>
        }
      >
        <Grid
          gridDefinition={[
            { colspan: { default: 12, m: 6 } },
            { colspan: { default: 12, m: 6 } },
            { colspan: { default: 12, m: 6 } },
            { colspan: { default: 12, m: 6 } },
          ]}
        >
          <FormField label="Bank Name">
            <Input value={bankName} onChange={({ detail }) => setBankName(detail.value)} placeholder="e.g. JP Morgan Chase" />
          </FormField>
          <FormField label="Account Holder Name">
            <Input value={accountHolder} onChange={({ detail }) => setAccountHolder(detail.value)} />
          </FormField>
          <FormField label="Account Number">
            <Input value={accountNumber} onChange={({ detail }) => setAccountNumber(detail.value)} />
          </FormField>
          <FormField label="Routing / IFSC Code">
            <Input value={routingOrIfsc} onChange={({ detail }) => setRoutingOrIfsc(detail.value)} />
          </FormField>
        </Grid>
      </Container>

      {/* Database Backup & Maintenance */}
      <Container
        header={
          <Header variant="h2" description="Export and import your entire product catalog, customers, invoices, and ledger">
            Data Portability & Factory Reset
          </Header>
        }
      >
        <SpaceBetween size="m">
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="primary" iconName="download" onClick={handleExportBackup}>
              Download Full JSON Backup
            </Button>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                border: '1px solid #0972d3',
                borderRadius: '4px',
                background: isDark ? '#1e293b' : '#ffffff',
                color: isDark ? '#60a5fa' : '#0972d3',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              📥 Upload & Restore JSON Backup
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />
            </label>

            <Button variant="normal" iconName="refresh" onClick={() => setIsResetModalOpen(true)}>
              Reset to Factory Demo Data
            </Button>
          </div>

          <Alert type="info">
            All database state is stored locally and securely in your browser's persistent storage. You can download JSON backups anytime to migrate to other devices or machines.
          </Alert>
        </SpaceBetween>
      </Container>

      {/* Reset Confirmation Modal */}
      <Modal
        visible={isResetModalOpen}
        onDismiss={() => setIsResetModalOpen(false)}
        header="Reset to Factory Demo Data?"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setIsResetModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleConfirmReset}>
                Confirm Reset
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Box color="text-body-secondary">
          This will clear all current custom products, orders, and ledger entries, and reload the initial demo store data. This action cannot be undone unless you have a downloaded backup.
        </Box>
      </Modal>
    </SpaceBetween>
  );
};
