import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  AppState as AppStateType,
  DebtRecord,
  Expense,
  GuestSession,
  Installment,
  LocationItem,
  Note,
  OrderItem,
  QuickSale,
  Receipt,
  TemplateItem,
  TeaHouseProfile,
} from '@/types';
import { loadState, saveState } from '@/utils/storage';
import { generateId, todayStr } from '@/utils/formatting';

interface AppContextType extends AppStateType {
  // Setup
  completeSetup: (
    profile: TeaHouseProfile,
    locations: LocationItem[],
    templates: TemplateItem[]
  ) => Promise<void>;

  // Profile
  updateProfile: (profile: TeaHouseProfile) => void;

  // Locations
  addLocation: (loc: LocationItem) => void;
  updateLocation: (loc: LocationItem) => void;
  removeLocation: (id: string) => void;

  // Templates
  addTemplate: (t: TemplateItem) => void;
  updateTemplate: (t: TemplateItem) => void;
  removeTemplate: (id: string) => void;

  // Sessions
  openSession: (session: GuestSession) => void;
  closeSession: (sessionId: string) => void;
  getSession: (id: string) => GuestSession | undefined;

  // Orders
  getOrders: (sessionId: string) => OrderItem[];
  addOrder: (sessionId: string, item: OrderItem) => void;
  updateOrder: (sessionId: string, item: OrderItem) => void;
  removeOrder: (sessionId: string, itemId: string) => void;
  toggleDelivered: (sessionId: string, itemId: string) => void;

  // Receipts
  addReceipt: (receipt: Receipt) => void;
  getReceipt: (id: string) => Receipt | undefined;

  // Debts
  addDebt: (debt: DebtRecord) => void;
  addInstallment: (debtId: string, installment: Installment) => void;
  removeDebt: (id: string) => void;
  getDebt: (id: string) => DebtRecord | undefined;

  // Expenses
  addExpense: (exp: Expense) => void;
  removeExpense: (id: string) => void;

  // Notes
  addNote: (note: Note) => void;
  removeNote: (id: string) => void;

  // Quick Sales
  addQuickSale: (sale: QuickSale) => void;
  removeQuickSale: (id: string) => void;

  // Theme
  toggleDarkMode: () => void;

  // Data management
  clearData: (keys: string[]) => void;

  // Loading
  isLoading: boolean;
}

