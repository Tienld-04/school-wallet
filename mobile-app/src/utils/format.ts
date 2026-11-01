const pad = (n: number) => String(n).padStart(2, '0');

const groupThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const parseDate = (value: string): Date | null => {
  if (!value) return null;
  const normalized = value.replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatVND = (amount: number): string =>
  groupThousands(String(Math.round(Math.abs(amount))));

export const formatDigits = (raw: string): string => (raw ? groupThousands(raw) : '');

export const formatCompact = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
};

export const isoDaysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const formatShortDate = (iso: string): string => {
  const match = /^\d{4}-(\d{2})-(\d{2})/.exec(iso ?? '');
  return match ? `${match[2]}/${match[1]}` : iso;
};

export const formatSignedAmount = (amount: string): string => {
  const sign = amount[0] === '+' || amount[0] === '-' ? amount[0] : '';
  const digits = amount.replace(/[^0-9]/g, '');
  return sign + groupThousands(digits);
};

export const formatDate = (value: string): string => {
  const d = parseDate(value);
  if (!d) return value;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const formatDateTime = (value: string, withSeconds = false): string => {
  const d = parseDate(value);
  if (!d) return value;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}${withSeconds ? `:${pad(d.getSeconds())}` : ''}`;
  return `${formatDate(value)} ${time}`;
};

export const formatRelativeDateTime = (value: string): string => {
  const d = parseDate(value);
  if (!d) return value;
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  if (d.toDateString() === now.toDateString()) return `Hôm nay · ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Hôm qua · ${time}`;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${time}`;
};

export const maskDateInput = (text: string): string => {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export const isoToDisplayDate = (iso: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
};

export const displayToIsoDate = (display: string): string => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
  if (!match) return '';
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  const valid =
    date.getFullYear() === Number(yyyy) &&
    date.getMonth() === Number(mm) - 1 &&
    date.getDate() === Number(dd);
  return valid ? `${yyyy}-${mm}-${dd}` : '';
};
