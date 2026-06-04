import { motion } from 'framer-motion';
import { SLIDE_IDS } from '../data/presskit.data';

interface NavDotsProps {
  activeIndex: number;
  onNavigate: (index: number) => void;
}

export default function NavDots({ activeIndex, onNavigate }: NavDotsProps) {
  return (
    <nav className="nav-dots" aria-label="Sections">
      {SLIDE_IDS.map((id, i) => (
        <button
          key={id}
          type="button"
          className="nav-dots__dot"
          aria-label={`Go to ${id}`}
          aria-current={activeIndex === i ? true : undefined}
          onClick={() => onNavigate(i)}
        >
          {activeIndex === i && (
            <motion.span
              className="nav-dots__active"
              layoutId="nav-active"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
