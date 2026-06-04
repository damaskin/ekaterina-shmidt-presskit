import { AnimatePresence, motion } from '../motion';
import { useEffect, useState, type FormEvent } from 'react';
import { PRESSKIT } from '../data/presskit.data';
import { useBooking } from '../context/BookingContext';
import { modalBackdrop, modalPanel } from '../motion';
import { submitBooking, BookingSubmitError } from '../services/submitBooking';
import BookingDatePicker from './BookingDatePicker';
import { emptyBookingForm, type BookingFormData } from '../types/booking';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

export default function BookingModal() {
  const { isOpen, close } = useBooking();
  const [form, setForm] = useState<BookingFormData>(emptyBookingForm);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

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
      }, 280);
    }
  }, [isOpen]);

  const update =
    (field: keyof BookingFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (status === 'error') setStatus('idle');
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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

                <form className="booking-form" onSubmit={handleSubmit}>
                  <div className="booking-form__row booking-form__row--2">
                    <label className="booking-field">
                      <span className="booking-field__label">Name *</span>
                      <input
                        className="booking-field__input"
                        type="text"
                        name="name"
                        required
                        autoComplete="name"
                        value={form.name}
                        onChange={update('name')}
                        placeholder="Your name"
                      />
                    </label>
                    <label className="booking-field">
                      <span className="booking-field__label">Email *</span>
                      <input
                        className="booking-field__input"
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={update('email')}
                        placeholder="you@email.com"
                      />
                    </label>
                  </div>

                  <div className="booking-form__row booking-form__row--2">
                    <label className="booking-field">
                      <span className="booking-field__label">Phone</span>
                      <input
                        className="booking-field__input"
                        type="tel"
                        name="phone"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={update('phone')}
                        placeholder="+7 …"
                      />
                    </label>
                    <BookingDatePicker
                      value={form.eventDate}
                      onChange={(iso) => {
                        setForm((prev) => ({ ...prev, eventDate: iso }));
                        if (status === 'error') setStatus('idle');
                      }}
                      required
                    />
                  </div>

                  <div className="booking-form__row booking-form__row--2">
                    <label className="booking-field">
                      <span className="booking-field__label">Venue *</span>
                      <input
                        className="booking-field__input"
                        type="text"
                        name="venue"
                        required
                        value={form.venue}
                        onChange={update('venue')}
                        placeholder="Club / event name"
                      />
                    </label>
                    <label className="booking-field">
                      <span className="booking-field__label">City</span>
                      <input
                        className="booking-field__input"
                        type="text"
                        name="city"
                        value={form.city}
                        onChange={update('city')}
                        placeholder="City, country"
                      />
                    </label>
                  </div>

                  <label className="booking-field">
                    <span className="booking-field__label">Message</span>
                    <textarea
                      className="booking-field__input booking-field__input--area"
                      name="message"
                      rows={2}
                      value={form.message}
                      onChange={update('message')}
                      placeholder="Set time, rider, travel, special requests…"
                    />
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
