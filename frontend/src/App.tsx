import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useAppStore } from './store/useAppStore';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { POSPage } from './pages/pos/POSPage';
import { WholesaleBillingPage } from './pages/wholesale/WholesaleBillingPage';
import { InvoicesListPage } from './pages/wholesale/InvoicesListPage';
import { ProductListPage } from './pages/inventory/ProductListPage';
import { StockAdjustmentPage } from './pages/inventory/StockAdjustmentPage';
import { CustomerListPage } from './pages/customers/CustomerListPage';
import { CustomerLedgerPage } from './pages/customers/CustomerLedgerPage';
import { SupplierListPage } from './pages/suppliers/SupplierListPage';
import { PurchaseOrderPage } from './pages/suppliers/PurchaseOrderPage';
import { DayEndClosingPage } from './pages/reports/DayEndClosingPage';
import { AnalyticsPage } from './pages/reports/AnalyticsPage';
import { SettingsPage } from './pages/settings/SettingsPage';

export const App: React.FC = () => {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/wholesale/billing" element={<WholesaleBillingPage />} />
          <Route path="/invoices" element={<InvoicesListPage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/stock-adjustments" element={<StockAdjustmentPage />} />
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/:id/ledger" element={<CustomerLedgerPage />} />
          <Route path="/suppliers" element={<SupplierListPage />} />
          <Route path="/purchases" element={<PurchaseOrderPage />} />
          <Route path="/reports/day-end" element={<DayEndClosingPage />} />
          <Route path="/reports/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
