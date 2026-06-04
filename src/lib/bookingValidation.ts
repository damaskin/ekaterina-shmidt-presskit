import type { BookingFormData } from '../types/booking';

export type BookingField = keyof BookingFormData;
export type BookingFieldErrors = Partial<Record<BookingField, string>>;

const NAME_RE = /^[\p{L}][\p{L}\s'.-]{1,79}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const VENUE_RE = /^[\p{L}\p{N}0-9][\p{L}\p{N}0-9\s&.,'"/\-–—()]{1,119}$/u;
const CITY_RE = /^[\p{L}][\p{L}\s'.-]{1,79}$/u;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Маска телефона: +7 (XXX) XXX-XX-XX или международный +XXXXXXXX */
export function formatPhoneInput(raw: string): string {
  const trimmed = raw.trimStart();
  if (!trimmed) return '';

  const hasPlus = trimmed.startsWith('+');
  const digits = phoneDigits(trimmed);

  if (!digits) return hasPlus ? '+' : '';

  if (hasPlus && (digits.startsWith('7') || digits.startsWith('8'))) {
    let d = digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
    d = d.slice(0, 11);
    const a = d.slice(1, 4);
    const b = d.slice(4, 7);
    const c = d.slice(7, 9);
    const e = d.slice(9, 11);
    let out = '+7';
    if (a.length) out += ` (${a}`;
    if (a.length === 3) out += ')';
    if (b.length) out += ` ${b}`;
    if (c.length) out += `-${c}`;
    if (e.length) out += `-${e}`;
    return out;
  }

  if (hasPlus) {
    return `+${digits.slice(0, 15)}`;
  }

  if (digits.startsWith('8') || digits.startsWith('7')) {
    const normalized = digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
    return formatPhoneInput(`+${normalized}`);
  }

  return formatPhoneInput(`+7${digits.slice(0, 10)}`);
}

export function sanitizeName(value: string): string {
  return value.replace(/[^\p{L}\s'.-]/gu, '').slice(0, 80);
}

export function sanitizeVenue(value: string): string {
  return value.replace(/[^\p{L}\p{N}\s&.,'"/\-–—()]/gu, '').slice(0, 120);
}

export function sanitizeCity(value: string): string {
  return value.replace(/[^\p{L}\s'.-]/gu, '').slice(0, 80);
}

export function sanitizeMessage(value: string): string {
  return value.slice(0, 1000);
}

export function sanitizeEmail(value: string): string {
  return value.replace(/\s/g, '').slice(0, 254);
}

function isFutureOrToday(iso: string): boolean {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

export function validateBookingField(
  field: BookingField,
  value: string,
): string | undefined {
  const v = value.trim();

  switch (field) {
    case 'name':
      if (!v) return 'Enter your name';
      if (!NAME_RE.test(v)) return 'Use 2–80 letters';
      return undefined;
    case 'email':
      if (!v) return 'Enter your email';
      if (!EMAIL_RE.test(v)) return 'Invalid email format';
      return undefined;
    case 'phone': {
      if (!v) return 'Enter your phone number';
      const digits = phoneDigits(v);
      if (digits.length < 10) return 'Enter a valid phone number';
      if (digits.length > 15) return 'Phone number is too long';
      return undefined;
    }
    case 'eventDate':
      if (!v) return 'Select event date';
      if (!ISO_DATE_RE.test(v)) return 'Invalid date';
      if (!isFutureOrToday(v)) return 'Date cannot be in the past';
      return undefined;
    case 'venue':
      if (!v) return 'Enter venue or event name';
      if (!VENUE_RE.test(v)) return 'Use 2–120 characters';
      return undefined;
    case 'city':
      if (!v) return 'Enter city';
      if (!CITY_RE.test(v)) return 'Use 2–80 letters';
      return undefined;
    case 'message':
      if (!v) return 'Add a short message';
      if (v.length < 10) return 'At least 10 characters';
      return undefined;
    default:
      return undefined;
  }
}

export function validateBookingForm(data: BookingFormData): BookingFieldErrors {
  const fields: BookingField[] = [
    'name',
    'email',
    'phone',
    'eventDate',
    'venue',
    'city',
    'message',
  ];
  const errors: BookingFieldErrors = {};
  for (const field of fields) {
    const err = validateBookingField(field, data[field]);
    if (err) errors[field] = err;
  }
  return errors;
}

export function hasBookingErrors(errors: BookingFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
