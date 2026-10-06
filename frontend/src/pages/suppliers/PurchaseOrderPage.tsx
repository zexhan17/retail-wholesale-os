import React, { useState } from 'react';
import { Plus, Download, X } from 'lucide-react';

import { usePurchaseStore } from '../../store/usePurchaseStore';
import { useProductStore } from '../../store/useProductStore';
import { useAppStore } from '../../store/useAppStore';
import { CurrencyText } from '../../components/common/CurrencyText';
import { PurchaseOrder, PurchaseOrderItem } from '../../types/purchase';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../../components/ui/table';
import { Card, CardContent } from '../../components/ui/card';

export const PurchaseOrderPage: React.FC = () => {
  const profile = useAppStore((state) => state.profile);
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const addNotification = useAppStore((state) => state.addNotification);

  const suppliers = usePurchaseStore((state) => state.suppliers);
  const purchaseOrders = usePurchaseStore((state) => state.purchaseOrders);
  const createPurchaseOrder = usePurchaseStore((state) => state.createPurchaseOrder);
  const receivePurchaseOrder = usePurchaseStore((state) => state.receivePurchaseOrder);

  const products = useProductStore((state) => state.products);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      sku: products[0]?.sku || '',
      unit: products[0]?.primaryUnit || 'Piece',
      quantity: 50,
      unitCost: products[0]?.costPrice || 10,
      taxRate: products[0]?.taxRate || 5,
      total: 50 * (products[0]?.costPrice || 10),
    },
  ]);

  const activeSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  const handleAddItem = () => {
    const p = products[0];
    if (!p) return;
    setPoItems([
      ...poItems,
      {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        unit: p.primaryUnit,
        quantity: 20,
        unitCost: p.costPrice,
        taxRate: p.taxRate,
        total: 20 * p.costPrice,
      },
    ]);
  };

  const handleUpdateItem = (index: number, updates: Partial<PurchaseOrderItem>) => {
    const updated = [...poItems];
    const current = { ...updated[index], ...updates };
    current.total = Number((current.quantity * current.unitCost).toFixed(2));
    updated[index] = current;
    setPoItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const poSubtotal = poItems.reduce((sum, i) => sum + i.total, 0);
  const poTaxTotal = poItems.reduce((sum, i) => sum + (i.total * (i.taxRate || 0)) / 100, 0);
  const poGrandTotal = Number((poSubtotal + poTaxTotal).toFixed(2));

  const handleCreateSubmit = () => {
    if (!activeSupplier || poItems.length === 0) return;

    const poNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    createPurchaseOrder({
      poNumber,
      supplierId: activeSupplier.id,
      supplierName: activeSupplier.name,
      orderDate: new Date().toISOString().split('T')[0],
      items: poItems,
      subtotal: poSubtotal,
      taxTotal: poTaxTotal,
      grandTotal: poGrandTotal,
      status: 'ordered',
      paymentStatus: 'unpaid',
      paidAmount: 0,
      notes: 'Standard replenishment order',
    });

    addNotification({
      type: 'success',
      header: 'Purchase Order Created',
      content: `Purchase Order #${poNumber} generated for ${activeSupplier.name}.`,
    });

    setIsCreateModalOpen(false);
  };

  const handleReceiveGoods = (po: PurchaseOrder) => {
    receivePurchaseOrder(po.id);
    addNotification({
      type: 'success',
      header: 'Goods Received (Stock Inwarded)',
      content: `Inwarded all products from PO #${po.poNumber} into inventory stock!`,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📋 Purchase Orders & Goods Inwarding</h1>
          <p className="text-muted-foreground mt-2">
            Procure stock from manufacturers and suppliers, log inward shipments, and update inventory counts.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="shrink-0 gap-2">
          <Plus className="w-4 h-4" />
          Create Purchase Order
        </Button>
      </div>

      {/* PO Table */}
      <Card>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Order Total</TableHead>
                <TableHead>Shipment Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.length > 0 ? (
                purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-semibold">{po.poNumber}</TableCell>
                    <TableCell>{po.supplierName}</TableCell>
                    <TableCell>{po.orderDate}</TableCell>
                    <TableCell>{po.items.length} item line(s)</TableCell>
                    <TableCell className="font-bold">
                      <CurrencyText amount={po.grandTotal} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={po.status === 'received' ? 'default' : 'secondary'} className={po.status === 'received' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}>
                        {po.status === 'received' ? 'RECEIVED & INWARDED' : 'ORDERED / IN TRANSIT'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={po.paymentStatus === 'paid' ? 'border-green-600 text-green-600' : 'border-slate-300 text-slate-500'}>
                        {po.paymentStatus.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {po.status === 'ordered' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReceiveGoods(po)}
                          className="gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400"
                        >
                          <Download className="w-4 h-4" />
                          Receive Stock
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No purchase orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create PO Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Supplier Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label>Select Supplier / Manufacturer</Label>
              <Select value={selectedSupplierId} onValueChange={(v) => setSelectedSupplierId(v || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <strong className="text-sm font-semibold">Procurement Line Items</strong>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Product
                </Button>
              </div>

              <div className="space-y-3">
                {poItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <div className="sm:col-span-5 grid gap-2">
                      <Label className="text-xs">Product</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(val) => {
                          const selectedProd = products.find((p) => p.id === val);
                          if (selectedProd) {
                            handleUpdateItem(idx, {
                              productId: selectedProd.id,
                              productName: selectedProd.name,
                              sku: selectedProd.sku,
                              unit: selectedProd.primaryUnit,
                              unitCost: selectedProd.costPrice,
                              taxRate: selectedProd.taxRate,
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-2 grid gap-2">
                      <Label className="text-xs">Quantity ({item.unit})</Label>
                      <Input
                        value={item.quantity.toString()}
                        type="number"
                        onChange={(e) =>
                          handleUpdateItem(idx, { quantity: parseInt(e.target.value) || 1 })
                        }
                      />
                    </div>

                    <div className="sm:col-span-2 grid gap-2">
                      <Label className="text-xs">Unit Cost</Label>
                      <Input
                        value={item.unitCost.toString()}
                        type="number"
                        onChange={(e) =>
                          handleUpdateItem(idx, { unitCost: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>

                    <div className="sm:col-span-2 grid gap-2 pb-2">
                      <Label className="text-xs text-muted-foreground">Line Total</Label>
                      <div className="font-bold">
                        <CurrencyText amount={item.total} />
                      </div>
                    </div>

                    <div className="sm:col-span-1 flex justify-end pb-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={poItems.length === 1}
                        onClick={() => handleRemoveItem(idx)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm mt-4">
                <span className="font-medium">Estimated Grand Total (Tax Incl.):</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  <CurrencyText amount={poGrandTotal} />
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSubmit}>Issue Purchase Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
