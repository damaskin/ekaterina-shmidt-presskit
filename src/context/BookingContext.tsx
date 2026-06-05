import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type BookingFormStatus = 'idle' | 'sending' | 'success' | 'error';

interface BookingContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  formStatus: BookingFormStatus;
  setFormStatus: (status: BookingFormStatus) => void;
  registerSubmitHandler: (handler: (() => void) | null) => void;
  requestSubmit: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<BookingFormStatus>('idle');
  const submitHandlerRef = useRef<(() => void) | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const registerSubmitHandler = useCallback((handler: (() => void) | null) => {
    submitHandlerRef.current = handler;
  }, []);

  const requestSubmit = useCallback(() => {
    submitHandlerRef.current?.();
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      formStatus,
      setFormStatus,
      registerSubmitHandler,
      requestSubmit,
    }),
    [
      isOpen,
      open,
      close,
      formStatus,
      registerSubmitHandler,
      requestSubmit,
    ],
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return ctx;
}
