import React, { useState, useMemo } from 'react';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Input from '@cloudscape-design/components/input';
import Modal from '@cloudscape-design/components/modal';
import FormField from '@cloudscape-design/components/form-field';
import Grid from '@cloudscape-design/components/grid';
import Badge from '@cloudscape-design/components/badge';
import Pagination from '@cloudscape-design/components/pagination';

import { useProductStore } from '../../store/useProductStore';
import { useAppStore } from '../../store/useAppStore';
import { Product, PriceTier } from '../../types/product';
import { CurrencyText } from '../../components/common/CurrencyText';
import { StockStatusIndicator } from '../../components/common/StatusBadge';

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
    <SpaceBetween size="l">
      {/* Header */}
      <Header
        variant="h1"
        description="Unified catalog with dual unit conversions (e.g. Pieces vs Cartons) and volume-based wholesale slab pricing."
        actions={
          <Button variant="primary" iconName="add-plus" onClick={openCreateModal}>
            Add New Product
          </Button>
        }
      >
        🏷️ Product Catalog & Dual Pricing
      </Header>

      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          background: isDark ? '#1e293b' : '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        }}
      >
        <div style={{ flex: 1, maxWidth: '420px' }}>
          <Input
            value={searchQuery}
            onChange={({ detail }) => setSearchQuery(detail.value)}
            placeholder="Search by product name, SKU, or barcode..."
            type="search"
          />
        </div>
      </div>

      {/* Products Table */}
      <Table
        columnDefinitions={[
          {
            id: 'product',
            header: 'Product Details',
            cell: (p) => (
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  SKU: {p.sku} • Barcode: {p.barcode} • Cat: {p.category}
                </div>
              </div>
            ),
          },
          {
            id: 'stock',
            header: 'Stock Level',
            cell: (p) => (
              <div>
                <StockStatusIndicator current={p.stockQuantity} reorder={p.reorderLevel} />
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                  Reorder at {p.reorderLevel} {p.primaryUnit}s
                </div>
              </div>
            ),
          },
          {
            id: 'uom',
            header: 'Packaging (Dual UoM)',
            cell: (p) => (
              <div>
                <div>
                  1 {p.packagingUnit} = <strong>{p.packagingMultiplier}</strong> {p.primaryUnit}s
                </div>
              </div>
            ),
          },
          {
            id: 'prices',
            header: 'Retail & Cost Price',
            cell: (p) => (
              <div>
                <div>
                  Retail:{' '}
                  <span style={{ fontWeight: 'bold', color: '#0972d3' }}>
                    <CurrencyText amount={p.retailPrice} />
                  </span>{' '}
                  / {p.primaryUnit}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  Cost: <CurrencyText amount={p.costPrice} />
                </div>
              </div>
            ),
          },
          {
            id: 'wholesaleTiers',
            header: 'Wholesale Slabs',
            cell: (p) => (
              <div>
                {p.wholesaleTiers && p.wholesaleTiers.length > 0 ? (
                  <SpaceBetween size="xxs">
                    {p.wholesaleTiers.map((t, idx) => (
                      <div key={idx} style={{ fontSize: '11px' }}>
                        <Badge color="blue">
                          {t.minQuantity}+ {p.primaryUnit}s @ <CurrencyText amount={t.pricePerUnit} />
                        </Badge>
                      </div>
                    ))}
                  </SpaceBetween>
                ) : (
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>No slabs set</span>
                )}
              </div>
            ),
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (p) => (
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="inline-link" onClick={() => openEditModal(p)}>
                  Edit
                </Button>
                <Button
                  variant="inline-link"
                  onClick={() => {
                    setAdjustModalProduct(p);
                    setAdjustDelta('0');
                  }}
                >
                  Adjust Stock
                </Button>
                <Button
                  variant="inline-link"
                  onClick={() => setDeleteModalProduct(p)}
                >
                  Delete
                </Button>
              </SpaceBetween>
            ),
          },
        ]}
        items={paginated}
        pagination={
          <Pagination
            currentPageIndex={currentPage}
            pagesCount={totalPages}
            onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
          />
        }
        empty={<Box textAlign="center" padding="l">No products found.</Box>}
      />

      {/* Add / Edit Product Modal */}
      <Modal
        visible={isProductModalOpen}
        onDismiss={() => setIsProductModalOpen(false)}
        header={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product'}
        size="large"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveProduct}>
                Save Product
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          {/* Basic Info */}
          <Grid
            gridDefinition={[
              { colspan: { default: 12, m: 6 } },
              { colspan: { default: 6, m: 3 } },
              { colspan: { default: 6, m: 3 } },
            ]}
          >
            <FormField label="Product Name">
              <Input value={name} onChange={({ detail }) => setName(detail.value)} placeholder="e.g. Basmati Rice 5kg" />
            </FormField>
            <FormField label="SKU">
              <Input value={sku} onChange={({ detail }) => setSku(detail.value)} />
            </FormField>
            <FormField label="Barcode (UPC/EAN)">
              <Input value={barcode} onChange={({ detail }) => setBarcode(detail.value)} />
            </FormField>
          </Grid>

          {/* Category & Dual UoM */}
          <Grid
            gridDefinition={[
              { colspan: { default: 12, m: 4 } },
              { colspan: { default: 6, m: 2.5 } },
              { colspan: { default: 6, m: 2.5 } },
              { colspan: { default: 12, m: 3 } },
            ]}
          >
            <FormField label="Category">
              <Input value={category} onChange={({ detail }) => setCategory(detail.value)} />
            </FormField>
            <FormField label="Primary Unit (Retail)">
              <Input value={primaryUnit} onChange={({ detail }) => setPrimaryUnit(detail.value)} placeholder="Piece, Bag, Kg" />
            </FormField>
            <FormField label="Packaging Unit (Wholesale)">
              <Input value={packagingUnit} onChange={({ detail }) => setPackagingUnit(detail.value)} placeholder="Carton, Box" />
            </FormField>
            <FormField label="Units per Package">
              <Input value={packagingMultiplier} type="number" onChange={({ detail }) => setPackagingMultiplier(detail.value)} />
            </FormField>
          </Grid>

          {/* Pricing & Stock */}
          <Grid
            gridDefinition={[
              { colspan: { default: 6, m: 2.5 } },
              { colspan: { default: 6, m: 2.5 } },
              { colspan: { default: 6, m: 2 } },
              { colspan: { default: 6, m: 2.5 } },
              { colspan: { default: 12, m: 2.5 } },
            ]}
          >
            <FormField label="Cost Price">
              <Input value={costPrice} type="number" onChange={({ detail }) => setCostPrice(detail.value)} />
            </FormField>
            <FormField label="Retail Selling Price">
              <Input value={retailPrice} type="number" onChange={({ detail }) => setRetailPrice(detail.value)} />
            </FormField>
            <FormField label="Tax Rate (%)">
              <Input value={taxRate} type="number" onChange={({ detail }) => setTaxRate(detail.value)} />
            </FormField>
            <FormField label="Initial Stock">
              <Input value={stockQuantity} type="number" onChange={({ detail }) => setStockQuantity(detail.value)} />
            </FormField>
            <FormField label="Reorder Threshold">
              <Input value={reorderLevel} type="number" onChange={({ detail }) => setReorderLevel(detail.value)} />
            </FormField>
          </Grid>

          {/* Wholesale Quantity Slabs Editor */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold' }}>Wholesale Volume Price Slabs</div>
              <Button
                iconName="add-plus"
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
                Add Slab
              </Button>
            </div>

            <SpaceBetween size="xs">
              {tiers.map((tier, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    background: isDark ? '#0f172a' : '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>Label: </span>
                    <Input
                      value={tier.label || ''}
                      onChange={({ detail }) => {
                        const updated = [...tiers];
                        updated[idx].label = detail.value;
                        setTiers(updated);
                      }}
                      placeholder="e.g. Master Carton Slab"
                    />
                  </div>
                  <div style={{ width: '130px' }}>
                    <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>Min Qty: </span>
                    <Input
                      value={tier.minQuantity.toString()}
                      type="number"
                      onChange={({ detail }) => {
                        const updated = [...tiers];
                        updated[idx].minQuantity = parseInt(detail.value) || 1;
                        setTiers(updated);
                      }}
                    />
                  </div>
                  <div style={{ width: '130px' }}>
                    <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>Rate per Unit: </span>
                    <Input
                      value={tier.pricePerUnit.toString()}
                      type="number"
                      onChange={({ detail }) => {
                        const updated = [...tiers];
                        updated[idx].pricePerUnit = parseFloat(detail.value) || 0;
                        setTiers(updated);
                      }}
                    />
                  </div>
                  <Button
                    variant="inline-icon"
                    iconName="close"
                    onClick={() => setTiers(tiers.filter((_, i) => i !== idx))}
                  />
                </div>
              ))}
            </SpaceBetween>
          </div>
        </SpaceBetween>
      </Modal>

      {/* Quick Adjust Stock Modal */}
      <Modal
        visible={!!adjustModalProduct}
        onDismiss={() => setAdjustModalProduct(null)}
        header={`Quick Stock Adjustment: ${adjustModalProduct?.name}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setAdjustModalProduct(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleQuickAdjustSubmit}>
                Confirm Stock Adjustment
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        {adjustModalProduct && (
          <SpaceBetween size="m">
            <div>
              <strong>Current Stock:</strong> {adjustModalProduct.stockQuantity} {adjustModalProduct.primaryUnit}s
            </div>

            <FormField label="Quantity Change (+ to add, - to deduct)">
              <Input
                value={adjustDelta}
                type="number"
                onChange={({ detail }) => setAdjustDelta(detail.value)}
                placeholder="e.g. +10 or -3"
              />
            </FormField>

            <FormField label="Reason for Adjustment">
              <Input
                value={adjustReason}
                onChange={({ detail }) => setAdjustReason(detail.value)}
                placeholder="e.g. Damaged during unloading, stock recount discrepancy"
              />
            </FormField>

            <div
              style={{
                background: isDark ? '#0f172a' : '#f8fafc',
                padding: '12px',
                borderRadius: '6px',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              }}
            >
              New Projected Stock:{' '}
              <strong>
                {Math.max(0, adjustModalProduct.stockQuantity + (parseInt(adjustDelta) || 0))}{' '}
                {adjustModalProduct.primaryUnit}s
              </strong>
            </div>
          </SpaceBetween>
        )}
      </Modal>
      {/* Delete Product Confirmation Modal */}
      <Modal
        visible={!!deleteModalProduct}
        onDismiss={() => setDeleteModalProduct(null)}
        header="Delete Product from Catalog?"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setDeleteModalProduct(null)}>Cancel</Button>
              <Button
                variant="primary"
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
            </SpaceBetween>
          </Box>
        }
      >
        {deleteModalProduct && (
          <Box color="text-body-secondary">
            Are you sure you want to permanently remove <strong>{deleteModalProduct.name}</strong> (SKU: {deleteModalProduct.sku})? This product will no longer appear in POS or Wholesale billing.
          </Box>
        )}
      </Modal>
    </SpaceBetween>
  );
};
