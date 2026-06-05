import type { ValidationMessages } from '../i18n/types';
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

function formatRussianPhone(digits: string): string {
  let d = digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
  if (!d.startsWith('7')) d = `7${d}`;
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

function isRussianLocalEntry(digits: string): boolean {
  return (
    digits.startsWith('8') ||
    (digits.startsWith('7') && digits.length === 11)
  );
}

/** Международный номер (+XXXXXXXX). Маска +7 только при явном вводе RU-номера. */
export function formatPhoneInput(raw: string): string {
  const trimmed = raw.trimStart();
  if (!trimmed) return '';

  const hasPlus = trimmed.startsWith('+');
  const digits = phoneDigits(trimmed);

  if (!digits) return hasPlus ? '+' : '';

  if (hasPlus && digits.startsWith('7') && digits.length <= 11) {
    return formatRussianPhone(digits);
  }

  if (hasPlus) {
    return `+${digits.slice(0, 15)}`;
  }

  if (isRussianLocalEntry(digits)) {
    return formatRussianPhone(digits);
  }

  return digits.slice(0, 15);
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
  messages: ValidationMessages,
): string | undefined {
  const v = value.trim();

  switch (field) {
    case 'name':
      if (!v) return messages.nameRequired;
      if (!NAME_RE.test(v)) return messages.nameInvalid;
      return undefined;
    case 'email':
      if (!v) return messages.emailRequired;
      if (!EMAIL_RE.test(v)) return messages.emailInvalid;
      return undefined;
    case 'phone': {
      if (!v) return messages.phoneRequired;
      const digits = phoneDigits(v);
      if (digits.length < 10) return messages.phoneInvalid;
      if (digits.length > 15) return messages.phoneTooLong;
      return undefined;
    }
    case 'eventDate':
      if (!v) return messages.eventDateRequired;
      if (!ISO_DATE_RE.test(v)) return messages.eventDateInvalid;
      if (!isFutureOrToday(v)) return messages.eventDatePast;
      return undefined;
    case 'venue':
      if (!v) return messages.venueRequired;
      if (!VENUE_RE.test(v)) return messages.venueInvalid;
      return undefined;
    case 'city':
      if (!v) return messages.cityRequired;
      if (!CITY_RE.test(v)) return messages.cityInvalid;
      return undefined;
    case 'message':
      if (!v) return messages.messageRequired;
      if (v.length < 10) return messages.messageTooShort;
      return undefined;
    default:
      return undefined;
  }
}

export function validateBookingForm(
  data: BookingFormData,
  messages: ValidationMessages,
): BookingFieldErrors {
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
    const err = validateBookingField(field, data[field], messages);
    if (err) errors[field] = err;
  }
  return errors;
}

export function hasBookingErrors(errors: BookingFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
