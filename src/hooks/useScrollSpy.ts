import { useEffect, useState, type RefObject } from 'react';
import { SLIDE_IDS } from '../data/presskit.data';

export function useScrollSpy(
  scrollRef: RefObject<HTMLElement | null>,
): [number, (index: number) => void] {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const sections = root.querySelectorAll<HTMLElement>('.slide');
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
      { root, threshold: [0.45, 0.6] },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [scrollRef]);

  const goToSlide = (index: number) => {
    const id = SLIDE_IDS[index];
    if (id) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return [activeIndex, goToSlide];
}
