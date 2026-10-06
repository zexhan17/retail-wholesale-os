import React, { useState, useMemo } from 'react';
import { Plus, Search, X } from 'lucide-react';

import { useProductStore } from '../../store/useProductStore';
import { useAppStore } from '../../store/useAppStore';
import { Product, PriceTier } from '../../types/product';
import { CurrencyText } from '../../components/common/CurrencyText';
import { StockStatusIndicator } from '../../components/common/StatusBadge';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
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

export const ProductListPage: React.FC = () => {
  const profile = useAppStore((state) => state.profile);
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const addNotification = useAppStore((state) => state.addNotification);

  const products = useProductStore((state) => state.products);
  const addProduct = useProductStore((state) => state.addProduct);
  const updateProduct = useProductStore((state) => state.updateProduct);
  const deleteProduct = useProductStore((state) => state.deleteProduct);
  const adjustStock = useProductStore((state) => state.adjustStock);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Add/Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('General');
  const [primaryUnit, setPrimaryUnit] = useState('Piece');
  const [packagingUnit, setPackagingUnit] = useState('Carton');
  const [packagingMultiplier, setPackagingMultiplier] = useState('12');
  const [costPrice, setCostPrice] = useState('10.00');
  const [retailPrice, setRetailPrice] = useState('15.00');
  const [taxRate, setTaxRate] = useState('5');
  const [reorderLevel, setReorderLevel] = useState('20');
  const [stockQuantity, setStockQuantity] = useState('100');
  const [tiers, setTiers] = useState<PriceTier[]>([
    { minQuantity: 12, pricePerUnit: 13.00, label: 'Carton Slab (12+)' },
    { minQuantity: 48, pricePerUnit: 11.50, label: 'Bulk Slab (48+)' },
  ]);

  // Quick Adjust Modal State
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState('0');
  const [adjustReason, setAdjustReason] = useState('Inventory recount');

  // Delete Modal State
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginated = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`SKU-${Date.now().toString().slice(-4)}`);
    setBarcode(`890${Date.now().toString().slice(-10)}`);
    setCategory('Grocery & Staples');
    setPrimaryUnit('Piece');
    setPackagingUnit('Carton');
    setPackagingMultiplier('12');
    setCostPrice('8.00');
    setRetailPrice('12.00');
    setTaxRate('5');
    setReorderLevel('20');
    setStockQuantity('100');
    setTiers([
      { minQuantity: 12, pricePerUnit: 10.50, label: 'Carton Tier (12+)' },
      { minQuantity: 48, pricePerUnit: 9.50, label: 'Pallet Tier (48+)' },
    ]);
    setIsProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setBarcode(p.barcode);
    setCategory(p.category);
    setPrimaryUnit(p.primaryUnit);
    setPackagingUnit(p.packagingUnit);
    setPackagingMultiplier(p.packagingMultiplier.toString());
    setCostPrice(p.costPrice.toString());
    setRetailPrice(p.retailPrice.toString());
    setTaxRate(p.taxRate.toString());
    setReorderLevel(p.reorderLevel.toString());
    setStockQuantity(p.stockQuantity.toString());
    setTiers([...p.wholesaleTiers]);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      sku: sku.trim(),
      barcode: barcode.trim(),
      description: `${name} standard retail & wholesale item.`,
      category: category.trim(),
      primaryUnit: primaryUnit.trim(),
      packagingUnit: packagingUnit.trim(),
      packagingMultiplier: Math.max(1, parseInt(packagingMultiplier) || 1),
      costPrice: parseFloat(costPrice) || 0,
      retailPrice: parseFloat(retailPrice) || 0,
      taxRate: parseFloat(taxRate) || 0,
      reorderLevel: parseInt(reorderLevel) || 0,
      stockQuantity: parseInt(stockQuantity) || 0,
      wholesaleTiers: tiers,
      batches: editingProduct?.batches || [
        {
          id: `b-${Date.now()}`,
          batchNumber: `LOT-${new Date().getFullYear()}`,
          quantity: parseInt(stockQuantity) || 0,
          costPrice: parseFloat(costPrice) || 0,
        },
      ],
      active: true,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
      addNotification({
        type: 'success',
        header: 'Product Updated',
        content: `Updated product "${payload.name}" successfully.`,
      });
    } else {
      addProduct(payload);
      addNotification({
        type: 'success',
        header: 'Product Added',
        content: `Product "${payload.name}" added to catalog.`,
      });
    }

    setIsProductModalOpen(false);
  };

  const handleQuickAdjustSubmit = () => {
    if (!adjustModalProduct) return;
    const delta = parseInt(adjustDelta) || 0;
    if (delta !== 0) {
      adjustStock(adjustModalProduct.id, delta, adjustReason);
      addNotification({
        type: 'info',
        header: 'Stock Adjusted',
        content: `Stock for ${adjustModalProduct.name} updated by ${delta > 0 ? '+' : ''}${delta} units.`,
      });
    }
    setAdjustModalProduct(null);
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🏷️ Product Catalog & Dual Pricing</h1>
          <p className="text-muted-foreground mt-2">
            Unified catalog with dual unit conversions (e.g. Pieces vs Cartons) and volume-based wholesale slab pricing.
          </p>
        </div>
        <Button onClick={openCreateModal} className="shrink-0 gap-2">
          <Plus className="w-4 h-4" />
          Add New Product
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU, or barcode..."
              className="pl-9"
              type="search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Details</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Packaging (Dual UoM)</TableHead>
                <TableHead>Retail & Cost Price</TableHead>
                <TableHead>Wholesale Slabs</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length > 0 ? (
                paginated.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        SKU: {p.sku} • Barcode: {p.barcode} • Cat: {p.category}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StockStatusIndicator current={p.stockQuantity} reorder={p.reorderLevel} />
                      <div className="text-xs text-muted-foreground mt-1">
                        Reorder at {p.reorderLevel} {p.primaryUnit}s
                      </div>
                    </TableCell>
                    <TableCell>
                      1 {p.packagingUnit} = <strong className="font-semibold">{p.packagingMultiplier}</strong> {p.primaryUnit}s
                    </TableCell>
                    <TableCell>
                      <div>
                        Retail: <span className="font-bold text-blue-600 dark:text-blue-400"><CurrencyText amount={p.retailPrice} /></span> / {p.primaryUnit}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Cost: <CurrencyText amount={p.costPrice} />
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.wholesaleTiers && p.wholesaleTiers.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {p.wholesaleTiers.map((t, idx) => (
                            <Badge key={idx} variant="secondary" className="w-fit text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                              {t.minQuantity}+ {p.primaryUnit}s @ <CurrencyText amount={t.pricePerUnit} />
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No slabs set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="link" size="sm" onClick={() => openEditModal(p)} className="p-0 h-auto">
                          Edit
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => {
                            setAdjustModalProduct(p);
                            setAdjustDelta('0');
                          }}
                          className="p-0 h-auto"
                        >
                          Adjust Stock
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setDeleteModalProduct(p)}
                          className="p-0 h-auto text-destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4 pr-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {/* Add / Edit Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Basmati Rice 5kg" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barcode">Barcode (UPC/EAN)</Label>
                <Input id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
              </div>
            </div>

            {/* Category & Dual UoM */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4">
              <div className="grid gap-2 md:col-span-4">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="primaryUnit">Primary Unit (Retail)</Label>
                <Input id="primaryUnit" value={primaryUnit} onChange={(e) => setPrimaryUnit(e.target.value)} placeholder="Piece, Bag, Kg" />
              </div>
              <div className="grid gap-2 md:col-span-3">
                <Label htmlFor="packagingUnit">Packaging Unit (Wholesale)</Label>
                <Input id="packagingUnit" value={packagingUnit} onChange={(e) => setPackagingUnit(e.target.value)} placeholder="Carton, Box" />
              </div>
              <div className="grid gap-2 md:col-span-3">
                <Label htmlFor="packagingMultiplier">Units per Package</Label>
                <Input id="packagingMultiplier" value={packagingMultiplier} type="number" onChange={(e) => setPackagingMultiplier(e.target.value)} />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="costPrice">Cost Price</Label>
                <Input id="costPrice" value={costPrice} type="number" onChange={(e) => setCostPrice(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="retailPrice">Retail Selling Price</Label>
                <Input id="retailPrice" value={retailPrice} type="number" onChange={(e) => setRetailPrice(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input id="taxRate" value={taxRate} type="number" onChange={(e) => setTaxRate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stockQuantity">Initial Stock</Label>
                <Input id="stockQuantity" value={stockQuantity} type="number" onChange={(e) => setStockQuantity(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reorderLevel">Reorder Threshold</Label>
                <Input id="reorderLevel" value={reorderLevel} type="number" onChange={(e) => setReorderLevel(e.target.value)} />
              </div>
            </div>

            {/* Wholesale Quantity Slabs Editor */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="font-semibold text-sm">Wholesale Volume Price Slabs</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    setTiers([
                      ...tiers,
                      {
                        minQuantity: tiers.length > 0 ? tiers[tiers.length - 1].minQuantity + 20 : 10,
                        pricePerUnit: parseFloat(costPrice) + 2,
                        label: `Bulk Slab (${tiers.length + 1})`,
                      },
                    ])
                  }
                >
                  <Plus className="w-4 h-4" />
                  Add Slab
                </Button>
              </div>

              <div className="space-y-3">
                {tiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex-1 w-full grid gap-1.5">
                      <Label className="text-xs text-muted-foreground">Label</Label>
                      <Input
                        value={tier.label || ''}
                        onChange={(e) => {
                          const updated = [...tiers];
                          updated[idx].label = e.target.value;
                          setTiers(updated);
                        }}
                        placeholder="e.g. Master Carton Slab"
                      />
                    </div>
                    <div className="w-full sm:w-32 grid gap-1.5">
                      <Label className="text-xs text-muted-foreground">Min Qty</Label>
                      <Input
                        value={tier.minQuantity.toString()}
                        type="number"
                        onChange={(e) => {
                          const updated = [...tiers];
                          updated[idx].minQuantity = parseInt(e.target.value) || 1;
                          setTiers(updated);
                        }}
                      />
                    </div>
                    <div className="w-full sm:w-32 grid gap-1.5">
                      <Label className="text-xs text-muted-foreground">Rate per Unit</Label>
                      <Input
                        value={tier.pricePerUnit.toString()}
                        type="number"
                        onChange={(e) => {
                          const updated = [...tiers];
                          updated[idx].pricePerUnit = parseFloat(e.target.value) || 0;
                          setTiers(updated);
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setTiers(tiers.filter((_, i) => i !== idx))}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProduct}>Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Adjust Stock Modal */}
      <Dialog open={!!adjustModalProduct} onOpenChange={(open) => !open && setAdjustModalProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Stock Adjustment: {adjustModalProduct?.name}</DialogTitle>
          </DialogHeader>
          
          {adjustModalProduct && (
            <div className="grid gap-4 py-4">
              <div className="text-sm">
                <strong>Current Stock:</strong> {adjustModalProduct.stockQuantity} {adjustModalProduct.primaryUnit}s
              </div>
  
              <div className="grid gap-2">
                <Label htmlFor="adjustDelta">Quantity Change (+ to add, - to deduct)</Label>
                <Input
                  id="adjustDelta"
                  value={adjustDelta}
                  type="number"
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  placeholder="e.g. +10 or -3"
                />
              </div>
  
              <div className="grid gap-2">
                <Label htmlFor="adjustReason">Reason for Adjustment</Label>
                <Input
                  id="adjustReason"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Damaged during unloading, stock recount discrepancy"
                />
              </div>
  
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md border border-slate-200 dark:border-slate-800 text-sm">
                New Projected Stock:{' '}
                <strong className="font-semibold">
                  {Math.max(0, adjustModalProduct.stockQuantity + (parseInt(adjustDelta) || 0))}{' '}
                  {adjustModalProduct.primaryUnit}s
                </strong>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustModalProduct(null)}>Cancel</Button>
            <Button onClick={handleQuickAdjustSubmit}>Confirm Stock Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation Modal */}
      <Dialog open={!!deleteModalProduct} onOpenChange={(open) => !open && setDeleteModalProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product from Catalog?</DialogTitle>
          </DialogHeader>
          
          {deleteModalProduct && (
            <div className="py-4 text-sm text-muted-foreground">
              Are you sure you want to permanently remove <strong className="text-foreground">{deleteModalProduct.name}</strong> (SKU: {deleteModalProduct.sku})? This product will no longer appear in POS or Wholesale billing.
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalProduct(null)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (deleteModalProduct) {
                  deleteProduct(deleteModalProduct.id);
                  addNotification({
                    type: 'info',
                    header: 'Product Removed',
                    content: `Product "${deleteModalProduct.name}" removed from catalog.`,
                  });
                  setDeleteModalProduct(null);
                }
              }}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
