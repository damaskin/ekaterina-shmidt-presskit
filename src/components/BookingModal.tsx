import { AnimatePresence, motion } from '../motion';
import { useEffect, useState, type FormEvent } from 'react';
import { PRESSKIT } from '../data/presskit.data';
import { useBooking } from '../context/BookingContext';
import {
  formatPhoneInput,
  hasBookingErrors,
  sanitizeCity,
  sanitizeEmail,
  sanitizeMessage,
  sanitizeName,
  sanitizeVenue,
  validateBookingField,
  validateBookingForm,
  type BookingField,
  type BookingFieldErrors,
} from '../lib/bookingValidation';
import { modalBackdrop, modalPanel } from '../motion';
import { submitBooking, BookingSubmitError } from '../services/submitBooking';
import BookingDatePicker from './BookingDatePicker';
import { emptyBookingForm, type BookingFormData } from '../types/booking';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

const ALL_FIELDS: BookingField[] = [
  'name',
  'email',
  'phone',
  'eventDate',
  'venue',
  'city',
  'message',
];

function fieldClass(touched: boolean, error?: string) {
  return touched && error ? ' booking-field__input--invalid' : '';
}

export default function BookingModal() {
  const { isOpen, close } = useBooking();
  const [form, setForm] = useState<BookingFormData>(emptyBookingForm);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<BookingField, boolean>>>(
    {},
  );

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) {
      window.setTimeout(() => {
        setForm(emptyBookingForm());
        setStatus('idle');
        setErrorMessage('');
        setFieldErrors({});
        setTouched({});
      }, 280);
    }
  }, [isOpen]);

  const touch = (field: BookingField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validateBookingField(field, form[field]),
    }));
  };

  const setField = (field: BookingField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateBookingField(field, value),
      }));
    }
    if (status === 'error') setStatus('idle');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const errors = validateBookingForm(form);
    setFieldErrors(errors);
    setTouched(
      ALL_FIELDS.reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {} as Record<BookingField, boolean>,
      ),
    );

    if (hasBookingErrors(errors)) return;

    setStatus('sending');
    setErrorMessage('');

    try {
      await submitBooking(form);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      if (err instanceof BookingSubmitError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Could not send. Try again or email us directly.');
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-backdrop"
            role="presentation"
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={close}
          />
          <motion.div
            className="modal modal--booking"
            role="dialog"
            aria-labelledby="booking-title"
            aria-modal="true"
            variants={modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="modal__glow" aria-hidden="true" />

            <button
              type="button"
              className="modal__close"
              aria-label="Close"
              onClick={close}
            >
              ×
            </button>

            {status === 'success' ? (
              <div className="booking-success">
                <div className="booking-success__icon" aria-hidden="true">
                  ✓
                </div>
                <h2 id="booking-title" className="modal__title">
                  Request sent
                </h2>
                <p className="booking-success__text">
                  Thank you! We will get back to you at{' '}
                  <strong>{form.email}</strong> soon.
                </p>
                <button type="button" className="btn btn--accent" onClick={close}>
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="modal__eyebrow label-caps">Booking</p>
                <h2 id="booking-title" className="modal__title">
                  Request a set
                </h2>
                <p className="modal__lead">
                  Fill in the details — we will reply via email.
                </p>

                <form className="booking-form" onSubmit={handleSubmit} noValidate>
                  <div className="booking-form__row booking-form__row--2">
                    <label className="booking-field">
                      <span className="booking-field__label">Name *</span>
                      <input
                        className={`booking-field__input${fieldClass(Boolean(touched.name), fieldErrors.name)}`}
                        type="text"
                        name="name"
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) => setField('name', sanitizeName(e.target.value))}
                        onBlur={() => touch('name')}
                        placeholder="Ekaterina Shmidt"
                        aria-invalid={Boolean(touched.name && fieldErrors.name)}
                      />
                      {touched.name && fieldErrors.name && (
                        <span className="booking-field__error" role="alert">
                          {fieldErrors.name}
                        </span>
                      )}
                    </label>
                    <label className="booking-field">
                      <span className="booking-field__label">Email *</span>
                      <input
                        className={`booking-field__input${fieldClass(Boolean(touched.email), fieldErrors.email)}`}
                        type="email"
                        name="email"
                        inputMode="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) =>
                          setField('email', sanitizeEmail(e.target.value))
                        }
                        onBlur={() => {
                          setField('email', sanitizeEmail(form.email).toLowerCase());
                          touch('email');
                        }}
                        placeholder="you@email.com"
                        aria-invalid={Boolean(touched.email && fieldErrors.email)}
                      />
                      {touched.email && fieldErrors.email && (
                        <span className="booking-field__error" role="alert">
                          {fieldErrors.email}
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="booking-form__row booking-form__row--2">
                    <label className="booking-field">
                      <span className="booking-field__label">Phone *</span>
                      <input
                        className={`booking-field__input${fieldClass(Boolean(touched.phone), fieldErrors.phone)}`}
                        type="tel"
                        name="phone"
                        inputMode="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) =>
                          setField('phone', formatPhoneInput(e.target.value))
                        }
                        onBlur={() => touch('phone')}
                        placeholder="+7 (999) 123-45-67"
                        aria-invalid={Boolean(touched.phone && fieldErrors.phone)}
                      />
                      {touched.phone && fieldErrors.phone && (
                        <span className="booking-field__error" role="alert">
                          {fieldErrors.phone}
                        </span>
                      )}
                    </label>
                    <BookingDatePicker
                      value={form.eventDate}
                      onChange={(iso) => setField('eventDate', iso)}
                      onBlur={() => touch('eventDate')}
                      error={fieldErrors.eventDate}
                      touched={Boolean(touched.eventDate)}
                      required
                    />
                  </div>

                  <div className="booking-form__row booking-form__row--2">
                    <label className="booking-field">
                      <span className="booking-field__label">Venue *</span>
                      <input
                        className={`booking-field__input${fieldClass(Boolean(touched.venue), fieldErrors.venue)}`}
                        type="text"
                        name="venue"
                        value={form.venue}
                        onChange={(e) =>
                          setField('venue', sanitizeVenue(e.target.value))
                        }
                        onBlur={() => touch('venue')}
                        placeholder="Club / event name"
                        aria-invalid={Boolean(touched.venue && fieldErrors.venue)}
                      />
                      {touched.venue && fieldErrors.venue && (
                        <span className="booking-field__error" role="alert">
                          {fieldErrors.venue}
                        </span>
                      )}
                    </label>
                    <label className="booking-field">
                      <span className="booking-field__label">City *</span>
                      <input
                        className={`booking-field__input${fieldClass(Boolean(touched.city), fieldErrors.city)}`}
                        type="text"
                        name="city"
                        value={form.city}
                        onChange={(e) => setField('city', sanitizeCity(e.target.value))}
                        onBlur={() => touch('city')}
                        placeholder="City, country"
                        aria-invalid={Boolean(touched.city && fieldErrors.city)}
                      />
                      {touched.city && fieldErrors.city && (
                        <span className="booking-field__error" role="alert">
                          {fieldErrors.city}
                        </span>
                      )}
                    </label>
                  </div>

                  <label className="booking-field">
                    <span className="booking-field__label">Message *</span>
                    <textarea
                      className={`booking-field__input booking-field__input--area${fieldClass(Boolean(touched.message), fieldErrors.message)}`}
                      name="message"
                      rows={2}
                      maxLength={1000}
                      value={form.message}
                      onChange={(e) =>
                        setField('message', sanitizeMessage(e.target.value))
                      }
                      onBlur={() => touch('message')}
                      placeholder="Set time, rider, travel, special requests…"
                      aria-invalid={Boolean(touched.message && fieldErrors.message)}
                    />
                    {touched.message && fieldErrors.message ? (
                      <span className="booking-field__error" role="alert">
                        {fieldErrors.message}
                      </span>
                    ) : (
                      <span className="booking-field__hint">
                        {form.message.length}/1000
                      </span>
                    )}
                  </label>

                  {status === 'error' && (
                    <p className="booking-form__error" role="alert">
                      {errorMessage}
                    </p>
                  )}

                  <div className="booking-form__actions">
                    <button
                      type="submit"
                      className="btn btn--accent booking-form__submit"
                      disabled={status === 'sending'}
                    >
                      {status === 'sending' ? 'Sending…' : 'Send request'}
                    </button>
                    <a
                      className="booking-form__mailto"
                      href={`mailto:${PRESSKIT.email}`}
                    >
                      or {PRESSKIT.email}
                    </a>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
