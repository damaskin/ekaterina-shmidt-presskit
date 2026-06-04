import { AnimatePresence, motion } from '../motion';
import { useEffect, useState } from 'react';
import { PRESSKIT } from '../data/presskit.data';
import { useBooking } from '../context/BookingContext';
import { modalBackdrop, modalPanel } from '../motion';

export default function BookingModal() {
  const { isOpen, close } = useBooking();
  const [copied, setCopied] = useState(false);
  const mailto = `mailto:${PRESSKIT.email}?subject=${encodeURIComponent('Booking Inquiry — Ekaterina Shmidt')}`;

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

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PRESSKIT.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
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
            className="modal"
            role="dialog"
            aria-labelledby="booking-title"
            aria-modal="true"
            variants={modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <button
              type="button"
              className="modal__close"
              aria-label="Close"
              onClick={close}
            >
              ×
            </button>
            <h2 id="booking-title" className="modal__title">
              Booking
            </h2>
            <p className="modal__lead">For bookings and inquiries:</p>
            <a className="modal__email" href={mailto}>
              {PRESSKIT.email}
            </a>
            <div className="modal__actions">
              <button type="button" className="btn btn--ghost" onClick={copyEmail}>
                {copied ? 'Copied' : 'Copy email'}
              </button>
              <a className="btn btn--accent" href={mailto}>
                Open mail
              </a>
            </div>
            <p className="modal__hint">
              Include: date, venue, city, set time, and technical rider requirements.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
