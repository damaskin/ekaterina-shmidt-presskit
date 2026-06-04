import { useEffect, useState } from 'react';
import { SLIDE_IDS } from '../data/presskit.data';

/** IntersectionObserver на window (как h2-pro) */
export function useScrollSpy(): [number, (index: number) => void] {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('.slide');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
            const index = Array.from(sections).indexOf(
              entry.target as HTMLElement,
            );
            if (index >= 0) setActiveIndex(index);
          }
        }
      },
      { threshold: [0.45, 0.55] },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const goToSlide = (index: number) => {
    const id = SLIDE_IDS[index];
    const el = id ? document.getElementById(id) : null;
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return [activeIndex, goToSlide];
}
