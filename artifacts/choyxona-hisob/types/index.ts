export type UnitType = 'dona' | 'kg' | 'gr';
export type PriceStatus = 'pullik' | 'bonus';
export type BandlikSababi = 'mehmon' | 'bron' | 'nosoz';
export type SessionStatus = 'active' | 'closed';
export type DebtStatus = 'tolanmagan' | 'qisman' | 'tolangan';
export type ExpenseCategory = 'oziq-ovqat' | 'kommunal' | 'ish-haqi' | 'ijara' | 'boshqa';

export interface TeaHouseProfile {
  id: string;
  name: string;
  servicePrice: number;
  createdAt: string;
}

export interface LocationItem {
  id: string;
  typeName: string;
  displayName: string;
  autoIndex: number;
  isActive: boolean;
  isBusy: boolean;
}

export interface TemplateVariant {
  id: string;
  name: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  unit: UnitType;
  priceStatus: PriceStatus;
  basePrice: number;
  variants: string[];
  isActive: boolean;
}

export interface GuestSession {
  id: string;
  locationId: string;
  locationName: string;
  guestCount: number;
  reason: BandlikSababi;
  status: SessionStatus;
  startTime: string;
  endTime?: string;
}

export interface OrderItem {
  id: string;
  templateId: string;
  name: string;
  variant?: string;
  unit: UnitType;
  qtyOrWeight: number;
  unitPrice: number;
  subtotal: number;
  isFree: boolean;
  isDelivered: boolean;
}

export interface ForgottenItem {
  id: string;
  name?: string;
  amount: number;
}

export interface Receipt {
  id: string;
  sessionId: string;
  locationName: string;
  guestCount: number;
  startTime: string;
  items: OrderItem[];
  serviceTotal: number;
  forgottenItems: ForgottenItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  vatPercent: number;
  vatAmount: number;
  finalTotal: number;
  cashRounded: number;
  partialPayment: number;
  timestamp: string;
}

export interface Installment {
  id: string;
  date: string;
  amount: number;
  note?: string;
  balanceAfter: number;
}

export interface DebtRecord {
  id: string;
  debtorName: string;
  totalDebt: number;
  paidAmount: number;
  remainingAmount: number;
  status: DebtStatus;
  installments: Installment[];
  note?: string;
  createdAt: string;
  receiptId?: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  date: string;
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}

export interface AppState {
  profile: TeaHouseProfile | null;
  locations: LocationItem[];
  templates: TemplateItem[];
  sessions: GuestSession[];
  orders: Record<string, OrderItem[]>;
  receipts: Receipt[];
  debts: DebtRecord[];
  expenses: Expense[];
  notes: Note[];
  isSetupDone: boolean;
  isDarkMode: boolean;
}
