import { OrderItem, ForgottenItem } from '@/types';

export interface BillResult {
  serviceTotal: number;
  itemTotal: number;
  forgottenTotal: number;
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  finalTotal: number;
  cashRounded: number;
}

export function calculateBill(
  guestCount: number,
  servicePrice: number,
  items: OrderItem[],
  forgottenItems: ForgottenItem[],
  discountPercent: number,
  vatPercent: number
): BillResult {
  const serviceTotal = guestCount * servicePrice;
  const itemTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const forgottenTotal = forgottenItems.reduce((sum, fi) => sum + fi.amount, 0);
  const subtotal = serviceTotal + itemTotal + forgottenTotal;
  const discountAmount = subtotal * (discountPercent / 100);
  const vatAmount = (subtotal - discountAmount) * (vatPercent / 100);
  const finalTotal = subtotal - discountAmount + vatAmount;
  const cashRounded = Math.ceil(finalTotal / 1000) * 1000;

  return {
    serviceTotal,
    itemTotal,
    forgottenTotal,
    subtotal,
    discountAmount,
    vatAmount,
    finalTotal,
    cashRounded,
  };
}

export function calcOrderItemSubtotal(
  unit: string,
  qtyOrWeight: number,
  unitPrice: number
): number {
  if (unit === 'dona') {
    return qtyOrWeight * unitPrice;
  } else if (unit === 'kg') {
    return qtyOrWeight * unitPrice;
  } else if (unit === 'gr') {
    return (qtyOrWeight / 1000) * unitPrice;
  }
  return qtyOrWeight * unitPrice;
}
