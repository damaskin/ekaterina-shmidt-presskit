import { useEffect, useRef, useState, type RefObject } from 'react';

/** Секция в viewport — для паузы тяжёлых эффектов */
export function useSectionActive<T extends HTMLElement = HTMLElement>(
  threshold = 0.12,
): { ref: RefObject<T | null>; isActive: boolean } {
  const ref = useRef<T | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(
          entry.isIntersecting && entry.intersectionRatio >= threshold,
        );
      },
      { threshold: [0, threshold, 0.35] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isActive };
}
