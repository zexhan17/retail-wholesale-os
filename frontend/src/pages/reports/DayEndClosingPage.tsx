import React, { useState, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';

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
      type: 'success', // using success instead of info, mapping to shadcn usually uses default or destructive
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
      type: 'success', // mapped info -> success for notification
      header: 'Register Re-Opened',
      content: 'New register shift started with $250.00 float.',
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">💰 Day-End Cash Closing & Z-Report</h1>
          <p className="text-muted-foreground mt-2">
            End-of-day register reconciliation, cash drawer balancing, and Z-Report audit generation.
          </p>
        </div>
        <div className="flex gap-2">
          {!drawerSession.isOpen && (
            <Button onClick={handleReopenRegister}>
              Open New Register Shift
            </Button>
          )}
          <Button
            variant="outline"
            disabled={!closedSummary}
            onClick={() => setIsZReportModalOpen(true)}
          >
            View Last Z-Report
          </Button>
        </div>
      </div>

      {/* Register Status Banner */}
      <div
        className={`flex flex-col sm:flex-row justify-between items-center flex-wrap gap-4 p-4 rounded-xl border ${
          drawerSession.isOpen
            ? isDark ? 'bg-emerald-950 border-emerald-700' : 'bg-emerald-50 border-emerald-300'
            : isDark ? 'bg-red-950 border-red-700' : 'bg-red-50 border-red-300'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={drawerSession.isOpen ? 'default' : 'destructive'} className={drawerSession.isOpen ? 'bg-green-600 hover:bg-green-700' : ''}>
              {drawerSession.isOpen ? 'REGISTER CURRENTLY ACTIVE' : 'REGISTER CLOSED'}
            </Badge>
            <span className="font-bold">Operator: {drawerSession.openedBy}</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Shift started at: {new Date(drawerSession.openedAt).toLocaleTimeString()} • Opening Float:{' '}
            <CurrencyText amount={drawerSession.openingFloat} />
          </div>
        </div>

        {drawerSession.isOpen && (
          <Button onClick={handleCloseShift}>
            Close Register & Generate Z-Report
          </Button>
        )}
      </div>

      {/* Grid: Financial Tenders Summary & Reconciliation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Tender Breakdown */}
        <div className="bg-card rounded-xl border shadow-sm flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Today's Tender Collections</h2>
            <p className="text-sm text-muted-foreground">Total collections recorded across all channels today</p>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div className="flex justify-between py-2 border-b">
              <span>💵 Cash Sales Tendered:</span>
              <span className="font-bold">
                <CurrencyText amount={cashSales} />
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>💳 Credit / Debit Card Terminal:</span>
              <span className="font-bold">
                <CurrencyText amount={cardSales} />
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>📱 Digital UPI & Bank Wire:</span>
              <span className="font-bold">
                <CurrencyText amount={digitalSales} />
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t-2 border-blue-600 text-lg font-bold text-blue-600">
              <span>Total Collections Today:</span>
              <span>
                <CurrencyText amount={totalCollectedToday} />
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Processed across {todayInvoices.length} transactions today.
            </div>
          </div>
        </div>

        {/* Physical Cash Drawer Balancing */}
        <div className="bg-card rounded-xl border shadow-sm flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Cash Drawer Balancing</h2>
            <p className="text-sm text-muted-foreground">Count physical cash in the drawer to verify against recorded sales</p>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Opening Float:</span>
              <span>
                <CurrencyText amount={drawerSession.openingFloat} />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">+ Cash Sales Inward:</span>
              <span className="text-green-600 font-semibold">
                +<CurrencyText amount={cashSales} />
              </span>
            </div>
            {drawerSession.cashDrops > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">- Cash Payouts / Drops:</span>
                <span className="text-destructive font-semibold">
                  -<CurrencyText amount={drawerSession.cashDrops} />
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-bold">
              <span>Expected Cash in Drawer:</span>
              <span className="text-base">
                <CurrencyText amount={drawerSession.expectedCash} />
              </span>
            </div>

            {/* Actual Count Input */}
            <div className="grid gap-2">
              <Label>Actual Physically Counted Cash</Label>
              <Input
                value={actualCashCount}
                type="number"
                onChange={(e) => setActualCashCount(e.target.value)}
              />
            </div>

            {/* Variance indicator */}
            <div
              className={`flex justify-between items-center p-3 rounded-lg border ${
                Math.abs(variance) < 0.01
                  ? isDark ? 'bg-emerald-950 border-emerald-700' : 'bg-emerald-50 border-emerald-300'
                  : isDark ? 'bg-red-950 border-red-700' : 'bg-red-50 border-red-300'
              }`}
            >
              <div>
                <div className="text-xs font-semibold">CASH VARIANCE:</div>
                <div
                  className={`text-xl font-bold ${
                    Math.abs(variance) < 0.01 ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-red-400' : 'text-red-700')
                  }`}
                >
                  <CurrencyText amount={variance} showPlus={true} />
                </div>
              </div>
              <Badge variant={Math.abs(variance) < 0.01 ? 'default' : 'destructive'} className={Math.abs(variance) < 0.01 ? 'bg-green-600 hover:bg-green-700' : ''}>
                {Math.abs(variance) < 0.01 ? 'BALANCED' : variance > 0 ? 'CASH OVER' : 'CASH SHORT'}
              </Badge>
            </div>

            {/* Optional Cash Drop Section */}
            <div className="border-t border-dashed pt-3 mt-2 grid gap-2">
              <Label>Drop Cash to Safe / Bank Deposit</Label>
              <div className="flex gap-2">
                <Input
                  value={cashDropAmount}
                  type="number"
                  placeholder="Amount to drop..."
                  onChange={(e) => setCashDropAmount(e.target.value)}
                />
                <Button variant="outline" onClick={handleRecordCashDrop}>Drop Cash</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Z-Report Modal */}
      <Dialog open={isZReportModalOpen} onOpenChange={setIsZReportModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Z-Report / Shift Close Audit Slip</DialogTitle>
          </DialogHeader>

          {closedSummary && (
            <div className="py-4 flex justify-center">
              <div
                ref={zReportRef}
                id="z-report-paper"
                className="bg-white text-black p-4 border w-full max-w-[280px] font-mono text-[11px] leading-[1.35]"
              >
                <div className="text-center mb-2">
                  <div className="font-bold text-base">{profile.storeName}</div>
                  <div className="text-[13px] font-bold mt-1">
                    *** OFFICIAL Z-REPORT ***
                  </div>
                  <div className="text-[11px] text-gray-600">Day-End Financial Audit</div>
                </div>

                <div className="border-t border-dashed border-gray-700 my-2" />

                <div>
                  <div><strong>Closed At:</strong> {closedSummary.closedAt}</div>
                  <div><strong>Opened At:</strong> {closedSummary.openedAt}</div>
                  <div><strong>Cashier:</strong> {closedSummary.cashier}</div>
                  <div><strong>Transactions:</strong> {closedSummary.invoiceCount}</div>
                </div>

                <div className="border-t border-dashed border-gray-700 my-2" />

                <div className="font-bold mb-1">SALES BY TENDER:</div>
                <div className="flex justify-between">
                  <span>Cash Tender:</span>
                  <span>{profile.currencySymbol}{closedSummary.cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card Terminal:</span>
                  <span>{profile.currencySymbol}{closedSummary.cardSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Digital / Wire:</span>
                  <span>{profile.currencySymbol}{closedSummary.digitalSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold mt-1 border-t border-black pt-[2px]">
                  <span>TOTAL REVENUE:</span>
                  <span>{profile.currencySymbol}{closedSummary.totalSales.toFixed(2)}</span>
                </div>

                <div className="border-t border-dashed border-gray-700 my-2" />

                <div className="font-bold mb-1">DRAWER RECONCILIATION:</div>
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>{profile.currencySymbol}{closedSummary.openingFloat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>+ Cash Sales:</span>
                  <span>+{profile.currencySymbol}{closedSummary.cashSales.toFixed(2)}</span>
                </div>
                {closedSummary.cashDrops > 0 && (
                  <div className="flex justify-between">
                    <span>- Cash Drops:</span>
                    <span>-{profile.currencySymbol}{closedSummary.cashDrops.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Expected Cash:</span>
                  <span>{profile.currencySymbol}{closedSummary.expectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Actual Counted:</span>
                  <span>{profile.currencySymbol}{closedSummary.actualCashCount.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between font-bold ${Math.abs(closedSummary.variance) < 0.01 ? 'text-green-800' : 'text-red-800'}`}>
                  <span>VARIANCE:</span>
                  <span>{profile.currencySymbol}{closedSummary.variance.toFixed(2)}</span>
                </div>

                <div className="border-t border-dashed border-gray-700 my-4 mb-2" />

                <div className="text-center text-[10px]">
                  <div>Shift Verified By: __________________</div>
                  <div className="mt-2 text-gray-500">Audit Record Saved • End of Shift</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsZReportModalOpen(false)}>Close</Button>
            <Button
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
