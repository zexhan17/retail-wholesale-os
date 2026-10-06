import React, { useEffect, useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  Tags, 
  Settings2, 
  Users, 
  Factory,
  ClipboardList,
  BarChart3,
  Moon,
  Sun,
  Menu,
  X,
  Bell,
  PackageSearch
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  
  // Dummy values to replace cloudscape hooks
  const profile = { storeName: 'OmniStore OS' };
  const lowStockCount = 0; 
  
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const navSections = [
    {
      title: 'Dashboard & Overview',
      items: [{ name: 'Dashboard', href: '/', icon: LayoutDashboard }],
    },
    {
      title: 'Sales & Transactions',
      items: [
        { name: 'Retail Quick POS', href: '/pos', icon: ShoppingCart },
        { name: 'Wholesale B2B Billing', href: '/wholesale/billing', icon: PackageSearch },
        { name: 'Invoices & Orders', href: '/invoices', icon: FileText },
      ],
    },
    {
      title: 'Inventory & Catalog',
      items: [
        { name: 'Products & Pricing', href: '/products', icon: Tags },
        { name: 'Stock Adjustments', href: '/stock-adjustments', icon: Settings2 },
      ],
    },
    {
      title: 'Parties & Khata Ledger',
      items: [
        { name: 'Customers (Khata)', href: '/customers', icon: Users },
        { name: 'Suppliers & Vendors', href: '/suppliers', icon: Factory },
        { name: 'Purchase Orders', href: '/purchases', icon: ClipboardList },
      ],
    },
    {
      title: 'Reconciliation & Reports',
      items: [
        { name: 'Day-End Z-Report', href: '/reports/day-end', icon: ClipboardList },
        { name: 'Sales Analytics', href: '/reports/analytics', icon: BarChart3 },
      ],
    },
  ];

  const isPosRoute = location.pathname === '/pos';

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:relative ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}`}>
        <div className="h-14 flex items-center px-4 border-b border-border justify-between">
          <Link to="/" className="font-bold text-lg text-primary flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center font-black">
              O
            </div>
            {profile.storeName}
          </Link>
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto h-[calc(100vh-3.5rem)] py-4 px-3 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                      location.pathname === item.href 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div>
            <div className="h-px bg-border my-4" />
            <Link
              to="/settings"
              className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                location.pathname === '/settings' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Settings2 size={18} />
              Settings
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <button 
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <h1 className="font-semibold text-lg hidden sm:block">
              {navSections.flatMap(s => s.items).find(i => i.href === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => navigate('/pos')}
              className="hidden sm:flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart size={16} />
              Open POS
            </button>
            
            <button className="relative p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors">
              <Bell size={20} />
              {lowStockCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
              )}
            </button>

            <button 
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-auto ${isPosRoute ? 'p-0' : 'p-4 sm:p-6 lg:p-8 bg-muted/20'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
