import React, { useState } from 'react';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Modal from '@cloudscape-design/components/modal';
import FormField from '@cloudscape-design/components/form-field';
import Select from '@cloudscape-design/components/select';
import Input from '@cloudscape-design/components/input';
import Grid from '@cloudscape-design/components/grid';
import Badge from '@cloudscape-design/components/badge';

import { usePurchaseStore } from '../../store/usePurchaseStore';
import { useProductStore } from '../../store/useProductStore';
import { useAppStore } from '../../store/useAppStore';
import { CurrencyText } from '../../components/common/CurrencyText';
import { PurchaseOrder, PurchaseOrderItem } from '../../types/purchase';

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
    <SpaceBetween size="l">
      {/* Header */}
      <Header
        variant="h1"
        description="Procure stock from manufacturers and suppliers, log inward shipments, and update inventory counts."
        actions={
          <Button variant="primary" iconName="add-plus" onClick={() => setIsCreateModalOpen(true)}>
            Create Purchase Order
          </Button>
        }
      >
        📋 Purchase Orders & Goods Inwarding
      </Header>

      {/* PO Table */}
      <Table
        columnDefinitions={[
          {
            id: 'poNumber',
            header: 'PO #',
            cell: (po) => <span style={{ fontWeight: 600 }}>{po.poNumber}</span>,
          },
          {
            id: 'supplier',
            header: 'Supplier',
            cell: (po) => po.supplierName,
          },
          {
            id: 'date',
            header: 'Order Date',
            cell: (po) => po.orderDate,
          },
          {
            id: 'items',
            header: 'Items',
            cell: (po) => `${po.items.length} item line(s)`,
          },
          {
            id: 'grandTotal',
            header: 'Order Total',
            cell: (po) => (
              <span style={{ fontWeight: 'bold' }}>
                <CurrencyText amount={po.grandTotal} />
              </span>
            ),
          },
          {
            id: 'status',
            header: 'Shipment Status',
            cell: (po) => (
              <Badge color={po.status === 'received' ? 'green' : 'blue'}>
                {po.status === 'received' ? 'RECEIVED & INWARDED' : 'ORDERED / IN TRANSIT'}
              </Badge>
            ),
          },
          {
            id: 'payment',
            header: 'Payment Status',
            cell: (po) => (
              <Badge color={po.paymentStatus === 'paid' ? 'green' : 'grey'}>
                {po.paymentStatus.toUpperCase()}
              </Badge>
            ),
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (po) => (
              <div>
                {po.status === 'ordered' && (
                  <Button
                    variant="inline-link"
                    iconName="upload"
                    onClick={() => handleReceiveGoods(po)}
                  >
                    Receive Stock
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        items={purchaseOrders}
        empty={<Box textAlign="center" padding="l">No purchase orders found.</Box>}
      />

      {/* Create PO Modal */}
      <Modal
        visible={isCreateModalOpen}
        onDismiss={() => setIsCreateModalOpen(false)}
        header="Create Supplier Purchase Order"
        size="large"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateSubmit}>
                Issue Purchase Order
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Select Supplier / Manufacturer">
            <Select
              selectedOption={
                activeSupplier
                  ? { label: activeSupplier.name, value: activeSupplier.id }
                  : null
              }
              onChange={({ detail }) => setSelectedSupplierId(detail.selectedOption.value as string)}
              options={suppliers.map((s) => ({
                label: s.name,
                value: s.id,
              }))}
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Procurement Line Items</strong>
            <Button iconName="add-plus" onClick={handleAddItem}>
              Add Product
            </Button>
          </div>

          <SpaceBetween size="xs">
            {poItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  padding: '10px',
                  background: isDark ? '#0f172a' : '#f8fafc',
                }}
              >
                <Grid
                  gridDefinition={[
                    { colspan: { default: 12, s: 6, m: 4 } },
                    { colspan: { default: 6, s: 3, m: 2 } },
                    { colspan: { default: 6, s: 3, m: 2 } },
                    { colspan: { default: 8, s: 9, m: 3 } },
                    { colspan: { default: 4, s: 3, m: 1 } },
                  ]}
                >
                  <FormField label="Product">
                    <Select
                      selectedOption={{ label: item.productName, value: item.productId }}
                      onChange={({ detail }) => {
                        const selectedProd = products.find((p) => p.id === detail.selectedOption.value);
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
                      options={products.map((p) => ({
                        label: p.name,
                        value: p.id,
                      }))}
                    />
                  </FormField>

                  <FormField label={`Quantity (${item.unit})`}>
                    <Input
                      value={item.quantity.toString()}
                      type="number"
                      onChange={({ detail }) =>
                        handleUpdateItem(idx, { quantity: parseInt(detail.value) || 1 })
                      }
                    />
                  </FormField>

                  <FormField label="Unit Cost">
                    <Input
                      value={item.unitCost.toString()}
                      type="number"
                      onChange={({ detail }) =>
                        handleUpdateItem(idx, { unitCost: parseFloat(detail.value) || 0 })
                      }
                    />
                  </FormField>

                  <FormField label="Line Total">
                    <div style={{ paddingTop: '8px', fontWeight: 'bold' }}>
                      <CurrencyText amount={item.total} />
                    </div>
                  </FormField>

                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                    <Button
                      variant="inline-icon"
                      iconName="close"
                      disabled={poItems.length === 1}
                      onClick={() => handleRemoveItem(idx)}
                    />
                  </div>
                </Grid>
              </div>
            ))}
          </SpaceBetween>

          <div
            style={{
              background: isDark ? '#1e293b' : '#ffffff',
              padding: '12px',
              borderRadius: '6px',
              border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Estimated Grand Total (Tax Incl.):</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0972d3' }}>
              <CurrencyText amount={poGrandTotal} />
            </span>
          </div>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
};
