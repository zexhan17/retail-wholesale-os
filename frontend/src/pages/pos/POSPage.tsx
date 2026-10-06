import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Header from '@cloudscape-design/components/header';
import Box from '@cloudscape-design/components/box';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Select from '@cloudscape-design/components/select';
import Modal from '@cloudscape-design/components/modal';
import Badge from '@cloudscape-design/components/badge';
import FormField from '@cloudscape-design/components/form-field';
import SegmentedControl from '@cloudscape-design/components/segmented-control';

import { useProductStore } from '../../store/useProductStore';
import { useCustomerStore } from '../../store/useCustomerStore';
import { useCartStore } from '../../store/useCartStore';
import { useSalesStore } from '../../store/useSalesStore';
import { useAppStore } from '../../store/useAppStore';
import { CurrencyText, formatMoney } from '../../components/common/CurrencyText';
import { PrintThermalReceipt } from '../../components/print/PrintThermalReceipt';
import { Invoice } from '../../types/invoice';
import { Product } from '../../types/product';
import { Minus, Plus, Trash2, ArrowRightLeft, CreditCard, ShoppingCart } from 'lucide-react';

export const POSPage: React.FC = () => {
  const profile = useAppStore((state) => state.profile);
  const addNotification = useAppStore((state) => state.addNotification);
  const drawerSession = useAppStore((state) => state.drawerSession);
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  const colors = useMemo(() => {
    return isDark
      ? {
          bgPage: '#0f172a',
          bgCard: '#1e293b',
          bgHeader: '#1e293b',
          bgSubtle: '#0f172a',
          bgHover: '#334155',
          bgMuted: '#141e2e',
          border: '#334155',
          borderLight: '#1e293b',
          borderHover: '#0972d3',
          textPrimary: '#f8fafc',
          textSecondary: '#94a3b8',
          textMuted: '#64748b',
          kbdBg: '#0f172a',
          kbdBorder: '#334155',
          kbdText: '#e2e8f0',
          chipBg: '#1e293b',
          chipBorder: '#334155',
          chipText: '#e2e8f0',
          chipSelectedBg: '#0972d3',
          chipSelectedText: '#ffffff',
          resizerBg: '#334155',
          resizerHover: '#0972d3',
          cartItemBg: '#1e293b',
          cartItemBorder: '#334155',
          stepperBg: '#0f172a',
          stepperBorder: '#334155',
          stepperBtnBg: '#1e293b',
          stepperBtnHover: '#334155',
          quickCashBg: '#1e293b',
          quickCashBorder: '#334155',
          quickCashText: '#e2e8f0',
          exactCashBg: '#064e3b',
          exactCashBorder: '#059669',
          exactCashText: '#6ee7b7',
          exactCashHover: '#047857',
        }
      : {
          bgPage: '#f8fafc',
          bgCard: '#ffffff',
          bgHeader: '#ffffff',
          bgSubtle: '#f8fafc',
          bgHover: '#f1f5f9',
          bgMuted: '#f1f5f9',
          border: '#e2e8f0',
          borderLight: '#f1f5f9',
          borderHover: '#0972d3',
          textPrimary: '#0f172a',
          textSecondary: '#64748b',
          textMuted: '#94a3b8',
          kbdBg: '#f1f5f9',
          kbdBorder: '#cbd5e1',
          kbdText: '#334155',
          chipBg: '#ffffff',
          chipBorder: '#cbd5e1',
          chipText: '#334155',
          chipSelectedBg: '#0972d3',
          chipSelectedText: '#ffffff',
          resizerBg: '#e2e8f0',
          resizerHover: '#0972d3',
          cartItemBg: '#ffffff',
          cartItemBorder: '#e2e8f0',
          stepperBg: '#ffffff',
          stepperBorder: '#cbd5e1',
          stepperBtnBg: '#f8fafc',
          stepperBtnHover: '#e2e8f0',
          quickCashBg: '#ffffff',
          quickCashBorder: '#cbd5e1',
          quickCashText: '#334155',
          exactCashBg: '#ecfdf5',
          exactCashBorder: '#10b981',
          exactCashText: '#047857',
          exactCashHover: '#d1fae5',
        };
  }, [isDark]);

  const products = useProductStore((state) => state.products);
  const getProductByBarcode = useProductStore((state) => state.getProductByBarcode);
  const customers = useCustomerStore((state) => state.customers);
  const createInvoice = useSalesStore((state) => state.createInvoice);

  // Cart Store
  const {
    items,
    customer,
    setCustomer,
    addItem,
    updateItemQuantity,
    updateItemUnitType,
    updateItemDiscount,
    removeItem,
    clearCart,
    holdCurrentCart,
    recallHeldCart,
    discardHeldCart,
    heldCarts,
    getTotals,
  } = useCartStore();

  const totals = getTotals();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Two-column resizable layout state (percentage of left column)
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('omnistore_pos_split');
      return saved ? parseFloat(saved) : 58;
    } catch {
      return 58;
    }
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Mobile viewport detection and tab switching (Catalog vs Cart)
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState('');

  // Categories list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['all', ...cats];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Barcode / Fast Input Handler (triggered on scanner Enter key or manual Enter)
  const handleBarcodeSubmit = useCallback(() => {
    const q = searchQuery.trim();
    if (!q) return;
    const matched = getProductByBarcode(q);
    if (matched) {
      if (matched.stockQuantity <= 0) {
        addNotification({
          type: 'error',
          header: 'Out of Stock',
          content: `${matched.name} has 0 stock remaining.`,
        });
      } else {
        addItem(matched, 1, 'primary');
        setSearchQuery('');
        addNotification({
          type: 'success',
          header: 'Item Added',
          content: `Added ${matched.name} to cart.`,
        });
      }
    } else {
      if (filteredProducts.length === 1) {
        const item = filteredProducts[0];
        if (item.stockQuantity <= 0) {
          addNotification({
            type: 'error',
            header: 'Out of Stock',
            content: `${item.name} has 0 stock remaining.`,
          });
        } else {
          addItem(item, 1, 'primary');
          setSearchQuery('');
          addNotification({
            type: 'success',
            header: 'Item Added',
            content: `Added ${item.name} to cart.`,
          });
        }
      } else {
        addNotification({
          type: 'warning',
          header: 'Product Not Found',
          content: `No matching product found for "${q}".`,
        });
      }
    }
  }, [searchQuery, getProductByBarcode, filteredProducts, addItem, addNotification]);

  // Debounced auto-scan: Detects when a barcode is entered without needing manual button click
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;

    const timer = setTimeout(() => {
      // Check if query is an exact barcode, SKU, or Product ID match
      const matched = getProductByBarcode(q);
      if (matched) {
        if (matched.stockQuantity <= 0) {
          addNotification({
            type: 'error',
            header: 'Out of Stock',
            content: `${matched.name} has 0 stock remaining.`,
          });
        } else {
          addItem(matched, 1, 'primary');
          setSearchQuery('');
          addNotification({
            type: 'success',
            header: 'Barcode Scanned',
            content: `Added ${matched.name} (${matched.barcode}) to cart.`,
          });
        }
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, getProductByBarcode, addItem, addNotification]);

  // Keyboard shortcut listener (F2 focus, F4 hold, F8 clear, F9 pay)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (items.length > 0) holdCurrentCart('Parked counter bill');
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (items.length > 0) clearCart();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (items.length > 0) handleOpenPayment();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, holdCurrentCart, clearCart]);

  // Resizer drag handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.min(75, Math.max(30, newRatio));
    setSplitRatio(clamped);
    try {
      localStorage.setItem('omnistore_pos_split', clamped.toFixed(1));
    } catch {}
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  // Open Payment Modal
  const handleOpenPayment = () => {
    if (items.length === 0) return;
    setTenderedAmount(totals.grandTotal.toFixed(2));
    setIsPaymentModalOpen(true);
  };

  // Quick Instant Tender without opening full modal (for speed at counter)
  const handleQuickCashTender = (exactOrAmount?: number) => {
    if (items.length === 0) return;
    const finalAmount = exactOrAmount !== undefined ? exactOrAmount : totals.grandTotal;

    const invoiceNum = `INV-RET-${Date.now().toString().slice(-6)}`;
    const selectedCustomer = customer || customers.find((c) => c.id === 'cust-walkin') || {
      name: 'Walk-in Cash Customer',
      id: undefined,
      phone: undefined,
    };

    const newInvoice = createInvoice({
      invoiceNumber: invoiceNum,
      type: 'retail',
      date: new Date().toISOString().split('T')[0],
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      items: [...items],
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      roundOff: 0,
      grandTotal: totals.grandTotal,
      paidAmount: totals.grandTotal,
      dueAmount: 0,
      paymentStatus: 'paid',
      status: 'completed',
      payments: [
        {
          id: `pay-${Date.now()}`,
          method: 'cash',
          amount: totals.grandTotal,
          reference: `Cash Paid: ${formatMoney(finalAmount, profile.currencySymbol)}`,
          date: new Date().toISOString(),
        },
      ],
      cashierName: drawerSession.openedBy || 'Counter POS 1',
    });

    clearCart();
    setCompletedInvoice(newInvoice);
    addNotification({
      type: 'success',
      header: 'Cash Sale Completed',
      content: `Invoice #${newInvoice.invoiceNumber} processed successfully!`,
    });
  };

  // Calculate change in payment modal
  const tenderedNum = parseFloat(tenderedAmount) || 0;
  const changeDue = Math.max(0, tenderedNum - totals.grandTotal);

  // Complete Sale inside Payment Modal
  const handleCompleteSale = () => {
    if (items.length === 0) return;

    const invoiceNum = `INV-RET-${Date.now().toString().slice(-6)}`;
    const selectedCustomer = customer || customers.find((c) => c.id === 'cust-walkin') || {
      name: 'Walk-in Cash Customer',
      id: undefined,
      phone: undefined,
    };

    const newInvoice = createInvoice({
      invoiceNumber: invoiceNum,
      type: 'retail',
      date: new Date().toISOString().split('T')[0],
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      items: [...items],
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      roundOff: 0,
      grandTotal: totals.grandTotal,
      paidAmount: totals.grandTotal,
      dueAmount: 0,
      paymentStatus: 'paid',
      status: 'completed',
      payments: [
        {
          id: `pay-${Date.now()}`,
          method: paymentMethod,
          amount: totals.grandTotal,
          reference: paymentReference || undefined,
          date: new Date().toISOString(),
        },
      ],
      cashierName: drawerSession.openedBy || 'Counter POS 1',
    });

    clearCart();
    setIsPaymentModalOpen(false);
    setCompletedInvoice(newInvoice);
    addNotification({
      type: 'success',
      header: 'Sale Completed',
      content: `Invoice #${newInvoice.invoiceNumber} processed successfully.`,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? 'calc(100dvh - 60px)' : 'calc(100vh - 65px)',
        padding: isMobile ? '6px 8px' : '10px 14px',
        boxSizing: 'border-box',
        gap: isMobile ? '6px' : '10px',
        width: '100%',
        background: colors.bgPage,
      }}
    >
      {/* Top Header & Operational Utility Toolbar */}
      <div
        style={{
          background: colors.bgCard,
          borderRadius: '8px',
          padding: isMobile ? '8px 12px' : '10px 16px',
          border: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 800, fontSize: isMobile ? '16px' : '18px', color: '#0972d3', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚡ POS Checkout Counter</span>
          </div>
          <Badge color={drawerSession.isOpen ? 'green' : 'red'}>
            {drawerSession.isOpen ? `Active • ${formatMoney(drawerSession.openingFloat, profile.currencySymbol)}` : 'Closed'}
          </Badge>
          {!isMobile && (
            <span style={{ fontSize: '12px', color: colors.textSecondary }}>
              Shortcuts: <kbd style={{ padding: '2px 4px', background: colors.kbdBg, borderRadius: '4px', border: `1px solid ${colors.kbdBorder}`, color: colors.kbdText }}>F2</kbd> Scan • <kbd style={{ padding: '2px 4px', background: colors.kbdBg, borderRadius: '4px', border: `1px solid ${colors.kbdBorder}`, color: colors.kbdText }}>F4</kbd> Hold • <kbd style={{ padding: '2px 4px', background: colors.kbdBg, borderRadius: '4px', border: `1px solid ${colors.kbdBorder}`, color: colors.kbdText }}>F9</kbd> Pay
            </span>
          )}
        </div>

        {/* Cart Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {heldCarts.length > 0 && (
            <Button
              iconName="file"
              onClick={() => setIsHeldModalOpen(true)}
            >
              Held ({heldCarts.length})
            </Button>
          )}

          <Button
            disabled={items.length === 0}
            iconName="calendar"
            onClick={() => holdCurrentCart('Parked bill')}
          >
            {isMobile ? 'Park' : 'Park Bill'}
          </Button>

          <Button
            disabled={items.length === 0}
            iconName="remove"
            onClick={clearCart}
          >
            Clear
          </Button>
        </div>

        {/* Mobile View Toggle Pills (Catalog vs Cart) */}
        {isMobile && (
          <div style={{ display: 'flex', width: '100%', gap: '6px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={() => setMobileTab('catalog')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: mobileTab === 'catalog' ? '2px solid #0972d3' : `1px solid ${colors.border}`,
                background: mobileTab === 'catalog' ? '#0972d3' : colors.bgSubtle,
                color: mobileTab === 'catalog' ? '#ffffff' : colors.textPrimary,
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>🏷️ Products</span>
              <span style={{
                background: mobileTab === 'catalog' ? '#ffffff' : colors.bgHover,
                color: mobileTab === 'catalog' ? '#0972d3' : colors.textSecondary,
                padding: '0 6px',
                borderRadius: '10px',
                fontSize: '11px',
              }}>
                {filteredProducts.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('cart')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: mobileTab === 'cart' ? '2px solid #0972d3' : `1px solid ${colors.border}`,
                background: mobileTab === 'cart' ? '#0972d3' : colors.bgSubtle,
                color: mobileTab === 'cart' ? '#ffffff' : colors.textPrimary,
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>🛒 Active Cart</span>
              {totals.itemCount > 0 && (
                <span style={{
                  background: mobileTab === 'cart' ? '#ffffff' : '#0972d3',
                  color: mobileTab === 'cart' ? '#0972d3' : '#ffffff',
                  padding: '0 6px',
                  borderRadius: '10px',
                  fontSize: '11px',
                }}>
                  {totals.itemCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Two-Column Draggable Layout Container */}
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          background: colors.bgCard,
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* ===================== LEFT COLUMN: CATALOG & SEARCH ===================== */}
        <div
          style={{
            width: isMobile ? '100%' : `${splitRatio}%`,
            minWidth: isMobile ? '0' : '320px',
            display: !isMobile || mobileTab === 'catalog' ? 'flex' : 'none',
            flexDirection: 'column',
            borderRight: isMobile ? 'none' : `1px solid ${colors.border}`,
            background: colors.bgCard,
          }}
        >
          {/* Search, Scanner & View Toggle Bar */}
          <div
            style={{
              padding: '12px',
              borderBottom: `1px solid ${colors.border}`,
              background: colors.bgSubtle,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Input
                  ref={searchInputRef as any}
                  value={searchQuery}
                  onChange={({ detail }) => setSearchQuery(detail.value)}
                  onKeyDown={(e) => {
                    if (e.detail.key === 'Enter') {
                      handleBarcodeSubmit();
                    }
                  }}
                  placeholder="⚡ Scan Barcode or type Name / SKU (auto-scans or press Enter)..."
                  type="search"
                  clearAriaLabel="Clear search"
                />
              </div>

              {/* Compact View Mode Icon Toggle */}
              <div
                style={{
                  display: 'flex',
                  gap: '2px',
                  background: colors.bgHover,
                  padding: '2px',
                  borderRadius: '6px',
                  alignItems: 'center',
                }}
              >
                <button
                  type="button"
                  title="Grid View"
                  aria-label="Grid View"
                  onClick={() => setViewMode('grid')}
                  style={{
                    border: 'none',
                    background: viewMode === 'grid' ? colors.bgCard : 'transparent',
                    color: viewMode === 'grid' ? '#0972d3' : colors.textSecondary,
                    boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                    borderRadius: '4px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm-11 11h7v7H3v-7zm11 0h7v7h-7v-7z" />
                  </svg>
                </button>
                <button
                  type="button"
                  title="List View"
                  aria-label="List View"
                  onClick={() => setViewMode('list')}
                  style={{
                    border: 'none',
                    background: viewMode === 'list' ? colors.bgCard : 'transparent',
                    color: viewMode === 'list' ? '#0972d3' : colors.textSecondary,
                    boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                    borderRadius: '4px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                paddingBottom: '2px',
              }}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      border: isSelected ? '1px solid #0972d3' : `1px solid ${colors.chipBorder}`,
                      background: isSelected ? colors.chipSelectedBg : colors.chipBg,
                      color: isSelected ? colors.chipSelectedText : colors.chipText,
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {cat === 'all' ? 'All Items' : cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Items Display (Grid or High-Density List) */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              background: colors.bgCard,
            }}
          >
            {filteredProducts.length === 0 ? (
              <Box textAlign="center" padding="l" color="text-body-secondary">
                No products found matching "{searchQuery}".
              </Box>
            ) : viewMode === 'grid' ? (
              /* --- GRID CARD VIEW --- */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? 'repeat(auto-fill, minmax(130px, 1fr))'
                    : 'repeat(auto-fill, minmax(170px, 1fr))',
                  gap: isMobile ? '8px' : '10px',
                }}
              >
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stockQuantity <= 0;
                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        if (!isOutOfStock) addItem(product, 1, 'primary');
                      }}
                      style={{
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '10px',
                        background: isOutOfStock ? colors.bgMuted : colors.bgCard,
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        opacity: isOutOfStock ? 0.6 : 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isOutOfStock) {
                          e.currentTarget.style.borderColor = colors.borderHover;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isOutOfStock) {
                          e.currentTarget.style.borderColor = colors.border;
                          e.currentTarget.style.transform = 'none';
                        }
                      }}
                    >
                      <div>
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            style={{
                              width: '100%',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              marginBottom: '6px',
                            }}
                          />
                        )}
                        <div style={{ fontWeight: 600, fontSize: '13px', lineHeight: '1.25', maxHeight: '34px', overflow: 'hidden', color: colors.textPrimary }}>
                          {product.name}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
                          {product.sku}
                        </div>
                      </div>

                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#0972d3' }}>
                            <CurrencyText amount={product.retailPrice} />
                          </span>
                          <span style={{ fontSize: '11px', color: colors.textSecondary }}>
                            /{product.primaryUnit}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px' }}>
                          <span style={{ color: product.stockQuantity <= product.reorderLevel ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                            {product.stockQuantity} left
                          </span>
                          {product.packagingMultiplier > 1 && (
                            <span style={{ fontSize: '10px', background: isDark ? '#1e3a5f' : '#eff6ff', color: isDark ? '#93c5fd' : '#1d4ed8', padding: '1px 4px', borderRadius: '4px' }}>
                              x{product.packagingMultiplier} {product.packagingUnit}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* --- HIGH DENSITY LIST VIEW --- */
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: `2px solid ${colors.border}`, color: colors.textSecondary }}>
                    <th style={{ padding: '6px 8px' }}>Item & SKU</th>
                    <th style={{ padding: '6px 8px' }}>Category</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Stock</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isOutOfStock = p.stockQuantity <= 0;
                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: `1px solid ${colors.borderLight}`,
                          background: isOutOfStock ? colors.bgMuted : colors.bgCard,
                        }}
                      >
                        <td style={{ padding: '6px 8px' }}>
                          <div style={{ fontWeight: 600, color: colors.textPrimary }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: colors.textSecondary }}>{p.sku} • {p.barcode}</div>
                        </td>
                        <td style={{ padding: '6px 8px', color: colors.textSecondary, fontSize: '12px' }}>{p.category}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <span style={{ color: p.stockQuantity <= p.reorderLevel ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                            {p.stockQuantity} {p.primaryUnit}s
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: '#0972d3' }}>
                          <CurrencyText amount={p.retailPrice} />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <Button
                            variant="primary"
                            disabled={isOutOfStock}
                            onClick={() => addItem(p, 1, 'primary')}
                          >
                            + Add
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Mobile Bottom Sticky Cart Banner */}
            {isMobile && totals.itemCount > 0 && (
              <div
                onClick={() => setMobileTab('cart')}
                style={{
                  background: '#0972d3',
                  color: '#ffffff',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  margin: '10px 0 4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(9, 114, 211, 0.35)',
                  fontWeight: 'bold',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🛒 {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'} in cart</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span><CurrencyText amount={totals.grandTotal} /></span>
                  <span>→ View Cart</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===================== DRAGGABLE RESIZER HANDLE ===================== */}
        <div
          onMouseDown={handleMouseDown}
          title="Drag to resize columns"
          style={{
            width: '8px',
            cursor: 'col-resize',
            background: colors.resizerBg,
            display: isMobile ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            zIndex: 10,
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = colors.resizerHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = colors.resizerBg)}
        >
          <div style={{ width: '2px', height: '24px', background: colors.textSecondary, borderRadius: '1px' }} />
        </div>

        {/* ===================== RIGHT COLUMN: ACTIVE CART & TENDER ===================== */}
        <div
          style={{
            flex: 1,
            width: isMobile ? '100%' : 'auto',
            minWidth: isMobile ? '0' : '320px',
            display: !isMobile || mobileTab === 'cart' ? 'flex' : 'none',
            flexDirection: 'column',
            background: colors.bgCard,
          }}
        >
          {/* Cart Header & Customer Picker */}
          <div
            style={{
              padding: isMobile ? '8px 10px' : '10px 14px',
              borderBottom: `1px solid ${colors.border}`,
              background: colors.bgSubtle,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {isMobile && (
              <Button
                iconName="arrow-left"
                onClick={() => setMobileTab('catalog')}
              >
                Back to Products Catalog
              </Button>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', color: colors.textPrimary }}>
                <ShoppingCart size={18} color="#0972d3" />
                <span>Active Cart ({totals.itemCount} items)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {totals.itemCount > 0 && (
                  <>
                    <button
                      type="button"
                      title="Clear Cart"
                      onClick={clearCart}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        color: colors.textSecondary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 500,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.borderColor = '#fca5a5';
                        e.currentTarget.style.background = isDark ? '#450a0a' : '#fef2f2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = colors.textSecondary;
                        e.currentTarget.style.borderColor = colors.border;
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Clear</span>
                    </button>
                    <Badge color="green">
                      Total: <CurrencyText amount={totals.grandTotal} />
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* Quick Customer Selector with Search Bar */}
            <Select
              selectedOption={
                customer
                  ? {
                      label: customer.name,
                      description: `${customer.phone} • ${customer.type.toUpperCase()}${customer.loyaltyPoints ? ` • ${customer.loyaltyPoints} pts` : ''}`,
                      value: customer.id,
                    }
                  : {
                      label: 'Walk-in Cash Customer',
                      description: 'Standard retail counter checkout',
                      value: 'cust-walkin',
                    }
              }
              onChange={({ detail }) => {
                const found = customers.find((c) => c.id === detail.selectedOption.value);
                setCustomer(found || null);
              }}
              options={[
                {
                  label: 'Walk-in Cash Customer',
                  description: 'Standard retail counter checkout',
                  value: 'cust-walkin',
                  tags: ['walkin', 'cash'],
                },
                ...customers
                  .filter((c) => c.id !== 'cust-walkin')
                  .map((c) => ({
                    label: c.name,
                    description: `${c.phone} • ${c.type.toUpperCase()}${c.loyaltyPoints ? ` • ${c.loyaltyPoints} pts` : ''}`,
                    value: c.id,
                    tags: [c.phone, c.email, c.companyName, c.address?.city].filter((t): t is string => Boolean(t)),
                  })),
              ]}
              filteringType="auto"
              filteringPlaceholder="Search customer by name, phone..."
              placeholder="Search or Select Customer..."
              empty="No customers found"
            />
          </div>

          {/* Cart Line Items Scroll Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              background: colors.bgCard,
            }}
          >
            {items.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textMuted,
                  gap: '8px',
                  padding: '30px 0',
                }}
              >
                <div style={{ fontSize: '36px' }}>🛒</div>
                <div style={{ fontWeight: 600 }}>Cart is empty</div>
                <div style={{ fontSize: '12px' }}>Tap products or scan barcode to add</div>
              </div>
            ) : (
              items.map((item) => {
                const rawProduct = products.find((p) => p.id === item.productId);
                return (
                  <div
                    key={item.id}
                    style={{
                      background: colors.cartItemBg,
                      border: `1px solid ${colors.cartItemBorder}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '13px',
                            color: colors.textPrimary,
                            lineHeight: 1.35,
                            wordBreak: 'break-word',
                          }}
                        >
                          {item.productName}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span>Rate: <CurrencyText amount={item.unitPrice} /></span>
                          {rawProduct && rawProduct.packagingMultiplier > 1 && (
                            <button
                              type="button"
                              title="Toggle packaging unit"
                              onClick={() =>
                                updateItemUnitType(
                                  item.id,
                                  item.unitType === 'primary' ? 'packaging' : 'primary',
                                  rawProduct
                                )
                              }
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: isDark ? '#1e3a5f' : '#eff6ff',
                                border: isDark ? '1px solid #2563eb' : '1px solid #bfdbfe',
                                borderRadius: '12px',
                                color: isDark ? '#93c5fd' : '#1d4ed8',
                                padding: '1px 8px',
                                fontSize: '10px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'background-color 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = isDark ? '#2563eb' : '#dbeafe';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = isDark ? '#1e3a5f' : '#eff6ff';
                              }}
                            >
                              <ArrowRightLeft size={10} />
                              <span>Unit: {item.unitType === 'packaging' ? rawProduct.packagingUnit : rawProduct.primaryUnit}</span>
                              <span style={{ opacity: 0.75 }}>(Switch)</span>
                            </button>
                          )}
                          {rawProduct && rawProduct.stockQuantity <= 5 && (
                            <span style={{ fontSize: '10px', color: '#dc2626', background: isDark ? '#450a0a' : '#fee2e2', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              Only {rawProduct.stockQuantity} in stock
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        title="Remove item"
                        aria-label="Remove item"
                        onClick={() => removeItem(item.id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: colors.textMuted,
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.background = isDark ? '#450a0a' : '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = colors.textMuted;
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Stepper & Line Total */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2px' }}>
                      {/* Quantity Stepper with Minus Button */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: `1px solid ${colors.stepperBorder}`,
                          borderRadius: '6px',
                          background: colors.stepperBg,
                          overflow: 'hidden',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        }}
                      >
                        <button
                          type="button"
                          title="Decrease quantity (-)"
                          aria-label="Decrease quantity"
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            background: colors.stepperBtnBg,
                            color: colors.textPrimary,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            borderRight: `1px solid ${colors.stepperBorder}`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.stepperBtnHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = colors.stepperBtnBg;
                          }}
                        >
                          <Minus size={14} strokeWidth={2.5} />
                        </button>
                        <span
                          style={{
                            minWidth: '32px',
                            padding: '0 4px',
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '13px',
                            color: colors.textPrimary,
                            userSelect: 'none',
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          title="Increase quantity (+)"
                          aria-label="Increase quantity"
                          onClick={() => {
                            if (rawProduct && item.quantity >= rawProduct.stockQuantity) {
                              addNotification({
                                type: 'warning',
                                header: 'Stock Limit',
                                content: `Only ${rawProduct.stockQuantity} ${rawProduct.primaryUnit} available in stock.`,
                              });
                              return;
                            }
                            updateItemQuantity(item.id, item.quantity + 1);
                          }}
                          style={{
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            background: colors.stepperBtnBg,
                            color: colors.textPrimary,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            borderLeft: `1px solid ${colors.stepperBorder}`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.stepperBtnHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = colors.stepperBtnBg;
                          }}
                        >
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Line Discount & Total */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '15px', color: isDark ? '#38bdf8' : '#0972d3' }}>
                          <CurrencyText amount={item.total} />
                        </div>
                        {item.taxAmount > 0 && (
                          <div style={{ fontSize: '10px', color: colors.textSecondary }}>
                            Tax ({item.taxRate}%): <CurrencyText amount={item.taxAmount} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Totals Summary & Fast Tender Deck */}
          <div
            style={{
              padding: '12px 14px',
              borderTop: `1px solid ${colors.border}`,
              background: colors.bgSubtle,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* Totals Breakdown */}
            <div style={{ fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: colors.textSecondary }}>
                <span>Subtotal:</span>
                <span><CurrencyText amount={totals.subtotal} /></span>
              </div>
              {totals.discountTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: '#16a34a' }}>
                  <span>Discount:</span>
                  <span>-<CurrencyText amount={totals.discountTotal} /></span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: colors.textSecondary }}>
                <span>Estimated Tax:</span>
                <span><CurrencyText amount={totals.taxTotal} /></span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  borderTop: `1px dashed ${colors.border}`,
                  paddingTop: '8px',
                  fontWeight: 'bold',
                  fontSize: '20px',
                  color: colors.textPrimary,
                }}
              >
                <span>TOTAL:</span>
                <span style={{ color: isDark ? '#38bdf8' : '#0972d3' }}>
                  <CurrencyText amount={totals.grandTotal} />
                </span>
              </div>
            </div>

            {/* Quick Cash Presets Bar (Speed Checkout) */}
            {items.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                <button
                  type="button"
                  onClick={() => handleQuickCashTender(totals.grandTotal)}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.exactCashBorder}`,
                    background: colors.exactCashBg,
                    color: colors.exactCashText,
                    fontWeight: 'bold',
                    fontSize: '11px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.exactCashHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colors.exactCashBg;
                  }}
                >
                  💵 Exact Cash ({formatMoney(totals.grandTotal, profile.currencySymbol)})
                </button>
                {(() => {
                  const quickOptions: number[] = [];
                  const ceiling10 = Math.ceil(totals.grandTotal / 10) * 10;
                  if (ceiling10 > totals.grandTotal) quickOptions.push(ceiling10);
                  const ceiling50 = Math.ceil(totals.grandTotal / 50) * 50;
                  if (ceiling50 > totals.grandTotal && !quickOptions.includes(ceiling50)) quickOptions.push(ceiling50);
                  const ceiling100 = Math.ceil(totals.grandTotal / 100) * 100;
                  if (ceiling100 >= totals.grandTotal && !quickOptions.includes(ceiling100)) quickOptions.push(ceiling100);
                  if (quickOptions.length < 3) {
                    const nextStep = (quickOptions[quickOptions.length - 1] || Math.ceil(totals.grandTotal)) + 100;
                    quickOptions.push(nextStep);
                  }
                  return quickOptions.slice(0, 3).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickCashTender(amt)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.quickCashBorder}`,
                        background: colors.quickCashBg,
                        color: colors.quickCashText,
                        fontWeight: 600,
                        fontSize: '11px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.bgHover;
                        e.currentTarget.style.borderColor = colors.borderHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = colors.quickCashBg;
                        e.currentTarget.style.borderColor = colors.quickCashBorder;
                      }}
                    >
                      {formatMoney(amt, profile.currencySymbol)}
                    </button>
                  ));
                })()}
              </div>
            )}

            {/* Main Checkout Button */}
            <button
              type="button"
              disabled={items.length === 0}
              onClick={handleOpenPayment}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '6px',
                border: 'none',
                background: items.length === 0 ? '#94a3b8' : '#0972d3',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: items.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: items.length === 0 ? 'none' : '0 2px 6px rgba(9, 114, 211, 0.3)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (items.length > 0) e.currentTarget.style.background = '#035397';
              }}
              onMouseLeave={(e) => {
                if (items.length > 0) e.currentTarget.style.background = '#0972d3';
              }}
            >
              <CreditCard size={17} />
              <span>TENDER / CHECKOUT ({formatMoney(totals.grandTotal, profile.currencySymbol)})</span>
              <span
                style={{
                  fontSize: '11px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontWeight: 600,
                }}
              >
                F9
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Tender Modal */}
      <Modal
        visible={isPaymentModalOpen}
        onDismiss={() => setIsPaymentModalOpen(false)}
        header={`Payment Tender: ${formatMoney(totals.grandTotal, profile.currencySymbol)}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCompleteSale} iconName="check">
                Complete Sale & Print Receipt
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <SegmentedControl
            selectedId={paymentMethod}
            onChange={({ detail }) => setPaymentMethod(detail.selectedId as any)}
            options={[
              { id: 'cash', text: '💵 Cash' },
              { id: 'card', text: '💳 Card' },
              { id: 'upi', text: '📱 Digital UPI / QR' },
            ]}
          />

          {paymentMethod === 'cash' && (
            <SpaceBetween size="s">
              <FormField label="Cash Received Amount">
                <Input
                  value={tenderedAmount}
                  onChange={({ detail }) => setTenderedAmount(detail.value)}
                  type="number"
                />
              </FormField>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button onClick={() => setTenderedAmount(totals.grandTotal.toFixed(2))}>
                  Exact ({formatMoney(totals.grandTotal, profile.currencySymbol)})
                </Button>
                {(() => {
                  const opts: number[] = [];
                  const ceiling10 = Math.ceil(totals.grandTotal / 10) * 10;
                  if (ceiling10 > totals.grandTotal) opts.push(ceiling10);
                  const ceiling50 = Math.ceil(totals.grandTotal / 50) * 50;
                  if (ceiling50 > totals.grandTotal && !opts.includes(ceiling50)) opts.push(ceiling50);
                  const ceiling100 = Math.ceil(totals.grandTotal / 100) * 100;
                  if (ceiling100 >= totals.grandTotal && !opts.includes(ceiling100)) opts.push(ceiling100);
                  const ceiling500 = Math.ceil(totals.grandTotal / 500) * 500;
                  if (ceiling500 >= totals.grandTotal && !opts.includes(ceiling500)) opts.push(ceiling500);
                  return opts.map((amt) => (
                    <Button
                      key={amt}
                      onClick={() => setTenderedAmount(amt.toFixed(2))}
                    >
                      {formatMoney(amt, profile.currencySymbol)}
                    </Button>
                  ));
                })()}
              </div>

              <div
                style={{
                  background: changeDue > 0 ? (isDark ? '#064e3b' : '#ecfdf5') : colors.bgSubtle,
                  border: `1px solid ${changeDue > 0 ? '#10b981' : colors.border}`,
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: 600 }}>CHANGE DUE:</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: changeDue > 0 ? (isDark ? '#6ee7b7' : '#047857') : colors.textPrimary }}>
                    <CurrencyText amount={changeDue} />
                  </div>
                </div>
                {changeDue > 0 && <Badge color="green">Return Cash</Badge>}
              </div>
            </SpaceBetween>
          )}

          {paymentMethod === 'card' && (
            <FormField label="Card Transaction Auth Slip Reference # (Optional)">
              <Input
                value={paymentReference}
                onChange={({ detail }) => setPaymentReference(detail.value)}
                placeholder="e.g. VISA-AUTH-8812"
              />
            </FormField>
          )}

          {paymentMethod === 'upi' && (
            <SpaceBetween size="s">
              <FormField label="UPI / QR Transaction Ref ID">
                <Input
                  value={paymentReference}
                  onChange={({ detail }) => setPaymentReference(detail.value)}
                  placeholder="e.g. UPI-992144"
                />
              </FormField>
              <Box textAlign="center" padding="m">
                <div style={{ display: 'inline-block', padding: '12px', background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '6px', color: colors.textPrimary }}>Scan Shop UPI QR Code</div>
                  <div style={{ width: '130px', height: '130px', background: colors.bgSubtle, color: colors.textSecondary, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    [QR CODE]
                  </div>
                </div>
              </Box>
            </SpaceBetween>
          )}
        </SpaceBetween>
      </Modal>

      {/* Held Bills Modal */}
      <Modal
        visible={isHeldModalOpen}
        onDismiss={() => setIsHeldModalOpen(false)}
        header={`Held Bills (${heldCarts.length})`}
        footer={
          <Box float="right">
            <Button onClick={() => setIsHeldModalOpen(false)}>Close</Button>
          </Box>
        }
      >
        {heldCarts.length === 0 ? (
          <Box textAlign="center" padding="m">No parked bills found.</Box>
        ) : (
          <SpaceBetween size="s">
            {heldCarts.map((h) => (
              <div
                key={h.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  background: colors.bgCard,
                  borderRadius: '6px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: colors.textPrimary }}>{h.note}</div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                    Parked at: {h.timestamp} • {h.items.length} items
                  </div>
                  {h.customer && (
                    <div style={{ fontSize: '12px', color: '#0972d3' }}>
                      Customer: {h.customer.name}
                    </div>
                  )}
                </div>
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    variant="primary"
                    onClick={() => {
                      recallHeldCart(h.id);
                      setIsHeldModalOpen(false);
                    }}
                  >
                    Recall Bill
                  </Button>
                  <Button
                    variant="icon"
                    iconName="remove"
                    onClick={() => discardHeldCart(h.id)}
                  />
                </SpaceBetween>
              </div>
            ))}
          </SpaceBetween>
        )}
      </Modal>

      {/* Printable Thermal Receipt Modal */}
      <Modal
        visible={!!completedInvoice}
        onDismiss={() => setCompletedInvoice(null)}
        header="Sale Complete - Receipt"
        footer={
          <Box float="right">
            <Button onClick={() => setCompletedInvoice(null)}>Close</Button>
          </Box>
        }
      >
        {completedInvoice && (
          <PrintThermalReceipt
            invoice={completedInvoice}
            onClose={() => setCompletedInvoice(null)}
          />
        )}
      </Modal>
    </div>
  );
};
