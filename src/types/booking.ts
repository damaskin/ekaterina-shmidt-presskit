export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  venue: string;
  city: string;
  message: string;
}

export const emptyBookingForm = (): BookingFormData => ({
  name: '',
  email: '',
  phone: '',
  eventDate: '',
  venue: '',
  city: '',
  message: '',
});
