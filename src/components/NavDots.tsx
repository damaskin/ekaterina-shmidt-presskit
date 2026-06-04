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
          className={`nav-dots__dot${activeIndex === i ? ' nav-dots__dot--active' : ''}`}
          aria-label={`Go to ${id}`}
          aria-current={activeIndex === i ? true : undefined}
          onClick={() => onNavigate(i)}
        >
          <span className="nav-dots__active" aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}
