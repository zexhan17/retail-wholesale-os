import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';

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
          type: 'error', // mapping generic error string for standard usage
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
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">⚙️ Settings & Database Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure your shop details, currency, tax rules, and manage persistent database backups.
          </p>
        </div>
        <Button onClick={handleSaveProfile}>
          Save Changes
        </Button>
      </div>

      {/* Profile & Tax Config */}
      <div className="bg-card rounded-xl border shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Store Profile & Tax Credentials</h2>
          <p className="text-sm text-muted-foreground">Store identity rendered on thermal receipts and formal B2B tax invoices</p>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Store / Business Legal Name</Label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Store Tagline / Slogan</Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Email Address</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Business Physical Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="sm:col-span-2 grid gap-2">
              <Label>Tax Registration ID (GSTIN / VAT / EIN)</Label>
              <Input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Currency Symbol</Label>
              <Input
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="₹, €, £ (or empty)"
              />
              <p className="text-[11px] text-muted-foreground">Leave empty for no symbol</p>
            </div>
            <div className="grid gap-2">
              <Label>Currency Code</Label>
              <Input
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                placeholder="USD, INR, EUR"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Receipt Footer Message</Label>
            <Input
              value={receiptFooterMessage}
              onChange={(e) => setReceiptFooterMessage(e.target.value)}
              placeholder="e.g. Thank you for shopping with us!"
            />
          </div>
        </div>
      </div>

      {/* Bank Details for Wholesale Invoicing */}
      <div className="bg-card rounded-xl border shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Bank Wire Transfer Details</h2>
          <p className="text-sm text-muted-foreground">Printed on B2B Wholesale Tax Invoices for client wire / RTGS payments</p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="grid gap-2">
            <Label>Bank Name</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. JP Morgan Chase" />
          </div>
          <div className="grid gap-2">
            <Label>Account Holder Name</Label>
            <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Account Number</Label>
            <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Routing / IFSC Code</Label>
            <Input value={routingOrIfsc} onChange={(e) => setRoutingOrIfsc(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Database Backup & Maintenance */}
      <div className="bg-card rounded-xl border shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Data Portability & Factory Reset</h2>
          <p className="text-sm text-muted-foreground">Export and import your entire product catalog, customers, invoices, and ledger</p>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="default" onClick={handleExportBackup}>
              Download Full JSON Backup
            </Button>

            <label className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 cursor-pointer">
              📥 Upload & Restore JSON Backup
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
            </label>

            <Button variant="outline" onClick={() => setIsResetModalOpen(true)}>
              Reset to Factory Demo Data
            </Button>
          </div>

          <div className="bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 p-3 rounded-md border border-blue-200 dark:border-blue-800 text-sm">
            All database state is stored locally and securely in your browser's persistent storage. You can download JSON backups anytime to migrate to other devices or machines.
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset to Factory Demo Data?</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-muted-foreground text-sm">
            This will clear all current custom products, orders, and ledger entries, and reload the initial demo store data. This action cannot be undone unless you have a downloaded backup.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmReset}>Confirm Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
