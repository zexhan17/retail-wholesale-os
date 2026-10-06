import React, { useState, useRef } from 'react';
import Header from '@cloudscape-design/components/header';
import Container from '@cloudscape-design/components/container';
import Grid from '@cloudscape-design/components/grid';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Modal from '@cloudscape-design/components/modal';
import Badge from '@cloudscape-design/components/badge';

import { useAppStore } from '../../store/useAppStore';
import { useSalesStore } from '../../store/useSalesStore';
import { CurrencyText } from '../../components/common/CurrencyText';
import { PrintService } from '../../services/printService';

export const DayEndClosingPage: React.FC = () => {
  const profile = useAppStore((state) => state.profile);
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';
  const drawerSession = useAppStore((state) => state.drawerSession);
  const recordCashDrop = useAppStore((state) => state.recordCashDrop);
  const closeDrawer = useAppStore((state) => state.closeDrawer);
  const openDrawer = useAppStore((state) => state.openDrawer);
  const addNotification = useAppStore((state) => state.addNotification);

  const invoices = useSalesStore((state) => state.invoices);

  // Today's Date
  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter((i) => i.date === todayStr || i.createdAt?.startsWith(todayStr));

  // Compute sales by tender
  const cashSales = todayInvoices
    .flatMap((i) => i.payments)
    .filter((p) => p.method === 'cash')
    .reduce((sum, p) => sum + p.amount, 0);

  const cardSales = todayInvoices
    .flatMap((i) => i.payments)
    .filter((p) => p.method === 'card')
    .reduce((sum, p) => sum + p.amount, 0);

  const digitalSales = todayInvoices
    .flatMap((i) => i.payments)
    .filter((p) => p.method === 'upi' || p.method === 'bank_transfer')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCollectedToday = cashSales + cardSales + digitalSales;

  // Actual Physical Count State
  const [actualCashCount, setActualCashCount] = useState<string>(drawerSession.expectedCash.toFixed(2));
  const [cashDropAmount, setCashDropAmount] = useState<string>('');
  const [isZReportModalOpen, setIsZReportModalOpen] = useState(false);
  const [closedSummary, setClosedSummary] = useState<any>(null);
  const zReportRef = useRef<HTMLDivElement>(null);

  const actualNum = parseFloat(actualCashCount) || 0;
  const variance = actualNum - drawerSession.expectedCash;

  const handleRecordCashDrop = () => {
    const amt = parseFloat(cashDropAmount) || 0;
    if (amt <= 0) return;
    recordCashDrop(amt);
    addNotification({
      type: 'info',
      header: 'Cash Drop Recorded',
      content: `Removed ${profile.currencySymbol}${amt.toFixed(2)} from cash drawer for deposit.`,
    });
    setCashDropAmount('');
  };

  const handleCloseShift = () => {
    const summary = {
      closedAt: new Date().toLocaleString(),
      openedAt: new Date(drawerSession.openedAt).toLocaleString(),
      cashier: drawerSession.openedBy,
      openingFloat: drawerSession.openingFloat,
      cashSales,
      cardSales,
      digitalSales,
      totalSales: totalCollectedToday,
      cashDrops: drawerSession.cashDrops,
      expectedCash: drawerSession.expectedCash,
      actualCashCount: actualNum,
      variance,
      invoiceCount: todayInvoices.length,
    };

    closeDrawer();
    setClosedSummary(summary);
    setIsZReportModalOpen(true);
    addNotification({
      type: 'success',
      header: 'Register Closed (Z-Report)',
      content: 'Cash drawer closed. Z-Report generated.',
    });
  };

  const handleReopenRegister = () => {
    openDrawer(250.0, 'Admin Register');
    addNotification({
      type: 'info',
      header: 'Register Re-Opened',
      content: 'New register shift started with $250.00 float.',
    });
  };

  return (
    <SpaceBetween size="l">
      {/* Header */}
      <Header
        variant="h1"
        description="End-of-day register reconciliation, cash drawer balancing, and Z-Report audit generation."
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            {!drawerSession.isOpen && (
              <Button variant="primary" onClick={handleReopenRegister}>
                Open New Register Shift
              </Button>
            )}
            <Button
              disabled={!closedSummary}
              iconName="download"
              onClick={() => setIsZReportModalOpen(true)}
            >
              View Last Z-Report
            </Button>
          </SpaceBetween>
        }
      >
        💰 Day-End Cash Closing & Z-Report
      </Header>

      {/* Register Status Banner */}
      <div
        style={{
          background: drawerSession.isOpen
            ? (isDark ? '#064e3b' : '#f0fdf4')
            : (isDark ? '#450a0a' : '#fef2f2'),
          border: `1px solid ${drawerSession.isOpen ? (isDark ? '#059669' : '#86efac') : (isDark ? '#dc2626' : '#fca5a5')}`,
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge color={drawerSession.isOpen ? 'green' : 'red'}>
              {drawerSession.isOpen ? 'REGISTER CURRENTLY ACTIVE' : 'REGISTER CLOSED'}
            </Badge>
            <span style={{ fontWeight: 'bold' }}>Operator: {drawerSession.openedBy}</span>
          </div>
          <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#4b5563', marginTop: '4px' }}>
            Shift started at: {new Date(drawerSession.openedAt).toLocaleTimeString()} • Opening Float:{' '}
            <CurrencyText amount={drawerSession.openingFloat} />
          </div>
        </div>

        {drawerSession.isOpen && (
          <Button variant="primary" onClick={handleCloseShift} iconName="check">
            Close Register & Generate Z-Report
          </Button>
        )}
      </div>

      {/* Grid: Financial Tenders Summary & Reconciliation */}
      <Grid
        gridDefinition={[
          { colspan: { default: 12, m: 6 } },
          { colspan: { default: 12, m: 6 } },
        ]}
      >
        {/* Today's Tender Breakdown */}
        <Container
          header={
            <Header variant="h2" description="Total collections recorded across all channels today">
              Today's Tender Collections
            </Header>
          }
        >
          <SpaceBetween size="m">
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>💵 Cash Sales Tendered:</span>
              <span style={{ fontWeight: 'bold' }}>
                <CurrencyText amount={cashSales} />
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>💳 Credit / Debit Card Terminal:</span>
              <span style={{ fontWeight: 'bold' }}>
                <CurrencyText amount={cardSales} />
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>📱 Digital UPI & Bank Wire:</span>
              <span style={{ fontWeight: 'bold' }}>
                <CurrencyText amount={digitalSales} />
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '2px solid #0972d3',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#0972d3',
              }}
            >
              <span>Total Collections Today:</span>
              <span>
                <CurrencyText amount={totalCollectedToday} />
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Processed across {todayInvoices.length} transactions today.
            </div>
          </SpaceBetween>
        </Container>

        {/* Physical Cash Drawer Balancing */}
        <Container
          header={
            <Header variant="h2" description="Count physical cash in the drawer to verify against recorded sales">
              Cash Drawer Balancing
            </Header>
          }
        >
          <SpaceBetween size="m">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Opening Float:</span>
              <span>
                <CurrencyText amount={drawerSession.openingFloat} />
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>+ Cash Sales Inward:</span>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>
                +<CurrencyText amount={cashSales} />
              </span>
            </div>
            {drawerSession.cashDrops > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>- Cash Payouts / Drops:</span>
                <span style={{ color: '#dc2626', fontWeight: 600 }}>
                  -<CurrencyText amount={drawerSession.cashDrops} />
                </span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                paddingTop: '8px',
                fontWeight: 'bold',
              }}
            >
              <span>Expected Cash in Drawer:</span>
              <span style={{ fontSize: '16px' }}>
                <CurrencyText amount={drawerSession.expectedCash} />
              </span>
            </div>

            {/* Actual Count Input */}
            <FormField label="Actual Physically Counted Cash">
              <Input
                value={actualCashCount}
                type="number"
                onChange={({ detail }) => setActualCashCount(detail.value)}
              />
            </FormField>

            {/* Variance indicator */}
            <div
              style={{
                background: Math.abs(variance) < 0.01
                  ? (isDark ? '#064e3b' : '#ecfdf5')
                  : (isDark ? '#450a0a' : '#fef2f2'),
                border: `1px solid ${Math.abs(variance) < 0.01 ? (isDark ? '#059669' : '#10b981') : (isDark ? '#dc2626' : '#ef4444')}`,
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>CASH VARIANCE:</div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: Math.abs(variance) < 0.01 ? (isDark ? '#6ee7b7' : '#047857') : (isDark ? '#f87171' : '#b91c1c'),
                  }}
                >
                  <CurrencyText amount={variance} showPlus={true} />
                </div>
              </div>
              <Badge color={Math.abs(variance) < 0.01 ? 'green' : 'red'}>
                {Math.abs(variance) < 0.01 ? 'BALANCED' : variance > 0 ? 'CASH OVER' : 'CASH SHORT'}
              </Badge>
            </div>

            {/* Optional Cash Drop Section */}
            <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
              <FormField label="Drop Cash to Safe / Bank Deposit">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Input
                    value={cashDropAmount}
                    type="number"
                    placeholder="Amount to drop..."
                    onChange={({ detail }) => setCashDropAmount(detail.value)}
                  />
                  <Button onClick={handleRecordCashDrop}>Drop Cash</Button>
                </div>
              </FormField>
            </div>
          </SpaceBetween>
        </Container>
      </Grid>

      {/* Z-Report Modal */}
      <Modal
        visible={isZReportModalOpen}
        onDismiss={() => setIsZReportModalOpen(false)}
        header="Z-Report / Shift Close Audit Slip"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setIsZReportModalOpen(false)}>Close</Button>
              <Button
                variant="primary"
                iconName="download"
                onClick={() => {
                  if (zReportRef.current) {
                    PrintService.printElement(zReportRef.current, 'Z-Report-Audit-Slip', 'thermal');
                  } else {
                    window.print();
                  }
                }}
              >
                Print Z-Report Slip
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        {closedSummary && (
          <div
            ref={zReportRef}
            id="z-report-paper"
            style={{
              width: '280px',
              maxWidth: '100%',
              margin: '0 auto',
              padding: '16px 12px',
              background: '#ffffff',
              color: '#111827',
              fontFamily: 'monospace, "Courier New", Courier',
              fontSize: '11px',
              lineHeight: '1.35',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{profile.storeName}</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '4px' }}>
                *** OFFICIAL Z-REPORT ***
              </div>
              <div style={{ fontSize: '11px', color: '#4b5563' }}>Day-End Financial Audit</div>
            </div>

            <div style={{ borderTop: '1px dashed #374151', margin: '8px 0' }} />

            <div>
              <div><strong>Closed At:</strong> {closedSummary.closedAt}</div>
              <div><strong>Opened At:</strong> {closedSummary.openedAt}</div>
              <div><strong>Cashier:</strong> {closedSummary.cashier}</div>
              <div><strong>Transactions:</strong> {closedSummary.invoiceCount}</div>
            </div>

            <div style={{ borderTop: '1px dashed #374151', margin: '8px 0' }} />

            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>SALES BY TENDER:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Cash Tender:</span>
              <span>{profile.currencySymbol}{closedSummary.cashSales.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Card Terminal:</span>
              <span>{profile.currencySymbol}{closedSummary.cardSales.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Digital / Wire:</span>
              <span>{profile.currencySymbol}{closedSummary.digitalSales.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '4px', borderTop: '1px solid #111827', paddingTop: '2px' }}>
              <span>TOTAL REVENUE:</span>
              <span>{profile.currencySymbol}{closedSummary.totalSales.toFixed(2)}</span>
            </div>

            <div style={{ borderTop: '1px dashed #374151', margin: '8px 0' }} />

            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>DRAWER RECONCILIATION:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Opening Float:</span>
              <span>{profile.currencySymbol}{closedSummary.openingFloat.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>+ Cash Sales:</span>
              <span>+{profile.currencySymbol}{closedSummary.cashSales.toFixed(2)}</span>
            </div>
            {closedSummary.cashDrops > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>- Cash Drops:</span>
                <span>-{profile.currencySymbol}{closedSummary.cashDrops.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Expected Cash:</span>
              <span>{profile.currencySymbol}{closedSummary.expectedCash.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Actual Counted:</span>
              <span>{profile.currencySymbol}{closedSummary.actualCashCount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: Math.abs(closedSummary.variance) < 0.01 ? '#047857' : '#b91c1c' }}>
              <span>VARIANCE:</span>
              <span>{profile.currencySymbol}{closedSummary.variance.toFixed(2)}</span>
            </div>

            <div style={{ borderTop: '1px dashed #374151', margin: '16px 0 8px 0' }} />

            <div style={{ textAlign: 'center', fontSize: '10px' }}>
              <div>Shift Verified By: __________________</div>
              <div style={{ marginTop: '8px', color: '#6b7280' }}>Audit Record Saved • End of Shift</div>
            </div>
          </div>
        )}
      </Modal>
    </SpaceBetween>
  );
};
