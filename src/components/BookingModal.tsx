import { AnimatePresence, motion } from '../motion';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PRESSKIT } from '../data/presskit.data';
import { useBooking } from '../context/BookingContext';
import { useI18n } from '../context/LocaleContext';
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
import { isTelegramWebApp } from '../hooks/useTelegramWebApp';
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
  const {
    isOpen,
    close,
    setFormStatus,
    registerSubmitHandler,
  } = useBooking();
  const { locale, t } = useI18n();
  const b = t.booking;
  const v = t.validation;
  const tgApp = isTelegramWebApp();

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
      [field]: validateBookingField(field, form[field], v),
    }));
  };

  const setField = (field: BookingField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateBookingField(field, value, v),
      }));
    }
    if (status === 'error') setStatus('idle');
  };

  useEffect(() => {
    setFormStatus(status);
  }, [status, setFormStatus]);

  const submitForm = useCallback(async () => {
    const errors = validateBookingForm(form, v);
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
        setErrorMessage(
          err.message.includes('VITE_BOOKING_API_URL') ? b.apiError : err.message,
        );
      } else {
        setErrorMessage(b.submitError);
      }
    }
  }, [form, v, b]);

  useEffect(() => {
    registerSubmitHandler(() => {
      void submitForm();
    });
    return () => registerSubmitHandler(null);
  }, [submitForm, registerSubmitHandler]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitForm();
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
          <div className="modal-shell">
            <motion.div
              key={locale}
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
              aria-label={b.close}
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
                  {b.successTitle}
                </h2>
                <p className="booking-success__text">
                  {(() => {
                    const msg = b.successText(form.email);
                    const idx = msg.indexOf(form.email);
                    if (idx < 0) return msg;
                    return (
                      <>
                        {msg.slice(0, idx)}
                        <strong>{form.email}</strong>
                        {msg.slice(idx + form.email.length)}
                      </>
                    );
                  })()}
                </p>
                <button
                  type="button"
                  className="btn btn--accent"
                  onClick={close}
                  hidden={tgApp}
                >
                  {b.successClose}
                </button>
              </div>
            ) : (
              <>
                <p className="modal__eyebrow label-caps">{b.eyebrow}</p>
                <h2 id="booking-title" className="modal__title">
                  {b.title}
                </h2>
                <p className="modal__lead">{b.lead}</p>

                <form className="booking-form" onSubmit={handleSubmit} noValidate>
                  <div className="booking-form__row booking-form__row--2">
                    <label className="booking-field">
                      <span className="booking-field__label">{b.name}</span>
                      <input
                        className={`booking-field__input${fieldClass(Boolean(touched.name), fieldErrors.name)}`}
                        type="text"
                        name="name"
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) => setField('name', sanitizeName(e.target.value))}
                        onBlur={() => touch('name')}
                        placeholder={b.namePlaceholder}
                        aria-invalid={Boolean(touched.name && fieldErrors.name)}
                      />
                      {touched.name && fieldErrors.name && (
                        <span className="booking-field__error" role="alert">
                          {fieldErrors.name}
                        </span>
                      )}
                    </label>
                    <label className="booking-field">
                      <span className="booking-field__label">{b.email}</span>
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
                        placeholder={b.emailPlaceholder}
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
                      <span className="booking-field__label">{b.phone}</span>
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
                        placeholder={b.phonePlaceholder}
                        aria-invalid={Boolean(touched.phone && fieldErrors.phone)}
                      />
                      {touched.phone && fieldErrors.phone && (
                        <span className="booking-field__error" role="alert">
                          {fieldErrors.phone}
                        </span>
                      )}
                    </label>
                    <BookingDatePicker
                      locale={locale}
                      value={form.eventDate}
                      onChange={(iso) => setField('eventDate', iso)}
                      onBlur={() => touch('eventDate')}
                      error={fieldErrors.eventDate}
                      touched={Boolean(touched.eventDate)}
                      labels={b}
                    />
                  </div>

                  <div className="booking-form__row booking-form__row--2">
                    <label className="booking-field">
                      <span className="booking-field__label">{b.venue}</span>
                      <input
                        className={`booking-field__input${fieldClass(Boolean(touched.venue), fieldErrors.venue)}`}
                        type="text"
                        name="venue"
                        value={form.venue}
                        onChange={(e) =>
                          setField('venue', sanitizeVenue(e.target.value))
                        }
                        onBlur={() => touch('venue')}
                        placeholder={b.venuePlaceholder}
                        aria-invalid={Boolean(touched.venue && fieldErrors.venue)}
                      />
                      {touched.venue && fieldErrors.venue && (
                        <span className="booking-field__error" role="alert">
                          {fieldErrors.venue}
                        </span>
                      )}
                    </label>
                    <label className="booking-field">
                      <span className="booking-field__label">{b.city}</span>
                      <input
                        className={`booking-field__input${fieldClass(Boolean(touched.city), fieldErrors.city)}`}
                        type="text"
                        name="city"
                        value={form.city}
                        onChange={(e) => setField('city', sanitizeCity(e.target.value))}
                        onBlur={() => touch('city')}
                        placeholder={b.cityPlaceholder}
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
                    <span className="booking-field__label">{b.message}</span>
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
                      placeholder={b.messagePlaceholder}
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
                    {!tgApp && (
                      <button
                        type="submit"
                        className="btn btn--accent booking-form__submit"
                        disabled={status === 'sending'}
                      >
                        {status === 'sending' ? b.sending : b.send}
                      </button>
                    )}
                    <a
                      className="booking-form__mailto copyable"
                      href={`mailto:${PRESSKIT.email}`}
                    >
                      {b.orEmail} {PRESSKIT.email}
                    </a>
                  </div>
                </form>
              </>
            )}
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
