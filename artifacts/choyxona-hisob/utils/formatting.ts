export function formatMoney(amount: number): string {
  const rounded = Math.round(amount);
  return rounded.toLocaleString('uz-UZ') + " so'm";
}

export function formatMoneyShort(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + ' mln';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + ' ming';
  }
  return amount.toFixed(0);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)}  ${formatTime(dateStr)}`;
}

export function formatDuration(startStr: string, endStr?: string): string {
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} daqiqa`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `${h} soat ${m} daqiqa`;
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

export function todayStr(): string {
  return new Date().toISOString();
}

export function isSameDay(dateStr: string, refStr: string): boolean {
  const d = new Date(dateStr);
  const r = new Date(refStr);
  return (
    d.getFullYear() === r.getFullYear() &&
    d.getMonth() === r.getMonth() &&
    d.getDate() === r.getDate()
  );
}
