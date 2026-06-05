/**
 * LazyMotion: лёгкий бандл анимаций (domAnimation).
 * Импортируй motion отсюда, не из framer-motion напрямую.
 */
export { domAnimation } from 'framer-motion';
export { m as motion, AnimatePresence } from 'framer-motion';

/** whileInView + once — remount via key={locale} on motion roots when language changes */
export const viewport = { once: true, amount: 0.2 } as const;

export const easeOut = [0.22, 1, 0.36, 1] as const;

export const fadeUpHero = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.45,
      ease: easeOut,
    },
  }),
};

export const fadeInView = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOut },
  },
};

export const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalPanel = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: easeOut },
  },
  exit: { opacity: 0, y: 12, scale: 0.99 },
};

/** Один whileInView на контейнер — дети без отдельных motion-узлов */
export const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: easeOut },
  },
};
