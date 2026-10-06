import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Grid from '@cloudscape-design/components/grid';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table from '@cloudscape-design/components/table';
import Link from '@cloudscape-design/components/link';

import { useAppStore } from '../../store/useAppStore';
import { useProductStore } from '../../store/useProductStore';
import { useCustomerStore } from '../../store/useCustomerStore';
import { useSalesStore } from '../../store/useSalesStore';
import { CurrencyText } from '../../components/common/CurrencyText';
import { InvoiceTypeBadge, PaymentStatusBadge, StockStatusIndicator } from '../../components/common/StatusBadge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const profile = useAppStore((state) => state.profile);
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const products = useProductStore((state) => state.products);
  const customers = useCustomerStore((state) => state.customers);
  const invoices = useSalesStore((state) => state.invoices);
  const drawerSession = useAppStore((state) => state.drawerSession);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stockQuantity <= p.reorderLevel).length,
    [products]
  );

  // Computed metrics
  const totalSalesRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const retailSales = invoices.filter((i) => i.type === 'retail');
  const wholesaleSales = invoices.filter((i) => i.type === 'wholesale');
  const retailRevenue = retailSales.reduce((sum, i) => sum + i.grandTotal, 0);
  const wholesaleRevenue = wholesaleSales.reduce((sum, i) => sum + i.grandTotal, 0);

  const totalKhataReceivables = customers
    .filter((c) => c.type === 'wholesale')
    .reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);

  const recentInvoices = invoices.slice(0, 5);

  return (
    <SpaceBetween size="l">
      {/* Page Header */}
      <Header
        variant="h1"
        description={`Welcome back to ${profile.storeName}. Real-time retail counters and wholesale ledger overview.`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="primary" iconName="add-plus" onClick={() => navigate('/pos')}>
              ⚡ Launch POS Counter
            </Button>
            <Button iconName="folder" onClick={() => navigate('/wholesale/billing')}>
              📦 New Wholesale Invoice
            </Button>
          </SpaceBetween>
        }
      >
        Operations Dashboard
      </Header>

      {/* KPI Cards Grid */}
      <Grid
        gridDefinition={[
          { colspan: { default: 12, s: 6, m: 3 } },
          { colspan: { default: 12, s: 6, m: 3 } },
          { colspan: { default: 12, s: 6, m: 3 } },
          { colspan: { default: 12, s: 6, m: 3 } },
        ]}
      >
        {/* KPI 1: Total Sales */}
        <Container>
          <Box color="text-label" fontSize="heading-xs">
            TOTAL SALES REVENUE
          </Box>
          <Box fontSize="display-l" fontWeight="bold" color="text-status-info" margin={{ top: 'xs' }}>
            <CurrencyText amount={totalSalesRevenue} />
          </Box>
          <Box fontSize="body-s" color="text-body-secondary" margin={{ top: 'xs' }}>
            {invoices.length} invoices ({retailSales.length} retail, {wholesaleSales.length} wholesale)
          </Box>
        </Container>

        {/* KPI 2: Wholesale Receivables */}
        <Container>
          <Box color="text-label" fontSize="heading-xs">
            OUTSTANDING KHATA CREDIT
          </Box>
          <Box fontSize="display-l" fontWeight="bold" color="text-status-warning" margin={{ top: 'xs' }}>
            <CurrencyText amount={totalKhataReceivables} />
          </Box>
          <Box fontSize="body-s" color="text-body-secondary" margin={{ top: 'xs' }}>
            Owed by B2B wholesale accounts
          </Box>
        </Container>

        {/* KPI 3: Cash Drawer Float */}
        <Container>
          <Box color="text-label" fontSize="heading-xs">
            CASH DRAWER ACTIVE
          </Box>
          <Box fontSize="display-l" fontWeight="bold" color="text-status-success" margin={{ top: 'xs' }}>
            <CurrencyText amount={drawerSession.expectedCash} />
          </Box>
          <Box fontSize="body-s" color="text-body-secondary" margin={{ top: 'xs' }}>
            {drawerSession.isOpen ? 'Register Open' : 'Register Closed'} (Float: {profile.currencySymbol}{drawerSession.openingFloat})
          </Box>
        </Container>

        {/* KPI 4: Low Stock Alert */}
        <Container>
          <Box color="text-label" fontSize="heading-xs">
            INVENTORY STATUS
          </Box>
          <Box
            fontSize="display-l"
            fontWeight="bold"
            color={lowStockCount > 0 ? 'text-status-error' : 'text-status-success'}
            margin={{ top: 'xs' }}
          >
            {lowStockCount > 0 ? `${lowStockCount} Low Stock` : 'Healthy'}
          </Box>
          <Box fontSize="body-s" color="text-body-secondary" margin={{ top: 'xs' }}>
            {products.length} active SKUs in catalog
          </Box>
        </Container>
      </Grid>

      {/* Dual Channel Split & Quick Actions */}
      <Grid
        gridDefinition={[
          { colspan: { default: 12, m: 7 } },
          { colspan: { default: 12, m: 5 } },
        ]}
      >
        {/* Channel Revenue Comparison */}
        <Container
          header={
            <Header variant="h2" description="Comparison between counter POS and bulk B2B invoices">
              Channel Revenue Distribution
            </Header>
          }
        >
          <SpaceBetween size="m">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>⚡ Retail Counter Sales</span>
                <span style={{ fontWeight: 'bold' }}>
                  <CurrencyText amount={retailRevenue} /> (
                  {totalSalesRevenue > 0
                    ? Math.round((retailRevenue / totalSalesRevenue) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div
                style={{
                  background: isDark ? '#334155' : '#e5e7eb',
                  borderRadius: '6px',
                  height: '14px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: '#10b981',
                    height: '100%',
                    width: `${totalSalesRevenue > 0 ? (retailRevenue / totalSalesRevenue) * 100 : 0}%`,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>📦 Wholesale B2B Invoices</span>
                <span style={{ fontWeight: 'bold' }}>
                  <CurrencyText amount={wholesaleRevenue} /> (
                  {totalSalesRevenue > 0
                    ? Math.round((wholesaleRevenue / totalSalesRevenue) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div
                style={{
                  background: isDark ? '#334155' : '#e5e7eb',
                  borderRadius: '6px',
                  height: '14px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: '#0972d3',
                    height: '100%',
                    width: `${totalSalesRevenue > 0 ? (wholesaleRevenue / totalSalesRevenue) * 100 : 0}%`,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            <Box margin={{ top: 'm' }}>
              <SpaceBetween direction="horizontal" size="s">
                <Button onClick={() => navigate('/reports/analytics')} iconName="status-positive">
                  Full Analytics & Margin Report
                </Button>
                <Button onClick={() => navigate('/reports/day-end')} iconName="file">
                  Day-End Cash Reconciliation (Z-Report)
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>

        {/* Quick Operational Shortcuts */}
        <Container
          header={
            <Header variant="h2" description="Instant shortcuts for daily store operations">
              Quick Actions
            </Header>
          }
        >
          <SpaceBetween size="s">
            <Button fullWidth variant="primary" iconName="add-plus" onClick={() => navigate('/pos')}>
              Launch Retail Checkout POS
            </Button>
            <Button fullWidth iconName="folder" onClick={() => navigate('/wholesale/billing')}>
              Create B2B Wholesale Invoice
            </Button>
            <Button fullWidth iconName="user-profile" onClick={() => navigate('/customers')}>
              Manage Customer Khata Ledger
            </Button>
            <Button fullWidth iconName="upload" onClick={() => navigate('/purchases')}>
              Stock Inwarding (Goods Receipt)
            </Button>
            <Button fullWidth iconName="settings" onClick={() => navigate('/settings')}>
              Backup Data or System Settings
            </Button>
          </SpaceBetween>
        </Container>
      </Grid>

      {/* Recent Transactions Table */}
      <Table
        header={
          <Header
            variant="h2"
            actions={
              <Button onClick={() => navigate('/invoices')}>View All Invoices</Button>
            }
          >
            Recent Transactions
          </Header>
        }
        columnDefinitions={[
          {
            id: 'invoiceNumber',
            header: 'Invoice #',
            cell: (inv) => <span style={{ fontWeight: 600 }}>{inv.invoiceNumber}</span>,
          },
          {
            id: 'type',
            header: 'Channel',
            cell: (inv) => <InvoiceTypeBadge type={inv.type} />,
          },
          {
            id: 'customer',
            header: 'Customer',
            cell: (inv) => inv.customerName,
          },
          {
            id: 'date',
            header: 'Date',
            cell: (inv) => inv.date,
          },
          {
            id: 'total',
            header: 'Amount',
            cell: (inv) => (
              <span style={{ fontWeight: 'bold' }}>
                <CurrencyText amount={inv.grandTotal} />
              </span>
            ),
          },
          {
            id: 'paymentStatus',
            header: 'Status',
            cell: (inv) => <PaymentStatusBadge status={inv.paymentStatus} />,
          },
          {
            id: 'action',
            header: 'Action',
            cell: (inv) => (
              <Button
                variant="inline-link"
                onClick={() => navigate(`/invoices?view=${inv.id}`)}
              >
                View
              </Button>
            ),
          },
        ]}
        items={recentInvoices}
        empty={<Box textAlign="center">No transactions recorded yet.</Box>}
      />
    </SpaceBetween>
  );
};
