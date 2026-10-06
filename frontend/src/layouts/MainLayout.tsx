import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '@cloudscape-design/components/app-layout';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import SideNavigation from '@cloudscape-design/components/side-navigation';
import Flashbar from '@cloudscape-design/components/flashbar';
import Modal from '@cloudscape-design/components/modal';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import { applyMode, Mode } from '@cloudscape-design/global-styles';

import { useAppStore } from '../store/useAppStore';
import { useProductStore } from '../store/useProductStore';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const profile = useAppStore((state) => state.profile);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const notifications = useAppStore((state) => state.notifications);
  const dismissNotification = useAppStore((state) => state.dismissNotification);

  // Directly select products to keep Zustand getSnapshot pure and cached
  const products = useProductStore((state) => state.products);
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stockQuantity <= p.reorderLevel),
    [products]
  );
  const lowStockCount = lowStockProducts.length;

  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 992 && location.pathname !== '/pos' : false;
  });

  // Auto-close side drawer when navigating routes on mobile screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setNavigationOpen(false);
    }
  }, [location.pathname]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    applyMode(nextTheme === 'dark' ? Mode.Dark : Mode.Light);
  }, [theme, setTheme]);

  const navItems = useMemo(
    () => [
      { type: 'link' as const, text: 'Dashboard & Overview', href: '/' },
      {
        type: 'section' as const,
        text: 'Sales & Transactions',
        items: [
          { type: 'link' as const, text: '⚡ Retail Quick POS', href: '/pos' },
          { type: 'link' as const, text: '📦 Wholesale B2B Billing', href: '/wholesale/billing' },
          { type: 'link' as const, text: '📄 Invoices & Orders', href: '/invoices' },
        ],
      },
      {
        type: 'section' as const,
        text: 'Inventory & Catalog',
        items: [
          { type: 'link' as const, text: '🏷️ Products & Dual Pricing', href: '/products' },
          { type: 'link' as const, text: '⚖️ Stock Adjustments', href: '/stock-adjustments' },
        ],
      },
      {
        type: 'section' as const,
        text: 'Parties & Khata Ledger',
        items: [
          { type: 'link' as const, text: '👥 Customers & Credit (Khata)', href: '/customers' },
          { type: 'link' as const, text: '🏭 Suppliers & Vendors', href: '/suppliers' },
          { type: 'link' as const, text: '📋 Purchase Orders (Inward)', href: '/purchases' },
        ],
      },
      {
        type: 'section' as const,
        text: 'Reconciliation & Reports',
        items: [
          { type: 'link' as const, text: '💰 Day-End Z-Report (Cash Drawer)', href: '/reports/day-end' },
          { type: 'link' as const, text: '📊 Sales & Margin Analytics', href: '/reports/analytics' },
        ],
      },
      { type: 'divider' as const },
      { type: 'link' as const, text: '⚙️ Settings & Database Backup', href: '/settings' },
    ],
    []
  );

  const identity = useMemo(
    () => ({
      href: '/',
      title: profile.storeName,
      logo: {
        src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230972d3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
        alt: 'OmniStore OS Logo',
      },
      onFollow: (e: any) => {
        e.preventDefault();
        navigate('/');
      },
    }),
    [profile.storeName, navigate]
  );

  const utilities = useMemo(
    () => [
      {
        type: 'button' as const,
        text: '⚡ Open POS Counter',
        iconName: 'external' as const,
        onClick: () => navigate('/pos'),
      },
      {
        type: 'button' as const,
        iconName: 'notification' as const,
        ariaLabel: 'Low Stock Alerts',
        badge: lowStockCount > 0,
        text: lowStockCount > 0 ? `${lowStockCount} Low Stock` : undefined,
        onClick: () => setIsLowStockModalOpen(true),
      },
      {
        type: 'button' as const,
        iconName: 'settings' as const,
        text: theme === 'dark' ? 'Switch to Light' : 'Switch to Dark',
        onClick: toggleTheme,
      },
      {
        type: 'menu-dropdown' as const,
        text: 'Admin Operator',
        iconName: 'user-profile' as const,
        items: [
          { id: 'settings', text: 'Store Configuration' },
          { id: 'pos', text: 'Launch POS' },
          { id: 'wholesale', text: 'New Wholesale Invoice' },
        ],
        onItemClick: (e: any) => {
          if (e.detail.id === 'settings') navigate('/settings');
          if (e.detail.id === 'pos') navigate('/pos');
          if (e.detail.id === 'wholesale') navigate('/wholesale/billing');
        },
      },
    ],
    [lowStockCount, theme, toggleTheme, navigate]
  );

  return (
    <div style={{ minHeight: '100vh', background: theme === 'dark' ? '#0f172a' : '#f8fafc' }}>
      {/* Cloudscape Top Navigation with memoized props */}
      <TopNavigation identity={identity} utilities={utilities} />

      {/* Cloudscape AppLayout Shell */}
      <AppLayout
        maxContentWidth={Number.MAX_VALUE}
        disableContentPaddings={location.pathname === '/pos'}
        navigationOpen={navigationOpen}
        onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
        navigation={
          <SideNavigation
            activeHref={location.pathname}
            header={{ href: '/', text: 'OmniStore Modules' }}
            items={navItems}
            onFollow={(e) => {
              e.preventDefault();
              navigate(e.detail.href);
            }}
          />
        }
        notifications={
          notifications.length > 0 ? (
            <Flashbar
              items={notifications.map((n) => ({
                type: n.type,
                header: n.header,
                content: n.content,
                dismissible: n.dismissible,
                id: n.id,
                onDismiss: () => dismissNotification(n.id),
              }))}
            />
          ) : undefined
        }
        content={<Outlet />}
        toolsHide={true}
      />

      {/* Low Stock Quick Alert Modal */}
      <Modal
        visible={isLowStockModalOpen}
        onDismiss={() => setIsLowStockModalOpen(false)}
        header={`Low Stock Inventory Alerts (${lowStockCount} items)`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setIsLowStockModalOpen(false)}>Close</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsLowStockModalOpen(false);
                  navigate('/purchases');
                }}
              >
                Create Purchase Order
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        {lowStockProducts.length === 0 ? (
          <Box textAlign="center" padding="l">
            <StatusIndicator type="success">All inventory items are well stocked!</StatusIndicator>
          </Box>
        ) : (
          <SpaceBetween size="s">
            <Box color="text-body-secondary">
              The following products are currently at or below their configured reorder thresholds:
            </Box>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e5e7eb'}` }}>
                  <th style={{ padding: '6px' }}>Product</th>
                  <th style={{ padding: '6px' }}>SKU</th>
                  <th style={{ padding: '6px', textAlign: 'center' }}>Current Stock</th>
                  <th style={{ padding: '6px', textAlign: 'center' }}>Reorder Level</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${theme === 'dark' ? '#1e293b' : '#f3f4f6'}` }}>
                    <td style={{ padding: '6px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '6px', color: theme === 'dark' ? '#94a3b8' : '#6b7280' }}>{p.sku}</td>
                    <td style={{ padding: '6px', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>
                      {p.stockQuantity} {p.primaryUnit}s
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center', color: theme === 'dark' ? '#94a3b8' : '#6b7280' }}>
                      {p.reorderLevel} {p.primaryUnit}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SpaceBetween>
        )}
      </Modal>
    </div>
  );
};
