import React from 'react';
import { Badge } from '../../components/ui/badge';

import { useSalesStore } from '../../store/useSalesStore';
import { useProductStore } from '../../store/useProductStore';
import { useAppStore } from '../../store/useAppStore';
import { CurrencyText } from '../../components/common/CurrencyText';

export const AnalyticsPage: React.FC = () => {
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
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">📊 Financial & Sales Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive financial reporting, gross profit margins, retail vs wholesale channel analysis, and inventory velocity.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">TOTAL REVENUE</div>
          <div className="text-3xl font-bold text-blue-600">
            <CurrencyText amount={totalRevenue} />
          </div>
          <div className="text-sm text-muted-foreground mt-1">Across {invoices.length} total orders</div>
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">ESTIMATED GROSS PROFIT</div>
          <div className="text-3xl font-bold text-green-600">
            <CurrencyText amount={estimatedGrossProfit} />
          </div>
          <div className="text-sm text-muted-foreground mt-1">Margin: {grossMarginPercentage.toFixed(1)}%</div>
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">COST OF GOODS (COGS)</div>
          <div className="text-3xl font-bold">
            <CurrencyText amount={totalCOGS} />
          </div>
          <div className="text-sm text-muted-foreground mt-1">Inventory procurement cost</div>
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">TAX COLLECTED (GST / VAT)</div>
          <div className="text-3xl font-bold text-amber-600">
            <CurrencyText amount={totalTax} />
          </div>
          <div className="text-sm text-muted-foreground mt-1">Ready for tax filing</div>
        </div>
      </div>

      {/* Channel Comparison */}
      <div className="bg-card rounded-xl border shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Channel Performance Breakdown</h2>
          <p className="text-sm text-muted-foreground">Comparison between retail counter transactions and B2B wholesale distribution</p>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Retail Channel Card */}
          <div
            className={`border rounded-xl p-4 ${
              isDark ? 'border-emerald-700 bg-emerald-950' : 'border-emerald-500 bg-emerald-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className={`font-bold text-lg ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                ⚡ Retail Counter POS
              </div>
              <Badge className="bg-green-600 hover:bg-green-700">{retailInvoices.length} Bills</Badge>
            </div>
            <div className="text-3xl font-bold mt-3">
              <CurrencyText amount={retailRevenue} />
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Average Ticket Size:{' '}
              <CurrencyText
                amount={retailInvoices.length > 0 ? retailRevenue / retailInvoices.length : 0}
              />
            </div>
          </div>

          {/* Wholesale Channel Card */}
          <div
            className={`border rounded-xl p-4 ${
              isDark ? 'border-sky-700 bg-sky-950' : 'border-blue-500 bg-blue-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className={`font-bold text-lg ${isDark ? 'text-sky-400' : 'text-blue-800'}`}>
                📦 Wholesale B2B Commercial
              </div>
              <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">{wholesaleInvoices.length} Invoices</Badge>
            </div>
            <div className="text-3xl font-bold mt-3">
              <CurrencyText amount={wholesaleRevenue} />
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Average Ticket Size:{' '}
              <CurrencyText
                amount={wholesaleInvoices.length > 0 ? wholesaleRevenue / wholesaleInvoices.length : 0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Sellers vs Slow Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Movers */}
        <div className="lg:col-span-7 bg-card rounded-xl border shadow-sm flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Top Selling Products</h2>
            <p className="text-sm text-muted-foreground">Highest revenue generating products</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Units Sold</th>
                  <th className="px-4 py-3 font-medium">Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {topSellers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                      No sales recorded yet.
                    </td>
                  </tr>
                ) : (
                  topSellers.map((item, idx) => (
                    <tr key={idx} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                      </td>
                      <td className="px-4 py-3 font-bold">{item.unitsSold}</td>
                      <td className="px-4 py-3 font-bold text-blue-600">
                        <CurrencyText amount={item.revenue} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dead Stock / Attention Needed */}
        <div className="lg:col-span-5 bg-card rounded-xl border shadow-sm flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Dead Stock / Zero Movement</h2>
            <p className="text-sm text-muted-foreground">Products with zero recorded sales</p>
          </div>
          <div className="overflow-x-auto">
            {deadStock.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">All inventory items are actively moving!</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Tied Capital</th>
                  </tr>
                </thead>
                <tbody>
                  {deadStock.slice(0, 5).map((p, idx) => (
                    <tr key={idx} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">Stock: {p.stockQuantity}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <CurrencyText amount={p.stockQuantity * p.costPrice} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