const defaultState: AppStateType = {
  profile: null,
  locations: [],
  templates: [],
  sessions: [],
  orders: {},
  receipts: [],
  debts: [],
  expenses: [],
  notes: [],
  quickSales: [],
  isSetupDone: false,
  isDarkMode: false,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppStateType>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadState().then((saved) => {
      setState((prev) => ({
        ...prev,
        ...saved,
        quickSales: (saved as any).quickSales ?? [],
      }));
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback((newState: AppStateType) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState(newState);
    }, 300);
  }, []);

  const update = useCallback(
    (updater: (prev: AppStateType) => AppStateType) => {
      setState((prev) => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const completeSetup = useCallback(
    async (
      profile: TeaHouseProfile,
      locations: LocationItem[],
      templates: TemplateItem[]
    ) => {
      update((prev) => ({
        ...prev,
        profile,
        locations,
        templates,
        isSetupDone: true,
      }));
    },
    [update]
  );

  const updateProfile = useCallback(
    (profile: TeaHouseProfile) => update((p) => ({ ...p, profile })),
    [update]
  );

  const addLocation = useCallback(
    (loc: LocationItem) =>
      update((p) => ({ ...p, locations: [...p.locations, loc] })),
    [update]
  );

  const updateLocation = useCallback(
    (loc: LocationItem) =>
      update((p) => ({
        ...p,
        locations: p.locations.map((l) => (l.id === loc.id ? loc : l)),
      })),
    [update]
  );

  const removeLocation = useCallback(
    (id: string) =>
      update((p) => ({
        ...p,
        locations: p.locations.filter((l) => l.id !== id),
      })),
    [update]
  );

  const addTemplate = useCallback(
    (t: TemplateItem) =>
      update((p) => ({ ...p, templates: [...p.templates, t] })),
    [update]
  );

  const updateTemplate = useCallback(
    (t: TemplateItem) =>
      update((p) => ({
        ...p,
        templates: p.templates.map((x) => (x.id === t.id ? t : x)),
      })),
    [update]
  );

  const removeTemplate = useCallback(
    (id: string) =>
      update((p) => ({
        ...p,
        templates: p.templates.filter((t) => t.id !== id),
      })),
    [update]
  );

  const openSession = useCallback(
    (session: GuestSession) => {
      update((p) => ({
        ...p,
        sessions: [...p.sessions, session],
        locations: p.locations.map((l) =>
          l.id === session.locationId ? { ...l, isBusy: true } : l
        ),
      }));
    },
    [update]
  );

  const closeSession = useCallback(
    (sessionId: string) => {
      update((p) => {
        const session = p.sessions.find((s) => s.id === sessionId);
        return {
          ...p,
          sessions: p.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, status: 'closed' as const, endTime: todayStr() }
              : s
          ),
          locations: session
            ? p.locations.map((l) =>
                l.id === session.locationId ? { ...l, isBusy: false } : l
              )
            : p.locations,
        };
      });
    },
    [update]
  );

  const getSession = useCallback(
    (id: string) => state.sessions.find((s) => s.id === id),
    [state.sessions]
  );

  const getOrders = useCallback(
    (sessionId: string) => state.orders[sessionId] ?? [],
    [state.orders]
  );

  const addOrder = useCallback(
    (sessionId: string, item: OrderItem) =>
      update((p) => ({
        ...p,
        orders: {
          ...p.orders,
          [sessionId]: [...(p.orders[sessionId] ?? []), item],
        },
      })),
    [update]
  );

  const updateOrder = useCallback(
    (sessionId: string, item: OrderItem) =>
      update((p) => ({
        ...p,
        orders: {
          ...p.orders,
          [sessionId]: (p.orders[sessionId] ?? []).map((o) =>
            o.id === item.id ? item : o
          ),
        },
      })),
    [update]
  );

  const removeOrder = useCallback(
    (sessionId: string, itemId: string) =>
      update((p) => ({
        ...p,
        orders: {
          ...p.orders,
          [sessionId]: (p.orders[sessionId] ?? []).filter(
            (o) => o.id !== itemId
          ),
        },
      })),
    [update]
  );

  const toggleDelivered = useCallback(
    (sessionId: string, itemId: string) =>
      update((p) => ({
        ...p,
        orders: {
          ...p.orders,
          [sessionId]: (p.orders[sessionId] ?? []).map((o) =>
            o.id === itemId ? { ...o, isDelivered: !o.isDelivered } : o
          ),
        },
      })),
    [update]
  );

  const addReceipt = useCallback(
    (receipt: Receipt) =>
      update((p) => ({ ...p, receipts: [receipt, ...p.receipts] })),
    [update]
  );

  const getReceipt = useCallback(
    (id: string) => state.receipts.find((r) => r.id === id),
    [state.receipts]
  );

  const addDebt = useCallback(
    (debt: DebtRecord) =>
      update((p) => ({ ...p, debts: [debt, ...p.debts] })),
    [update]
  );

  const addInstallment = useCallback(
    (debtId: string, installment: Installment) =>
      update((p) => ({
        ...p,
        debts: p.debts.map((d) => {
          if (d.id !== debtId) return d;
          const paidAmount = d.paidAmount + installment.amount;
          const remainingAmount = d.totalDebt - paidAmount;
          const status =
            remainingAmount <= 0
              ? ('tolangan' as const)
              : paidAmount > 0
              ? ('qisman' as const)
              : ('tolanmagan' as const);
          return {
            ...d,
            paidAmount,
            remainingAmount: Math.max(0, remainingAmount),
            status,
            installments: [...d.installments, installment],
          };
        }),
      })),
    [update]
  );

  const removeDebt = useCallback(
    (id: string) =>
      update((p) => ({ ...p, debts: p.debts.filter((d) => d.id !== id) })),
    [update]
  );

  const getDebt = useCallback(
    (id: string) => state.debts.find((d) => d.id === id),
    [state.debts]
  );

  const addExpense = useCallback(
    (exp: Expense) =>
      update((p) => ({ ...p, expenses: [exp, ...p.expenses] })),
    [update]
  );

  const removeExpense = useCallback(
    (id: string) =>
      update((p) => ({
        ...p,
        expenses: p.expenses.filter((e) => e.id !== id),
      })),
    [update]
  );

  const addNote = useCallback(
    (note: Note) =>
      update((p) => ({ ...p, notes: [note, ...p.notes] })),
    [update]
  );

  const removeNote = useCallback(
    (id: string) =>
      update((p) => ({ ...p, notes: p.notes.filter((n) => n.id !== id) })),
    [update]
  );

  const addQuickSale = useCallback(
    (sale: QuickSale) =>
      update((p) => ({ ...p, quickSales: [sale, ...p.quickSales] })),
    [update]
  );

  const removeQuickSale = useCallback(
    (id: string) =>
      update((p) => ({
        ...p,
        quickSales: p.quickSales.filter((s) => s.id !== id),
      })),
    [update]
  );

  const toggleDarkMode = useCallback(
    () => update((p) => ({ ...p, isDarkMode: !p.isDarkMode })),
    [update]
  );

  const clearData = useCallback(
    (keys: string[]) => {
      update((p) => {
        const next = { ...p };
        if (keys.includes('all') || keys.includes('templates')) {
          next.locations = [];
          next.templates = [];
          next.profile = keys.includes('all') ? null : p.profile;
          if (keys.includes('all')) next.isSetupDone = false;
        }
        if (keys.includes('all') || keys.includes('receipts')) {
          next.receipts = [];
          next.sessions = [];
          next.orders = {};
          next.quickSales = [];
        }
        if (keys.includes('all') || keys.includes('debts')) {
          next.debts = [];
        }
        if (keys.includes('all') || keys.includes('expenses')) {
          next.expenses = [];
        }
        if (keys.includes('all') || keys.includes('notes')) {
          next.notes = [];
        }
        return next;
      });
    },
    [update]
  );

  return (
    <AppContext.Provider
      value={{
        ...state,
        completeSetup,
        updateProfile,
        addLocation,
        updateLocation,
        removeLocation,
        addTemplate,
        updateTemplate,
        removeTemplate,
        openSession,
        closeSession,
        getSession,
        getOrders,
        addOrder,
        updateOrder,
        removeOrder,
        toggleDelivered,
        addReceipt,
        getReceipt,
        addDebt,
        addInstallment,
        removeDebt,
        getDebt,
        addExpense,
        removeExpense,
        addNote,
        removeNote,
        addQuickSale,
        removeQuickSale,
        toggleDarkMode,
        clearData,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
