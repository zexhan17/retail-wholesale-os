import React, { useState } from 'react';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Grid from '@cloudscape-design/components/grid';
import FormField from '@cloudscape-design/components/form-field';
import Select from '@cloudscape-design/components/select';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';

import { useProductStore } from '../../store/useProductStore';
import { useAppStore } from '../../store/useAppStore';

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
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Reconcile inventory audits, write off damaged or expired stock, and log audit trails."
      >
        ⚖️ Stock Adjustments & Audit Log
      </Header>

      <Grid
        gridDefinition={[
          { colspan: { default: 12, m: 5 } },
          { colspan: { default: 12, m: 7 } },
        ]}
      >
        {/* Adjustment Form */}
        <Container
          header={
            <Header variant="h2" description="Enter physical inventory change details">
              Create Stock Adjustment
            </Header>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Target Product">
              <Select
                selectedOption={
                  activeProduct
                    ? {
                        label: activeProduct.name,
                        value: activeProduct.id,
                        description: `Current Stock: ${activeProduct.stockQuantity} ${activeProduct.primaryUnit}s`,
                      }
                    : null
                }
                onChange={({ detail }) => setSelectedProductId(detail.selectedOption.value as string)}
                options={products.map((p) => ({
                  label: p.name,
                  value: p.id,
                  description: `Current: ${p.stockQuantity} ${p.primaryUnit}s • SKU: ${p.sku}`,
                }))}
              />
            </FormField>

            <FormField label="Adjustment Action">
              <Select
                selectedOption={{
                  label:
                    adjustmentType === 'deduct'
                      ? '🔻 Write-Off / Deduct Stock'
                      : '🔼 Add Found Stock',
                  value: adjustmentType,
                }}
                onChange={({ detail }) => setAdjustmentType(detail.selectedOption.value as any)}
                options={[
                  { label: '🔻 Write-Off / Deduct Stock', value: 'deduct' },
                  { label: '🔼 Add Found Stock', value: 'add' },
                ]}
              />
            </FormField>

            <FormField label="Reason Category">
              <Select
                selectedOption={{ label: reasonCategory, value: reasonCategory }}
                onChange={({ detail }) => setReasonCategory(detail.selectedOption.value as string)}
                options={[
                  { label: 'Damaged in transit / Unloading', value: 'Damaged in transit / Unloading' },
                  { label: 'Expired batch write-off', value: 'Expired batch write-off' },
                  { label: 'Physical count discrepancy (Audit)', value: 'Physical count discrepancy (Audit)' },
                  { label: 'Store usage / Sample display', value: 'Store usage / Sample display' },
                  { label: 'Theft / Shrinkage loss', value: 'Theft / Shrinkage loss' },
                ]}
              />
            </FormField>

            <FormField label={`Quantity in ${activeProduct?.primaryUnit || 'Units'}`}>
              <Input
                value={quantity}
                type="number"
                onChange={({ detail }) => setQuantity(detail.value)}
              />
            </FormField>

            <FormField label="Specific Audit Notes (Optional)">
              <Input
                value={notes}
                onChange={({ detail }) => setNotes(detail.value)}
                placeholder="e.g. Discovered dented cans in aisle 3 pallet"
              />
            </FormField>

            {activeProduct && (
              <div
                style={{
                  background: isDark ? '#0f172a' : '#f8fafc',
                  padding: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  fontSize: '13px',
                }}
              >
                <div>Current Stock: <strong>{activeProduct.stockQuantity}</strong> {activeProduct.primaryUnit}s</div>
                <div>
                  Projected Stock After Adjustment:{' '}
                  <strong style={{ color: adjustmentType === 'deduct' ? '#dc2626' : '#16a34a' }}>
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

            <Button variant="primary" fullWidth onClick={handleSubmit} iconName="check">
              Apply Stock Adjustment
            </Button>
          </SpaceBetween>
        </Container>

        {/* Audit Log Table */}
        <Container
          header={
            <Header variant="h2" description="Recent stock reconciliation entries">
              Recent Adjustment Audit History
            </Header>
          }
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: `2px solid ${isDark ? '#334155' : '#e2e8f0'}`, color: isDark ? '#94a3b8' : '#64748b' }}>
                <th style={{ padding: '8px' }}>Timestamp</th>
                <th style={{ padding: '8px' }}>Product</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Adjustment</th>
                <th style={{ padding: '8px' }}>Reason</th>
                <th style={{ padding: '8px' }}>Author</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record.id} style={{ borderBottom: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` }}>
                  <td style={{ padding: '8px', fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>{record.date}</td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ fontWeight: 600 }}>{record.productName}</div>
                    <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#6b7280' }}>{record.sku}</div>
                  </td>
                  <td
                    style={{
                      padding: '8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: record.deltaQuantity > 0 ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {record.deltaQuantity > 0 ? `+${record.deltaQuantity}` : record.deltaQuantity}
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{record.reason}</td>
                  <td style={{ padding: '8px', fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>{record.author}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Container>
      </Grid>
    </SpaceBetween>
  );
};
