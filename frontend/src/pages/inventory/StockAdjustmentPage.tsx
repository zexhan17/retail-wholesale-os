import React, { useState } from 'react';
import { Check } from 'lucide-react';

import { useProductStore } from '../../store/useProductStore';
import { useAppStore } from '../../store/useAppStore';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';

interface AdjustmentHistoryRecord {
  id: string;
  date: string;
  productName: string;
  sku: string;
  deltaQuantity: number;
  reason: string;
  author: string;
}

export const StockAdjustmentPage: React.FC = () => {
  const addNotification = useAppStore((state) => state.addNotification);
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const products = useProductStore((state) => state.products);
  const adjustStock = useProductStore((state) => state.adjustStock);

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [adjustmentType, setAdjustmentType] = useState<'deduct' | 'add'>('deduct');
  const [reasonCategory, setReasonCategory] = useState('Damaged in transit / Unloading');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  const [history, setHistory] = useState<AdjustmentHistoryRecord[]>([
    {
      id: 'adj-1',
      date: '2025-05-11 14:10',
      productName: 'Cold-Pressed Extra Virgin Olive Oil (1L)',
      sku: 'OIL-OLV-1L',
      deltaQuantity: -2,
      reason: 'Broken bottle during shelf stocking',
      author: 'Warehouse Lead',
    },
    {
      id: 'adj-2',
      date: '2025-05-09 10:30',
      productName: 'Premium Royal Basmati Rice (5kg)',
      sku: 'RICE-BAS-05',
      deltaQuantity: 5,
      reason: 'Physical count audit found extra unrecorded bags',
      author: 'Inventory Manager',
    },
  ]);

  const activeProduct = products.find((p) => p.id === selectedProductId);

  const handleSubmit = () => {
    if (!activeProduct) return;
    const qty = parseInt(quantity) || 0;
    if (qty <= 0) return;

    const delta = adjustmentType === 'add' ? qty : -qty;
    const finalReason = `${reasonCategory}${notes ? `: ${notes}` : ''}`;

    adjustStock(activeProduct.id, delta, finalReason);

    const newRecord: AdjustmentHistoryRecord = {
      id: `adj-${Date.now()}`,
      date: new Date().toLocaleString(),
      productName: activeProduct.name,
      sku: activeProduct.sku,
      deltaQuantity: delta,
      reason: finalReason,
      author: 'Admin Operator',
    };

    setHistory([newRecord, ...history]);
    addNotification({
      type: 'success',
      header: 'Stock Level Updated',
      content: `${activeProduct.name} stock adjusted by ${delta > 0 ? '+' : ''}${delta} ${activeProduct.primaryUnit}s.`,
    });

    setQuantity('1');
    setNotes('');
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">⚖️ Stock Adjustments & Audit Log</h1>
        <p className="text-muted-foreground mt-2">
          Reconcile inventory audits, write off damaged or expired stock, and log audit trails.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Adjustment Form */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Create Stock Adjustment</CardTitle>
              <CardDescription>Enter physical inventory change details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label>Target Product</Label>
                  <Select value={selectedProductId} onValueChange={(v) => setSelectedProductId(v || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} (Current: {p.stockQuantity} {p.primaryUnit}s)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Adjustment Action</Label>
                  <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as 'deduct' | 'add')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deduct">🔻 Write-Off / Deduct Stock</SelectItem>
                      <SelectItem value="add">🔼 Add Found Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Reason Category</Label>
                  <Select value={reasonCategory} onValueChange={(v) => setReasonCategory(v || '')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Damaged in transit / Unloading">Damaged in transit / Unloading</SelectItem>
                      <SelectItem value="Expired batch write-off">Expired batch write-off</SelectItem>
                      <SelectItem value="Physical count discrepancy (Audit)">Physical count discrepancy (Audit)</SelectItem>
                      <SelectItem value="Store usage / Sample display">Store usage / Sample display</SelectItem>
                      <SelectItem value="Theft / Shrinkage loss">Theft / Shrinkage loss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Quantity in {activeProduct?.primaryUnit || 'Units'}</Label>
                  <Input
                    value={quantity}
                    type="number"
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Specific Audit Notes (Optional)</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Discovered dented cans in aisle 3 pallet"
                  />
                </div>

                {activeProduct && (
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800 text-sm">
                    <div>Current Stock: <strong className="font-semibold">{activeProduct.stockQuantity}</strong> {activeProduct.primaryUnit}s</div>
                    <div className="mt-1">
                      Projected Stock After Adjustment:{' '}
                      <strong className={adjustmentType === 'deduct' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-green-600 dark:text-green-400 font-bold'}>
                        {Math.max(
                          0,
                          activeProduct.stockQuantity +
                            (adjustmentType === 'add' ? parseInt(quantity) || 0 : -(parseInt(quantity) || 0))
                        )}
                      </strong>{' '}
                      {activeProduct.primaryUnit}s
                    </div>
                  </div>
                )}

                <Button className="w-full mt-2 gap-2" onClick={handleSubmit}>
                  <Check className="w-4 h-4" />
                  Apply Stock Adjustment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Log Table */}
        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Adjustment Audit History</CardTitle>
              <CardDescription>Recent stock reconciliation entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-muted-foreground text-left">
                      <th className="p-3 font-medium">Timestamp</th>
                      <th className="p-3 font-medium">Product</th>
                      <th className="p-3 font-medium text-center">Adjustment</th>
                      <th className="p-3 font-medium">Reason</th>
                      <th className="p-3 font-medium">Author</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{record.date}</td>
                        <td className="p-3">
                          <div className="font-medium">{record.productName}</div>
                          <div className="text-xs text-muted-foreground">{record.sku}</div>
                        </td>
                        <td
                          className={`p-3 text-center font-bold ${
                            record.deltaQuantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {record.deltaQuantity > 0 ? `+${record.deltaQuantity}` : record.deltaQuantity}
                        </td>
                        <td className="p-3 text-xs">{record.reason}</td>
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{record.author}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
