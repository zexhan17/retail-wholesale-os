import { create } from 'zustand';
import { BusinessProfile, OperatingMode } from '../types/settings';
import { StorageService } from '../services/storage';

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  header?: string;
  content: string;
  dismissible?: boolean;
}

export interface CashDrawerSession {
  isOpen: boolean;
  openedAt: string;
  openedBy: string;
  openingFloat: number;
  expectedCash: number;
  cashDrops: number;
}

interface AppState {
  profile: BusinessProfile;
  theme: 'light' | 'dark';
  notifications: AppNotification[];
  drawerSession: CashDrawerSession;
  updateProfile: (profile: BusinessProfile) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Omit<AppNotification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  openDrawer: (floatAmount: number, cashier: string) => void;
  recordCashSale: (amount: number) => void;
  recordCashDrop: (amount: number) => void;
  closeDrawer: () => CashDrawerSession;
}

const defaultDrawer: CashDrawerSession = {
  isOpen: true,
  openedAt: new Date().toISOString(),
  openedBy: 'Admin Register',
  openingFloat: 250.00,
  expectedCash: 250.00,
  cashDrops: 0,
};

export const useAppStore = create<AppState>((set, get) => ({
  profile: StorageService.loadProfile(),
  theme: (localStorage.getItem('omnistore_theme') as 'light' | 'dark') || 'light',
  notifications: [],
  drawerSession: defaultDrawer,

  updateProfile: (profile) => {
    StorageService.saveProfile(profile);
    set({ profile });
  },

  setTheme: (theme) => {
    localStorage.setItem('omnistore_theme', theme);
    set({ theme });
  },

  addNotification: (notification) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id, dismissible: true }],
    }));
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  openDrawer: (floatAmount, cashier) => {
    const session: CashDrawerSession = {
      isOpen: true,
      openedAt: new Date().toISOString(),
      openedBy: cashier,
      openingFloat: floatAmount,
      expectedCash: floatAmount,
      cashDrops: 0,
    };
    set({ drawerSession: session });
  },

  recordCashSale: (amount) => {
    set((state) => ({
      drawerSession: {
        ...state.drawerSession,
        expectedCash: state.drawerSession.expectedCash + amount,
      },
    }));
  },

  recordCashDrop: (amount) => {
    set((state) => ({
      drawerSession: {
        ...state.drawerSession,
        cashDrops: state.drawerSession.cashDrops + amount,
        expectedCash: Math.max(0, state.drawerSession.expectedCash - amount),
      },
    }));
  },

  closeDrawer: () => {
    const current = get().drawerSession;
    set((state) => ({
      drawerSession: {
        ...state.drawerSession,
        isOpen: false,
      },
    }));
    return current;
  },
}));
