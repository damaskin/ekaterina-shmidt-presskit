export function getBookingApiUrl(): string | undefined {
  const url = import.meta.env.VITE_BOOKING_API_URL as string | undefined;
  return url?.trim() || undefined;
}

export function getRegisterApiUrl(): string | undefined {
  const bookingUrl = getBookingApiUrl();
  if (!bookingUrl) return undefined;

  try {
    const url = new URL(bookingUrl);
    if (url.pathname.endsWith('/booking')) {
      url.pathname = url.pathname.replace(/\/booking\/?$/, '/register');
    } else {
      url.pathname = url.pathname.replace(/\/?$/, '/register');
    }
    return url.toString();
  } catch {
    return bookingUrl.replace(/\/?$/, '/register');
  }
}
