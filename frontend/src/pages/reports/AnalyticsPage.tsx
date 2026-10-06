import React from 'react';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Grid from '@cloudscape-design/components/grid';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Table from '@cloudscape-design/components/table';
import Badge from '@cloudscape-design/components/badge';

import { useSalesStore } from '../../store/useSalesStore';
import { useProductStore } from '../../store/useProductStore';
import { useAppStore } from '../../store/useAppStore';
import { CurrencyText } from '../../components/common/CurrencyText';

export const AnalyticsPage: React.FC = () => {
  const profile = useAppStore((state) => state.profile);
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const invoices = useSalesStore((state) => state.invoices);
  const products = useProductStore((state) => state.products);

  // Financial aggregates
  const totalRevenue = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalTax = invoices.reduce((sum, i) => sum + i.taxTotal, 0);
  const totalDiscount = invoices.reduce((sum, i) => sum + i.discountTotal, 0);

  // Calculate COGS (Cost of Goods Sold)
  const totalCOGS = invoices.reduce((sum, inv) => {
    return (
      sum +
      inv.items.reduce((itemSum, item) => {
        return itemSum + item.costPrice * item.quantity;
      }, 0)
    );
  }, 0);

  const estimatedGrossProfit = totalRevenue - totalCOGS - totalTax;
  const grossMarginPercentage = totalRevenue > 0 ? (estimatedGrossProfit / totalRevenue) * 100 : 0;

  // Channel breakdown
  const retailInvoices = invoices.filter((i) => i.type === 'retail');
  const wholesaleInvoices = invoices.filter((i) => i.type === 'wholesale');
  const retailRevenue = retailInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const wholesaleRevenue = wholesaleInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

  // Product sales velocity
  const productSalesMap = new Map<string, { name: string; sku: string; unitsSold: number; revenue: number }>();

  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const existing = productSalesMap.get(item.productId) || {
        name: item.productName,
        sku: item.sku,
        unitsSold: 0,
        revenue: 0,
      };
      existing.unitsSold += item.totalPrimaryUnits;
      existing.revenue += item.total;
      productSalesMap.set(item.productId, existing);
    });
  });

  const productSalesList = Array.from(productSalesMap.values()).sort((a, b) => b.revenue - a.revenue);
  const topSellers = productSalesList.slice(0, 5);

  // Products with zero sales
  const deadStock = products.filter((p) => !productSalesMap.has(p.id));

  return (
    <SpaceBetween size="l">
      {/* Header */}
      <Header
        variant="h1"
        description="Comprehensive financial reporting, gross profit margins, retail vs wholesale channel analysis, and inventory velocity."
      >
        📊 Financial & Sales Analytics
      </Header>

      {/* KPI Cards */}
      <Grid
        gridDefinition={[
          { colspan: { default: 12, s: 6, m: 3 } },
          { colspan: { default: 12, s: 6, m: 3 } },
          { colspan: { default: 12, s: 6, m: 3 } },
          { colspan: { default: 12, s: 6, m: 3 } },
        ]}
      >
        <Container>
          <Box color="text-label" fontSize="heading-xs">TOTAL REVENUE</Box>
          <Box fontSize="display-l" fontWeight="bold" color="text-status-info" margin={{ top: 'xs' }}>
            <CurrencyText amount={totalRevenue} />
          </Box>
          <Box fontSize="body-s" color="text-body-secondary" margin={{ top: 'xs' }}>
            Across {invoices.length} total orders
          </Box>
        </Container>

        <Container>
          <Box color="text-label" fontSize="heading-xs">ESTIMATED GROSS PROFIT</Box>
          <Box fontSize="display-l" fontWeight="bold" color="text-status-success" margin={{ top: 'xs' }}>
            <CurrencyText amount={estimatedGrossProfit} />
          </Box>
          <Box fontSize="body-s" color="text-body-secondary" margin={{ top: 'xs' }}>
            Margin: {grossMarginPercentage.toFixed(1)}%
          </Box>
        </Container>

        <Container>
          <Box color="text-label" fontSize="heading-xs">COST OF GOODS (COGS)</Box>
          <Box fontSize="display-l" fontWeight="bold" margin={{ top: 'xs' }}>
            <CurrencyText amount={totalCOGS} />
          </Box>
          <Box fontSize="body-s" color="text-body-secondary" margin={{ top: 'xs' }}>
            Inventory procurement cost
          </Box>
        </Container>

        <Container>
          <Box color="text-label" fontSize="heading-xs">TAX COLLECTED (GST / VAT)</Box>
          <Box fontSize="display-l" fontWeight="bold" color="text-status-warning" margin={{ top: 'xs' }}>
            <CurrencyText amount={totalTax} />
          </Box>
          <Box fontSize="body-s" color="text-body-secondary" margin={{ top: 'xs' }}>
            Ready for tax filing
          </Box>
        </Container>
      </Grid>

      {/* Channel Comparison */}
      <Container
        header={
          <Header variant="h2" description="Comparison between retail counter transactions and B2B wholesale distribution">
            Channel Performance Breakdown
          </Header>
        }
      >
        <Grid
          gridDefinition={[
            { colspan: { default: 12, m: 6 } },
            { colspan: { default: 12, m: 6 } },
          ]}
        >
          {/* Retail Channel Card */}
          <div
            style={{
              border: `1px solid ${isDark ? '#059669' : '#10b981'}`,
              borderRadius: '8px',
              padding: '16px',
              background: isDark ? '#064e3b' : '#f0fdf4',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: isDark ? '#6ee7b7' : '#065f46' }}>
                ⚡ Retail Counter POS
              </div>
              <Badge color="green">{retailInvoices.length} Bills</Badge>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '10px', color: isDark ? '#f8fafc' : '#0f172a' }}>
              <CurrencyText amount={retailRevenue} />
            </div>
            <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#4b5563', marginTop: '4px' }}>
              Average Ticket Size:{' '}
              <CurrencyText
                amount={retailInvoices.length > 0 ? retailRevenue / retailInvoices.length : 0}
              />
            </div>
          </div>

          {/* Wholesale Channel Card */}
          <div
            style={{
              border: `1px solid ${isDark ? '#0284c7' : '#0972d3'}`,
              borderRadius: '8px',
              padding: '16px',
              background: isDark ? '#0c4a6e' : '#f0f9ff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: isDark ? '#7dd3fc' : '#075985' }}>
                📦 Wholesale B2B Commercial
              </div>
              <Badge color="blue">{wholesaleInvoices.length} Invoices</Badge>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '10px', color: isDark ? '#f8fafc' : '#0f172a' }}>
              <CurrencyText amount={wholesaleRevenue} />
            </div>
            <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#4b5563', marginTop: '4px' }}>
              Average Ticket Size:{' '}
              <CurrencyText
                amount={wholesaleInvoices.length > 0 ? wholesaleRevenue / wholesaleInvoices.length : 0}
              />
            </div>
          </div>
        </Grid>
      </Container>

      {/* Top Sellers vs Slow Movers */}
      <Grid
        gridDefinition={[
          { colspan: { default: 12, m: 7 } },
          { colspan: { default: 12, m: 5 } },
        ]}
      >
        {/* Top Movers */}
        <Container
          header={
            <Header variant="h2" description="Highest revenue generating products">
              Top Selling Products
            </Header>
          }
        >
          <Table
            columnDefinitions={[
              {
                id: 'product',
                header: 'Product',
                cell: (item) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>SKU: {item.sku}</div>
                  </div>
                ),
              },
              {
                id: 'units',
                header: 'Units Sold',
                cell: (item) => (
                  <span style={{ fontWeight: 'bold' }}>{item.unitsSold}</span>
                ),
              },
              {
                id: 'revenue',
                header: 'Revenue Generated',
                cell: (item) => (
                  <span style={{ fontWeight: 'bold', color: '#0972d3' }}>
                    <CurrencyText amount={item.revenue} />
                  </span>
                ),
              },
            ]}
            items={topSellers}
            empty={<Box textAlign="center">No sales recorded yet.</Box>}
          />
        </Container>

        {/* Dead Stock / Attention Needed */}
        <Container
          header={
            <Header variant="h2" description="Products with zero recorded sales">
              Dead Stock / Zero Movement
            </Header>
          }
        >
          {deadStock.length === 0 ? (
            <Box textAlign="center" padding="m">All inventory items are actively moving!</Box>
          ) : (
            <Table
              columnDefinitions={[
                {
                  id: 'name',
                  header: 'Product',
                  cell: (p) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Stock: {p.stockQuantity}</div>
                    </div>
                  ),
                },
                {
                  id: 'tiedCapital',
                  header: 'Tied Capital',
                  cell: (p) => (
                    <CurrencyText amount={p.stockQuantity * p.costPrice} />
                  ),
                },
              ]}
              items={deadStock.slice(0, 5)}
            />
          )}
        </Container>
      </Grid>
    </SpaceBetween>
  );
};
