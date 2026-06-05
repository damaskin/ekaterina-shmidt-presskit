import type { BookingFormData } from '../types/booking';

export class BookingSubmitError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'BookingSubmitError';
  }
}

export async function submitBooking(data: BookingFormData): Promise<void> {
  const apiUrl = import.meta.env.VITE_BOOKING_API_URL as string | undefined;

  if (!apiUrl) {
    throw new BookingSubmitError(
      'Форма не подключена к серверу. Нужно задеплоить Worker и задать VITE_BOOKING_API_URL (см. docs/BOOKING_TELEGRAM.md).',
    );
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let detail = 'Failed to send request';
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      /* noop */
    }
    throw new BookingSubmitError(detail, response.status);
  }
}
