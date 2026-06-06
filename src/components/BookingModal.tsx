import { AnimatePresence, motion } from '../motion';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
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
import {
  canRequestTelegramContact,
  requestTelegramContactPhone,
} from '../lib/requestTelegramContact';
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
  const [requestingTgPhone, setRequestingTgPhone] = useState(false);
  const tgContactAvailable = tgApp && canRequestTelegramContact();

  useEffect(() => {
    const scrollRoot = tgApp
      ? document.getElementById('root')
      : document.documentElement;
    const target = scrollRoot ?? document.body;
    target.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      target.style.overflow = '';
    };
  }, [isOpen, tgApp]);

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

  const handleShareTelegramPhone = async () => {
    setRequestingTgPhone(true);
    try {
      const phone = await requestTelegramContactPhone();
      if (!phone) return;

      const formatted = formatPhoneInput(phone);
      setField('phone', formatted);
      setTouched((prev) => ({ ...prev, phone: true }));
      setFieldErrors((prev) => ({
        ...prev,
        phone: validateBookingField('phone', formatted, v),
      }));
    } finally {
      setRequestingTgPhone(false);
    }
  };

  const modal = (
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
                      <div className="booking-field__phone-row">
                        <input
                          className={`booking-field__input booking-field__input--phone${fieldClass(Boolean(touched.phone), fieldErrors.phone)}`}
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
                        {tgContactAvailable && (
                          <button
                            type="button"
                            className="booking-field__tg-phone"
                            onClick={() => void handleShareTelegramPhone()}
                            disabled={
                              requestingTgPhone || status === 'sending'
                            }
                            aria-label={b.shareTelegramPhone}
                            title={b.shareTelegramPhone}
                          >
                            <svg
                              className="booking-field__tg-phone-icon"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              focusable="false"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                            </svg>
                          </button>
                        )}
                      </div>
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

  return tgApp ? createPortal(modal, document.body) : modal;
}
