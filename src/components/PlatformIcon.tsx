import type { PlatformId } from '../data/presskit.data';

interface PlatformIconProps {
  id: PlatformId;
  className?: string;
}

/** Outline-иконки сервисов (stroke, без заливки бренда) */
export default function PlatformIcon({ id, className }: PlatformIconProps) {
  const props = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.65,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (id) {
    case 'soundcloud':
      return (
        <svg {...props}>
          <path d="M6.5 16.2a2.8 2.8 0 0 1-2.8-2.8c0-1.5 1.2-2.7 2.8-2.8" />
          <path d="M9.8 16.2a4.2 4.2 0 0 1-4.2-4.2 4.2 4.2 0 0 1 4.2-4.2" />
          <path d="M13.1 16.2a5.6 5.6 0 0 1-5.6-5.6 5.6 5.6 0 0 1 5.6-5.6" />
          <path d="M16.4 16.2a7 7 0 0 1-7-7 7 7 0 0 1 7-7" />
          <path d="M19.2 10.8a4.4 4.4 0 0 0 0 8.8h1.3a3.5 3.5 0 0 0 0-8.8h-1.3z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="12" rx="3.2" ry="3.2" />
          <path d="M11 10.2v3.6l3.8-1.8-3.8-1.8z" />
        </svg>
      );
    case 'flat-audio':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path d="M8 15V9" />
          <path d="M12 15v-4" />
          <path d="M16 15V9" />
          <path d="M6 17h12" strokeWidth={1.2} />
        </svg>
      );
    default:
      return null;
  }
}
