import { SLIDE_IDS } from '../data/presskit.data';
import { useI18n } from '../context/LocaleContext';

interface NavDotsProps {
  activeIndex: number;
  onNavigate: (index: number) => void;
}

const NAV_KEYS = ['cover', 'about', 'styles', 'experience', 'releases', 'rider'] as const;

export default function NavDots({ activeIndex, onNavigate }: NavDotsProps) {
  const { t } = useI18n();

  return (
    <nav className="nav-dots" aria-label={t.nav.sections}>
      {SLIDE_IDS.map((id, i) => {
        const label = t.nav[NAV_KEYS[i]];
        return (
          <button
            key={id}
            type="button"
            className={`nav-dots__dot${activeIndex === i ? ' nav-dots__dot--active' : ''}`}
            aria-label={t.nav.goTo(label)}
            aria-current={activeIndex === i ? true : undefined}
            onClick={() => onNavigate(i)}
          >
            <span className="nav-dots__active" aria-hidden="true" />
          </button>
        );
      })}
    </nav>
  );
}
